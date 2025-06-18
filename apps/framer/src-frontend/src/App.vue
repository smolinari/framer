<template>
  <div class="app-container">
    <ControlsArea
      v-model="toggleState"
      :available-desktop-presets="availableDesktopPresets"
      :is-app-interactive="isProgrammaticallyInteractive"
      :available-mobile-presets="availableMobilePresets"
      @apply-preset="handleApplyPreset"
      @open-custom-size="openCustomSizeDialog"
      @open-about="openAboutDialog"
      @open-system-info="openSystemInfoDialog"
      @close-app="closeApp"
      @update:model-value="onToggleChange"
    />

    <FrameDisplay
      :is-frame-active="isFrameActive"
      :frame-style="frameStyle"
      :is-resizing="isResizing"
      :dimensions-text="dimensionsText"
      @frame-mousedown="onFrameMouseDown"
      @resize-handle-mousedown="onResizeHandleMouseDown"
    />
  </div>
  <!-- Dialogs -->
  <AboutDialog
    v-model="isAboutDialogOpen"
    :app-name="appName"
    :app-version="appVersion"
  />

  <SystemInfoDialog
    v-model="isSystemInfoDialogOpen"
    :monitor-physical-width="monitorPhysicalWidth"
    :monitor-physical-height="monitorPhysicalHeight"
    :monitor-scale-factor="currentMonitorScaleFactor" 
    :applied-app-zoom="currentAppliedAppZoom"
    :frame-style="frameStyle"
    :os-type="osType"
    :os-platform="osPlatform"
    :os-arch="osArch"
    :os-version-info="osVersionInfo"
  />
  <CustomSizeDialog
    v-model="isCustomSizeDialogOpen"
    :initial-width="parseInt(frameStyle.width, 10) || null"
    :initial-height="parseInt(frameStyle.height, 10) || null"
    @apply-custom-size="applyCustomSizeFromDialog"
  />
</template>

<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';
import { onMounted, ref, onBeforeUnmount, reactive, computed } from 'vue';
import { info as logInfo, error as logError } from '@tauri-apps/plugin-log'; // Corrected import
import { useWindowInteractiveState } from './composables/useWindowInteractiveState';
import { register as registerShortcut, unregister as unregisterShortcut } from '@tauri-apps/plugin-global-shortcut'; // Import shortcut functions
import { exit as tauriExit } from '@tauri-apps/plugin-process';

import ControlsArea from './components/ControlsArea.vue';
import FrameDisplay from './components/FrameDisplay.vue';
import AboutDialog from './components/dialogs/AboutDialog.vue';
import SystemInfoDialog from './components/dialogs/SystemInfoDialog.vue';
import CustomSizeDialog from './components/dialogs/CustomSizeDialog.vue';

import { useAppSysInfo } from './composables/useAppSysInfo';
import { useMonitorAndScaling } from './composables/useMonitorAndScaling';
import { useFrameGeometry } from './composables/useFrameGeometry';
import { useFramePersistence } from './composables/useFramePersistence';
import { usePresets, type ScreenPreset } from './composables/usePresets'; // ScreenPreset is already defined in ControlsArea, ensure consistency or import from a shared types file
import { useFrameDragging } from './composables/useFrameDragging';
import { useFrameResizing } from './composables/useFrameResizing';
import { CONTROLS_AREA_HEIGHT } from './config/constants';

// Define ScreenPreset type (can be moved to a shared types file later)
// interface ScreenPreset { // This is now imported from usePresets or defined in ControlsArea
//   label: string;
//   width: number;
//   height: number;
//   type: 'desktop' | 'mobile';
// }

const { initializeInteractiveState, toggleCurrentInteractiveState, isProgrammaticallyInteractive } = useWindowInteractiveState();

// --- Frame State & Style (Managed by Composables) ---
const isFrameActive = ref(false); // Initialized by onMounted logic from App.old
const frameStyle = reactive({
  display: 'block',
  left: '0px',
  top: '0px',
  width: '0px', // Will be initialized
  height: '0px', // Will be initialized
  border: '8px solid dodgerblue', // Default, can be customized later
  position: 'absolute' as const,
  backgroundColor: 'transparent',
  boxSizing: 'border-box' as const,
  cursor: 'move', // Default cursor for the frame
  zIndex: 100,
  userSelect: 'auto' as 'none' | 'auto',
  pointerEvents: 'auto' as 'none' | 'auto', // Ensure the frame itself is interactive
});

// --- Composable Initializations (from App.old) ---
const { 
  monitorPhysicalWidth, 
  monitorPhysicalHeight, 
  fetchMonitorAndApplyScaling, 
  monitorScaleFactor: currentMonitorScaleFactor, // Assuming useMonitorAndScaling exposes these
  appliedAppZoom: currentAppliedAppZoom      // Assuming useMonitorAndScaling exposes these
} = useMonitorAndScaling();

const { appName, appVersion, osArch, osPlatform, osType, osVersionInfo, fetchAppSysInfo } = useAppSysInfo();
const { saveFrameState } = useFramePersistence(frameStyle);
const { initializeFrameGeometry } = useFrameGeometry(frameStyle, monitorPhysicalWidth, monitorPhysicalHeight);

// Call composables with the expected two arguments
const { onFrameMouseDown: originalOnFrameMouseDown } = useFrameDragging(frameStyle, saveFrameState);
const { isResizing, onResizeHandleMouseDown: originalOnResizeHandleMouseDown } = useFrameResizing(frameStyle, saveFrameState);

const toggleState = ref(true); // This was v-model for ControlsArea in App.old, linked to isFrameActive
const { availableDesktopPresets, availableMobilePresets, applyPreset } = usePresets(monitorPhysicalWidth, monitorPhysicalHeight, frameStyle, isFrameActive, toggleState, saveFrameState);

// Wrap the event handlers to include the focus call
const onFrameMouseDown = (event: MouseEvent) => {
  handleFocusOnClick();
  originalOnFrameMouseDown(event);
};

const onResizeHandleMouseDown = (event: MouseEvent, handleId: string) => {
  handleFocusOnClick();
  originalOnResizeHandleMouseDown(event, handleId);
};

const dimensionsText = computed(() => {
  if (!isFrameActive.value || frameStyle.display === 'none') return '';
  return `w: ${parseInt(frameStyle.width, 10)}px h: ${parseInt(frameStyle.height, 10)}px`;
});

async function handleFocusOnClick() {
  await logInfo("App.vue: Interactive element clicked, attempting to set focus.");
  console.log("[CONSOLE.LOG] App.vue: Interactive element clicked, attempting to set focus.");
  try {
    await getCurrentWindow().setFocus();
    const isFocused = await getCurrentWindow().isFocused();
    await logInfo(`App.vue: Focus set on box click. Is focused: ${isFocused}`);
    console.log(`[CONSOLE.LOG] App.vue: Focus set on box click. Is focused: ${isFocused}`);
  } catch (e) {
    await logError(`App.vue: Error setting focus on box click: ${e}`);
    console.error(`[CONSOLE.ERROR] App.vue: Error setting focus on box click:`, e);
  }
};

const SHORTCUT_TOGGLE_INTERACTIVITY = 'Ctrl+F9';
let isProcessingShortcut = false; // Flag to prevent rapid double execution

// --- Dialog States ---
const isCustomSizeDialogOpen = ref(false);
const isSystemInfoDialogOpen = ref(false);
const isAboutDialogOpen = ref(false);

onMounted(async () => {
  await logInfo("App.vue (Simplified Click-Through Test): onMounted Start");
  console.log("[CONSOLE.LOG] App.vue (Simplified Click-Through Test): onMounted Start");

  // --- Window Interactivity and Focus Setup (from current App.vue) ---
  try {
    await initializeInteractiveState(true); // true means the window should be interactive (ignoreCursorEvents=false)
    await logInfo("App.vue (Simplified): Window initialized to INTERACTIVE (ignoreCursorEvents=false) via composable, by passing `true`.");
    console.log("[CONSOLE.LOG] App.vue (Simplified): Window initialized to INTERACTIVE (ignoreCursorEvents=false) via composable, by passing `true`.");

    // --- Setup from App.old's onMounted ---
    let initialTargetWidth = 1920; // Default PHYSICAL width for Full HD
    let initialTargetHeight = 1080; // Default PHYSICAL height for Full HD

    try {
      await fetchAppSysInfo(); // For dialogs later
      await fetchMonitorAndApplyScaling();

      // Set window to full screen
      // await logInfo(`App.vue: Before window resize - Monitor dimensions: ${monitorPhysicalWidth.value}x${monitorPhysicalHeight.value}`);
      // console.log(`[CONSOLE.LOG] App.vue: Before window resize - Monitor dimensions: ${monitorPhysicalWidth.value}x${monitorPhysicalHeight.value}`);
      // const appWindow = getCurrentWindow();
      // if (monitorPhysicalWidth.value > 0 && monitorPhysicalHeight.value > 0) {
      //   await appWindow.setSize(new PhysicalSize(monitorPhysicalWidth.value, monitorPhysicalHeight.value));
      //   await appWindow.setPosition(new PhysicalPosition(0, 0));
      //   await logInfo(`App.vue: Window resize attempt complete. Target: ${monitorPhysicalWidth.value}x${monitorPhysicalHeight.value}`);
      //   console.log(`[CONSOLE.LOG] App.vue: Window resize attempt complete. Target: ${monitorPhysicalWidth.value}x${monitorPhysicalHeight.value}`);
      //   const newSize = await appWindow.outerSize();
      //   await logInfo(`App.vue: Window actual outerSize after resize: ${newSize.width}x${newSize.height}`);
      //   console.log(`[CONSOLE.LOG] App.vue: Window actual outerSize after resize: ${newSize.width}x${newSize.height}`);
      // } else {
      //   await logError("App.vue: Monitor dimensions not available for full screen.");
      //   console.error("[CONSOLE.ERROR] App.vue: Monitor dimensions not available for full screen.");
      // }

      await initializeFrameGeometry(initialTargetWidth, initialTargetHeight); // Initialize frame (will try to load state or use defaults)
      await logInfo(`App.vue: After initializeFrameGeometry - frameStyle: ${JSON.stringify(frameStyle)}`);
      console.log(`[CONSOLE.LOG] App.vue: After initializeFrameGeometry - frameStyle: ${JSON.stringify(frameStyle)}`);
    } catch (error) {
      await logError(`onMounted: Error during initial setup from App.old: ${error}`);
      console.error(`[CONSOLE.ERROR] onMounted: Error during initial setup from App.old:`, error);
      // Fallback for frameStyle if composables fail
      frameStyle.width = `${initialTargetWidth}px`;
      frameStyle.height = `${initialTargetHeight}px`;
      const newLeft = (monitorPhysicalWidth.value / 2) - (initialTargetWidth / 2);
      const newTop = (monitorPhysicalHeight.value / 2) - (initialTargetHeight / 2);
      frameStyle.left = `${Math.max(0, newLeft)}px`;
      frameStyle.top = `${Math.max(CONTROLS_AREA_HEIGHT, newTop)}px`;
    }

    // Attempt to explicitly set focus to the window after a short delay
    setTimeout(async () => { // Re-enable focus logic
      try {
        const win = getCurrentWindow();
        let isInitiallyFocused = await win.isFocused();
        await logInfo(`App.vue (Simplified): Window focused BEFORE setFocus (delayed): ${isInitiallyFocused}`);
        console.log(`[CONSOLE.LOG] App.vue (Simplified): Window focused BEFORE setFocus (delayed): ${isInitiallyFocused}`);
        await win.setFocus();
        await logInfo("App.vue (Simplified): Attempted to set focus to the main window (delayed).");
        console.log("[CONSOLE.LOG] App.vue (Simplified): Attempted to set focus to the main window (delayed).");
        let isNowFocused = await win.isFocused();
        await logInfo(`App.vue (Simplified): Window focused AFTER setFocus (delayed): ${isNowFocused}`);
        console.log(`[CONSOLE.LOG] App.vue (Simplified): Window focused AFTER setFocus (delayed): ${isNowFocused}`);
      } catch (focusError) {
        await logError(`App.vue (Simplified): Error setting window focus (delayed): ${focusError}`);
        console.error(`[CONSOLE.ERROR] App.vue (Simplified): Error setting window focus (delayed):`, focusError);
      }
    }, 300);

  } catch (e) {
    await logError(`App.vue (Simplified): Error in initial window setup: ${e}`);
    console.error(`[CONSOLE.ERROR] App.vue (Simplified): Error in initial window setup:`, e);
  }

  // --- Hotkey Registration (from current App.vue) ---
  try { // Re-enable hotkey registration
    await registerShortcut(SHORTCUT_TOGGLE_INTERACTIVITY, async () => {
      if (isProcessingShortcut) {
        await logInfo(`Global shortcut '${SHORTCUT_TOGGLE_INTERACTIVITY}' triggered again quickly, ignoring subsequent call.`);
        console.log(`[CONSOLE.LOG] Global shortcut '${SHORTCUT_TOGGLE_INTERACTIVITY}' triggered again quickly, ignoring subsequent call.`);
        return;
      }
      isProcessingShortcut = true;

      await logInfo(`Global shortcut '${SHORTCUT_TOGGLE_INTERACTIVITY}' triggered from frontend (processing).`);
      console.log(`[CONSOLE.LOG] Global shortcut '${SHORTCUT_TOGGLE_INTERACTIVITY}' triggered from frontend (processing).`);
      await toggleCurrentInteractiveState(); // Re-enable the toggle logic

      // Reset the flag after a short timeout.
      // This allows the key-up event (if that's the second trigger) to be ignored,
      // and prepares for the next distinct key press.
      setTimeout(() => {
        isProcessingShortcut = false;
      }, 100); // 100ms should be sufficient to distinguish key-down/key-up pairs.
    });
    await logInfo(`App.vue: Global shortcut '${SHORTCUT_TOGGLE_INTERACTIVITY}' registered successfully.`);
    console.log(`[CONSOLE.LOG] App.vue: Global shortcut '${SHORTCUT_TOGGLE_INTERACTIVITY}' registered successfully.`);
  } catch (e) {
    await logError(`App.vue: Error registering global shortcut '${SHORTCUT_TOGGLE_INTERACTIVITY}': ${e}`);
    console.error(`[CONSOLE.ERROR] App.vue: Error registering global shortcut '${SHORTCUT_TOGGLE_INTERACTIVITY}':`, e);
  }

  // --- Final frame activation from App.old's onMounted ---
  if (toggleState.value) { // Re-enable complex frame activation
    setTimeout(async () => {
      isFrameActive.value = true; 
      await logInfo(`onMounted: Frame set to active (isFrameActive: ${isFrameActive.value}) after timeout. FrameStyle: ${JSON.stringify(frameStyle)}`);
      console.log(`[CONSOLE.LOG] onMounted: Frame set to active (isFrameActive: ${isFrameActive.value}) after timeout. FrameStyle: ${JSON.stringify(frameStyle)}`);
    }, 50); // Small delay to ensure other setups are complete
  } else {
    isFrameActive.value = false;
    await logInfo("onMounted: Frame set to INACTIVE initially (toggleState is false).");
    console.log("[CONSOLE.LOG] onMounted: Frame set to INACTIVE initially (toggleState is false).");
  }
  
  await logInfo(`App.vue: End of onMounted - isFrameActive: ${isFrameActive.value}, toggleState: ${toggleState.value}`);
  console.log(`[CONSOLE.LOG] App.vue: End of onMounted - isFrameActive: ${isFrameActive.value}, toggleState: ${toggleState.value}`);

  await logInfo("App.vue (Simplified): onMounted Setup complete. No mousemove listener for toggling global interactivity.");
  console.log("[CONSOLE.LOG] App.vue (Simplified): onMounted Setup complete. No mousemove listener for toggling global interactivity.");
});

onBeforeUnmount(async () => {
  try { // Re-enable hotkey unregistration
    await unregisterShortcut(SHORTCUT_TOGGLE_INTERACTIVITY);
    await logInfo(`App.vue: Global shortcut '${SHORTCUT_TOGGLE_INTERACTIVITY}' unregistered.`);
    console.log(`[CONSOLE.LOG] App.vue: Global shortcut '${SHORTCUT_TOGGLE_INTERACTIVITY}' unregistered.`);
  } catch (e) {
    await logError(`App.vue: Error unregistering global shortcut '${SHORTCUT_TOGGLE_INTERACTIVITY}': ${e}`);
    console.error(`[CONSOLE.ERROR] App.vue: Error unregistering global shortcut '${SHORTCUT_TOGGLE_INTERACTIVITY}':`, e);
  }
  logInfo("App.vue (Simplified): onBeforeUnmount.");
  console.log("[CONSOLE.LOG] App.vue (Simplified): onBeforeUnmount.");
});

// --- Event Handlers for ControlsArea and FrameDisplay (Now using composables where appropriate) ---
function onToggleChange(value: boolean) {
  const isActive = Boolean(value);
  isFrameActive.value = isActive; // Directly update isFrameActive
  toggleState.value = isActive; // Keep toggleState in sync for composables that might use it
  logInfo(`App.vue: Frame active state toggled by ControlsArea: ${isFrameActive.value}`);
  console.log(`[CONSOLE.LOG] App.vue: Frame active state toggled by ControlsArea: ${isFrameActive.value}`);
}

async function closeApp() {
  await logInfo("App.vue: Close app requested from ControlsArea.");
  console.log("[CONSOLE.LOG] App.vue: Close app requested from ControlsArea.");
  await tauriExit(0);
}

function handleApplyPreset(preset: ScreenPreset) {
  logInfo(`App.vue: Apply preset: ${preset.label}`);
  console.log(`[CONSOLE.LOG] App.vue: Apply preset: ${preset.label}`);
  applyPreset(preset); // Use the composable function
}

// Dialog openers - can be expanded later to show actual dialogs
function openCustomSizeDialog() { 
  logInfo("App.vue: Open custom size dialog requested."); 
  console.log("[CONSOLE.LOG] App.vue: Open custom size dialog requested.");
  isCustomSizeDialogOpen.value = true;
}
function openAboutDialog() { 
  logInfo("App.vue: Open about dialog requested."); 
  console.log("[CONSOLE.LOG] App.vue: Open about dialog requested.");
  isAboutDialogOpen.value = true;
}
function openSystemInfoDialog() { 
  logInfo("App.vue: Open system info dialog requested."); 
  console.log("[CONSOLE.LOG] App.vue: Open system info dialog requested.");
  isSystemInfoDialogOpen.value = true;
}

function applyCustomSizeFromDialog(width: number, height: number) {
  const customPreset: ScreenPreset = { label: `Custom (${width}x${height})`, width, height, type: 'desktop' };
  applyPreset(customPreset);
}

// onFrameMouseDown and onResizeHandleMouseDown are now directly provided by their respective composables
// and passed as props to FrameDisplay.vue.
// The handleFocusOnClick is passed into those composables so they can call it.

</script>

<style scoped>
/* Ensure html, body, and the root app div have no default spacing and hide overflow */
:global(html), :global(body), :global(#app) {
  margin: 0;
  padding: 0;
  overflow: hidden; /* Hide scrollbars */
  background: transparent !important; /* Ensure transparency */
  width: 100vw; /* Ensure they take full viewport width */
  height: 100vh; /* Ensure they take full viewport height */
  box-sizing: border-box; /* Consistent sizing model */
}

.app-container {
  width: 100%; /* Take full width of parent (#app) */
  height: 100%; /* Take full height of parent (#app) */
  position: relative;
  overflow: hidden;
  background-color: transparent; /* Fully transparent */
  /* border: 2px solid rgba(0, 0, 0, 0.01); */ /* Remove or make transparent */
  border: none; /* Or border: 2px solid transparent; */
  pointer-events: none; /* Container itself is click-through */
  box-sizing: border-box;
}
</style>
