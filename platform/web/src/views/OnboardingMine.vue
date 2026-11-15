<script setup>
// 我的入驻进度：站内实时追踪
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Btn from '../components/Btn.vue';
import StepsBar from '../components/StepsBar.vue';
import StatusBadge from '../components/StatusBadge.vue';
import PageHead from '../components/PageHead.vue';
import EmptyState from '../components/EmptyState.vue';
import LoadBlock from '../components/LoadBlock.vue';
import ErrorBlock from '../components/ErrorBlock.vue';
import { api, fmtDateTime } from '../api';

const { t, tm } = useI18n();
const data = ref(null);
const error = ref(false);

async function load() {
  error.value = false;
  try { data.value = await api.get('/onboarding/mine'); }
  catch { error.value = true; }
}
onMounted(load);

const IDX = { submitted: 0, material_review: 1, contract_signing: 2, tier_evaluation: 3, active: 4, rejected: -1 };
</script>

<template>
  <div class="container page-enter" style="padding-top: 32px; max-width: 860px">
    <PageHead
      :title="t('onboarding.mineTitle')"
      :sub="t('onboarding.mineSub')"
      :crumbs="[{ label: t('nav.home'), to: '/' }, { label: t('onboarding.crumbsApply'), to: '/apply/school' }, { label: t('onboarding.crumbsMine') }]"
    />

    <LoadBlock v-if="!data && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="data">
      <EmptyState
        v-if="!data.items.length"
        :title="t('onboarding.mineEmpty')"
        :desc="t('onboarding.mineEmptyDesc')"
        :action-text="t('onboarding.mineEmptyAction')"
        action-to="/apply/school"
      />
      <article v-for="sa in data.items" :key="sa.id" class="card app">
        <div class="row-between a-head">
          <div class="row" style="gap:12px">
            <b class="a-t">{{ sa.school_name }}</b>
            <StatusBadge :status="sa.status" />
            <span class="badge badge-gray">{{ t('onboarding.confirmTier') }}{{ sa.intent_tier === '认证级' ? t('academies.certify') : sa.intent_tier === '优选级' ? t('academies.prefer') : t('academies.lead') }}</span>
          </div>
          <Btn v-if="sa.status === 'active'" variant="secondary" size="sm" to="/school">{{ t('onboarding.goAdmin') }}</Btn>
        </div>
        <StepsBar :steps="tm('iasc.steps')" :current="Math.max(IDX[sa.status], 0)" :failed="sa.status === 'rejected'" :failed-label="t('tracker.failedLabel')" />
        <p class="hint-line">{{ sa.status === 'rejected' ? t('onboarding.rejectedHint') : t(`onboarding.hintText.${sa.status}`) }}</p>

        <div class="tl card">
          <div class="tl-t">{{ t('onboarding.timeline') }}</div>
          <ol>
            <li v-for="(e, i) in data.events.filter(e => e.status).slice().reverse()" :key="i" class="row">
              <span class="tl-dot" :class="{ fail: e.status === 'rejected' }"></span>
              <div>
                <div class="small">{{ e.note }}</div>
                <span class="caption num">{{ fmtDateTime(e.created_at) }}</span>
              </div>
            </li>
          </ol>
        </div>
      </article>
    </template>
  </div>
</template>

<style scoped>
.app { padding: 24px 26px; display: flex; flex-direction: column; gap: 18px; margin-bottom: 16px; }
.a-t { font-size: var(--fs-h3); }
.hint-line { font-size: var(--fs-body); color: var(--fg-2); background: var(--surface-2); padding: 12px 16px; border-radius: var(--r-s); line-height: 1.7; }
.tl { padding: 16px 18px; background: var(--surface); }
.tl-t { font-weight: 600; font-size: var(--fs-small); margin-bottom: 12px; }
.tl ol { display: flex; flex-direction: column; gap: 12px; }
.tl li { gap: 12px; align-items: flex-start; }
.tl-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--fg-2); margin-top: 6px; flex: none; }
.tl-dot.fail { background: var(--danger); }
</style>
