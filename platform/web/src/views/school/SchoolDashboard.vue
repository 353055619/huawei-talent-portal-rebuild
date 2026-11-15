<script setup>
// 学院数据看板
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import PageHead from '../../components/PageHead.vue';
import StatTile from '../../components/StatTile.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import { api } from '../../api';

const { t } = useI18n();
const data = ref(null);
const error = ref(false);

async function load() {
  error.value = false;
  try { data.value = await api.get('/school/dashboard'); }
  catch { error.value = true; }
}
onMounted(load);

const maxMonth = computed(() => Math.max(...(data.value?.monthly || []).map(m => m.c), 1));

const EMP_LABEL = {
  submitted: t('employer.submittedStage'), screening: t('employer.screeningStage'), written_test: t('employer.writtenStage'),
  interview: t('employer.interviewStage'), offer: t('employer.offerStage'), hired: t('employer.hiredStage'),
};
const empTotal = computed(() =>
  Object.values(data.value?.employment || {}).reduce((s, n) => s + n, 0) || 1
);
const FUNNEL_ORDER = ['submitted', 'screening', 'written_test', 'interview', 'offer', 'hired'];
const monthlyAria = computed(() =>
  (data.value?.monthly || []).map((m) => `${m.m} ${m.c}`).join('，')
);
</script>

<template>
  <div>
    <PageHead
      :title="t('school.dashboardTitle', { name: data?.school?.name || '' })"
      :sub="t('school.dashboardSub')"
      :crumbs="[{ label: t('workbench.schoolGroup') }, { label: t('workbench.dash') }]"
    >
      <template #actions>
        <span v-if="data" class="badge" :class="data.school.tier === '领先级' ? 'badge-red' : 'badge-blue'">
          {{ data.school.tier === '领先级' ? t('academies.lead') : data.school.tier === '优选级' ? t('academies.prefer') : t('academies.certify') }}
        </span>
      </template>
    </PageHead>

    <LoadBlock v-if="!data && !error" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="data">
      <div class="stat-grid">
        <div class="card"><StatTile :value="data.students" :label="t('school.mStudents')" :hint="t('school.mStudentsH')" /></div>
        <div class="card"><StatTile :value="data.learning.learners" :label="t('school.mLearners')" :hint="t('school.mLearnersH', { n: data.learning.total_progress + data.learning.completed })" /></div>
        <div class="card"><StatTile :value="data.learning.completed" :label="t('school.mCompleted')" trend="+12%" /></div>
        <div class="card"><StatTile :value="data.certs.this_year" :label="t('school.mCert')" :hint="t('school.mCertH')" /></div>
        <div class="card"><StatTile :value="data.contests.entries" :label="t('school.mContest')" :hint="t('school.mContestH', { n: data.contests.advanced })" /></div>
      </div>

      <div class="two-col">
        <section class="card sect">
          <h2>{{ t('school.monthly') }}</h2>
          <div class="bars" role="img" :aria-label="t('school.monthlyAria') + monthlyAria">
            <div v-for="m in data.monthly" :key="m.m" class="b-col">
              <span class="b-v num">{{ m.c }}</span>
              <div class="b-bar"><span :style="{ height: (m.c / maxMonth) * 100 + '%' }"></span></div>
              <span class="b-l">{{ m.m }}</span>
            </div>
          </div>
        </section>

        <section class="card sect">
          <h2>{{ t('school.funnel', { n: empTotal }) }}</h2>
          <ul class="funnel">
            <li v-for="k in FUNNEL_ORDER" :key="k" class="f-row">
              <span class="f-l">{{ EMP_LABEL[k] }}</span>
              <div class="f-bar"><span :class="k" :style="{ width: ((data.employment[k] || 0) / empTotal) * 100 + '%' }"></span></div>
              <span class="f-v num">{{ data.employment[k] || 0 }}</span>
            </li>
          </ul>
          <p class="caption" style="margin-top:12px">
            {{ t('school.funnelNote', { n: data.employment.rejected || 0 }) }}
          </p>
        </section>
      </div>

      <div class="two-col" style="margin-top:16px">
        <section class="card sect">
          <h2>{{ t('school.certDist') }}</h2>
          <ul class="dist">
            <li v-for="d in data.certDist" :key="d.direction" class="row-between d-row">
              <span>{{ d.direction }}</span>
              <span class="num"><b>{{ d.c }}</b>{{ t('school.certUnit') }}</span>
            </li>
            <li v-if="!data.certDist.length" class="muted small">{{ t('school.certDistEmpty') }}</li>
          </ul>
        </section>
        <section class="card sect">
          <h2>{{ t('school.jobsDist') }}</h2>
          <ul class="dist">
            <li v-for="j in data.jobsDist" :key="j.industry" class="row-between d-row">
              <span>{{ j.industry }}</span>
              <span class="num"><b>{{ j.offers }}</b>{{ t('school.offersUnit') }}</span>
            </li>
          </ul>
          <router-link class="link small" style="display:inline-block;margin-top:10px" to="/school/outcomes">{{ t('school.jobsDistAll') }}</router-link>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 16px; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.sect { padding: 20px 22px; }
h2 { font-size: var(--fs-h3); margin-bottom: 16px; }

.bars { display: flex; align-items: flex-end; gap: 18px; height: 160px; padding: 8px 4px 0; }
.b-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end; }
.b-v { font-size: var(--fs-caption); color: var(--muted); }
.b-bar { width: 100%; max-width: 42px; height: 100px; background: var(--surface-3); border-radius: 5px 5px 0 0; display: flex; align-items: flex-end; overflow: hidden; }
.b-bar span { width: 100%; background: var(--fg-2); border-radius: 5px 5px 0 0; transition: height var(--t-mid); }
.b-l { font-size: var(--fs-caption); color: var(--faint); }

.funnel { display: flex; flex-direction: column; gap: 9px; }
.f-row { display: grid; grid-template-columns: 90px 1fr 40px; align-items: center; gap: 12px; }
.f-l { font-size: var(--fs-small); color: var(--muted); }
.f-bar { height: 14px; background: var(--surface-3); border-radius: 4px; overflow: hidden; }
.f-bar span { display: block; height: 100%; background: var(--info); border-radius: 4px; }
.f-bar span.offer, .f-bar span.hired { background: var(--success); }
.f-v { font-size: var(--fs-small); text-align: right; }

.dist { display: flex; flex-direction: column; }
.d-row { padding: 9px 0; border-bottom: 1px solid var(--border); font-size: var(--fs-small); }
.d-row:last-child { border-bottom: none; }
@media (max-width: 1100px) { .stat-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 800px) { .two-col { grid-template-columns: 1fr; } .stat-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
