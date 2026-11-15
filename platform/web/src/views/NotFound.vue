<script setup>
import { useI18n } from 'vue-i18n';
import Btn from '../components/Btn.vue';
const { t } = useI18n();
</script>

<template>
  <div class="nf">
    <div class="code num">404</div>
    <h1>{{ t('notfound.title') }}</h1>
    <p class="muted">{{ t('notfound.desc') }}</p>
    <div class="row" style="justify-content:center">
      <Btn variant="primary" to="/">{{ t('notfound.home') }}</Btn>
      <Btn variant="secondary" to="/courses">{{ t('notfound.courses') }}</Btn>
      <Btn variant="secondary" to="/jobs">{{ t('notfound.jobs') }}</Btn>
    </div>
  </div>
</template>

<style scoped>
.nf { max-width: 520px; margin: 0 auto; padding: 96px 24px 64px; text-align: center; display: flex; flex-direction: column; gap: 14px; align-items: center; }
.code { font-size: 64px; font-weight: 600; color: var(--border-strong); }
h1 { font-size: var(--fs-h1); }
</style>
