<template>
  <q-dialog
    :model-value="props.modelValue"
    @update:model-value="emitUpdateModelValue"
    @show="onDialogShow"
  >
    <q-card class="themed-dialog-card" style="min-width: 300px">
      <q-card-section>
        <div class="text-h6">Enter Custom Dimensions</div>
      </q-card-section>
      <q-card-section class="q-pt-none q-gutter-md">
        <q-input dense v-model.number="widthInput" type="number" label="Width (px)" autofocus />
        <q-input dense v-model.number="heightInput" type="number" label="Height (px)" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="white" v-close-popup />
        <q-btn
          flat
          label="Apply"
          color="white"
          @click="handleApply"
          :disable="!widthInput || !heightInput || widthInput <= 0 || heightInput <= 0"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean; // For v-model
  initialWidth: number | null;
  initialHeight: number | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'apply-custom-size', width: number, height: number): void;
}>();

const widthInput = ref<number | null>(props.initialWidth);
const heightInput = ref<number | null>(props.initialHeight);

watch(() => props.modelValue, (newValue) => {
  if (newValue) { // When dialog is shown
    widthInput.value = props.initialWidth;
    heightInput.value = props.initialHeight;
  }
});

function onDialogShow() { // Alternative way to reset on show
  widthInput.value = props.initialWidth;
  heightInput.value = props.initialHeight;
}

function emitUpdateModelValue(value: boolean) {
  emit('update:modelValue', value);
}

function handleApply() {
  if (widthInput.value && heightInput.value && widthInput.value > 0 && heightInput.value > 0) {
    emit('apply-custom-size', widthInput.value, heightInput.value);
    emit('update:modelValue', false); // Close dialog on apply
  }
}
</script>

<style scoped>
.themed-dialog-card {
  background-color: #003f5c;
  color: white;
}

.themed-dialog-card .text-h6,
.themed-dialog-card .text-subtitle2,
.themed-dialog-card .q-input { /* Ensure input text and label are also styled if needed */
  color: white;
}

.themed-dialog-card .text-h6 {
  font-size: 1.5rem; /* 20% increase */
}

/* If Quasar input's default label/text color isn't white on this background, you might need more specific selectors */
:deep(.q-field__label),
:deep(.q-field__native) {
  color: white !important;
  font-size: 1.2rem; /* Approx 20% increase for input text and label */
}

:deep(.q-field__control):before {
    border-bottom-color: rgba(255,255,255,0.7) !important;
}
:deep(.q-field__control):after {
    border-bottom-color: white !important;
}

</style>