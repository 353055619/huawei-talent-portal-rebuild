<script setup>
// 候选人管线：按阶段推进（双向透明）
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChevronRight } from 'lucide-vue-next';
import Btn from '../../components/Btn.vue';
import PageHead from '../../components/PageHead.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import { api, timeAgo } from '../../api';
import { useUi } from '../../stores/ui';

const { t } = useI18n();
const ui = useUi();
const items = ref(null);
const error = ref(false);
const busy = ref(null);
const stageFilter = ref('');

const STAGES = [
  ['submitted', 'employer.submittedStage'], ['screening', 'employer.screeningStage'], ['written_test', 'employer.writtenStage'],
  ['interview', 'employer.interviewStage'], ['offer', 'employer.offerStage'], ['hired', 'employer.hiredStage'], ['rejected', 'employer.poolStage'],
];
const STAGE_LABEL = computed(() => Object.fromEntries(STAGES.map(([k, key]) => [k, t(key)])));
const NEXT_ACTION = computed(() => ({
  submitted: t('employer.nextActionMap.submitted'),
  screening: t('employer.nextActionMap.screening'),
  written_test: t('employer.nextActionMap.written_test'),
  interview: t('employer.nextActionMap.interview'),
}));

async function load() {
  error.value = false;
  try { items.value = (await api.get('/employer/pipeline')).items; }
  catch { error.value = true; }
}
onMounted(load);

const filtered = computed(() =>
  (items.value || []).filter((i) => !stageFilter.value || i.status === stageFilter.value)
);

async function advance(app, action) {
  busy.value = app.id;
  try {
    await api.post(`/employer/applications/${app.id}/stage`, { action });
    ui.toast(t('employer.advancedToast'));
    await load();
  } catch (e) { ui.toast(e.message, 'error'); }
  busy.value = null;
}

function statusClass(s) {
  if (s === 'offer' || s === 'hired') return 'badge-green';
  if (s === 'rejected') return 'badge-gray';
  return 'badge-blue';
}
</script>

<template>
  <div>
    <PageHead :title="t('employer.pipelineTitle')" :sub="t('employer.pipelineSub')" :crumbs="[{ label: t('workbench.employerGroup') }, { label: t('workbench.pipeline') }]" />

    <LoadBlock v-if="!items && !error" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="items">
      <div class="stage-tabs">
        <button class="s-tab" :class="{ on: !stageFilter }" @click="stageFilter = ''">
          {{ t('common.all') }} <span class="num">{{ items.length }}</span>
        </button>
        <button v-for="[k, key] in STAGES" :key="k" class="s-tab" :class="{ on: stageFilter === k }" @click="stageFilter = k">
          {{ t(key) }} <span class="num">{{ items.filter(i => i.status === k).length }}</span>
        </button>
      </div>

      <EmptyState
        v-if="!filtered.length"
        :title="t('employer.pipelineEmpty')"
        :desc="t('employer.pipelineEmptyDesc')"
      />
      <div v-else class="list">
        <article v-for="a in filtered" :key="a.id" class="card cand">
          <div class="c-main">
            <div class="row" style="gap:12px; flex-wrap:wrap">
              <span class="avatar num">{{ a.student_name.slice(0, 1) }}</span>
              <div>
                <div class="row" style="gap:8px">
                  <b>{{ a.student_name }}</b>
                  <span class="badge" :class="a.realname_verified ? 'badge-green' : 'badge-gray'">{{ a.realname_verified ? t('employer.verifiedBadge') : t('employer.unverified') }}</span>
                  <span v-if="a.cert_count" class="badge badge-blue">{{ t('employer.certCount', { n: a.cert_count }) }}</span>
                  <span v-if="a.contest_adv" class="badge badge-amber">{{ t('employer.contestAdv') }}</span>
                </div>
                <div class="caption" style="margin-top:3px">
                  {{ a.school_name || '—' }} · {{ a.major }} · {{ a.grade }} · {{ timeAgo(a.created_at) }}{{ t('employer.appliedAgo') }}
                </div>
              </div>
            </div>
            <div class="row cand-meta" style="gap:8px; margin-top:10px; flex-wrap:wrap">
              <span class="badge badge-gray">{{ a.job_title }}</span>
              <span v-if="a.intention" class="caption">{{ t('employer.intentionOf', { v: a.intention }) }}</span>
            </div>
            <p v-if="a.skills?.length" class="caption skills">{{ a.skills.slice(0, 4).join('；') }}</p>
          </div>

          <div class="c-actions">
            <span class="badge" :class="statusClass(a.status)">
              {{ STAGE_LABEL[a.status] || a.status }}
            </span>
            <template v-if="NEXT_ACTION[a.status]">
              <Btn variant="primary" size="sm" :loading="busy === a.id" @click="advance(a, 'advance')">
                {{ NEXT_ACTION[a.status] }} <ChevronRight :size="13" :stroke-width="2" />
              </Btn>
            </template>
            <Btn v-if="a.status === 'offer'" variant="primary" size="sm" :loading="busy === a.id" @click="advance(a, 'hire')">{{ t('employer.confirmHire') }}</Btn>
            <Btn v-if="!['rejected', 'hired'].includes(a.status)" variant="ghost" size="sm" :loading="busy === a.id" @click="advance(a, 'reject')">{{ t('employer.toPool') }}</Btn>
            <p v-if="a.stage_note" class="caption note">{{ a.stage_note }}</p>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stage-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
.s-tab {
  padding: 7px 14px; border-radius: var(--r-pill); font-size: var(--fs-small);
  border: 1px solid var(--border-strong); background: var(--surface); color: var(--fg-2);
}
.s-tab .num { color: var(--faint); margin-left: 4px; }
.s-tab.on { background: var(--inverse-bg); border-color: var(--inverse-bg); color: var(--inverse-fg); }
.s-tab.on .num { color: rgba(255,255,255,0.6); }

.list { display: flex; flex-direction: column; gap: 12px; }
.cand { display: flex; gap: 20px; padding: 18px 20px; flex-wrap: wrap; }
.c-main { flex: 1; min-width: 240px; }
.c-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex: none; }
.avatar {
  width: 38px; height: 38px; border-radius: 50%; flex: none;
  background: var(--surface-3); color: var(--fg-2);
  display: inline-flex; align-items: center; justify-content: center; font-weight: 600;
}
.skills { margin-top: 8px; line-height: 1.6; }
.note { max-width: 220px; text-align: right; line-height: 1.5; }
@media (max-width: 700px) { .c-actions { align-items: flex-start; } .note { text-align: left; } }
</style>
