<template>
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
        <p><strong>Author:</strong> Scott Molinari</p>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" color="white" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
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
</script>

<style scoped>
.themed-dialog-card {
  background-color: #003f5c;
  color: white;
}

.themed-dialog-card .text-h6,
.themed-dialog-card .text-subtitle2,
.themed-dialog-card p {
  color: white;
}
</style>