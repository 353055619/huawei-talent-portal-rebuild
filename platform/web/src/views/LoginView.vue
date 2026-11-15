<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ArrowLeft } from 'lucide-vue-next';
import Btn from '../components/Btn.vue';
import { useAuth } from '../stores/auth';
import { useUi } from '../stores/ui';

const { t } = useI18n();
const auth = useAuth();
const ui = useUi();
const route = useRoute();
const router = useRouter();

const email = ref('');
const password = ref('');
const submitting = ref(false);
const formError = ref('');
const emailError = ref('');
const pwError = ref('');

const DEMO = [
  ['student@hw.dev', '学生 · 林晓澜（全旅程演示）'],
  ['teacher@hw.dev', '教师 · 陈明远'],
  ['schooladmin@hw.dev', '学院管理 · 王建国'],
  ['employer@hw.dev', '企业 · 软通动力 苏婉晴'],
  ['iasc@hw.dev', 'IASC 运营 · 郑浩'],
];

const redirect = (user) => {
  if (route.query.redirect) return String(route.query.redirect);
  const r = user?.roles?.[0];
  if (r === 'teacher') return '/teach';
  if (r === 'school_admin') return '/school';
  if (r === 'iasc') return '/iasc';
  if (r === 'employer') return '/employer';
  return '/home';
};

function validateEmail() {
  emailError.value = email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())
    ? t('login.emailErr') : '';
  return !emailError.value;
}
function validatePw() {
  pwError.value = !password.value ? t('login.pwErr') : '';
  return !pwError.value;
}

async function submit() {
  formError.value = '';
  const okE = validateEmail(); validateEmail(); const okP = validatePw();
  if (!email.value.trim() || !okE || !okP) {
    formError.value = !email.value.trim() && !password.value
      ? t('login.bothErr')
      : (emailError.value || pwError.value);
    return;
  }
  submitting.value = true;
  try {
    const user = await auth.login(email.value.trim(), password.value);
    ui.toast(t('login.welcomeBack', { name: user.name }));
    router.push(String(redirect(user)));
  } catch (e) {
    formError.value = e.status === 401 ? t('login.loginFailed') : e.message;
  } finally {
    submitting.value = false;
  }
}

function fill(acct) {
  email.value = acct;
  password.value = 'demo1234';
  emailError.value = ''; pwError.value = ''; formError.value = '';
}

onMounted(() => {
  if (auth.isLogged) router.push(String(route.query.redirect || (auth.activeRole === 'teacher' ? '/teach' : auth.activeRole === 'school_admin' ? '/school' : auth.activeRole === 'iasc' ? '/iasc' : auth.activeRole === 'employer' ? '/employer' : '/home')));
});
</script>

<template>
  <div class="login-page">
    <div class="back-home">
      <router-link to="/" class="row muted"><ArrowLeft :size="15" :stroke-width="1.8" />{{ t('login.backHome') }}</router-link>
    </div>
    <div class="login-grid">
      <div class="login card">
        <div class="brand-row">
          <span class="sq-mark"></span>
          <span class="t">华为高校人才平台</span>
        </div>
        <h1>{{ t('login.title') }}</h1>
        <p class="muted">{{ t('login.sub') }}</p>

        <div v-if="formError" class="form-banner" role="alert">{{ formError }}</div>
        <div v-if="route.query.redirect" class="redirect-hint">
          {{ t('login.redirectHint') }}
        </div>

        <form novalidate @submit.prevent="submit">
          <div class="field">
            <label for="email">{{ t('login.account') }}</label>
            <input
              id="email" v-model="email" class="input" type="email" autocomplete="username"
              :placeholder="t('login.accountPh')" required
              :aria-invalid="!!emailError" aria-describedby="email-err"
              @blur="validateEmail"
            />
            <span v-if="emailError" id="email-err" class="field-error" role="alert">{{ emailError }}</span>
          </div>
          <div class="field" style="margin-top: 16px">
            <label for="password">{{ t('login.password') }}</label>
            <input
              id="password" v-model="password" class="input" type="password"
              autocomplete="current-password" :placeholder="t('login.passwordPh')" required
              :aria-invalid="!!pwError" aria-describedby="pw-err"
              @blur="validatePw"
            />
            <span v-if="pwError" id="pw-err" class="field-error" role="alert">{{ pwError }}</span>
          </div>
          <Btn variant="primary" size="lg" block :loading="submitting" style="margin-top: 18px" type="submit">
            {{ t('login.title') }}
          </Btn>
        </form>
        <div class="form-foot">
          <span class="caption">{{ t('login.demoPwHint') }}</span>
          <button class="caption forgot" type="button" @click="ui.toast(t('login.demoPwHint'), 'info')">{{ t('login.forgot') }}</button>
        </div>
        <p class="caption alt">
          {{ t('login.noAccount') }}<router-link class="link" :to="{ path: '/register', query: route.query }">{{ t('login.registerOne') }}</router-link>
        </p>
      </div>

      <aside class="demo card" aria-label="demo">
        <div class="d-head">{{ t('login.demoTitle') }}</div>
        <ul>
          <li v-for="[acct, label] in DEMO" :key="acct">
            <button class="d-btn" @click="fill(acct)">
              <span class="d-label">{{ label }}<i class="d-fill">↳</i></span>
              <span class="d-acct num">{{ acct }}</span>
            </button>
          </li>
        </ul>
        <p class="caption d-note">{{ t('login.demoNote') }}</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100dvh; display: flex; flex-direction: column;
  background:
    radial-gradient(1200px 500px at 85% -10%, var(--accent-soft), transparent 60%),
    var(--bg);
  padding: var(--sp-5);
}
.back-home { max-width: 980px; width: 100%; margin: 0 auto var(--sp-4); }
.back-home a:hover { color: var(--fg); }

.login-grid {
  max-width: 980px; width: 100%; margin: 4vh auto auto;
  display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 4fr); gap: var(--sp-6);
  align-items: start;
}
.login { padding: var(--sp-10); }
.brand-row { display: flex; align-items: center; gap: 9px; font-weight: 600; margin-bottom: var(--sp-6); }
h1 { font-size: var(--fs-h1); }

.form-banner {
  margin-top: var(--sp-5); padding: 10px 14px;
  background: var(--danger-soft); color: var(--danger);
  border-radius: var(--r-s); font-size: var(--fs-small);
}
.redirect-hint {
  margin-top: var(--sp-4); font-size: var(--fs-small); color: var(--info);
  background: var(--info-soft); padding: 8px 12px; border-radius: var(--r-s);
}
.alt { margin-top: var(--sp-5); }

.demo { padding: var(--sp-5); background: var(--surface-2); }
.d-head { font-weight: 600; margin-bottom: var(--sp-3); }
.demo ul { display: flex; flex-direction: column; gap: 6px; }
.d-btn {
  width: 100%; text-align: left; padding: 10px 12px;
  border: 1px solid var(--border); border-radius: var(--r-s); background: var(--surface);
  transition: border-color var(--t-fast), box-shadow var(--t-fast);
  display: flex; flex-direction: column; gap: 2px;
}
.d-btn:hover { border-color: var(--fg-2); box-shadow: var(--shadow-1); }
.d-label { font-size: var(--fs-body); font-weight: 500; display: flex; justify-content: space-between; align-items: center; }
.d-fill { font-style: normal; color: var(--faint); opacity: 0; transition: opacity var(--t-fast); font-weight: 400; }
.d-btn:hover .d-fill { opacity: 1; color: var(--accent-ink); }
.d-acct { font-size: var(--fs-caption); color: var(--muted); }
.d-note { margin-top: var(--sp-4); line-height: 1.6; }
.form-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
.forgot { color: var(--muted); }
.forgot:hover { color: var(--fg); text-decoration: underline; text-underline-offset: 3px; }

@media (max-width: 800px) {
  .login-grid { grid-template-columns: 1fr; margin-top: var(--sp-5); }
}
</style>
