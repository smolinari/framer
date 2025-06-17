<template>
  <div class="app-container">
    <!-- Bare minimum test element -->
    <div
      class="interactive-test-box"
      ref="testBoxVueRef"
    >
      Hover Me (Vue - Geometric)
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';
import { onMounted, ref, onBeforeUnmount } from 'vue';
import { info as logInfo, error as logError } from '@tauri-apps/plugin-log';
import { useWindowInteractiveState } from './composables/useWindowInteractiveState';

const { initializeInteractiveState, setWindowInteractive } = useWindowInteractiveState();

const testBoxVueRef = ref<HTMLDivElement | null>(null);
let testBoxRect: DOMRect | null = null;
let isMouseGeometricallyInsideTestBox = ref(false); // Vue ref to track state

async function makeInteractive() {
  // Only call if state is changing
  if (!isMouseGeometricallyInsideTestBox.value) {
    await logInfo('--- makeInteractive CALLED (Geometric) ---');
    await logInfo('App.vue (Bare Minimum): Test box geometrically entered - setting interactive TRUE');
    try {
      await getCurrentWindow().setFocus();
      await logInfo('App.vue (Bare Minimum): Attempted to set window focus.');
    } catch (focusError) {
      await logError(`App.vue (Bare Minimum): Error setting window focus: ${focusError}`);
    }
    await setWindowInteractive(true);
    isMouseGeometricallyInsideTestBox.value = true;
  }
}

async function makeClickThrough() {
  // Only call if state is changing
  if (isMouseGeometricallyInsideTestBox.value) {
    await logInfo('--- makeClickThrough CALLED (Geometric) ---');
    await logInfo('App.vue (Bare Minimum): Test box geometrically left - setting interactive FALSE (click-through)');
    await setWindowInteractive(false);
    isMouseGeometricallyInsideTestBox.value = false;
  }
}

const handleDocumentMouseMove = async (event: MouseEvent) => {
  // Always try to get the most current bounding rect if the element exists
  if (testBoxVueRef.value) {
    testBoxRect = testBoxVueRef.value.getBoundingClientRect();
  } else {
    // If testBoxVueRef.value is null (e.g., component unmounted before listener removed),
    // we can't proceed with geometric checks.
    return;
  }

  if (!testBoxRect) return; // Should not happen if testBoxVueRef.value was valid

  const mouseX = event.clientX;
  const mouseY = event.clientY;

  const isCurrentlyGeometricallyInside =
    mouseX >= testBoxRect.left &&
    mouseX <= testBoxRect.right &&
    mouseY >= testBoxRect.top &&
    mouseY <= testBoxRect.bottom;

  if (isCurrentlyGeometricallyInside) {
    if (!isMouseGeometricallyInsideTestBox.value) {
      // Moved into the box
      makeInteractive();
    }
  } else {
    if (isMouseGeometricallyInsideTestBox.value) {
      // Moved out of the box
      makeClickThrough();
    }
  }
};

onMounted(async () => {
  await logInfo("App.vue (Bare Minimum - Geometric): onMounted Start");

  // Initialize the window to be click-through by default.
  try {
    await initializeInteractiveState(false);
    await logInfo("App.vue (Bare Minimum - Geometric): Window initialized to CLICK-THROUGH via composable.");
  } catch (e) {
    await logError(`App.vue (Bare Minimum - Geometric): Error in initial window setup: ${e}`);
  }

  // Get initial bounding box after component is mounted and element ref is available
  if (testBoxVueRef.value) {
    testBoxRect = testBoxVueRef.value.getBoundingClientRect();
    await logInfo(`App.vue (Bare Minimum - Geometric): Initial testBoxRect calculated: ${JSON.stringify(testBoxRect)}`);
  } else {
    // This case should ideally not happen if onMounted runs after template refs are set.
    // If it does, it might indicate an issue with Vue's lifecycle or ref timing.
    await logError("App.vue (Bare Minimum - Geometric): testBoxVueRef not available for initial rect calculation in onMounted.");
  }

  document.addEventListener('mousemove', handleDocumentMouseMove);
  await logInfo("App.vue (Bare Minimum - Geometric): document.mousemove listener added.");

  await logInfo("App.vue (Bare Minimum - Geometric): onMounted Setup complete.");
});

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleDocumentMouseMove);
  logInfo("App.vue (Bare Minimum - Geometric): document.mousemove listener removed.");
});

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
  background-color: rgba(0, 0, 0, 0.01); /* Solid black with 1% (near invisible) transparency */
  pointer-events: auto;
  box-sizing: border-box;
  border: 2px solid rgba(0, 0, 0, 0.01); /* Solid black border with 1% (near invisible) transparency */
}

.interactive-test-box {
  position: absolute;
  top: 50px;
  left: 50px;
  width: 150px;
  height: 100px;
  background-color: rgb(0, 128, 255); /* Fully OPAQUE blue */
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid white;
  cursor: pointer;
  pointer-events: auto;
  user-select: none;
  box-sizing: border-box;
  z-index: 10000;
}
</style>
