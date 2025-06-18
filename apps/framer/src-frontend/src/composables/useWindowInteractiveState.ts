import { ref } from 'vue';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { error as logError, info as logInfo } from '@tauri-apps/plugin-log';

// Get the window instance once. TypeScript will infer the correct type.
const appWindow = getCurrentWindow();

// This ref tracks the state of whether the window *should be* interactive.
// true = interactive (ignoreCursorEvents = false)
// false = click-through (ignoreCursorEvents = true)
const isProgrammaticallyInteractive = ref(false);

export function useWindowInteractiveState() {
  /**
   * Sets the window's interactivity.
   * @param interactive If true, makes the window interactive. If false, makes it click-through.
   */
  async function setWindowInteractive(interactive: boolean) {
    if (isProgrammaticallyInteractive.value === interactive) {
      await logInfo(`Window interactive state already ${interactive}. No Tauri call needed.`);
      console.log(`[CONSOLE.LOG] Window interactive state already ${interactive}. No Tauri call needed.`);
      return; // Avoid redundant calls
    }

    try {
      // Set ignoreCursorEvents (true for click-through, false for interactive)
      await appWindow.setIgnoreCursorEvents(!interactive); 
      isProgrammaticallyInteractive.value = interactive;
      // Re-assert fullscreen and undecorated state, as focus changes can sometimes affect this for alwaysOnTop windows
      await appWindow.setFullscreen(true); 
      await appWindow.setDecorations(false); 
      await logInfo(`Window ignoreCursorEvents set to: ${!interactive} (Programmatically Interactive: ${interactive})`);
      console.log(`[CONSOLE.LOG] Window ignoreCursorEvents set to: ${!interactive} (Programmatically Interactive: ${interactive})`);
    } catch (e) {
      await logError(`Error setting window ignoreCursorEvents to ${!interactive}: ${e}`);
      console.error(`[CONSOLE.ERROR] Error setting window ignoreCursorEvents to ${!interactive}:`, e);
    }
  }

  /**
   * Initializes the window's click-through state.
   * Typically called once on application mount.
   * @param initialInteractiveState Defaults to false (click-through).
   */
  async function initializeInteractiveState(initialInteractiveState: boolean = false) {
    try {
      await appWindow.setIgnoreCursorEvents(!initialInteractiveState);
      isProgrammaticallyInteractive.value = initialInteractiveState;
      await logInfo(`Initial window ignoreCursorEvents set to: ${!initialInteractiveState} (Programmatically Interactive: ${initialInteractiveState})`);
      console.log(`[CONSOLE.LOG] Initial window ignoreCursorEvents set to: ${!initialInteractiveState} (Programmatically Interactive: ${initialInteractiveState})`);
    } catch (e) {
      await logError(`Error setting initial window ignoreCursorEvents: ${e}`);
      console.error(`[CONSOLE.ERROR] Error setting initial window ignoreCursorEvents:`, e);
    }
  }

  // Function to toggle the current tracked interactive state
  async function toggleCurrentInteractiveState() {
    await logInfo(`Toggling interactive state. Current isProgrammaticallyInteractive: ${isProgrammaticallyInteractive.value}`);
    console.log(`[CONSOLE.LOG] Toggling interactive state. Current isProgrammaticallyInteractive: ${isProgrammaticallyInteractive.value}`);
    await setWindowInteractive(!isProgrammaticallyInteractive.value);
  }

  return {
    isProgrammaticallyInteractive, // Expose the ref for readonly access
    setWindowInteractive,
    initializeInteractiveState,
    toggleCurrentInteractiveState, // Expose the toggle function
  };
}
