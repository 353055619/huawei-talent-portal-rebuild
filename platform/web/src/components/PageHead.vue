<script setup>
// 页头：面包屑 + 标题 + 右侧动作。所有内页使用，保证可回退。
import { useRoute } from 'vue-router';

defineProps({
  title: { type: String, required: true },
  sub: { type: String, default: '' },
  crumbs: { type: Array, default: () => [] }, // [{label, to}]
});
const route = useRoute();
</script>

<template>
  <header class="phead">
    <nav v-if="crumbs.length" class="crumbs" :aria-label="'面包屑 ' + route.path">
      <template v-for="(c, i) in crumbs" :key="i">
        <router-link v-if="c.to" :to="c.to" class="crumb">{{ c.label }}</router-link>
        <span v-else class="crumb cur" aria-current="page">{{ c.label }}</span>
        <span v-if="i < crumbs.length - 1" class="sep" aria-hidden="true">/</span>
      </template>
    </nav>
    <div class="title-row">
      <div class="tt">
        <h1>{{ title }}</h1>
        <p v-if="sub" class="sub">{{ sub }}</p>
      </div>
      <div class="acts"><slot name="actions" /></div>
    </div>
  </header>
</template>

<style scoped>
.phead { margin-bottom: var(--sp-6); }
.crumbs { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: var(--sp-3); }
.crumb { font-size: var(--fs-small); color: var(--muted); }
a.crumb:hover { color: var(--fg); text-decoration: underline; text-underline-offset: 3px; }
.crumb.cur { color: var(--fg-2); font-weight: 600; }
.sep { color: var(--faint); font-size: 12px; }
.title-row { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--sp-4); flex-wrap: wrap; }
.sub { margin-top: var(--sp-2); color: var(--muted); max-width: 68ch; }
.acts { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
</style>
