<script setup>
// 双选会列表：现网完全没有的能力，重构的就业出口
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { MapPin, CalendarDays } from 'lucide-vue-next';
import StatusBadge from '../components/StatusBadge.vue';
import LoadBlock from '../components/LoadBlock.vue';
import ErrorBlock from '../components/ErrorBlock.vue';
import { api, fmtDate } from '../api';
import { useAuth } from '../stores/auth';

const { t } = useI18n();
const auth = useAuth();
const items = ref(null);
const error = ref(false);

async function load() {
  error.value = false;
  try { items.value = (await api.get('/fairs')).items; }
  catch { error.value = true; }
}
onMounted(load);
</script>

<template>
  <div class="container page-enter" style="padding-top: 32px">
    <header class="head">
      <div>
        <h1>{{ t('fairs.title') }}</h1>
        <p class="muted">{{ t('fairs.sub') }}</p>
      </div>
      <router-link v-if="auth.isLogged" class="mine-link" to="/my/fairs">{{ t('fairs.mine') }}</router-link>
    </header>

    <LoadBlock v-if="!items && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <div v-else class="fairs">
      <router-link v-for="f in items" :key="f.id" :to="`/fairs/${f.id}`" class="card card-hover fair">
        <div class="d num" :style="{ background: `hsl(${f.cover_hue} 45% 94%)`, color: `hsl(${f.cover_hue} 45% 30%)` }">
          <span class="m">{{ new Date(f.fair_date).getMonth() + 1 }}月</span>
          <b>{{ new Date(f.fair_date).getDate() }}</b>
        </div>
        <div class="body">
          <div class="row" style="gap:10px">
            <h2>{{ f.name }}</h2>
            <StatusBadge :status="f.status" />
          </div>
          <div class="meta muted">
            <span class="row"><MapPin :size="14" :stroke-width="1.7" />{{ f.venue }}</span>
            <span class="row"><CalendarDays :size="14" :stroke-width="1.7" />{{ fmtDate(f.fair_date) }}{{ f.end_date ? ` - ${fmtDate(f.end_date)}` : '' }}</span>
          </div>
          <p class="intro muted">{{ f.intro }}</p>
          <div class="nums">
            <span><b class="num">{{ f.companies_count }}</b>{{ t('fairs.companies') }}</span>
            <span><b class="num">{{ f.jobs_count }}</b>{{ t('fairs.jobsCount') }}</span>
            <span><b class="num">{{ f.booths }}</b>{{ t('fairs.booths') }}</span>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; margin-bottom: 24px; }
.head p { margin-top: 10px; max-width: 64ch; }
.mine-link { color: var(--accent-ink); font-size: var(--fs-small); font-weight: 500; }
.mine-link:hover { text-decoration: underline; }
.fairs { display: flex; flex-direction: column; gap: 16px; }
.fair { display: flex; gap: 22px; padding: 22px 26px; }
.d { width: 72px; height: 76px; border-radius: var(--r-m); flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
.d .m { font-size: 12px; font-weight: 600; }
.d b { font-size: 30px; line-height: 1; }
.body { min-width: 0; flex: 1; }
h2 { font-size: var(--fs-h3); }
.meta { display: flex; gap: 20px; margin-top: 8px; font-size: var(--fs-small); flex-wrap: wrap; }
.intro { margin-top: 10px; font-size: var(--fs-small); line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.nums { display: flex; gap: 20px; margin-top: 12px; font-size: var(--fs-small); color: var(--muted); }
.nums b { font-size: 16px; color: var(--fg); margin-right: 2px; }
@media (max-width: 640px) { .fair { flex-direction: column; } }
</style>
