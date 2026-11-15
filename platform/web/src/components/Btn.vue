<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'secondary' }, // primary | secondary | ghost | danger
  size: { type: String, default: 'md' },           // sm | md | lg
  loading: Boolean,
  disabled: Boolean,
  block: Boolean,
  to: [String, Object],
  href: String,
});
const emit = defineEmits(['click']);

const isDisabled = computed(() => props.disabled || props.loading);
const cls = computed(() => [
  'btn',
  `btn-${props.variant}`,
  `btn-${props.size}`,
  { 'is-block': props.block, 'is-loading': props.loading, 'is-disabled': isDisabled.value },
]);

function onClick(e) {
  if (isDisabled.value) { e.preventDefault(); return; }
  emit('click', e);
}
</script>

<template>
  <a v-if="href" :class="cls" :href="href" target="_blank" rel="noopener"><slot /></a>
  <router-link v-else-if="to && !isDisabled" :class="cls" :to="to"><slot /></router-link>
  <button v-else :class="cls" :disabled="isDisabled" @click="onClick">
    <span v-if="loading" class="btn-spinner" aria-hidden="true"></span>
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-weight: 600; font-size: var(--fs-body);
  border-radius: var(--r-s);
  border: 1px solid transparent;
  transition: background var(--t-fast), border-color var(--t-fast), color var(--t-fast), transform var(--t-fast);
  white-space: nowrap; line-height: 1;
  letter-spacing: 0.02em;
  min-height: 36px; padding: 0 16px;
}
.btn:active:not(.is-disabled) { transform: scale(0.98); }
.btn-sm { min-height: 28px; padding: 0 10px; font-size: var(--fs-small); }
.btn-lg { min-height: 44px; padding: 0 24px; font-size: var(--fs-body-l); }
.is-block { width: 100%; }

.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover:not(.is-disabled) { background: var(--accent-deep); }

.btn-secondary { background: var(--surface); color: var(--fg); border-color: var(--border-strong); }
.btn-secondary:hover:not(.is-disabled) { border-color: var(--fg-2); }

.btn-ghost { background: transparent; color: var(--fg-2); }
.btn-ghost:hover:not(.is-disabled) { background: var(--surface-3); color: var(--fg); }

.btn-danger { background: var(--danger); color: #fff; }
.btn-danger:hover:not(.is-disabled) { filter: brightness(0.92); }

.is-disabled { opacity: 0.5; cursor: not-allowed; }

.btn-spinner {
  width: 13px; height: 13px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
  animation: spin 0.7s linear infinite;
}
.btn-secondary .btn-spinner, .btn-ghost .btn-spinner {
  border-color: rgba(0,0,0,0.15); border-top-color: var(--fg-2);
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
