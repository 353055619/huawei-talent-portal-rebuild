<script setup>
// 学习频道：公开可浏览的课程目录（未登录可看全量，报名时引导登录并回跳）
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Btn from '../components/Btn.vue';
import FilterChips from '../components/FilterChips.vue';
import EmptyState from '../components/EmptyState.vue';
import LoadBlock from '../components/LoadBlock.vue';
import ErrorBlock from '../components/ErrorBlock.vue';
import { api } from '../api';

const { t } = useI18n();
const route = useRoute();
const items = ref(null);
const total = ref(0);
const page = ref(1);
const loading = ref(false);
const error = ref(false);
const tracks = ref([]);

const filter = ref({ track: '', category: '', level: '', q: route.query.q || '', sort: 'learners' });

async function load() {
  loading.value = true; error.value = false;
  try {
    const data = await api.get('/courses', { ...filter.value, page: page.value });
    items.value = data.items;
    total.value = data.total;
    tracks.value = data.tracks;
  } catch { error.value = true; }
  loading.value = false;
}
onMounted(load);
watch([() => filter.value.track, () => filter.value.category, () => filter.value.level, () => filter.value.sort],
  () => { page.value = 1; load(); });
watch(page, load);
watch(() => route.query.q, (q) => { filter.value.q = q || ''; page.value = 1; load(); });

function computedPages() { return Math.ceil(total.value / 12); }
function clearFilters() {
  filter.value = { track: '', category: '', level: '', q: '', sort: 'learners' };
  page.value = 1; load();
}
</script>

<template>
  <div class="container page-enter" style="padding-top: 32px">
    <header class="head">
      <div>
        <h1>{{ t('courses.title') }}</h1>
        <p class="muted">{{ t('courses.sub') }}</p>
      </div>
      <div class="search-row" role="search">
        <input v-model="filter.q" class="input" type="search" :placeholder="t('courses.searchPh')" aria-label="search" @keydown.enter="page = 1; load()" />
        <Btn variant="secondary" @click="page = 1; load()">{{ t('common.search') }}</Btn>
      </div>
    </header>

    <div class="filters">
      <div class="f-row">
        <span class="f-label">{{ t('courses.track') }}</span>
        <FilterChips v-model="filter.track" :options="tracks.map(x => ({ label: x, value: x }))" />
      </div>
      <div class="f-row">
        <span class="f-label">{{ t('courses.category') }}</span>
        <FilterChips v-model="filter.category" :options="[{ label: t('courses.core'), value: '核心课' }, { label: t('courses.practice'), value: '实践课' }, { label: t('courses.general'), value: '通识课' }]" />
      </div>
      <div class="f-row">
        <span class="f-label">{{ t('courses.level') }}</span>
        <FilterChips v-model="filter.level" :options="[{ label: t('courses.beginner'), value: '入门' }, { label: t('courses.intermediate'), value: '进阶' }, { label: t('courses.advanced'), value: '高阶' }]" />
      </div>
      <div class="f-row">
        <span class="f-label">{{ t('courses.sort') }}</span>
        <FilterChips v-model="filter.sort" :all-label="t('courses.hot')" :options="[{ label: t('courses.newest'), value: 'new' }, { label: t('courses.shortHours'), value: 'hours' }]" />
      </div>
    </div>

    <p class="result-line caption">{{ t('courses.resultCount', { n: total }) }}<span v-if="filter.q">{{ t('courses.keywordOf', { q: filter.q }) }}</span></p>

    <LoadBlock v-if="loading && !items" :rows="4" :label="t('common.loading')" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <EmptyState
      v-else-if="items && !items.length"
      :title="t('courses.emptyTitle')"
      :desc="t('courses.emptyDesc')"
      :action-text="t('courses.emptyAction')"
      @action="clearFilters"
    />
    <template v-else-if="items">
      <div class="grid">
        <router-link v-for="c in items" :key="c.id" :to="`/courses/${c.id}`" class="card card-hover c-card">
          <div class="c-top" :style="{ background: `hsl(${c.cover_hue} 45% 95%)` }">
            <span class="badge" :class="c.category === '核心课' ? 'badge-blue' : c.category === '实践课' ? 'badge-amber' : 'badge-gray'">
              {{ c.category === '核心课' ? t('courses.core') : c.category === '实践课' ? t('courses.practice') : t('courses.general') }}
            </span>
            <span class="c-hue-num num">{{ c.code }}</span>
          </div>
          <div class="c-body">
            <div class="c-t">{{ c.title }}</div>
            <p class="c-s muted">{{ c.summary }}</p>
            <div class="c-meta caption">
              <span>{{ c.track }} · {{ c.level }} · {{ c.hours }} {{ t('common.hoursUnit') }}</span>
              <span class="num">{{ c.learners.toLocaleString() }} {{ t('courses.learned') }}</span>
            </div>
          </div>
        </router-link>
      </div>
      <div v-if="computedPages() > 1" class="pager">
        <Btn variant="secondary" size="sm" :disabled="page <= 1" @click="page--">{{ t('common.prev') }}</Btn>
        <span class="caption num">{{ page }} / {{ computedPages() }}</span>
        <Btn variant="secondary" size="sm" :disabled="page >= computedPages()" @click="page++">{{ t('common.next') }}</Btn>
      </div>
    </template>
  </div>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; }
.head p { margin-top: 8px; max-width: 60ch; }
.search-row { display: flex; gap: 8px; }
.search-row .input { width: 260px; }

.filters { display: flex; flex-direction: column; gap: 10px; margin: 24px 0; padding: 16px; background: var(--surface-2); border-radius: var(--r-m); border: 1px solid var(--border); }
.f-row { display: flex; gap: 12px; align-items: baseline; }
.f-label { font-size: var(--fs-caption); color: var(--faint); width: 34px; flex: none; font-weight: 600; }
.result-line { margin-bottom: 12px; }

.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.c-card { display: flex; flex-direction: column; overflow: hidden; }
.c-top { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; }
.c-hue-num { font-size: 12px; color: var(--muted); }
.c-body { padding: 4px 16px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.c-t { font-weight: 600; font-size: var(--fs-body-l); line-height: 1.4; margin-top: 8px; }
.c-s { font-size: var(--fs-small); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 42px; }
.c-meta { display: flex; justify-content: space-between; margin-top: auto; }
.pager { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 32px 0; }
@media (max-width: 1000px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .grid { grid-template-columns: 1fr; } .search-row .input { width: 100%; } }
</style>
