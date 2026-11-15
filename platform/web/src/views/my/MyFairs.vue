<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Btn from '../../components/Btn.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import PageHead from '../../components/PageHead.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import StepsBar from '../../components/StepsBar.vue';
import { api, fmtDate } from '../../api';

const { t } = useI18n();
const items = ref(null);
const error = ref(false);

async function load() {
  error.value = false;
  try { items.value = (await api.get('/my/fairs')).items; }
  catch { error.value = true; }
}
onMounted(load);

const STAGE_IDX = { registered: 0, checked_in: 1, attended: 2 };
</script>

<template>
  <div>
    <PageHead :title="t('my.fairsTitle')" :sub="t('my.fairsSub')" :crumbs="[{ label: t('workbench.studentGroup') }, { label: t('workbench.myFairs') }]" />

    <LoadBlock v-if="!items && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <EmptyState
      v-else-if="!items.length"
      :title="t('fairs.emptyTitle')"
      :desc="t('fairs.emptyDesc')"
      :action-text="t('fairs.emptyAction')"
      action-to="/fairs"
    />
    <div v-else class="list">
      <article v-for="f in items" :key="f.id" class="card fair">
        <div class="row-between">
          <div>
            <b class="f-t">{{ f.name }}</b>
            <div class="caption" style="margin-top:4px">{{ fmtDate(f.fair_date) }} · {{ f.venue }}</div>
          </div>
          <StatusBadge :status="f.status" />
        </div>
        <StepsBar :steps="[t('fairs.stagesRegistered'), t('fairs.stagesCheckin'), t('fairs.stagesAttended')]" :current="STAGE_IDX[f.my_status]" compact />
        <div class="row-between foot">
          <span v-if="f.my_status === 'registered'" class="ticket">
            {{ t('fairs.ticket') }} <b class="num">{{ String(f.id).padStart(3, '0') }}-{{ f.session === '下午场' ? 'PM' : 'AM' }}</b>
            <span class="caption">{{ t('fairs.ticketNote', { s: f.session }) }}</span>
          </span>
          <span v-else class="caption">{{ f.my_status === 'checked_in' ? t('fairs.checkedInNote') : t('fairs.attendedNote') }}</span>
          <Btn variant="secondary" size="sm" :to="`/fairs/${f.id}`">{{ t('fairs.venueJobs') }}</Btn>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.list { display: flex; flex-direction: column; gap: 14px; }
.fair { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }
.f-t { font-size: var(--fs-body-l); }
.foot { flex-wrap: wrap; gap: 12px; }
.ticket b { font-size: 16px; color: var(--accent-ink); }
</style>
