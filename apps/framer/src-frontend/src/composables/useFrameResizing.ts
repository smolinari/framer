import { ref, reactive } from 'vue';

interface FrameStyle {
  left: string;
  top: string;
  width: string;
  height: string;
  userSelect?: 'none' | 'auto';
  // Add other properties if needed
}

import { MIN_FRAME_WIDTH, MIN_FRAME_HEIGHT, CONTROLS_AREA_HEIGHT } from '../config/constants';

export function useFrameResizing(
  frameStyle: FrameStyle, // The reactive frameStyle object
  saveFrameState: () => Promise<void> // Function to save state
) {
  const isResizing = ref(false);
  const activeHandle = ref<string | null>(null);
  const resizeStartX = ref(0);
  const resizeStartY = ref(0);
  const initialFrameRect = reactive({ left: 0, top: 0, width: 0, height: 0 });

  function onResizeMouseMove(event: MouseEvent) {
    if (!isResizing.value || !activeHandle.value) return;
    let dx = event.clientX - resizeStartX.value;
    let dy = event.clientY - resizeStartY.value;
    let newX = initialFrameRect.left;
    let newY = initialFrameRect.top;
    let newWidth = initialFrameRect.width;
    let newHeight = initialFrameRect.height;
    const handle = activeHandle.value;

    if (handle.includes('e')) {
      newWidth = Math.max(MIN_FRAME_WIDTH, initialFrameRect.width + dx);
    } else if (handle.includes('w')) {
      newWidth = Math.max(MIN_FRAME_WIDTH, initialFrameRect.width - dx);
      newX = initialFrameRect.left + (initialFrameRect.width - newWidth);
    }
    if (handle.includes('s')) {
      newHeight = Math.max(MIN_FRAME_HEIGHT, initialFrameRect.height + dy);
    } else if (handle.includes('n')) {
      newHeight = Math.max(MIN_FRAME_HEIGHT, initialFrameRect.height - dy);
      newY = initialFrameRect.top + (initialFrameRect.height - newHeight);
    }

    if (event.ctrlKey && initialFrameRect.width > 0 && initialFrameRect.height > 0) {
      const aspectRatio = initialFrameRect.width / initialFrameRect.height;
      if (handle.includes('e') || handle.includes('w')) {
        newHeight = Math.max(MIN_FRAME_HEIGHT, newWidth / aspectRatio);
        if (newHeight < MIN_FRAME_HEIGHT) {
          newHeight = MIN_FRAME_HEIGHT;
          newWidth = Math.max(MIN_FRAME_WIDTH, newHeight * aspectRatio);
        }
        if (handle.includes('w')) {
          newX = initialFrameRect.left + (initialFrameRect.width - newWidth);
        }
      } else if (handle.includes('n') || handle.includes('s')) {
        newWidth = Math.max(MIN_FRAME_WIDTH, newHeight * aspectRatio);
        if (newWidth < MIN_FRAME_WIDTH) {
          newWidth = MIN_FRAME_WIDTH;
          newHeight = Math.max(MIN_FRAME_HEIGHT, newWidth / aspectRatio);
        }
        if (handle.includes('n')) {
          newY = initialFrameRect.top + (initialFrameRect.height - newHeight);
        }
      }
    }

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
    if (!isResizing.value) return;
    isResizing.value = false;
    activeHandle.value = null;
    frameStyle.userSelect = 'auto';
    window.removeEventListener('mousemove', onResizeMouseMove);
    window.removeEventListener('mouseup', onResizeMouseUp);
    saveFrameState();
  }

  function onResizeHandleMouseDown(event: MouseEvent, handleId: string) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    isResizing.value = true;
    activeHandle.value = handleId;
    resizeStartX.value = event.clientX;
    resizeStartY.value = event.clientY;
    initialFrameRect.left = parseInt(frameStyle.left, 10);
    initialFrameRect.top = parseInt(frameStyle.top, 10);
    initialFrameRect.width = parseInt(frameStyle.width, 10);
    initialFrameRect.height = parseInt(frameStyle.height, 10);
    frameStyle.userSelect = 'none';
    window.addEventListener('mousemove', onResizeMouseMove);
    window.addEventListener('mouseup', onResizeMouseUp);
  }

  return {
    isResizing, // Expose this as FrameDisplay needs it for the dimension text
    onResizeHandleMouseDown,
  };
}