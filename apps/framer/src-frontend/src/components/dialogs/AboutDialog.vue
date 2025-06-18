<template>
  <!-- eslint-disable-next-line vue/no-v-model-argument -->
  <q-dialog
    :model-value="props.modelValue"
    @update:model-value="emitUpdateModelValue"
  >
    <q-card class="themed-dialog-card" style="min-width: 350px; max-width: 500px;">
      <q-card-section>
        <div class="text-h6">About {{ props.appName }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <p>Framer helps you delineate a specific area on your screen, which is especially useful for screen recording and streaming.</p>
        <p><strong>Version:</strong> {{ props.appVersion }}</p>
        <p class="q-mt-sm text-caption"><i>Note: Due to complexities in OS display scaling, achieving absolute pixel-perfect frame dimensions across all systems can be challenging. This app aims for a close approximation.</i></p>
        <p class="q-mt-md" @click.prevent="openPatreonLink" style="cursor: pointer;">
          If you like my work, <a href="https://www.patreon.com/user?u=16255660" target="_blank" rel="noopener noreferrer" class="text-white text-weight-bold" style="text-decoration: underline;">buy me a coffee</a>.
        </p>
        <p><strong>Author:</strong> Scott Molinari</p>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" color="white" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { open as openShell } from '@tauri-apps/plugin-shell';

const props = defineProps<{
  modelValue: boolean; // For v-model
  appName: string;
  appVersion: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

function emitUpdateModelValue(value: boolean) {
  emit('update:modelValue', value);
}

async function openPatreonLink(event: MouseEvent) {
  // Prevent default if the click was directly on the <p> but allow if it was on the <a> for right-click context menu
  if (event.target === event.currentTarget || (event.target as HTMLElement).tagName !== 'A') {
    event.preventDefault();
  }
  await openShell('https://www.patreon.com/user?u=16255660');
}
</script>

<style scoped>
.themed-dialog-card {
  background-color: #003f5c;
  color: white;
}

.themed-dialog-card .text-h6,
.themed-dialog-card p {
  color: white;
}

.themed-dialog-card .text-h6 {
  font-size: 1.5rem; /* 20% increase from Quasar's default 1.25rem */
}
.themed-dialog-card p {
  font-size: 1.2rem; /* Approx 20% increase from a typical 1rem base */
}
</style>