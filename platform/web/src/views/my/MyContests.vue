<script setup>
// 我的大赛：晋级看板
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import StepsBar from '../../components/StepsBar.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import PageHead from '../../components/PageHead.vue';
import { api, fmtDate } from '../../api';

const { t } = useI18n();
const items = ref(null);
const error = ref(false);

async function load() {
  error.value = false;
  try { items.value = (await api.get('/my/contests')).items; }
  catch { error.value = true; }
}
onMounted(load);
</script>

<template>
  <div>
    <PageHead :title="t('my.contestsTitle')" :sub="t('my.contestsSub')" :crumbs="[{ label: t('workbench.studentGroup') }, { label: t('workbench.myContests') }]" />

    <LoadBlock v-if="!items && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <EmptyState
      v-else-if="!items.length"
      :title="t('my.contestsEmpty')"
      :desc="t('my.contestsEmptyDesc')"
      :action-text="t('my.contestsEmptyAction')"
      action-to="/contests"
    />
    <div v-else class="list">
      <article v-for="e in items" :key="e.id" class="card entry">
        <div class="e-head row-between">
          <div>
            <div class="row" style="gap:10px">
              <b class="e-t">{{ e.track_name }}</b>
              <span class="badge badge-gray">{{ e.entry_mode === '团队' ? t('contests.team', { n: e.team_size }) : t('contests.solo') }}</span>
              <span v-if="e.team_name" class="badge badge-blue">{{ e.team_name }}</span>
            </div>
            <div class="caption" style="margin-top:4px">{{ fmtDate(e.created_at) }}{{ t('contests.appliedAt') }} · {{ t('contests.currentStage', { s: e.stages[Math.min(e.stage_idx, e.stages.length - 1)] }) }}</div>
          </div>
        </div>
        <StepsBar :steps="e.stages.slice(0, 5)" :current="e.stage_idx" :failed="e.status === 'eliminated'" :failed-label="t('my.eliminated')" />
        <div class="caption next-tip">
          {{ e.status === 'eliminated' ? t('contests.stageOut') : e.stage_idx < e.stages.length - 1 ? t('contests.stageNext', { s: e.stages[Math.min(e.stage_idx + 1, e.stages.length - 1)] }) : t('contests.stageDone') }}
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.list { display: flex; flex-direction: column; gap: 14px; }
.entry { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }
.e-t { font-size: var(--fs-body-l); }
.next-tip { background: var(--surface-2); border-radius: var(--r-s); padding: 10px 14px; line-height: 1.6; }
</style>
