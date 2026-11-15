<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ArrowLeft } from 'lucide-vue-next';
import Btn from '../components/Btn.vue';
import { api } from '../api';
import { useAuth } from '../stores/auth';
import { useUi } from '../stores/ui';

const { t } = useI18n();
const auth = useAuth();
const ui = useUi();
const route = useRoute();
const router = useRouter();

const form = ref({ name: '', email: '', password: '', confirm: '', school_id: '' });
const schools = ref([]);
const errors = ref({});
const formError = ref('');
const submitting = ref(false);

api.get('/academies').then((d) => { schools.value = d.items.filter((s) => s.tier).slice(0, 12); }).catch(() => {});

const RULES = {
  name: (v) => !v.trim() ? t('register.nameErr') : v.trim().length > 20 ? t('register.nameLong') : '',
  email: (v) => !v.trim() ? t('register.emailEmpty') : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? t('register.emailFmt') : '',
  password: (v) => !v ? t('register.pwErr') : v.length < 8 ? t('register.pwShort') : '',
  confirm: (v) => v !== form.value.password ? t('register.mismatch') : '',
};

function check(field) {
  if (field === 'confirm' && !form.value.confirm && !form.value.password) return;
  errors.value[field] = RULES[field] ? RULES[field](form.value[field]) : '';
}

async function submit() {
  formError.value = '';
  for (const f of Object.keys(RULES)) check(f);
  const bad = Object.entries(errors.value).filter(([, v]) => v);
  if (bad.length) { formError.value = t('register.fixed', { n: bad.length, msg: bad[0][1] }); return; }
  submitting.value = true;
  try {
    await auth.register({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      password: form.value.password,
      school_id: form.value.school_id ? +form.value.school_id : null,
    });
    ui.toast(t('register.title'));
    router.push(String(route.query.redirect || '/home'));
  } catch (e) {
    formError.value = e.message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="reg-page">
    <div class="wrap">
      <router-link to="/" class="row muted back"><ArrowLeft :size="15" :stroke-width="1.8" />{{ t('login.backHome') }}</router-link>
      <div class="reg card">
        <div class="brand-row"><span class="sq-mark"></span><span class="t">华为高校人才平台</span></div>
        <h1>{{ t('register.title') }}</h1>
        <p class="muted">{{ t('register.sub') }}</p>

        <div v-if="formError" class="form-banner" role="alert">{{ formError }}</div>

        <form novalidate @submit.prevent="submit">
          <div class="grid-2">
            <div class="field">
              <label for="name">{{ t('register.name') }}</label>
              <input id="name" v-model="form.name" class="input" required maxlength="20"
                :aria-invalid="!!errors.name" aria-describedby="err-name" @blur="check('name')" />
              <span v-if="errors.name" id="err-name" class="field-error" role="alert">{{ errors.name }}</span>
            </div>
            <div class="field">
              <label for="email">{{ t('register.email') }}</label>
              <input id="email" v-model="form.email" class="input" type="email" required autocomplete="username"
                :aria-invalid="!!errors.email" aria-describedby="err-email" @blur="check('email')" />
              <span v-if="errors.email" id="err-email" class="field-error" role="alert">{{ errors.email }}</span>
            </div>
            <div class="field">
              <label for="password">{{ t('register.pw') }}</label>
              <input id="password" v-model="form.password" class="input" type="password" required minlength="8"
                autocomplete="new-password" :aria-invalid="!!errors.password" aria-describedby="err-pw" @blur="check('password')" />
              <span v-if="errors.password" id="err-pw" class="field-error" role="alert">{{ errors.password }}</span>
              <span v-else class="hint">{{ t('register.pwHint') }}</span>
            </div>
            <div class="field">
              <label for="confirm">{{ t('register.pwConfirm') }}</label>
              <input id="confirm" v-model="form.confirm" class="input" type="password" required
                autocomplete="new-password" :aria-invalid="!!errors.confirm" aria-describedby="err-cf" @blur="check('confirm')" />
              <span v-if="errors.confirm" id="err-cf" class="field-error" role="alert">{{ errors.confirm }}</span>
            </div>
          </div>
          <div class="field" style="margin-top:16px">
            <label for="school">{{ t('register.school') }}</label>
            <select id="school" v-model="form.school_id" class="select">
              <option value="">{{ t('register.schoolEmpty') }}</option>
              <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}（{{ s.tier }}）</option>
            </select>
          </div>
          <Btn variant="primary" size="lg" block type="submit" :loading="submitting" style="margin-top: 24px">
            {{ t('register.create') }}
          </Btn>
        </form>
        <p class="caption" style="margin-top:16px">
          {{ t('register.have') }}<router-link class="link" :to="{ path: '/login', query: route.query }">{{ t('register.loginNow') }}</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reg-page { min-height: 100dvh; background: var(--bg); padding: var(--sp-5); }
.wrap { max-width: 720px; margin: 0 auto; }
.back { margin-bottom: var(--sp-4); }
.back:hover { color: var(--fg); }
.reg { padding: var(--sp-10); }
.brand-row { display: flex; align-items: center; gap: 9px; font-weight: 600; margin-bottom: var(--sp-6); }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: var(--sp-5); }
.form-banner {
  margin-top: var(--sp-5); padding: 10px 14px;
  background: var(--danger-soft); color: var(--danger);
  border-radius: var(--r-s); font-size: var(--fs-small);
}
@media (max-width: 640px) { .grid-2 { grid-template-columns: 1fr; } }
</style>
