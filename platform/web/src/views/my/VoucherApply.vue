<script setup>
// 考券申请向导（现网此路由是空白页）
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Btn from '../../components/Btn.vue';
import PageHead from '../../components/PageHead.vue';
import StepsBar from '../../components/StepsBar.vue';
import { api } from '../../api';
import { useUi } from '../../stores/ui';

const { t, tm } = useI18n();
const router = useRouter();
const ui = useUi();
const certs = ref([]);
const certId = ref('');
const reason = ref('');
const error = ref('');
const submitting = ref(false);

onMounted(async () => {
  try { certs.value = (await api.get('/certifications')).items; } catch { /* 保持空 */ }
});

async function submit() {
  error.value = '';
  if (!certId.value) { error.value = t('certs.chooseCertPh'); return; }
  if (!reason.value.trim()) { error.value = t('my.reason'); return; }
  submitting.value = true;
  try {
    await api.post('/my/voucher-requests', { certId: +certId.value, reason: reason.value.trim() });
    ui.toast(t('my.vaOk'));
    router.push('/my/applications');
  } catch (e) { error.value = e.message; }
  submitting.value = false;
}
</script>

<template>
  <div>
    <PageHead
      :title="t('my.voucherApplyTitle')"
      :sub="t('my.voucherApplySub')"
      :crumbs="[{ label: t('workbench.studentGroup') }, { label: t('workbench.vouchers'), to: '/my/vouchers' }, { label: t('my.applyVoucher') }]"
    />

    <div class="card form-card">
      <StepsBar :steps="tm('my.vaSteps')" :current="0" style="margin-bottom: 28px" />

      <div v-if="error" class="form-banner" role="alert">{{ error }}</div>

      <div class="field">
        <label for="cert">{{ t('certs.chooseCert') }}</label>
        <select id="cert" v-model="certId" class="select">
          <option value="">{{ t('certs.chooseCertPh') }}</option>
          <optgroup v-for="g in [['HCIA', 'HCIA'], ['HCIP', 'HCIP'], ['HCIE', 'HCIE']]" :key="g[0]" :label="g[1]">
            <option v-for="c in certs.filter(c => c.level === g[0])" :key="c.id" :value="c.id">{{ c.name }}（¥{{ c.price }}）</option>
          </optgroup>
        </select>
        <span class="hint">{{ t('my.vaHint') }}</span>
      </div>

      <div class="field" style="margin-top: 20px">
        <label for="reason">{{ t('my.reason') }}</label>
        <textarea
          id="reason" v-model="reason" class="textarea" maxlength="200"
          :placeholder="t('my.reasonPh')"
          aria-describedby="reason-hint"
        ></textarea>
        <span id="reason-hint" class="hint">{{ t('my.reasonHint', { n: 200 - reason.length }) }}</span>
      </div>

      <div class="submit-row">
        <Btn variant="primary" size="lg" :loading="submitting" @click="submit">{{ t('my.submitApply') }}</Btn>
        <Btn variant="ghost" to="/my/vouchers">{{ t('my.backVouchers') }}</Btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-card { padding: 26px 28px; max-width: 640px; }
.form-banner { padding: 10px 14px; background: var(--danger-soft); color: var(--danger); border-radius: var(--r-s); font-size: var(--fs-small); margin-bottom: 18px; }
.submit-row { display: flex; gap: 12px; margin-top: 26px; }
</style>
