<script setup>
// 岗位列表：公开浏览，投递引导登录回跳
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Btn from '../components/Btn.vue';
import HueSquare from '../components/HueSquare.vue';
import FilterChips from '../components/FilterChips.vue';
import EmptyState from '../components/EmptyState.vue';
import LoadBlock from '../components/LoadBlock.vue';
import ErrorBlock from '../components/ErrorBlock.vue';
import { api } from '../api';

const { t } = useI18n();
const route = useRoute();
const items = ref(null);
const total = ref(0);
const cities = ref([]);
const page = ref(1);
const loading = ref(false);
const error = ref(false);
const filter = ref({ kind: String(route.query.kind || ''), city: '', q: '' });

async function load() {
  loading.value = true; error.value = false;
  try {
    const d = await api.get('/jobs', { ...filter.value, page: page.value });
    items.value = d.items; total.value = d.total; cities.value = d.cities;
  } catch { error.value = true; }
  loading.value = false;
}
onMounted(load);
watch(() => [filter.value.kind, filter.value.city], () => { page.value = 1; load(); });
watch(page, load);
watch(() => route.query.kind, (k) => { filter.value.kind = k || ''; });
</script>

<template>
  <div class="container page-enter" style="padding-top: 32px">
    <header class="head">
      <div>
        <h1>{{ t('jobs.title') }}</h1>
        <p class="muted">{{ t('jobs.sub') }}</p>
      </div>
      <div class="search-row" role="search">
        <input v-model="filter.q" class="input" type="search" :placeholder="t('jobs.searchPh')" aria-label="search" @keydown.enter="page = 1; load()" />
        <Btn variant="secondary" @click="page = 1; load()">{{ t('common.search') }}</Btn>
      </div>
    </header>

    <div class="filters">
      <div class="f-row">
        <span class="f-label">{{ t('jobs.kind') }}</span>
        <FilterChips v-model="filter.kind" :all-label="t('common.all')" :options="[{ label: t('jobs.campus'), value: '校招' }, { label: t('jobs.intern'), value: '实习' }]" />
      </div>
      <div class="f-row">
        <span class="f-label">{{ t('jobs.city') }}</span>
        <FilterChips v-model="filter.city" :all-label="t('common.all')" :options="cities.map(c => ({ label: c, value: c }))" />
      </div>
    </div>

    <p class="result-line caption">{{ t('jobs.resultCount', { n: total }) }}</p>

    <LoadBlock v-if="loading && !items" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <EmptyState
      v-else-if="items && !items.length"
      :title="t('jobs.emptyTitle')"
      :desc="t('jobs.emptyDesc')"
      :action-text="t('jobs.emptyAction')"
      action-to="/fairs"
    />
    <template v-else-if="items">
      <div class="jobs">
        <router-link v-for="j in items" :key="j.id" :to="`/jobs/${j.id}`" class="card card-hover job">
          <HueSquare :hue="j.company_hue" :name="j.company_name.slice(0, 1)" :size="46" />
          <div class="j-body">
            <div class="j-title">{{ j.title }}</div>
            <div class="caption">{{ j.company_name }}{{ j.company_verified ? ` · ${t('jobs.verified')}` : '' }} · {{ j.company_industry }}</div>
            <div class="j-tags">
              <span v-for="tag in j.tags?.slice(0, 3)" :key="tag" class="badge badge-gray">{{ tag }}</span>
            </div>
          </div>
          <div class="j-side">
            <div class="num salary">{{ j.salary }}</div>
            <div class="caption">{{ j.city }} · {{ j.kind }} · {{ t('jobs.openings', { n: j.openings }) }}</div>
          </div>
        </router-link>
      </div>
      <div v-if="Math.ceil(total / 10) > 1" class="pager">
        <Btn variant="secondary" size="sm" :disabled="page <= 1" @click="page--">{{ t('common.prev') }}</Btn>
        <span class="caption num">{{ page }} / {{ Math.ceil(total / 10) }}</span>
        <Btn variant="secondary" size="sm" :disabled="page >= Math.ceil(total / 10)" @click="page++">{{ t('common.next') }}</Btn>
      </div>
    </template>
  </div>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; }
.head p { margin-top: 8px; max-width: 60ch; }
.search-row { display: flex; gap: 8px; }
.search-row .input { width: 240px; }
.filters { display: flex; flex-direction: column; gap: 10px; margin: 22px 0; padding: 16px; background: var(--surface-2); border-radius: var(--r-m); border: 1px solid var(--border); }
.f-row { display: flex; gap: 12px; align-items: baseline; }
.f-label { font-size: var(--fs-caption); color: var(--faint); width: 34px; flex: none; font-weight: 600; }
.result-line { margin-bottom: 12px; }
.jobs { display: flex; flex-direction: column; gap: 12px; }
.job { display: flex; gap: 16px; padding: 18px 20px; align-items: center; }
.j-body { flex: 1; min-width: 0; }
.j-title { font-weight: 600; font-size: var(--fs-body-l); }
.j-title:hover { color: var(--accent-ink); }
.j-tags { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.j-side { text-align: right; flex: none; }
.salary { font-size: 17px; font-weight: 600; }
.pager { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 32px 0; }
@media (max-width: 640px) {
  .job { flex-direction: column; align-items: flex-start; }
  .j-side { text-align: left; }
  .search-row { width: 100%; }
  .search-row .input { width: 100%; }
}
</style>
