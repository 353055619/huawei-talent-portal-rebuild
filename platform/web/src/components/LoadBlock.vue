<script setup>
defineProps({ rows: { type: Number, default: 3 }, label: { type: String, default: '加载中…' } });
</script>

<template>
  <div class="load" role="status" :aria-label="label">
    <div v-for="i in rows" :key="i" class="skeleton row-skel" :style="{ height: i === 1 ? 48 + 'px' : 64 + 'px' }"></div>
    <span class="sr-only">{{ label }}</span>
  </div>
</template>

<style scoped>
.load { display: flex; flex-direction: column; gap: var(--sp-3); padding: var(--sp-4) 0; }
.row-skel { width: 100%; }
.sr-only {
  position: absolute; width: 1px; height: 1px;
  clip-path: inset(50%); overflow: hidden; white-space: nowrap;
}
</style>
