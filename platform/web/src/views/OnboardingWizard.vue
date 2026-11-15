<script setup>
// 学院入驻向导（旅程A）：全线上
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { CheckCircle2, FileSignature } from 'lucide-vue-next';
import Btn from '../components/Btn.vue';
import StepsBar from '../components/StepsBar.vue';
import PageHead from '../components/PageHead.vue';
import { api } from '../api';
import { useAuth } from '../stores/auth';
import { useUi } from '../stores/ui';

const { t, tm } = useI18n();
const router = useRouter();
const auth = useAuth();
const ui = useUi();

const step = ref(1);
const form = ref({
  school_name: '', province: '', city: '', contact_name: '', contact_title: '',
  contact_email: '', intent_tier: '认证级',
});
const signed = ref(false);
const submitting = ref(false);
const formError = ref('');

const PROVINCES = ['四川省', '云南省', '贵州省', '重庆市', '陕西省', '甘肃省', '广西壮族自治区', '湖北省', '湖南省', '浙江省', '江苏省', '广东省', '北京市', '上海市'];

function next() {
  formError.value = '';
  if (step.value === 1) {
    const f = form.value;
    if (!f.school_name.trim() || !f.province || !f.contact_name.trim() || !f.contact_title.trim()) {
      formError.value = t('onboarding.step1Err');
      return;
    }
  }
  if (step.value === 2 && !signed.value) {
    formError.value = t('onboarding.signRequired');
    return;
  }
  step.value++;
}

async function submit() {
  submitting.value = true;
  try {
    await api.post('/onboarding/apply', form.value);
    ui.toast(t('onboarding.submittedToast'));
    router.push('/onboarding/mine');
  } catch (e) { formError.value = e.message; }
  submitting.value = false;
}

const TIERS = [
  ['认证级', 'onboarding.tierCertify'],
  ['优选级', 'onboarding.tierPrefer'],
  ['领先级', 'onboarding.tierLead'],
];
</script>

<template>
  <div class="container page-enter" style="padding-top: 32px; max-width: 860px">
    <PageHead
      :title="t('onboarding.title')"
      :sub="t('onboarding.sub')"
      :crumbs="[{ label: t('nav.home'), to: '/' }, { label: t('nav.academies'), to: '/academies' }, { label: t('onboarding.crumbsApply') }]"
    />

    <div class="card wizard">
      <StepsBar :steps="tm('onboarding.wizSteps')" :current="step - 1" style="margin-bottom: 30px" />

      <div v-if="formError" class="form-banner" role="alert">{{ formError }}</div>

      <!-- 第 1 步：学院信息 -->
      <section v-if="step === 1">
        <h2>{{ t('onboarding.step1Title') }}</h2>
        <div class="w-grid">
          <div class="field span-2">
            <label for="o-name">{{ t('onboarding.schoolName') }}</label>
            <input id="o-name" v-model="form.school_name" class="input" :placeholder="t('onboarding.schoolNamePh')" />
          </div>
          <div class="field">
            <label for="o-prov">{{ t('onboarding.province') }}</label>
            <select id="o-prov" v-model="form.province" class="select">
              <option value="">{{ t('onboarding.chooseProvince') }}</option>
              <option v-for="p in PROVINCES" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div class="field">
            <label for="o-city">{{ t('onboarding.city') }}</label>
            <input id="o-city" v-model="form.city" class="input" :placeholder="t('onboarding.cityPh')" />
          </div>
          <div class="field">
            <label for="o-cp">{{ t('onboarding.contact') }}</label>
            <input id="o-cp" v-model="form.contact_name" class="input" :placeholder="t('onboarding.contactPh')" />
          </div>
          <div class="field">
            <label for="o-title">{{ t('onboarding.duty') }}</label>
            <input id="o-title" v-model="form.contact_title" class="input" :placeholder="t('onboarding.contactPh')" />
          </div>
          <div class="field">
            <label for="o-mail">{{ t('onboarding.email') }}</label>
            <input id="o-mail" v-model="form.contact_email" class="input" type="email" :placeholder="t('onboarding.emailPh')" />
          </div>
          <div class="field">
            <label for="o-tier">{{ t('onboarding.tier') }}</label>
            <select id="o-tier" v-model="form.intent_tier" class="select">
              <option value="认证级">{{ t('academies.certify') }}</option>
              <option value="优选级">{{ t('academies.prefer') }}</option>
              <option value="领先级">{{ t('academies.lead') }}</option>
            </select>
          </div>
        </div>
        <dl class="tier-note">
          <template v-for="[tier, note] in TIERS" :key="tier">
            <dt :class="{ cur: form.intent_tier === tier }">{{ tier === '认证级' ? t('academies.certify') : tier === '优选级' ? t('academies.prefer') : t('academies.lead') }}</dt>
            <dd class="muted" :class="{ cur: form.intent_tier === tier }">{{ t(note) }}</dd>
          </template>
        </dl>
      </section>

      <!-- 第 2 步：电子授权函 -->
      <section v-if="step === 2">
        <h2>{{ t('onboarding.step2Title') }}</h2>
        <p class="muted small" style="margin-bottom:16px">{{ t('onboarding.step2Note') }}</p>
        <div class="doc card">
          <div class="doc-head row">
            <FileSignature :size="16" :stroke-width="1.7" class="muted" />
            <b>{{ t('onboarding.docTitle') }} · {{ form.school_name }}</b>
          </div>
          <p class="muted small doc-body">
            {{ t('onboarding.docBody', { contact: form.contact_name || '—', title: form.contact_title || '—', school: form.school_name || '—' }) }}
          </p>
          <label class="sign row" :class="{ signed }">
            <input v-model="signed" type="checkbox" />
            <span>{{ signed ? t('onboarding.signedText', { name: auth.user?.name }) : t('onboarding.signText', { name: auth.user?.name }) }}</span>
          </label>
          <span v-if="signed" class="row signed-ok caption"><CheckCircle2 :size="14" :stroke-width="1.8" class="ok" />{{ t('onboarding.signedOk') }}</span>
        </div>
      </section>

      <!-- 第 3 步：确认提交 -->
      <section v-if="step === 3">
        <h2>{{ t('onboarding.step3Title') }}</h2>
        <dl class="confirm">
          <div><dt>{{ t('onboarding.confirmSchool') }}</dt><dd>{{ form.school_name }}（{{ form.province }}{{ form.city ? ' · ' + form.city : '' }}）</dd></div>
          <div><dt>{{ t('onboarding.confirmContact') }}</dt><dd>{{ form.contact_name }} · {{ form.contact_title }}</dd></div>
          <div><dt>{{ t('onboarding.confirmTier') }}</dt><dd>{{ form.intent_tier === '认证级' ? t('academies.certify') : form.intent_tier === '优选级' ? t('academies.prefer') : t('academies.lead') }}</dd></div>
          <div><dt>{{ t('onboarding.confirmSigned') }}</dt><dd class="row" style="gap:6px"><CheckCircle2 :size="14" :stroke-width="1.8" class="ok" />{{ t('onboarding.confirmSigned') }}</dd></div>
        </dl>
        <p class="muted small">{{ t('onboarding.step3Note') }}</p>
      </section>

      <div class="nav row" style="gap:12px; margin-top:26px">
        <Btn v-if="step > 1" variant="ghost" @click="step--; formError = ''">{{ t('onboarding.prev') }}</Btn>
        <Btn v-if="step < 3" variant="primary" @click="next">{{ t('onboarding.next') }}</Btn>
        <Btn v-else variant="primary" size="lg" :loading="submitting" @click="submit">{{ t('onboarding.submitApply') }}</Btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wizard { padding: 28px 30px; }
h2 { font-size: var(--fs-h3); margin-bottom: 16px; }
.w-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.span-2 { grid-column: span 2; }
.form-banner { padding: 10px 14px; background: var(--danger-soft); color: var(--danger); border-radius: var(--r-s); font-size: var(--fs-small); margin-bottom: 18px; }

.tier-note { display: grid; grid-template-columns: 90px 1fr; gap: 6px 16px; margin-top: 20px; padding: 14px 16px; background: var(--surface-2); border-radius: var(--r-s); font-size: var(--fs-small); }
.tier-note dt { font-weight: 600; color: var(--muted); }
.tier-note dt.cur { color: var(--accent-ink); }
.tier-note dd { color: var(--faint); }
.tier-note dd.cur { color: var(--fg-2); }

.doc { padding: 18px 20px; background: var(--surface-2); }
.doc-head { gap: 8px; margin-bottom: 10px; }
.doc-body { line-height: 1.8; border-bottom: 1px dashed var(--border-strong); padding-bottom: 14px; }
.sign { gap: 10px; padding: 14px 4px 4px; font-size: var(--fs-body); cursor: pointer; }
.sign input { width: 16px; height: 16px; accent-color: var(--accent); }
.signed-ok { margin-top: 8px; padding-left: 26px; }
.ok { color: var(--success); }

.confirm { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.confirm > div { display: flex; gap: 16px; font-size: var(--fs-body); }
.confirm dt { width: 70px; color: var(--muted); flex: none; }
@media (max-width: 640px) { .w-grid { grid-template-columns: 1fr; } .span-2 { grid-column: span 1; } }
</style>
