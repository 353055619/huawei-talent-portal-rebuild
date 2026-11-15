<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Btn from '../../components/Btn.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import PageHead from '../../components/PageHead.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import { api, fmtDate } from '../../api';

const { t } = useI18n();
const items = ref(null);
const error = ref(false);

async function load() {
  error.value = false;
  try { items.value = (await api.get('/my/vouchers')).items; }
  catch { error.value = true; }
}
onMounted(load);

const RULES = computed(() => [
  [t('my.r1t'), t('my.r1d')],
  [t('my.r2t'), t('my.r2d')],
  [t('my.r3t'), t('my.r3d')],
  [t('my.r4t'), t('my.r4d')],
]);
</script>

<template>
  <div>
    <PageHead :title="t('my.vouchersTitle')" :sub="t('my.vouchersSub')" :crumbs="[{ label: t('workbench.studentGroup') }, { label: t('workbench.vouchers') }]">
      <template #actions>
        <Btn variant="primary" to="/my/vouchers/apply">{{ t('my.applyVoucher') }}</Btn>
      </template>
    </PageHead>

    <LoadBlock v-if="!items && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="items">
      <EmptyState
        v-if="!items.length"
        :title="t('my.vouchersEmpty')"
        :desc="t('my.vouchersEmptyDesc')"
        :action-text="t('my.applyVoucher')"
        action-to="/my/vouchers/apply"
      />
      <div v-else class="v-list">
        <div v-for="v in items" :key="v.id" class="card voucher" :class="{ dead: v.status === 'used' || v.status === 'expired' }">
          <div class="v-head row-between">
            <span class="badge badge-blue">{{ v.kind }}</span>
            <StatusBadge :status="v.status" />
          </div>
          <div class="v-cert">
            <b>{{ v.cert_name }}</b>
            <span class="caption">{{ v.cert_level }}</span>
          </div>
          <div class="v-code num">{{ v.code }}</div>
          <div class="v-meta caption">
            <span>{{ t('my.sourceUnit') }}{{ v.source }}</span>
            <span>{{ t('my.validUntil') }} {{ fmtDate(v.expires_at) }}</span>
          </div>
          <p v-if="v.note" class="caption v-note">{{ v.note }}</p>
          <Btn v-if="v.status === 'claimed'" variant="primary" size="sm" to="/my/exams">{{ t('my.bookWithVoucher') }}</Btn>
        </div>
      </div>

      <section class="card rules">
        <h2>{{ t('my.rulesTitle') }}</h2>
        <dl>
          <template v-for="[rt, rd] in RULES" :key="rt">
            <dt>{{ rt }}</dt>
            <dd class="muted">{{ rd }}</dd>
          </template>
        </dl>
      </section>
    </template>
  </div>
</template>

<style scoped>
.v-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.voucher { padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; }
.voucher.dead { opacity: 0.62; }
.v-cert { display: flex; flex-direction: column; gap: 2px; }
.v-code {
  font-size: 18px; font-weight: 600; letter-spacing: 0.04em;
  background: var(--surface-3); border-radius: var(--r-s); padding: 8px 12px;
  border: 1px dashed var(--border-strong);
}
.voucher:not(.dead) .v-code { background: var(--accent-soft); border-color: var(--accent-line); color: var(--accent-deep); }
.v-meta { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.v-note { line-height: 1.6; }
.rules { margin-top: 20px; padding: 20px 22px; }
h2 { font-size: var(--fs-h3); margin-bottom: 14px; }
.rules dl { display: grid; grid-template-columns: 120px 1fr; row-gap: 10px; column-gap: 20px; }
.rules dt { font-weight: 600; font-size: var(--fs-small); }
.rules dd { font-size: var(--fs-small); line-height: 1.65; }
@media (max-width: 640px) { .rules dl { grid-template-columns: 1fr; } }
</style>
