<script setup>
// 考券配额：审核学生申请 → 一键发放
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Check, X } from 'lucide-vue-next';
import Btn from '../../components/Btn.vue';
import PageHead from '../../components/PageHead.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import { api, timeAgo } from '../../api';
import { useUi } from '../../stores/ui';

const { t } = useI18n();
const ui = useUi();
const data = ref(null);
const error = ref(false);
const busy = ref(null);

async function load() {
  error.value = false;
  try { data.value = await api.get('/school/quota'); }
  catch { error.value = true; }
}
onMounted(load);

async function review(req, approve) {
  busy.value = req.id;
  try {
    const r = await api.post(`/school/voucher-requests/${req.id}/review`, { approve });
    ui.toast(approve ? t('school.approvedIssue', { code: r.voucherCode }) : t('school.rejectedToast'));
    await load();
  } catch (e) { ui.toast(e.message, 'error'); }
  busy.value = null;
}
</script>

<template>
  <div>
    <PageHead :title="t('school.quotaTitle')" :sub="t('school.quotaSub')" :crumbs="[{ label: t('workbench.schoolGroup') }, { label: t('workbench.quota') }]" />

    <LoadBlock v-if="!data && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="data">
      <section class="card sect">
        <h2>{{ t('school.pendingReview') }} <span v-if="data.requests.length" class="badge badge-red num">{{ data.requests.length }}</span></h2>
        <EmptyState
          v-if="!data.requests.length"
          :title="t('school.reviewEmptyTitle')"
          :desc="t('school.reviewEmptyDesc')"
        />
        <ul v-else class="reqs">
          <li v-for="r in data.requests" :key="r.id" class="req">
            <div class="req-body">
              <div class="row" style="gap:10px">
                <b>{{ r.student_name }}</b>
                <span class="badge badge-blue">{{ r.cert_name }}</span>
              </div>
              <p class="muted small" style="margin-top:6px; line-height:1.7">{{ r.reason }}</p>
              <span class="caption">{{ timeAgo(r.created_at) }}{{ t('school.submittedAgo') }}</span>
            </div>
            <div class="row" style="gap:8px; flex:none">
              <Btn variant="primary" size="sm" :loading="busy === r.id" @click="review(r, true)">
                <Check :size="13" :stroke-width="2" />{{ t('school.approve') }}
              </Btn>
              <Btn variant="ghost" size="sm" :loading="busy === r.id" @click="review(r, false)">
                <X :size="13" :stroke-width="2" />{{ t('school.reject') }}
              </Btn>
            </div>
          </li>
        </ul>
      </section>

      <div class="two-col">
        <section class="card sect">
          <h2>{{ t('school.quotaLeft') }} <span class="badge badge-green num">{{ data.available.length }}</span></h2>
          <div class="v-pool">
            <span v-for="v in data.available" :key="v.id" class="v-chip num" :title="v.cert_name">
              {{ v.cert_name.replace('HCIA-', '').replace('HCIP-', '') }}
            </span>
          </div>
          <p class="caption" style="margin-top:10px">{{ t('school.quotaEmptyNote') }}</p>
        </section>

        <section class="card sect">
          <h2>{{ t('school.history') }}</h2>
          <ul v-if="data.history.length" class="hist">
            <li v-for="h in data.history" :key="h.id" class="row-between h-row">
              <span class="small">{{ h.student_name }} · {{ h.cert_name }}</span>
              <span class="badge" :class="h.status === 'issued' ? 'badge-green' : 'badge-amber'">
                {{ h.status === 'issued' ? t('school.issued') : t('school.rejected') }}
              </span>
            </li>
          </ul>
          <p v-else class="muted small">{{ t('school.noHistory') }}</p>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.sect { padding: 20px 22px; margin-bottom: 16px; }
h2 { font-size: var(--fs-h3); margin-bottom: 14px; }
.reqs { display: flex; flex-direction: column; }
.req { display: flex; justify-content: space-between; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
.req:last-child { border-bottom: none; }
.req-body { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.v-pool { display: flex; flex-wrap: wrap; gap: 8px; }
.v-chip {
  padding: 5px 12px; border-radius: var(--r-s);
  background: var(--accent-soft); color: var(--accent-deep);
  font-size: var(--fs-caption); font-weight: 600; border: 1px dashed var(--accent-line);
}
.hist .h-row { padding: 9px 0; border-bottom: 1px solid var(--border); font-size: var(--fs-small); }
.hist .h-row:last-child { border-bottom: none; }
@media (max-width: 800px) { .two-col { grid-template-columns: 1fr; } }
</style>
