<script setup>
// 企业工作台
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus } from 'lucide-vue-next';
import Btn from '../../components/Btn.vue';
import PageHead from '../../components/PageHead.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import { api, timeAgo } from '../../api';
import { useUi } from '../../stores/ui';

const { t } = useI18n();
const ui = useUi();
const data = ref(null);
const error = ref(false);
const showForm = ref(false);
const form = ref({ title: '', kind: '校招', city: '', salary: '', openings: 1, requirement: '', duty: '', tags: '' });
const creating = ref(false);
const formError = ref('');

async function load() {
  error.value = false;
  try { data.value = await api.get('/employer/overview'); }
  catch { error.value = true; }
}
onMounted(load);

async function create() {
  formError.value = '';
  const f = form.value;
  if (!f.title.trim() || !f.city.trim() || !f.salary.trim() || !f.requirement.trim() || !f.duty.trim()) {
    formError.value = t('employer.requiredHint'); return;
  }
  creating.value = true;
  try {
    await api.post('/employer/jobs', { ...f, openings: +f.openings || 1, tags: f.tags.split(/[，,;；\s]+/).filter(Boolean) });
    ui.toast(t('employer.publishedToast'));
    showForm.value = false;
    await load();
  } catch (e) { formError.value = e.message; }
  creating.value = false;
}

async function closeJob(id) {
  try { await api.post(`/employer/jobs/${id}/close`); ui.toast(t('employer.closedToast')); await load(); }
  catch (e) { ui.toast(e.message, 'error'); }
}
</script>

<template>
  <div>
    <PageHead :title="t('employer.title')" :sub="t('employer.sub')" :crumbs="[{ label: t('workbench.employerGroup') }, { label: t('workbench.jobMgmt') }]">
      <template #actions>
        <Btn variant="primary" @click="showForm = !showForm"><Plus :size="15" :stroke-width="2" />{{ t('employer.publish') }}</Btn>
      </template>
    </PageHead>

    <LoadBlock v-if="!data && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="data">
      <div v-if="showForm" class="card form">
        <h2>{{ t('employer.formTitle') }}</h2>
        <div v-if="formError" class="form-banner" role="alert">{{ formError }}</div>
        <div class="f-grid">
          <div class="field span-2"><label for="j-title">{{ t('employer.jobTitle') }}</label>
            <input id="j-title" v-model="form.title" class="input" :placeholder="t('employer.jobTitlePh')" />
          </div>
          <div class="field"><label for="j-kind">{{ t('employer.kind') }}</label>
            <select id="j-kind" v-model="form.kind" class="select"><option value="校招">{{ t('jobs.campus') }}</option><option value="实习">{{ t('jobs.intern') }}</option></select>
          </div>
          <div class="field"><label for="j-city">{{ t('employer.city') }}</label>
            <input id="j-city" v-model="form.city" class="input" :placeholder="t('employer.cityPh')" />
          </div>
          <div class="field"><label for="j-sal">{{ t('employer.salary') }}</label>
            <input id="j-sal" v-model="form.salary" class="input" :placeholder="t('employer.salaryPh')" />
          </div>
          <div class="field"><label for="j-open">{{ t('employer.openings') }}</label>
            <input id="j-open" v-model="form.openings" class="input num" type="number" min="1" />
          </div>
          <div class="field span-2"><label for="j-duty">{{ t('employer.dutyLabel') }}</label>
            <textarea id="j-duty" v-model="form.duty" class="textarea"></textarea>
          </div>
          <div class="field span-2"><label for="j-req">{{ t('employer.reqLabel') }}</label>
            <textarea id="j-req" v-model="form.requirement" class="textarea"></textarea>
          </div>
          <div class="field span-2"><label for="j-tags">{{ t('employer.tagsLabel') }}</label>
            <input id="j-tags" v-model="form.tags" class="input" :placeholder="t('employer.tagsPh')" />
          </div>
        </div>
        <div class="row" style="gap:12px; margin-top:18px">
          <Btn variant="primary" :loading="creating" @click="create">{{ t('employer.publishCta') }}</Btn>
          <Btn variant="ghost" @click="showForm = false">{{ t('common.cancel') }}</Btn>
        </div>
      </div>

      <div class="stat-row">
        <div class="card stat"><div class="v num">{{ data.jobs.length }}</div><div class="l">{{ t('employer.managed') }}</div></div>
        <div class="card stat"><div class="v num">{{ data.jobs.reduce((s, j) => s + j.applications, 0) }}</div><div class="l">{{ t('employer.totalApplies') }}</div></div>
        <div class="card stat"><div class="v num">{{ data.jobs.reduce((s, j) => s + j.pending, 0) }}</div><div class="l">{{ t('employer.pending') }}</div></div>
      </div>

      <EmptyState v-if="!data.jobs.length" :title="t('employer.jobsEmpty')" :desc="t('employer.jobsEmptyDesc')" />
      <div v-else class="list">
        <div v-for="j in data.jobs" :key="j.id" class="card job card-hover">
          <div class="row-between" style="flex-wrap:wrap; gap:10px">
            <div>
              <div class="row" style="gap:10px">
                <router-link :to="`/jobs/${j.id}`" class="j-t"><b>{{ j.title }}</b></router-link>
                <StatusBadge :status="j.status === 'open' ? 'open' : 'closed'" />
              </div>
              <div class="caption" style="margin-top:4px">{{ j.city }} · {{ j.kind }} · {{ j.salary }} · {{ t('jobs.postedAgo', { time: timeAgo(j.posted_at) }) }}</div>
            </div>
            <div class="row" style="gap:14px">
              <span class="caption">{{ t('employer.appliesUnit') }} <b class="num">{{ j.applications }}</b></span>
              <span v-if="j.pending" class="badge badge-red">{{ t('employer.pendingUnit', { n: j.pending }) }}</span>
              <Btn variant="secondary" size="sm" to="/employer/pipeline">{{ t('employer.pipelineLink') }}</Btn>
              <Btn v-if="j.status === 'open'" variant="ghost" size="sm" @click="closeJob(j.id)">{{ t('employer.closeJob') }}</Btn>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.form { padding: 22px 24px; margin-bottom: 18px; }
h2 { font-size: var(--fs-h3); margin-bottom: 14px; }
.f-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.span-2 { grid-column: span 2; }
.form-banner { padding: 10px 14px; background: var(--danger-soft); color: var(--danger); border-radius: var(--r-s); font-size: var(--fs-small); margin-bottom: 14px; }
.stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 18px; }
.stat { padding: 16px 20px; }
.stat .v { font-size: 26px; font-weight: 600; }
.stat .l { font-size: var(--fs-small); color: var(--muted); }
.list { display: flex; flex-direction: column; gap: 12px; }
.job { padding: 16px 20px; }
.j-t:hover b { color: var(--accent-ink); }
@media (max-width: 700px) { .f-grid { grid-template-columns: 1fr; } .span-2 { grid-column: span 1; } }
</style>
