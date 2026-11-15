<script setup>
import { computed } from 'vue';

const props = defineProps({
  hue: { type: Number, default: 8 },
  name: { type: String, default: '' },
  size: { type: Number, default: 40 },
});
const initials = computed(() => props.name?.slice(0, 1) || '·');
</script>

<template>
  <span
    class="hue-sq"
    :style="{
      width: size + 'px', height: size + 'px',
      background: `hsl(${hue} 42% 46%)`,
      color: `hsl(${hue} 20% 96%)`,
      fontSize: Math.round(size * 0.38) + 'px',
      borderRadius: Math.max(4, Math.round(size * 0.14)) + 'px',
    }"
    aria-hidden="true"
  >{{ initials }}</span>
</template>

<style scoped>
.hue-sq {
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 600; flex: none; letter-spacing: 0;
}
</style>
