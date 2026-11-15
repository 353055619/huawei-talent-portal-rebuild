<script setup>
// 认证全景：三级 × 方向矩阵
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import FilterChips from '../components/FilterChips.vue';
import LoadBlock from '../components/LoadBlock.vue';
import ErrorBlock from '../components/ErrorBlock.vue';
import { api } from '../api';

const { t } = useI18n();
const items = ref(null);
const error = ref(false);
const level = ref('');
const direction = ref('');

async function load() {
  error.value = false;
  try { items.value = (await api.get('/certifications')).items; }
  catch { error.value = true; }
}
onMounted(load);

const directions = computed(() => [...new Set((items.value || []).map((c) => c.direction))]);
const filtered = computed(() =>
  (items.value || []).filter((c) => (!level.value || c.level === level.value) && (!direction.value || c.direction === direction.value))
);
const LEVELS = ['HCIA', 'HCIP', 'HCIE'];
const LEVEL_NOTE = { HCIA: 'certs.hciaNote', HCIP: 'certs.hcipNote', HCIE: 'certs.hcieNote' };
</script>

<template>
  <div class="container page-enter" style="padding-top: 32px">
    <header class="head">
      <h1>{{ t('certs.title') }}</h1>
      <p class="muted">{{ t('certs.sub') }}</p>
    </header>

    <div class="filters">
      <div class="f-row">
        <span class="f-label">{{ t('certs.level') }}</span>
        <FilterChips v-model="level" :all-label="t('common.all')" :options="LEVELS.map(l => ({ label: l, value: l }))" />
      </div>
      <div class="f-row">
        <span class="f-label">{{ t('certs.direction') }}</span>
        <FilterChips v-model="direction" :all-label="t('common.all')" :options="directions.map(d => ({ label: d, value: d }))" />
      </div>
    </div>

    <LoadBlock v-if="!items && !error" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <div v-else class="matrix">
      <section v-for="lv in LEVELS.filter(l => !level || l === level)" :key="lv" class="lv-group">
        <div class="lv-head row">
          <span class="lv-badge num" :class="lv.toLowerCase()">{{ lv }}</span>
          <span class="muted small">{{ t(LEVEL_NOTE[lv]) }}</span>
        </div>
        <div class="cert-grid">
          <router-link v-for="c in filtered.filter(c => c.level === lv)" :key="c.id" :to="`/certifications/${c.id}`" class="card card-hover cert">
            <div class="c-name">{{ c.name }}</div>
            <div class="c-dir caption">{{ c.direction }} · {{ c.exam_form }}</div>
            <div class="c-foot row-between">
              <span class="num price">¥{{ c.price }}</span>
              <span class="caption">{{ t('certs.suggestHours', { n: c.learner_hours }) }}</span>
            </div>
          </router-link>
        </div>
      </section>
      <p v-if="!filtered.length" class="empty-line muted">{{ t('certs.emptyLine') }}</p>
    </div>
  </div>
</template>

<style scoped>
.head h1 { font-size: var(--fs-h1); }
.head p { margin-top: 10px; max-width: 72ch; }
.filters { display: flex; flex-direction: column; gap: 10px; margin: 24px 0; padding: 16px; background: var(--surface-2); border-radius: var(--r-m); border: 1px solid var(--border); }
.f-row { display: flex; gap: 12px; align-items: baseline; }
.f-label { font-size: var(--fs-caption); color: var(--faint); width: 34px; flex: none; font-weight: 600; }

.lv-group { margin-bottom: 32px; }
.lv-head { gap: 12px; margin-bottom: 12px; }
.lv-badge { font-weight: 600; font-size: 15px; padding: 3px 12px; border-radius: var(--r-s); }
.hcia { background: var(--info-soft); color: var(--info); }
.hcip { background: var(--success-soft); color: var(--success); }
.hcie { background: var(--inverse-bg); color: var(--inverse-fg); }
.cert-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.cert { padding: 16px; display: flex; flex-direction: column; gap: 6px; }
.c-name { font-weight: 600; }
.cert:hover .c-name { color: var(--accent-ink); }
.c-foot { margin-top: auto; padding-top: 10px; }
.price { font-weight: 600; }
.empty-line { padding: 32px 0; text-align: center; }
@media (max-width: 1000px) { .cert-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .cert-grid { grid-template-columns: 1fr; } }
</style>
