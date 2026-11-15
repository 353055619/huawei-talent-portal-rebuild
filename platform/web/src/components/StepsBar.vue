<script setup>
// 旅程进度条 —— 全站签名组件。
// 所有域（投递/考券/大赛/双选会/入驻/约考/学习）共用同一个可视化，
// 由后端 TRACKERS 注册表驱动，前端零定制。
const props = defineProps({
  steps: { type: Array, required: true },
  current: { type: Number, default: 0 },
  failed: Boolean,
  failedLabel: { type: String, default: '未通过' },
  compact: Boolean,
});
</script>

<template>
  <ol class="steps" :class="{ compact }" :aria-label="`进度：第 ${current + 1} 步，共 ${steps.length} 步`">
    <li v-for="(s, i) in steps" :key="i" class="step" :class="{ done: i < current, active: i === current && !failed, failed: i === 0 && failed }">
      <span class="node" aria-hidden="true">
        <svg v-if="i < current && !failed" width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2 6.5 4.8 9.2 10 3.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <template v-else>{{ i + 1 }}</template>
      </span>
      <span class="lbl">{{ s }}</span>
      <span v-if="i < steps.length - 1" class="link" aria-hidden="true"></span>
    </li>
    <li v-if="failed" class="step failed-flag">
      <span class="node x" aria-hidden="true">✕</span>
      <span class="lbl">{{ failedLabel }}</span>
    </li>
  </ol>
</template>

<style scoped>
.steps { display: flex; align-items: flex-start; width: 100%; }
.step { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; position: relative; }
.step:not(:last-child) { padding-right: 18px; }

.node {
  width: 24px; height: 24px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; font-family: var(--font-num);
  background: var(--surface-3); color: var(--faint);
  border: 1.5px solid var(--border-strong);
  flex: none;
  transition: all var(--t-fast);
}
.lbl { font-size: var(--fs-small); color: var(--faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.step.done .node { background: var(--fg); border-color: var(--fg); color: #fff; }
.step.done .lbl { color: var(--fg-2); }
.step.active .node { background: var(--surface); border-color: var(--accent); color: var(--accent-ink); box-shadow: 0 0 0 4px var(--accent-soft); }
.step.active .lbl { color: var(--fg); font-weight: 600; }

.link {
  position: absolute; left: 32px; right: 12px; top: 12px;
  height: 2px; background: var(--border-strong); border-radius: 1px;
}
.step.done .link { background: var(--fg); }

.step.failed .node { border-color: var(--danger); color: var(--danger); }
.step.failed-flag { flex: 0 0 auto; padding-right: 0; }
.step.failed-flag .node { background: var(--danger); border-color: var(--danger); color: #fff; font-size: 10px; }
.step.failed-flag .lbl { color: var(--danger); font-weight: 600; }

.compact .node { width: 20px; height: 20px; font-size: 10px; }
.compact .lbl { font-size: var(--fs-caption); }
.compact .link { top: 10px; left: 28px; }

@media (max-width: 640px) {
  .lbl { display: none; }
  .step.active .lbl { display: inline; position: absolute; top: 28px; left: 0; }
  .step:not(:last-child) { padding-right: 8px; }
}
</style>
