import { LazyStore } from '@tauri-apps/plugin-store';
import { info as logInfo, error as logError } from '@tauri-apps/plugin-log';

interface FrameStyle {
  left: string;
  top: string;
  width: string;
  height: string;
}

export function useFramePersistence(frameStyle: FrameStyle) {
  const store = new LazyStore('.framer-settings.dat');

  async function saveFrameState() {
    try {
      await store.set('frameGeometry', {
        left: frameStyle.left,
        top: frameStyle.top,
        width: frameStyle.width,
        height: frameStyle.height,
      });
      await store.save();
      await logInfo(`useFramePersistence: Frame state saved (physical pixels): ${JSON.stringify(frameStyle)}`);
    } catch (error) {
      await logError(`useFramePersistence: Failed to save frame state: ${error}`);
    }
  }

  return {
    saveFrameState,
  };
}