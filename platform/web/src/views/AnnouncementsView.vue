<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import LoadBlock from '../components/LoadBlock.vue';
import ErrorBlock from '../components/ErrorBlock.vue';
import { api, fmtDateTime } from '../api';

const { t } = useI18n();
const items = ref(null);
const error = ref(false);
async function load() {
  error.value = false;
  try { items.value = (await api.get('/announcements')).items; }
  catch { error.value = true; }
}
onMounted(load);
</script>

<template>
  <div class="container page-enter" style="padding-top: 32px; max-width: 820px">
    <header class="head">
      <h1>{{ t('announcements.title') }}</h1>
      <p class="muted">{{ t('announcements.sub') }}</p>
    </header>
    <LoadBlock v-if="!items && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <ul v-else class="anns">
      <li v-for="a in items" :key="a.id" class="card ann">
        <div class="row-between">
          <span class="badge badge-gray">{{ a.category }}</span>
          <span class="caption num">{{ fmtDateTime(a.published_at) }}</span>
        </div>
        <h2>{{ a.title }}</h2>
        <p class="muted">{{ a.body }}</p>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.head { margin-bottom: 24px; }
.head p { margin-top: 8px; }
.anns { display: flex; flex-direction: column; gap: 14px; }
.ann { padding: 22px 24px; display: flex; flex-direction: column; gap: 8px; }
h2 { font-size: var(--fs-h3); margin: 12px 0 8px; }
.ann p { line-height: 1.8; }
</style>
