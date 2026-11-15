<script setup>
// 空态即入口：每个空列表都给出「为什么是空的 + 下一步动作」
import Btn from './Btn.vue';

defineProps({
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  actionText: { type: String, default: '' },
  actionTo: { type: [String, Object], default: '' },
});
const emit = defineEmits(['action']);
</script>

<template>
  <div class="empty">
    <div class="mark" aria-hidden="true">
      <span class="sq"></span>
    </div>
    <h3 class="t">{{ title }}</h3>
    <p v-if="desc" class="d">{{ desc }}</p>
    <Btn v-if="actionText" variant="primary" size="md" :to="actionTo || undefined" @click="emit('action')">
      {{ actionText }}
    </Btn>
  </div>
</template>

<style scoped>
.empty {
  display: flex; flex-direction: column; align-items: center; gap: var(--sp-3);
  padding: var(--sp-12) var(--sp-6);
  text-align: center;
}
.mark {
  width: 56px; height: 56px; border-radius: var(--r-m);
  background: var(--surface-3);
  display: flex; align-items: center; justify-content: center;
}
.sq { width: 14px; height: 14px; background: var(--border-strong); }
.t { font-size: var(--fs-h3); color: var(--fg); }
.d { font-size: var(--fs-body); color: var(--muted); max-width: 46ch; line-height: 1.7; margin-bottom: var(--sp-2); }
</style>
