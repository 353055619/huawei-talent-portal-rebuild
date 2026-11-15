<script setup>
defineProps({
  options: { type: Array, required: true }, // [{label, value}]
  modelValue: { type: String, default: '' },
  allLabel: { type: String, default: '全部' },
});
const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div class="chips" role="group">
    <button
      v-for="opt in [{ label: allLabel, value: '' }, ...options]"
      :key="opt.value"
      class="chip"
      :class="{ on: modelValue === opt.value }"
      :aria-pressed="modelValue === opt.value"
      @click="emit('update:modelValue', opt.value)"
    >{{ opt.label }}</button>
  </div>
</template>

<style scoped>
.chips { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.chip {
  padding: 5px 14px; border-radius: var(--r-pill);
  border: 1px solid var(--border-strong);
  background: var(--surface); color: var(--fg-2);
  font-size: var(--fs-small); font-weight: 500;
  transition: all var(--t-fast);
  min-height: 30px;
}
.chip:hover { border-color: var(--fg-2); }
.chip.on {
  background: var(--inverse-bg); border-color: var(--inverse-bg); color: var(--inverse-fg);
  font-weight: 600;
}
</style>
