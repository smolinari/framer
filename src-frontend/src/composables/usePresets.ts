import { computed, type Ref } from 'vue';

interface FrameStyle {
  left: string;
  top: string;
  width: string;
  height: string;
  // Add other properties if applyPreset modifies them directly,
  // though currently it only sets width, height, left, top.
}

export interface ScreenPreset {
  label: string;
  width: number; // Physical pixels
  height: number; // Physical pixels
  type: 'desktop' | 'mobile';
}

const allPresets: ScreenPreset[] = [
  { label: '4K UHD (3840x2160)', width: 3840, height: 2160, type: 'desktop' },
  { label: 'QHD (2560x1440)', width: 2560, height: 1440, type: 'desktop' },
  { label: 'Full HD (1920x1080)', width: 1920, height: 1080, type: 'desktop' },
  { label: 'HD (1280x720)', width: 1280, height: 720, type: 'desktop' },
  { label: 'SD (640x480) 4:3', width: 640, height: 480, type: 'desktop' },
  { label: 'Square (1080x1080)', width: 1080, height: 1080, type: 'desktop' },
  { label: 'Mobile Landscape L (926x428)', width: 926, height: 428, type: 'mobile' },
  { label: 'Mobile Landscape M (800x360)', width: 800, height: 360, type: 'mobile' },
  { label: 'Mobile Landscape S (640x360)', width: 640, height: 360, type: 'mobile' },
  { label: 'Mobile Portrait L (428x926)', width: 428, height: 926, type: 'mobile' },
  { label: 'Mobile Portrait M (360x800)', width: 360, height: 800, type: 'mobile' },
  { label: 'Mobile Portrait S (360x640)', width: 360, height: 640, type: 'mobile' },
];

import { CONTROLS_AREA_HEIGHT } from '../config/constants';

export function usePresets(
  monitorPhysicalWidth: Ref<number>,
  monitorPhysicalHeight: Ref<number>,
  frameStyle: FrameStyle, // The reactive frameStyle object from App.vue
  isFrameActive: Ref<boolean>, // To activate frame if needed
  toggleState: Ref<boolean>, // To manage the toggle's state
  saveFrameState: () => Promise<void> // Function to save state
) {
  const availableDesktopPresets = computed(() => {
    return allPresets.filter(preset =>
      preset.type === 'desktop' &&
      preset.width < monitorPhysicalWidth.value &&
      preset.height < monitorPhysicalHeight.value
    ).sort((a, b) => b.width - a.width);
  });

  const availableMobilePresets = computed(() => {
    return allPresets.filter(preset =>
      preset.type === 'mobile' &&
      preset.width < monitorPhysicalWidth.value &&
      preset.height < monitorPhysicalHeight.value
    ).sort((a, b) => b.width - a.width);
  });

  function applyPreset(preset: ScreenPreset) {
    frameStyle.width = `${preset.width}px`;
    frameStyle.height = `${preset.height}px`;
    const newLeft = (monitorPhysicalWidth.value / 2) - (preset.width / 2);
    const newTop = (monitorPhysicalHeight.value / 2) - (preset.height / 2);
    frameStyle.left = `${Math.max(0, newLeft)}px`;
    frameStyle.top = `${Math.max(CONTROLS_AREA_HEIGHT, newTop)}px`;
    if (!isFrameActive.value) {
      toggleState.value = true; // This will trigger onToggleChange in App.vue, which sets isFrameActive.value
    }
    saveFrameState();
  }

  return {
    availableDesktopPresets,
    availableMobilePresets,
    applyPreset,
    // allPresets, // Optionally expose if needed elsewhere, though usually not
  };
}