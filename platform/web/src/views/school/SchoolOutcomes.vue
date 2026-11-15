<script setup>
// 就业去向报告（outcomes）
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import PageHead from '../../components/PageHead.vue';
import HueSquare from '../../components/HueSquare.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import { api, fmtDate } from '../../api';

const { t } = useI18n();
const data = ref(null);
const error = ref(false);

async function load() {
  error.value = false;
  try { data.value = await api.get('/school/outcomes'); }
  catch { error.value = true; }
}
onMounted(load);

const STATUS_LABEL = { offer: 'school.offerTalking', hired: 'school.hiredLabel' };
</script>

<template>
  <div>
    <PageHead :title="t('school.outcomesTitle')" :sub="t('school.outcomesSub')" :crumbs="[{ label: t('workbench.schoolGroup') }, { label: t('workbench.outcomes') }]">
      <template #actions>
        <span class="badge badge-gray">{{ t('school.outcomesScope') }}</span>
      </template>
    </PageHead>

    <LoadBlock v-if="!data && !error" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="data">
      <section class="card sect">
        <h2>{{ t('school.byCompany') }}</h2>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>{{ t('school.byCompany') }}</th><th>{{ t('school.industry') }}</th><th>{{ t('school.applies') }}</th><th>{{ t('school.offerHired') }}</th><th>{{ t('school.convert') }}</th></tr></thead>
            <tbody>
              <tr v-for="c in data.byCompany" :key="c.name">
                <td>
                  <span class="row" style="gap:10px">
                    <HueSquare :hue="c.logo_hue" :name="c.name.slice(0, 1)" :size="28" />
                    <b>{{ c.name }}</b>
                  </span>
                </td>
                <td class="small muted">{{ c.industry }}</td>
                <td class="num">{{ c.total }}</td>
                <td class="num"><b>{{ c.offers }}</b></td>
                <td>
                  <div class="conv"><span :style="{ width: (c.offers / Math.max(c.total, 1)) * 100 + '%' }"></span></div>
                  <span class="caption num">{{ Math.round((c.offers / Math.max(c.total, 1)) * 100) }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card sect">
        <h2>{{ t('school.recentOffers') }}</h2>
        <ul class="recent">
          <li v-for="r in data.recent" :key="r.name + r.job_title" class="row-between r-row">
            <span class="row" style="gap:10px">
              <b>{{ r.name }}</b>
              <span class="muted small">{{ r.job_title }} · {{ r.company_name }}</span>
            </span>
            <span class="row" style="gap:10px">
              <span class="badge" :class="r.status === 'hired' ? 'badge-green' : 'badge-blue'">{{ t(STATUS_LABEL[r.status]) }}</span>
              <span class="caption num">{{ fmtDate(r.updated_at) }}</span>
            </span>
          </li>
        </ul>
        <p v-if="!data.recent.length" class="muted small">{{ t('school.recentEmpty') }}</p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.sect { padding: 20px 22px; margin-bottom: 16px; }
h2 { font-size: var(--fs-h3); margin-bottom: 14px; }
.table-wrap { overflow-x: auto; }
.conv { display: flex; align-items: center; gap: 8px; min-width: 130px; }
.conv > div { width: 70px; height: 5px; background: var(--surface-3); border-radius: 3px; overflow: hidden; }
.conv span:last-child { font-size: var(--fs-caption); }
.conv > div > span { display: block; height: 100%; background: var(--success); border-radius: 3px; }
.recent .r-row { padding: 10px 0; border-bottom: 1px solid var(--border); font-size: var(--fs-body); }
.recent .r-row:last-child { border-bottom: none; }
</style>
