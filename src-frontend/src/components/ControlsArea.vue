<template>
  <div
    class="controls-area"
  >
    <q-btn
      dense
      flat
      color="white"
      icon="add"
      size="md"
      class="q-mr-sm"
    >
      <q-menu v-model="isPresetMenuOpen" anchor="bottom end" self="top end">
        <q-list dense class="preset-menu-list" style="min-width: 280px;">
          <template v-if="props.availableDesktopPresets.length > 0">
            <q-item-label header dense class="q-py-xs">Desktop</q-item-label>
            <q-item v-for="preset in props.availableDesktopPresets" :key="preset.label" clickable v-close-popup @click="handleApplyPreset(preset)">
              <q-item-section>{{ preset.label }}</q-item-section>
            </q-item>
          </template>
          <q-separator v-if="props.availableDesktopPresets.length > 0 && props.availableMobilePresets.length > 0" />
          <template v-if="props.availableMobilePresets.length > 0">
            <q-item-label header dense class="q-py-xs q-mt-sm">Mobile</q-item-label>
            <q-item v-for="preset in props.availableMobilePresets" :key="preset.label" clickable v-close-popup @click="handleApplyPreset(preset)">
              <q-item-section>{{ preset.label }}</q-item-section>
            </q-item>
          </template>
          <q-item v-if="!props.availableDesktopPresets.length && !props.availableMobilePresets.length" dense>
            <q-item-section>
              <div>No smaller presets available</div>
            </q-item-section>
          </q-item>
          <q-separator v-if="props.availableDesktopPresets.length > 0 || props.availableMobilePresets.length > 0" />
          <q-item clickable v-close-popup @click="emit('open-custom-size')">
            <q-item-section>Custom Size...</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>

    <q-toggle
      :model-value="props.modelValue"
      color="white"
      @update:model-value="handleToggleChange"
    />

    <q-btn dense flat color="white" icon="settings" size="md" class="q-mx-xs">
      <q-menu v-model="isConfigMenuOpen" anchor="bottom middle" self="top middle">
        <q-list dense style="min-width: 180px;" class="preset-menu-list">
          <q-item clickable v-close-popup @click="emit('open-about')">
            <q-item-section>About Framer</q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="emit('open-system-info')">
            <q-item-section>System Info</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>

    <q-btn
      dense
      flat
      color="white"
      icon="close"
      size="md"
      @click="emit('close-app')"
      class="q-ml-xs"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// import { getCurrentWindow } from '@tauri-apps/api/window'; // No longer needed directly
import { /* info as logInfo, error as logError */ } from '@tauri-apps/plugin-log';
// import { useWindowInteractiveState } from '../composables/useWindowInteractiveState'; // No longer needed

// Re-define ScreenPreset here for now. Ideally, move to a shared types.ts file.
interface ScreenPreset {
  label: string;
  width: number;
  height: number;
  type: 'desktop' | 'mobile';
}

const props = defineProps<{
  modelValue: boolean; // For v-model on q-toggle
  availableDesktopPresets: ScreenPreset[];
  availableMobilePresets: ScreenPreset[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'apply-preset', preset: ScreenPreset): void;
  (e: 'open-custom-size'): void;
  (e: 'open-about'): void;
  (e: 'open-system-info'): void;
  (e: 'close-app'): void;
}>();

const isPresetMenuOpen = ref(false);
const isConfigMenuOpen = ref(false);

// const { setWindowInteractive } = useWindowInteractiveState(); // No longer needed
// allowInteraction and enableClickThrough functions are removed.


function handleToggleChange(value: boolean | number | string) {
  emit('update:modelValue', Boolean(value));
}

function handleApplyPreset(preset: ScreenPreset) {
  emit('apply-preset', preset);
}

</script>

<style scoped>
/* Styles specific to ControlsArea, copied from App.vue */
.controls-area {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  background-color: #003f5c;
  padding: 2px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  border: 2px solid white;
  pointer-events: auto; /* Ensure controls area itself is interactive */
}

.preset-menu-list {
  background-color: #003f5c;
}

.preset-menu-list .q-item {
  color: white;
}

.preset-menu-list .q-item .q-item__section {
  font-size: 1.12em;
}

.q-item__label--header {
  background-color: #003148;
  color: white !important;
  font-weight: bold;
  font-size: 1.25rem;
}
</style>