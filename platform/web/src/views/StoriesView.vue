<script setup>
// 成功案例：结构化成长节点 + 去向
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Quote, MapPin } from 'lucide-vue-next';
import LoadBlock from '../components/LoadBlock.vue';
import ErrorBlock from '../components/ErrorBlock.vue';
import EmptyState from '../components/EmptyState.vue';
import { api } from '../api';

const { t } = useI18n();
const items = ref(null);
const error = ref(false);
const open = ref(null);

async function load() {
  error.value = false;
  try { items.value = (await api.get('/stories')).items; }
  catch { error.value = true; }
}
onMounted(load);

function toggle(i) { open.value = open.value === i ? null : i; }
</script>

<template>
  <div class="container page-enter" style="padding-top: 32px; max-width: 900px">
    <header class="head">
      <h1>{{ t('stories.title') }}</h1>
      <p class="muted">{{ t('stories.sub') }}</p>
    </header>

    <LoadBlock v-if="!items && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <EmptyState v-else-if="!items.length" :title="t('stories.emptyTitle')" :desc="t('stories.emptyDesc')" />
    <div v-else class="stories">
      <article v-for="(s, i) in items" :key="s.id" class="card story" :class="{ open: open === i }">
        <div class="s-top row-between">
          <span class="badge badge-gray">{{ s.track }}</span>
          <span v-if="s.award" class="badge badge-red">{{ s.award }}</span>
        </div>
        <h2>{{ s.title }}</h2>
        <blockquote class="quote">
          <Quote :size="15" :stroke-width="1.7" aria-hidden="true" />
          {{ s.quote }}
        </blockquote>
        <div class="meta">
          <b>{{ s.student_name }}</b>
          <span class="muted">{{ s.school_name }} · {{ t('stories.cohort', { y: s.year }) }}</span>
          <span class="row outcome"><MapPin :size="13" :stroke-width="1.7" />{{ s.outcome }}</span>
        </div>
        <div class="path">
          <span v-for="(m, j) in s.milestone" :key="m" class="ms">
            {{ m }}<i v-if="j < s.milestone.length - 1" aria-hidden="true">→</i>
          </span>
        </div>
        <button class="read" :aria-expanded="open === i" @click="toggle(i)">
          {{ open === i ? t('stories.collapse') : t('stories.read') }}
        </button>
        <p v-if="open === i" class="full muted">{{ s.story }}</p>
      </article>
    </div>
  </div>
</template>

<style scoped>
.head { margin-bottom: 28px; }
.head p { margin-top: 8px; }
.stories { display: flex; flex-direction: column; gap: 18px; }
.story { padding: 26px 28px; display: flex; flex-direction: column; gap: 12px; }
.s-top { gap: 8px; }
h2 { font-size: var(--fs-h2); letter-spacing: -0.01em; }
.quote {
  display: flex; gap: 8px; align-items: baseline;
  font-size: var(--fs-body-l); line-height: 1.8; color: var(--fg-2);
  padding: 14px 18px; background: var(--surface-2); border-radius: var(--r-m);
}
.quote svg { color: var(--accent); flex: none; transform: translateY(2px); }
.meta { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; font-size: var(--fs-small); }
.outcome { gap: 4px; color: var(--fg-2); font-weight: 500; }
.path { display: flex; flex-wrap: wrap; gap: 6px 4px; align-items: center; }
.ms {
  font-size: var(--fs-caption); color: var(--fg-2); font-weight: 500;
  background: var(--surface-3); border-radius: var(--r-pill); padding: 3px 10px;
  display: inline-flex; align-items: center; gap: 6px;
}
.ms i { font-style: normal; color: var(--faint); }
.read {
  align-self: flex-start; color: var(--accent-ink); font-size: var(--fs-small); font-weight: 600;
  padding: 4px 0; border-bottom: 1px solid var(--accent-line);
}
.read:hover { border-color: var(--accent-ink); }
.full { line-height: 2; border-top: 1px dashed var(--border); padding-top: 14px; }
</style>
