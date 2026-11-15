<script setup>
defineProps({
  value: { type: [String, Number], required: true },
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  trend: { type: String, default: '' }, // 如 +12%
});
</script>

<template>
  <div class="stat">
    <div class="v num">{{ value }}</div>
    <div class="l">{{ label }}</div>
    <div v-if="hint || trend" class="h caption">
      <span v-if="trend" class="trend" :class="{ up: trend.startsWith('+') }">{{ trend }}</span>
      {{ hint }}
    </div>
  </div>
</template>

<style scoped>
.stat { display: flex; flex-direction: column; gap: 2px; padding: var(--sp-4); }
.v { font-size: 30px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.1; }
.l { font-size: var(--fs-small); color: var(--muted); }
.h { margin-top: 2px; }
.trend { color: var(--success); font-weight: 600; margin-right: 4px; }
</style>
