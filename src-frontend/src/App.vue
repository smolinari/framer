<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { currentMonitor as getCurrentMonitor } from '@tauri-apps/api/window' // Changed import
import { LazyStore } from '@tauri-apps/plugin-store';
import { exit as tauriExit } from '@tauri-apps/plugin-process'; // Corrected import
// import HelloWorld from './components/HelloWorld.vue' // Can be removed if not used

// --- Frame State & Style ---
const isFrameActive = ref(false) // Start with frame inactive, activate in onMounted after styles
const frameStyle = reactive({
  display: 'block', // Default display style when the frame is active in the DOM
  left: '0px',    // Will be calculated in onMounted to center
  top: '0px',     // Will be calculated in onMounted to center
  width: '1920px', // Default to Full HD width
  height: '1080px',// Default to Full HD height
  border: '8px solid red', // From your original style.css
  position: 'absolute' as const,
  backgroundColor: 'transparent', // For click-through if needed later, or for styling
  boxSizing: 'border-box' as const,
  cursor: 'move', // Default cursor for dragging (to be implemented)
  zIndex: 100,    // Ensure frame is above default content, but below controls
  userSelect: 'auto' as 'none' | 'auto', // For preventing text selection during resize
})

// --- Dragging State ---
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const initialFrameOffsetX = ref(0);
const initialFrameOffsetY = ref(0);
const CONTROLS_AREA_HEIGHT = 50; // New effective top boundary: 10px (top offset) + 40px (control area height)

// --- Resizing State ---
const isResizing = ref(false);
const activeHandle = ref<string | null>(null);
const resizeStartX = ref(0);
const resizeStartY = ref(0);
const initialFrameRect = reactive({ left: 0, top: 0, width: 0, height: 0 });
const MIN_FRAME_WIDTH = 20;
const MIN_FRAME_HEIGHT = 20;

const resizeHandles = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

// --- Screen & Preset State ---
const screenWidth = ref(window.innerWidth); // Fallback, will be updated by Tauri
const screenHeight = ref(window.innerHeight); // Fallback, will be updated by Tauri

interface ScreenPreset {
  label: string;
  width: number;
  height: number;
  type: 'desktop' | 'mobile';
}

const allPresets: ScreenPreset[] = [
  // Desktop Landscape (Max 4K, others smaller)
  { label: '4K UHD (3840x2160)', width: 3840, height: 2160, type: 'desktop' },
  { label: 'QHD (2560x1440)', width: 2560, height: 1440, type: 'desktop' },
  { label: 'Full HD (1920x1080)', width: 1920, height: 1080, type: 'desktop' },
  { label: 'HD (1280x720)', width: 1280, height: 720, type: 'desktop' },
  { label: 'SD (640x480) 4:3', width: 640, height: 480, type: 'desktop' },
  { label: 'Square (1080x1080)', width: 1080, height: 1080, type: 'desktop' },

  // Mobile Landscape
  { label: 'Mobile Landscape L (926x428)', width: 926, height: 428, type: 'mobile' },
  { label: 'Mobile Landscape M (800x360)', width: 800, height: 360, type: 'mobile' },
  { label: 'Mobile Landscape S (640x360)', width: 640, height: 360, type: 'mobile' },

  // Mobile Portrait
  { label: 'Mobile Portrait L (428x926)', width: 428, height: 926, type: 'mobile' },
  { label: 'Mobile Portrait M (360x800)', width: 360, height: 800, type: 'mobile' },
  { label: 'Mobile Portrait S (360x640)', width: 360, height: 640, type: 'mobile' },
];

// Filtered and sorted presets for Desktop
const availableDesktopPresets = computed(() => {
  return allPresets.filter(preset =>
    preset.type === 'desktop' &&
    preset.width < screenWidth.value &&
    preset.height < screenHeight.value
  ).sort((a, b) => b.width - a.width); // Sort largest desktop first
});

// Filtered and sorted presets for Mobile
const availableMobilePresets = computed(() => {
  return allPresets.filter(preset =>
    preset.type === 'mobile' &&
    preset.width < screenWidth.value &&
    preset.height < screenHeight.value
  ).sort((a, b) => b.width - a.width); // Sort largest mobile first
});

const isPresetMenuOpen = ref(false);

// --- Custom Size Dialog State ---
const isCustomSizeDialogOpen = ref(false);
const customWidthInput = ref<number | null>(null);
const customHeightInput = ref<number | null>(null);

// --- Store for Persisting State ---
const store = new LazyStore('.framer-settings.dat'); // Using a .dat extension for the store file

// Watcher and togglePresetMenu function can be removed as menu is working.

const dimensionsText = computed(() => {
  if (!isFrameActive.value || frameStyle.display === 'none') return '';
  return `w: ${parseInt(frameStyle.width)}px h: ${parseInt(frameStyle.height)}px`;
})

// --- Toggle Control ---
// This 'toggleState' will be bound to the q-toggle and will drive 'isFrameActive'
const toggleState = ref(true)

function onToggleChange(value: boolean | number | string) { // q-toggle can emit various types
  const isActive = Boolean(value);
  isFrameActive.value = isActive; // This is the primary control for v-if
  if (isActive) {
    console.log("Vue App: Frame is ON (isFrameActive set to true)");
  } else {
    console.log("Vue App: Frame is OFF (isFrameActive set to false)");
  }
}

// --- Persist Frame State ---
async function saveFrameState() {
  try {
    await store.set('frameGeometry', {
      left: frameStyle.left,
      top: frameStyle.top,
      width: frameStyle.width,
      height: frameStyle.height,
    });
    await store.save(); // Explicitly save to disk
    console.log('Frame state saved:', {
      left: frameStyle.left,
      top: frameStyle.top,
      width: frameStyle.width,
      height: frameStyle.height,
    });
  } catch (error) {
    console.error('Failed to save frame state:', error);
  }
}

// No longer need showFrame and hideFrame functions
// Initialize frame visibility based on the initial toggle state
onMounted(async () => { // Make onMounted async to use await for store
  const currentMonitor = getCurrentMonitor();
  let initialTargetWidth = 1920; // Default
  let initialTargetHeight = 1080; // Default

  currentMonitor.then(monitor => {
    if (monitor) {
      screenWidth.value = monitor.size.width / monitor.scaleFactor; // Use logical pixels
      screenHeight.value = monitor.size.height / monitor.scaleFactor; // Use logical pixels
      console.log(`Monitor size: ${screenWidth.value}x${screenHeight.value} (logical)`);
    } else {
      console.warn("Could not get current monitor information.");
      // Fallback to window inner size if monitor info is not available
      screenWidth.value = window.innerWidth;
      screenHeight.value = window.innerHeight;
    }

    // Try to load saved frame geometry AFTER getting screen dimensions
    return store.get<{ left: string; top: string; width: string; height: string }>('frameGeometry');
  })
  .then(savedFrameGeo => {
    if (savedFrameGeo && savedFrameGeo.width && savedFrameGeo.height && savedFrameGeo.left && savedFrameGeo.top) {
      console.log('Loaded saved frame geometry:', savedFrameGeo);
      frameStyle.width = savedFrameGeo.width;
      frameStyle.height = savedFrameGeo.height;
      frameStyle.left = savedFrameGeo.left;
      frameStyle.top = savedFrameGeo.top;

      // Basic validation for loaded position against current screen
      let loadedWidth = parseInt(savedFrameGeo.width, 10);
      let loadedHeight = parseInt(savedFrameGeo.height, 10);
      let loadedLeft = parseInt(savedFrameGeo.left, 10);
      let loadedTop = parseInt(savedFrameGeo.top, 10);

      frameStyle.width = `${Math.max(MIN_FRAME_WIDTH, loadedWidth)}px`;
      frameStyle.height = `${Math.max(MIN_FRAME_HEIGHT, loadedHeight)}px`;
      frameStyle.left = `${Math.max(0, Math.min(loadedLeft, screenWidth.value - loadedWidth))}px`;
      frameStyle.top = `${Math.max(CONTROLS_AREA_HEIGHT, Math.min(loadedTop, screenHeight.value - loadedHeight))}px`;
    } else {
      console.log('No valid saved frame geometry found, using defaults.');
      // Set default Full HD dimensions if no saved state
      frameStyle.width = `${initialTargetWidth}px`;
      frameStyle.height = `${initialTargetHeight}px`;
      // Center the default frame
      const newLeft = (screenWidth.value / 2) - (initialTargetWidth / 2);
      const newTop = (screenHeight.value / 2) - (initialTargetHeight / 2);
      frameStyle.left = `${Math.max(0, newLeft)}px`;
      frameStyle.top = `${Math.max(CONTROLS_AREA_HEIGHT, newTop)}px`;
    }

    console.log(`Frame style after loading/defaults:`, JSON.parse(JSON.stringify(frameStyle)));

    // Set initial visibility
    if (toggleState.value) {
      setTimeout(() => {
        isFrameActive.value = true;
        console.log("Frame should be active and visible on startup.");
      }, 50);
    }
  }).catch(error => {
    console.error("Error in onMounted during monitor check or frame setup:", error);
    // Fallback logic if monitor info fails
    screenWidth.value = window.innerWidth; 
    screenHeight.value = window.innerHeight;

    frameStyle.width = `${initialTargetWidth}px`;
    frameStyle.height = `${initialTargetHeight}px`;
    const newLeft = (screenWidth.value / 2) - (initialTargetWidth / 2);
    const newTop = (screenHeight.value / 2) - (initialTargetHeight / 2);
    frameStyle.left = `${Math.max(0, newLeft)}px`;
    frameStyle.top = `${Math.max(CONTROLS_AREA_HEIGHT, newTop)}px`;

    if (toggleState.value) {
      // Fallback scenario
      setTimeout(async () => { // Make inner function async if saveFrameState is called here
        console.log("Inside setTimeout (catch block) for startup visibility. FrameStyle before activation:", JSON.parse(JSON.stringify(frameStyle)));
        isFrameActive.value = true;
      }, 50); // Slightly increased delay
    } else {
      isFrameActive.value = false;
    }
  });
});

// --- Frame Dragging Functions ---
function onFrameMouseDown(event: MouseEvent) {
  if (event.button !== 0) return; // Only react to left mouse button

  isDragging.value = true;
  dragStartX.value = event.clientX;
  dragStartY.value = event.clientY;
  initialFrameOffsetX.value = parseInt(frameStyle.left, 10);
  initialFrameOffsetY.value = parseInt(frameStyle.top, 10);

  // Add listeners to the window for smoother dragging
  window.addEventListener('mousemove', onFrameMouseMove);
  window.addEventListener('mouseup', onFrameMouseUp);
}

function onFrameMouseMove(event: MouseEvent) {
  if (!isDragging.value) return;

  const dx = event.clientX - dragStartX.value;
  const dy = event.clientY - dragStartY.value;

  frameStyle.left = `${initialFrameOffsetX.value + dx}px`;
  // Ensure frame cannot be dragged under the controls area
  frameStyle.top = `${Math.max(CONTROLS_AREA_HEIGHT, initialFrameOffsetY.value + dy)}px`;
}

function onFrameMouseUp() {
  isDragging.value = false;
  window.removeEventListener('mousemove', onFrameMouseMove);
  window.removeEventListener('mouseup', onFrameMouseUp);
  saveFrameState(); // Save state after dragging
}

// --- Frame Resizing Functions ---
function onResizeHandleMouseDown(event: MouseEvent, handleId: string) {
  if (event.button !== 0) return;
  event.preventDefault(); // Prevent default browser actions like text selection
  event.stopPropagation(); // Prevent frame drag from triggering

  isResizing.value = true;
  activeHandle.value = handleId;
  resizeStartX.value = event.clientX;
  resizeStartY.value = event.clientY;

  initialFrameRect.left = parseInt(frameStyle.left, 10);
  initialFrameRect.top = parseInt(frameStyle.top, 10);
  initialFrameRect.width = parseInt(frameStyle.width, 10);
  initialFrameRect.height = parseInt(frameStyle.height, 10);

  frameStyle.userSelect = 'none'; // Disable user-select on the frame during resize
  window.addEventListener('mousemove', onResizeMouseMove);
  window.addEventListener('mouseup', onResizeMouseUp);
}

function onResizeMouseMove(event: MouseEvent) {
  if (!isResizing.value || !activeHandle.value) return;

  let dx = event.clientX - resizeStartX.value;
  let dy = event.clientY - resizeStartY.value;

  let newX = initialFrameRect.left;
  let newY = initialFrameRect.top;
  let newWidth = initialFrameRect.width;
  let newHeight = initialFrameRect.height;

  const handle = activeHandle.value;

  // Horizontal resizing
  if (handle.includes('e')) {
    newWidth = Math.max(MIN_FRAME_WIDTH, initialFrameRect.width + dx);
  } else if (handle.includes('w')) {
    newWidth = Math.max(MIN_FRAME_WIDTH, initialFrameRect.width - dx);
    newX = initialFrameRect.left + (initialFrameRect.width - newWidth);
  }

  // Vertical resizing
  if (handle.includes('s')) {
    newHeight = Math.max(MIN_FRAME_HEIGHT, initialFrameRect.height + dy);
  } else if (handle.includes('n')) {
    newHeight = Math.max(MIN_FRAME_HEIGHT, initialFrameRect.height - dy);
    newY = initialFrameRect.top + (initialFrameRect.height - newHeight);
  }

  // Proportional scaling (Ctrl key)
  if (event.ctrlKey && initialFrameRect.width > 0 && initialFrameRect.height > 0) {
    const aspectRatio = initialFrameRect.width / initialFrameRect.height;
    if (handle.includes('e') || handle.includes('w')) { // Width changed
      // const originalNewWidth = newWidth; // Not strictly needed here
      newHeight = Math.max(MIN_FRAME_HEIGHT, newWidth / aspectRatio);
      // If height adjustment caused width to go below min, readjust width
      if (newHeight < MIN_FRAME_HEIGHT) {
        newHeight = MIN_FRAME_HEIGHT;
        newWidth = Math.max(MIN_FRAME_WIDTH, newHeight * aspectRatio);
      }
       // If width was adjusted from 'w' handle, update X
      if (handle.includes('w')) {
        newX = initialFrameRect.left + (initialFrameRect.width - newWidth);
      }
    } else if (handle.includes('n') || handle.includes('s')) { // Height changed
      // const originalNewHeight = newHeight; // Not strictly needed here
      newWidth = Math.max(MIN_FRAME_WIDTH, newHeight * aspectRatio);
       // If width adjustment caused height to go below min, readjust height
      if (newWidth < MIN_FRAME_WIDTH) {
        newWidth = MIN_FRAME_WIDTH;
        newHeight = Math.max(MIN_FRAME_HEIGHT, newWidth / aspectRatio);
      }
      // If height was adjusted from 'n' handle, update Y
      if (handle.includes('n')) {
        newY = initialFrameRect.top + (initialFrameRect.height - newHeight);
      }
    }
  }

  // Constrain top position
  if (newY < CONTROLS_AREA_HEIGHT) {
    const diffY = CONTROLS_AREA_HEIGHT - newY;
    newHeight = Math.max(MIN_FRAME_HEIGHT, newHeight - diffY);
    newY = CONTROLS_AREA_HEIGHT;
  }

  frameStyle.left = `${newX}px`;
  frameStyle.top = `${newY}px`;
  frameStyle.width = `${newWidth}px`;
  frameStyle.height = `${newHeight}px`;
}

function onResizeMouseUp() {
  isResizing.value = false;
  activeHandle.value = null;
  frameStyle.userSelect = 'auto'; // Re-enable user-select on the frame
  window.removeEventListener('mousemove', onResizeMouseMove);
  window.removeEventListener('mouseup', onResizeMouseUp);
  saveFrameState(); // Save state after resizing
}

// --- Preset Application ---
function applyPreset(preset: ScreenPreset) {
  frameStyle.width = `${preset.width}px`;
  frameStyle.height = `${preset.height}px`;

  // Center the new frame (optional, adjust as needed)
  const newLeft = (screenWidth.value / 2) - (preset.width / 2);
  const newTop = (screenHeight.value / 2) - (preset.height / 2);

  frameStyle.left = `${Math.max(0, newLeft)}px`; // Ensure not off-screen left
  frameStyle.top = `${Math.max(CONTROLS_AREA_HEIGHT, newTop)}px`; // Ensure not under controls or off-screen top

  if (!isFrameActive.value) {
    toggleState.value = true; // This will trigger onToggleChange which calls showFrame
  } // If already active, changing dimensions is enough, display is already 'block'
  saveFrameState(); // Save state after applying a preset
}

// --- Custom Size Dialog Functions ---
function openCustomSizeDialog() {
  customWidthInput.value = parseInt(frameStyle.width, 10) || null; // Pre-fill with current width
  customHeightInput.value = parseInt(frameStyle.height, 10) || null; // Pre-fill with current height
  isCustomSizeDialogOpen.value = true;
}

function applyCustomSize() {
  if (customWidthInput.value && customHeightInput.value && customWidthInput.value > 0 && customHeightInput.value > 0) {
    const customPreset: ScreenPreset = {
      label: `Custom (${customWidthInput.value}x${customHeightInput.value})`,
      width: customWidthInput.value,
      height: customHeightInput.value,
      type: 'desktop', // Or determine based on aspect ratio, or just 'custom'
    };
    applyPreset(customPreset);
    isCustomSizeDialogOpen.value = false; // Close dialog on apply
  }
}

// --- App Close Function ---
async function closeApp() {
  console.log("Attempting to close application...");
  await tauriExit(0); // Exit with code 0 (success)
}
</script>

<template>
  <div class="app-container">
    <!-- Controls Area -->
    <div class="controls-area">
      <q-btn 
        dense 
        flat 
        color="white" 
        icon="add" 
        size="md" 
        class="q-mr-sm">
        <q-menu v-model="isPresetMenuOpen" anchor="bottom end" self="top end">
          <q-list dense class="preset-menu-list" style="min-width: 280px;">
            <template v-if="availableDesktopPresets.length > 0">
              <q-item-label header dense class="q-py-xs">Desktop</q-item-label>
              <q-item v-for="preset in availableDesktopPresets" :key="preset.label" clickable v-close-popup @click="applyPreset(preset)">
                <q-item-section>{{ preset.label }}</q-item-section>
              </q-item>
            </template>

            <q-separator v-if="availableDesktopPresets.length > 0 && availableMobilePresets.length > 0" />

            <template v-if="availableMobilePresets.length > 0">
              <q-item-label header dense class="q-py-xs q-mt-sm">Mobile</q-item-label>
              <q-item v-for="preset in availableMobilePresets" :key="preset.label" clickable v-close-popup @click="applyPreset(preset)">
                <q-item-section>{{ preset.label }}</q-item-section>
              </q-item>
            </template>
            <q-item v-if="!availableDesktopPresets.length && !availableMobilePresets.length" dense>
              <q-item-section>
                <div>No smaller presets available</div>
              </q-item-section>
            </q-item>

            <!-- Custom Size Option -->
            <q-separator v-if="availableDesktopPresets.length > 0 || availableMobilePresets.length > 0" />
            <q-item clickable v-close-popup @click="openCustomSizeDialog">
              <q-item-section>Custom Size...</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>

      <q-toggle
        v-model="toggleState"
        color="white"
        @update:model-value="onToggleChange"
      />

      <q-btn
        dense
        flat
        color="white"
        icon="close"
        size="md"
        @click="closeApp"
        class="q-ml-sm"
      />
      <!-- <q-btn color="primary" label="Test Quasar Button" /> -->
      <!-- <q-icon name="info" size="md" class="q-ml-sm" /> -->
    </div>

    <!-- The Draggable/Resizable Frame -->
    <div
      v-if="isFrameActive"
      id="framer-vue-main"
      :style="[frameStyle, { userSelect: frameStyle.userSelect || 'auto' }]"
      @mousedown="onFrameMouseDown"
    >
      <!-- Dimension Display inside the frame -->
      <div class="dimension-display-vue" v-if="isResizing">
        {{ dimensionsText }}
      </div>
      <!-- Resize Handles -->
      <div
        v-for="handle in resizeHandles"
        :key="handle"
        :class="['resize-handle', `handle-${handle}`]"
        @mousedown.stop="onResizeHandleMouseDown($event, handle)"
      ></div>

    </div>

    <!-- HelloWorld and logos can be removed or kept for testing -->
    <!-- <HelloWorld msg="Vite + Vue" /> -->
  </div>

  <!-- Custom Size Dialog -->
  <q-dialog v-model="isCustomSizeDialogOpen">
    <q-card style="min-width: 300px">
      <q-card-section>
        <div class="text-h6">Enter Custom Dimensions</div>
      </q-card-section>

      <q-card-section class="q-pt-none q-gutter-md">
        <q-input dense v-model.number="customWidthInput" type="number" label="Width (px)" autofocus />
        <q-input dense v-model.number="customHeightInput" type="number" label="Height (px)" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn 
          flat 
          label="Apply" 
          color="primary" 
          @click="applyCustomSize" 
          :disable="!customWidthInput || !customHeightInput || customWidthInput <= 0 || customHeightInput <= 0" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  /* transition: filter 300ms; // Can be removed if logos are removed */
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

.app-container {
  width: 100vw;
  height: 100vh;
  position: relative; /* Context for absolute positioning of the frame */
  overflow: hidden; /* Prevent scrollbars if frame moves out of view */
}

.controls-area {
  position: fixed; /* Keep controls at a fixed position */
  top: 10px; /* Ensure 10px from the top of the window */
  left: 50%; /* Center horizontally */
  transform: translateX(-50%); /* Adjust for own width to truly center */
  z-index: 1001; /* Ensure controls are above the frame */
  background-color: #003f5c;; /* More blue and a bit darker background */
  /* color: white; Let Quasar components handle their text color or style them individually */
  padding: 2px 8px; /* Further reduced vertical padding for ~40px height, kept horizontal */
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  border: 2px solid white; /* White border (outline) */
}

/* Styling for the preset menu list itself */
.preset-menu-list {
  background-color: #003f5c;; /* Base background for the whole menu */
}

/* Styling for the preset menu items */
.preset-menu-list .q-item {
  /* background-color is inherited from .preset-menu-list or can be set if different */
  color: white;
}

.preset-menu-list .q-item .q-item__section {
  font-size: 1.12em; /* Approx 40% bigger than default 0.8em for dense list items, adjust as needed */
  /* Quasar dense items have a smaller base font-size, so 1.4 * default might be too large.
     If default q-item font-size is ~14px, dense might be ~12px. 1.4 * 12px = 16.8px.
     Let's try a slightly smaller increase first, e.g., 1.12em of the parent, or a fixed px value.
     A font-size of 1.12em on the q-item__section (assuming parent q-item has a base size) might be more appropriate. */
}

/* Styling for the preset menu section headers */
.q-item__label--header {
  background-color: #003148;; /* Darker shade of the menu background */
  color: white !important; /* Ensure white text, overriding Quasar defaults if necessary */
  font-size: 1.25rem; /* Make header text standard size, bold will differentiate it */
  /* The q-py-xs class in the template already handles top/bottom padding */
}
#framer-vue-main {
  /* Dynamic styles are applied via :style="frameStyle" */
  /* Static styles that don't change can go here */
}

.dimension-display-vue {
  position: absolute;
  /* Positioned at the bottom-right corner inside the frame */
  bottom: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 1.44em; /* Increased font size (0.9em * 1.6) */
  pointer-events: none; /* So it doesn't interfere with frame interactions */
  user-select: none; /* Standard */
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none;    /* Firefox */
  -ms-user-select: none;     /* Internet Explorer/Edge */
}

.resize-handle {
  position: absolute;
  width: 14px; /* Increased size */
  height: 14px; /* Increased size */
  background-color: rgba(255, 255, 0, 0.7); /* Yellow with some transparency */
  border: 1px solid rgba(0,0,0,0.5);
  z-index: 101; /* Above the frame's z-index */
  box-sizing: border-box;
}

/* Corner handles positioning */
/* The -12px values were from your latest version, keeping them */
.handle-nw { top: -12px; left: -12px; cursor: nwse-resize; }
.handle-ne { top: -12px; right: -12px; cursor: nesw-resize; }
.handle-sw { bottom: -12px; left: -12px; cursor: nesw-resize; }
.handle-se { bottom: -12px; right: -12px; cursor: nwse-resize; }

/* Side handles positioning */
.handle-n { top: -12px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.handle-s { bottom: -12px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.handle-w { top: 50%; left: -12px; transform: translateY(-50%); cursor: ew-resize; }
.handle-e { top: 50%; right: -12px; transform: translateY(-50%); cursor: ew-resize; }

</style>
