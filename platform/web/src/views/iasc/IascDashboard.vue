<script setup>
// IASC 运营看板
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowRight } from 'lucide-vue-next';
import Btn from '../../components/Btn.vue';
import PageHead from '../../components/PageHead.vue';
import StepsBar from '../../components/StepsBar.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import { api, fmtDate } from '../../api';
import { useUi } from '../../stores/ui';

const { t, tm } = useI18n();
const ui = useUi();
const data = ref(null);
const error = ref(false);
const busy = ref(null);

async function load() {
  error.value = false;
  try { data.value = await api.get('/iasc/dashboard'); }
  catch { error.value = true; }
}
onMounted(load);

const STAGE_IDX = { submitted: 0, material_review: 1, contract_signing: 2, tier_evaluation: 3, active: 4 };

async function advance(sa, reject = false) {
  busy.value = sa.id;
  try {
    await api.post(`/iasc/onboarding/${sa.id}/${reject ? 'reject' : 'advance'}`, {});
    ui.toast(reject ? t('iasc.rejectedToast') : t('iasc.advancedToast'));
    await load();
  } catch (e) { ui.toast(e.message, 'error'); }
  busy.value = null;
}
</script>

<template>
  <div>
    <PageHead :title="t('iasc.title')" :sub="t('iasc.sub')" :crumbs="[{ label: t('workbench.iascGroup') }, { label: t('workbench.opsDash') }]" />

    <LoadBlock v-if="!data && !error" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="data">
      <div class="stat-row">
        <div class="card stat"><div class="v num">{{ data.academies.total }}</div><div class="l">{{ t('iasc.academies') }}</div></div>
        <div class="card stat"><div class="v num">{{ data.academies.leading }}</div><div class="l">{{ t('iasc.leading') }}</div></div>
        <div class="card stat"><div class="v num">{{ data.vouchers.available || 0 }}</div><div class="l">{{ t('iasc.voucherPool') }}</div></div>
        <div class="card stat"><div class="v num">{{ data.fairs.length }}</div><div class="l">{{ t('iasc.fairsCount') }}</div></div>
      </div>

      <section class="card sect">
        <h2>{{ t('iasc.onboardingTitle') }} <span v-if="data.pendingOnboarding.length" class="badge badge-red num">{{ data.pendingOnboarding.length }}</span></h2>
        <EmptyState v-if="!data.pendingOnboarding.length" :title="t('iasc.onboardingEmpty')" :desc="t('iasc.onboardingEmptyDesc')" />
        <div v-else class="onboard-list">
          <article v-for="sa in data.pendingOnboarding" :key="sa.id" class="onboard">
            <div class="o-head row-between">
              <div>
                <div class="row" style="gap:10px">
                  <b>{{ sa.school_name }}</b>
                  <StatusBadge :status="sa.status" />
                </div>
                <div class="caption" style="margin-top:3px">{{ sa.province }} · {{ t('iasc.applicant') }} {{ sa.applicant }} · {{ fmtDate(sa.updated_at) }}{{ t('iasc.updatedAgo') }}</div>
              </div>
              <div class="row" style="gap:8px">
                <Btn variant="primary" size="sm" :loading="busy === sa.id" @click="advance(sa)">
                  {{ t('iasc.advance') }} <ArrowRight :size="13" :stroke-width="2" />
                </Btn>
                <Btn variant="ghost" size="sm" :loading="busy === sa.id" @click="advance(sa, true)">{{ t('iasc.reject') }}</Btn>
              </div>
            </div>
            <StepsBar :steps="tm('iasc.steps')" :current="Math.max(STAGE_IDX[sa.status], 0)" compact />
          </article>
        </div>
      </section>

      <section class="card sect">
        <h2>{{ t('iasc.fairsOps') }}</h2>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>{{ t('nav.fairs') }}</th><th>{{ t('iasc.cityCol') }}</th><th>{{ t('iasc.dateCol') }}</th><th>{{ t('common.status') }}</th><th>{{ t('iasc.regCount') }}</th><th>{{ t('iasc.companyJobsCol') }}</th></tr></thead>
            <tbody>
              <tr v-for="f in data.fairs" :key="f.id">
                <td><b>{{ f.name }}</b></td>
                <td>{{ f.city }}</td>
                <td class="num">{{ fmtDate(f.fair_date) }}</td>
                <td><StatusBadge :status="f.status" /></td>
                <td class="num"><b>{{ f.registered }}</b></td>
                <td class="num">{{ f.companies_count }} / {{ f.jobs_count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
.stat { padding: 16px 20px; }
.stat .v { font-size: 26px; font-weight: 600; }
.stat .l { font-size: var(--fs-small); color: var(--muted); }
.sect { padding: 20px 22px; margin-bottom: 16px; }
h2 { font-size: var(--fs-h3); margin-bottom: 14px; }
.onboard-list { display: flex; flex-direction: column; gap: 18px; }
.onboard { display: flex; flex-direction: column; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--border); }
.onboard:last-child { border-bottom: none; }
.table-wrap { overflow-x: auto; }
@media (max-width: 800px) { .stat-row { grid-template-columns: repeat(2, 1fr); } }
</style>
