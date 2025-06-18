<template>
  <div
    v-if="props.isFrameActive"
    id="framer-display-main"
    :style="[props.frameStyle, { userSelect: props.frameStyle.userSelect || 'auto' }]"
    @mousedown="handleFrameMouseDown"
  >
    <div class="dimension-display-vue" v-if="props.isResizing">
      {{ props.dimensionsText }}
    </div>
    <div
      v-for="handle in resizeHandles"
      :key="handle"
      :class="['resize-handle', `handle-${handle}`]"
      @mousedown.stop="handleResizeHandleMouseDown($event, handle)"
    ></div>
  </div>
</template>

<script setup lang="ts">
import type { PropType, CSSProperties } from 'vue';

// Define an interface for the frameStyle prop for better type safety
interface FrameStyle extends CSSProperties {
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

const props = defineProps({
  isFrameActive: {
    type: Boolean,
    required: true,
  },
  frameStyle: {
    type: Object as PropType<FrameStyle>,
    required: true,
  },
  isResizing: {
    type: Boolean,
    required: true,
  },
  dimensionsText: {
    type: String,
    required: true,
  },
});

const emit = defineEmits<{
  (e: 'frame-mousedown', event: MouseEvent): void;
  (e: 'resize-handle-mousedown', event: MouseEvent, handleId: string): void;
}>();

const resizeHandles = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

function handleFrameMouseDown(event: MouseEvent) {
  emit('frame-mousedown', event);
}

function handleResizeHandleMouseDown(event: MouseEvent, handleId: string) {
  emit('resize-handle-mousedown', event, handleId);
}
</script>

<style scoped>
/* Styles for dimension-display-vue and resize-handle are copied from App.vue's style section */
/* #framer-display-main is the new ID for the main frame div, replacing #framer-vue-main if it was styled directly */

.dimension-display-vue {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 1.44em;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.resize-handle {
  position: absolute;
  width: 14px;
  height: 14px;
  background-color: rgba(255, 255, 0, 0.7);
  border: 1px solid rgba(0,0,0,0.5);
  z-index: 101; /* Ensure handles are above the frame if it has a background, but below controls */
  box-sizing: border-box;
}

.handle-nw { top: -12px; left: -12px; cursor: nwse-resize; }
.handle-ne { top: -12px; right: -12px; cursor: nesw-resize; }
.handle-sw { bottom: -12px; left: -12px; cursor: nesw-resize; }
.handle-se { bottom: -12px; right: -12px; cursor: nwse-resize; }
.handle-n { top: -12px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.handle-s { bottom: -12px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
.handle-w { top: 50%; left: -12px; transform: translateY(-50%); cursor: ew-resize; }
.handle-e { top: 50%; right: -12px; transform: translateY(-50%); cursor: ew-resize; }
</style>