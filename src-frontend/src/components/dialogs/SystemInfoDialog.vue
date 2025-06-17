<template>
  <q-dialog
    :model-value="props.modelValue"
    @update:model-value="emitUpdateModelValue"
  >
    <q-card class="themed-dialog-card" style="min-width: 400px; max-width: 600px;">
      <q-card-section>
        <div class="text-h6">System & Sizing Information</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="text-subtitle2">Monitor & Scaling:</div>
        <div><strong>Monitor Physical Res:</strong> {{ props.monitorPhysicalWidth }} x {{ props.monitorPhysicalHeight }} px</div>
        <div><strong>Monitor Logical Res (Work Area):</strong> {{ Math.round(props.monitorPhysicalWidth / props.monitorScaleFactor) }} x {{ Math.round(props.monitorPhysicalHeight / props.monitorScaleFactor) }} px</div>
        <div><strong>Effective OS Scale Factor:</strong> {{ props.monitorScaleFactor }} (e.g., 1.2 means 120%)</div>
        <div><strong>Applied App Zoom:</strong> {{ props.appliedAppZoom.toFixed(4) }}</div>
        <q-separator class="q-my-md" />
        <div class="text-subtitle2">Frame Dimensions (Physical Pixels):</div>
        <div><strong>Current Frame Width:</strong> {{ props.frameStyle.width }}</div>
        <div><strong>Current Frame Height:</strong> {{ props.frameStyle.height }}</div>
        <div><strong>Current Frame Left:</strong> {{ props.frameStyle.left }}</div>
        <div><strong>Current Frame Top:</strong> {{ props.frameStyle.top }}</div>
        <q-separator class="q-my-md" />
        <div class="text-subtitle2">OS Information:</div>
        <div><strong>OS:</strong> {{ props.osType }} ({{ props.osPlatform }})</div>
        <div><strong>Architecture:</strong> {{ props.osArch }}</div>
        <div><strong>OS Version:</strong> {{ props.osVersionInfo }}</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" color="white" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'; // Import CSSProperties for frameStyle type

interface FrameStyle extends CSSProperties {
  width: string;
  height: string;
  left: string;
  top: string;
}

const props = defineProps<{
  modelValue: boolean; // For v-model
  monitorPhysicalWidth: number;
  monitorPhysicalHeight: number;
  monitorScaleFactor: number;
  appliedAppZoom: number;
  frameStyle: FrameStyle; // Use the defined interface
  osType: string;
  osPlatform: string;
  osArch: string;
  osVersionInfo: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

function emitUpdateModelValue(value: boolean) {
  emit('update:modelValue', value);
}
</script>

<style scoped>
.themed-dialog-card {
  background-color: #003f5c;
  color: white;
}

.themed-dialog-card .text-h6,
.themed-dialog-card .text-subtitle2,
.themed-dialog-card p,
.themed-dialog-card div strong {
  color: white; /* Ensure text inside sections is white */
}

.themed-dialog-card .q-separator {
  background-color: rgba(255, 255, 255, 0.3); /* Style for the separator */
}
</style>