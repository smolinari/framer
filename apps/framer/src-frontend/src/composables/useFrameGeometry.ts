import type { Ref } from 'vue';
import { LazyStore } from '@tauri-apps/plugin-store';
import { info as logInfo, error as logError } from '@tauri-apps/plugin-log';

interface FrameStyle {
  display: string;
  left: string;
  top: string;
  width: string;
  height: string;
  border: string;
  position: 'absolute' | 'relative' | 'fixed' | 'static' | 'sticky';
  backgroundColor: string;
  boxSizing: 'content-box' | 'border-box';
  cursor: string;
  zIndex: number;
  userSelect?: 'none' | 'auto';
}

import { MIN_FRAME_WIDTH, MIN_FRAME_HEIGHT, CONTROLS_AREA_HEIGHT } from '../config/constants';

export function useFrameGeometry(
  frameStyle: FrameStyle, // Pass the reactive frameStyle object
  monitorPhysicalWidth: Ref<number>,
  monitorPhysicalHeight: Ref<number>
) {
  const store = new LazyStore('.framer-settings.dat');

  async function initializeFrameGeometry(defaultWidth: number, defaultHeight: number) {
    await logInfo("useFrameGeometry: Initializing frame geometry...");
    try {
      const savedFrameGeo = await store.get<{ left: string; top: string; width: string; height: string }>('frameGeometry');

      if (savedFrameGeo && savedFrameGeo.width && savedFrameGeo.height && savedFrameGeo.left && savedFrameGeo.top) {
        await logInfo(`useFrameGeometry: Loaded saved frame geometry (physical pixels): ${JSON.stringify(savedFrameGeo)}`);
        
        let loadedWidth = parseInt(savedFrameGeo.width, 10);
        let loadedHeight = parseInt(savedFrameGeo.height, 10);
        let loadedLeft = parseInt(savedFrameGeo.left, 10);
        let loadedTop = parseInt(savedFrameGeo.top, 10);

        frameStyle.width = `${Math.max(MIN_FRAME_WIDTH, loadedWidth)}px`;
        frameStyle.height = `${Math.max(MIN_FRAME_HEIGHT, loadedHeight)}px`;
        // Ensure frame is within monitor bounds
        frameStyle.left = `${Math.max(0, Math.min(loadedLeft, monitorPhysicalWidth.value - Math.max(MIN_FRAME_WIDTH, loadedWidth)))}px`;
        frameStyle.top = `${Math.max(CONTROLS_AREA_HEIGHT, Math.min(loadedTop, monitorPhysicalHeight.value - Math.max(MIN_FRAME_HEIGHT, loadedHeight)))}px`;

      } else {
        await logInfo('useFrameGeometry: No valid saved frame geometry found, using defaults.');
        frameStyle.width = `${defaultWidth}px`;
        frameStyle.height = `${defaultHeight}px`;
        const newLeft = (monitorPhysicalWidth.value / 2) - (defaultWidth / 2);
        const newTop = (monitorPhysicalHeight.value / 2) - (defaultHeight / 2);
        frameStyle.left = `${Math.max(0, newLeft)}px`;
        frameStyle.top = `${Math.max(CONTROLS_AREA_HEIGHT, newTop)}px`;
      }
    } catch (error) {
      await logError(`useFrameGeometry: Error initializing frame geometry: ${error}`);
      // Fallback to defaults in case of store error
      frameStyle.width = `${defaultWidth}px`;
      frameStyle.height = `${defaultHeight}px`;
      const newLeft = (monitorPhysicalWidth.value / 2) - (defaultWidth / 2);
      const newTop = (monitorPhysicalHeight.value / 2) - (defaultHeight / 2);
      frameStyle.left = `${Math.max(0, newLeft)}px`;
      frameStyle.top = `${Math.max(CONTROLS_AREA_HEIGHT, newTop)}px`;
    }
    await logInfo(`useFrameGeometry: Frame geometry initialized to: ${JSON.stringify({width: frameStyle.width, height: frameStyle.height, left: frameStyle.left, top: frameStyle.top})}`);
  }

  // The saveFrameState function could also be moved here if desired,
  // it would need access to frameStyle and the store instance.

  return {
    initializeFrameGeometry,
    // store, // Optionally return the store if App.vue still needs it for saveFrameState
  };
}