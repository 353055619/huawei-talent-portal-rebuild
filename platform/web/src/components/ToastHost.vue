<script setup>
import { useUi } from '../stores/ui';

const ui = useUi();
</script>

<template>
  <div class="toast-host" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in ui.toasts" :key="t.id" class="toast" :class="`toast-${t.kind}`" role="status">
        <span class="dot" aria-hidden="true"></span>
        <span class="msg">{{ t.message }}</span>
        <button class="x" aria-label="关闭通知" @click="ui.dismiss(t.id)">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed; top: var(--sp-5); left: 50%; transform: translateX(-50%);
  z-index: var(--z-toast);
  display: flex; flex-direction: column; gap: var(--sp-2);
  width: min(420px, calc(100vw - 32px));
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  display: flex; align-items: center; gap: 10px;
  background: var(--inverse-bg); color: var(--inverse-fg);
  border-radius: var(--r-m);
  padding: 12px 14px;
  box-shadow: var(--shadow-3);
  font-size: var(--fs-body);
}
.dot { width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--success); }
.toast-error .dot { background: #ff7b72; }
.toast-info .dot { background: #79b8ff; }
.msg { flex: 1; min-width: 0; }
.x { color: rgba(255,255,255,0.5); font-size: 12px; padding: 4px; flex: none; }
.x:hover { color: #fff; }

.toast-enter-active, .toast-leave-active { transition: all var(--t-mid); }
.toast-enter-from { opacity: 0; transform: translateY(-10px); }
.toast-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
