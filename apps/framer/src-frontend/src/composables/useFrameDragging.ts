import { ref } from 'vue';

interface FrameStyle {
  left: string;
  top: string;
  // Potentially other style properties if needed by dragging, though unlikely
}

import { CONTROLS_AREA_HEIGHT } from '../config/constants';

export function useFrameDragging(
  frameStyle: FrameStyle, // The reactive frameStyle object
  saveFrameState: () => Promise<void> // Function to save state
) {
  const isDragging = ref(false);
  const dragStartX = ref(0);
  const dragStartY = ref(0);
  const initialFrameOffsetX = ref(0);
  const initialFrameOffsetY = ref(0);

  function onFrameMouseMove(event: MouseEvent) {
    if (!isDragging.value) return;
    const dx = event.clientX - dragStartX.value;
    const dy = event.clientY - dragStartY.value;
    frameStyle.left = `${initialFrameOffsetX.value + dx}px`;
    frameStyle.top = `${Math.max(CONTROLS_AREA_HEIGHT, initialFrameOffsetY.value + dy)}px`;
  }

  function onFrameMouseUp() {
    if (!isDragging.value) return; // Ensure this only runs if dragging was active
    isDragging.value = false;
    window.removeEventListener('mousemove', onFrameMouseMove);
    window.removeEventListener('mouseup', onFrameMouseUp);
    saveFrameState();
  }

  function onFrameMouseDown(event: MouseEvent) {
    if (event.button !== 0) return;
    isDragging.value = true;
    dragStartX.value = event.clientX;
    dragStartY.value = event.clientY;
    initialFrameOffsetX.value = parseInt(frameStyle.left, 10);
    initialFrameOffsetY.value = parseInt(frameStyle.top, 10);
    window.addEventListener('mousemove', onFrameMouseMove);
    window.addEventListener('mouseup', onFrameMouseUp);
  }

  return {
    onFrameMouseDown,
    // isDragging, // Optionally expose if needed by App.vue, but likely not
  };
}