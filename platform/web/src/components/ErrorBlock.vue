<script setup>
import Btn from './Btn.vue';

defineProps({
  message: { type: String, default: '加载失败' },
  detail: { type: String, default: '' },
});
const emit = defineEmits(['retry']);
</script>

<template>
  <div class="err" role="alert">
    <div class="card-inner">
      <h3>{{ message }}</h3>
      <p v-if="detail" class="d">{{ detail }}</p>
      <div class="meta caption">请检查网络后重试；若持续失败，请联系平台支持并提供错误码。</div>
      <Btn variant="secondary" size="sm" @click="emit('retry')">重试</Btn>
    </div>
  </div>
</template>

<style scoped>
.err { padding: var(--sp-8); display: flex; justify-content: center; }
.card-inner {
  background: var(--danger-soft); border: 1px solid #ecc8c5;
  border-radius: var(--r-m); padding: var(--sp-5) var(--sp-6);
  display: flex; flex-direction: column; align-items: flex-start; gap: var(--sp-2);
  max-width: 480px;
}
h3 { font-size: var(--fs-h3); color: var(--danger); }
.d { color: var(--fg-2); }
.meta { color: var(--muted); margin-bottom: var(--sp-2); }
</style>
