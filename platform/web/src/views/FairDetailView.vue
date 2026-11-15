<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { MapPin, CalendarDays, Building2, Ticket } from 'lucide-vue-next';
import Btn from '../components/Btn.vue';
import StatusBadge from '../components/StatusBadge.vue';
import LoadBlock from '../components/LoadBlock.vue';
import ErrorBlock from '../components/ErrorBlock.vue';
import { api, fmtDate } from '../api';
import { useAuth } from '../stores/auth';
import { useUi } from '../stores/ui';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuth();
const ui = useUi();
const fair = ref(null);
const error = ref(false);
const session = ref('上午场');
const registering = ref(false);

async function load() {
  error.value = false;
  try { fair.value = await api.get(`/fairs/${route.params.id}`); }
  catch { error.value = true; }
}
onMounted(load);

async function register() {
  if (!auth.isLogged) {
    ui.toast(t('courses.loginEnroll'), 'info');
    router.push({ path: '/login', query: { redirect: route.fullPath } });
    return;
  }
  registering.value = true;
  try {
    await api.post(`/my/fairs/${route.params.id}/register`, { session: session.value });
    ui.toast(t('fairs.registerOk'));
    await load();
  } catch (e) { ui.toast(e.message, 'error'); }
  registering.value = false;
}
</script>

<template>
  <div class="container page-enter" style="padding-top: 32px">
    <LoadBlock v-if="!fair && !error" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('notfound.title')" />
    <template v-if="fair">
      <nav class="crumbs caption">
        <router-link to="/">{{ t('nav.home') }}</router-link> / <router-link to="/fairs">{{ t('nav.fairs') }}</router-link> / <span class="cur">{{ fair.name }}</span>
      </nav>

      <div class="grid-2">
        <div>
          <div class="card hero" :style="{ borderTop: `3px solid hsl(${fair.cover_hue} 45% 50%)` }">
            <div class="row" style="gap:12px">
              <h1>{{ fair.name }}</h1>
              <StatusBadge :status="fair.status" />
            </div>
            <div class="meta muted">
              <span class="row"><CalendarDays :size="15" :stroke-width="1.7" />{{ fmtDate(fair.fair_date) }}{{ fair.end_date ? ` - ${fmtDate(fair.end_date)}` : '' }}</span>
              <span class="row"><MapPin :size="15" :stroke-width="1.7" />{{ fair.venue }}</span>
            </div>
            <p class="intro">{{ fair.intro }}</p>
            <ul class="hl">
              <li v-for="h in fair.highlights" :key="h">{{ h }}</li>
            </ul>
            <div class="nums">
              <div class="n"><b class="num">{{ fair.companies_count }}</b><span>{{ t('fairs.companies') }}</span></div>
              <div class="n"><b class="num">{{ fair.jobs_count }}</b><span>{{ t('fairs.jobsCount') }}</span></div>
              <div class="n"><b class="num">{{ fair.booths }}</b><span>{{ t('fairs.booths') }}</span></div>
            </div>
          </div>

          <section class="card sect">
            <h2>{{ t('fairs.cityJobs', { city: fair.city }) }}</h2>
            <ul class="jobs">
              <li v-for="j in fair.cityJobs" :key="j.id">
                <router-link :to="`/jobs/${j.id}`" class="row-between job">
                  <span class="row" style="gap:10px; min-width:0">
                    <Building2 :size="15" :stroke-width="1.7" class="muted" style="flex:none" />
                    <span class="j-t">{{ j.title }}</span>
                    <span class="caption">{{ j.company_name }}</span>
                  </span>
                  <span class="row" style="gap:10px; flex:none">
                    <span class="caption">{{ j.city }} · {{ j.kind }}</span>
                    <span class="num small salary">{{ j.salary }}</span>
                  </span>
                </router-link>
              </li>
            </ul>
            <router-link class="link small" to="/jobs" style="display:inline-block; margin-top:12px">{{ t('fairs.browseAll') }}</router-link>
          </section>
        </div>

        <aside class="side">
          <div class="card act">
            <template v-if="fair.registered">
              <div class="done row"><Ticket :size="16" :stroke-width="1.7" class="ok" />{{ t('fairs.registered') }}</div>
              <p class="caption">{{ t('fairs.registeredNote') }}</p>
              <Btn variant="secondary" block to="/my/fairs">{{ t('fairs.viewMine') }}</Btn>
            </template>
            <template v-else-if="fair.status === 'registering'">
              <div class="t">{{ t('fairs.chooseSession') }}</div>
              <div class="sessions" role="radiogroup" aria-label="session">
                <button v-for="s in ['上午场', '下午场']" :key="s" class="sess" :class="{ on: session === s }" role="radio" :aria-checked="session === s" @click="session = s">{{ s === '上午场' ? t('fairs.morning') : t('fairs.afternoon') }}</button>
              </div>
              <Btn variant="primary" size="lg" block :loading="registering" @click="register">{{ t('fairs.registerCta') }}</Btn>
              <p class="caption">{{ t('fairs.registerNote') }}</p>
            </template>
            <template v-else-if="fair.status === 'upcoming'">
              <div class="t">{{ t('fairs.upcomingTitle') }}</div>
              <p class="caption">{{ t('fairs.upcomingNote') }}</p>
              <Btn variant="secondary" block to="/jobs">{{ t('fairs.previewJobs') }}</Btn>
            </template>
            <template v-else>
              <div class="t">{{ t('fairs.finishedTitle') }}</div>
              <p class="caption">{{ t('fairs.finishedNote') }}</p>
              <Btn variant="secondary" block to="/jobs">{{ t('fairs.browseJobs') }}</Btn>
            </template>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.crumbs { margin-bottom: 16px; display: flex; gap: 6px; }
.crumbs a:hover { color: var(--fg); }
.grid-2 { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; align-items: start; }
.hero { padding: 26px 28px; }
h1 { font-size: 24px; }
.meta { display: flex; gap: 20px; margin-top: 12px; font-size: var(--fs-small); flex-wrap: wrap; }
.intro { margin-top: 16px; color: var(--fg-2); line-height: 1.8; }
.hl { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
.hl li { font-size: var(--fs-small); color: var(--muted); padding-left: 16px; position: relative; }
.hl li::before { content: ''; position: absolute; left: 0; top: 8px; width: 6px; height: 6px; background: var(--accent); }
.nums { display: flex; gap: 40px; margin-top: 22px; }
.n b { font-size: 26px; font-weight: 600; display: block; }
.n span { font-size: var(--fs-caption); color: var(--muted); }
.sect { margin-top: 18px; padding: 24px; }
.sect h2 { font-size: var(--fs-h3); margin-bottom: 12px; }
.jobs li + li { border-top: 1px solid var(--border); }
.job { padding: 12px 2px; }
.j-t { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.job:hover .j-t { color: var(--accent-ink); }
.salary { color: var(--fg-2); font-weight: 600; }
.side { position: sticky; top: 80px; }
.act { padding: 20px; }
.t { font-weight: 600; margin-bottom: 10px; }
.sessions { display: flex; gap: 8px; margin-bottom: 14px; }
.sess { flex: 1; padding: 9px; border: 1px solid var(--border-strong); border-radius: var(--r-s); font-size: var(--fs-small); font-weight: 500; }
.sess.on { border-color: var(--accent); color: var(--accent-ink); background: var(--accent-soft); font-weight: 600; }
.act .caption { margin: 10px 0 4px; line-height: 1.65; }
.done { font-weight: 600; margin-bottom: 8px; }
.ok { color: var(--success); }
@media (max-width: 1000px) { .grid-2 { grid-template-columns: 1fr; } .side { position: static; } }
</style>
