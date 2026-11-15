<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ShieldCheck, MapPin, Banknote } from 'lucide-vue-next';
import Btn from '../components/Btn.vue';
import HueSquare from '../components/HueSquare.vue';
import LoadBlock from '../components/LoadBlock.vue';
import ErrorBlock from '../components/ErrorBlock.vue';
import { api, timeAgo, fmtDate } from '../api';
import { useAuth } from '../stores/auth';
import { useUi } from '../stores/ui';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuth();
const ui = useUi();
const job = ref(null);
const error = ref(false);
const applying = ref(false);

async function load() {
  error.value = false;
  try { job.value = await api.get(`/jobs/${route.params.id}`); }
  catch { error.value = true; }
}
onMounted(load);

async function apply() {
  if (!auth.isLogged) {
    ui.toast(t('jobs.loginApply'), 'info');
    router.push({ path: '/login', query: { redirect: route.fullPath } });
    return;
  }
  applying.value = true;
  try {
    await api.post(`/my/jobs/${route.params.id}/apply`);
    ui.toast(t('jobs.applyOk'));
    await load();
  } catch (e) { ui.toast(e.message, 'error'); }
  applying.value = false;
}
</script>

<template>
  <div class="container page-enter" style="padding-top: 32px">
    <LoadBlock v-if="!job && !error" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('notfound.title')" />
    <template v-if="job">
      <nav class="crumbs caption">
        <router-link to="/">{{ t('nav.home') }}</router-link> / <router-link to="/jobs">{{ t('nav.jobs') }}</router-link> / <span class="cur">{{ job.title }}</span>
      </nav>

      <div class="grid-2">
        <div>
          <div class="card head-card">
            <div class="row" style="gap:14px">
              <HueSquare :hue="job.company_hue" :name="job.company_name.slice(0, 1)" :size="54" />
              <div>
                <h1>{{ job.title }}</h1>
                <div class="caption row" style="gap:14px; margin-top:6px; flex-wrap:wrap">
                  <span class="row"><MapPin :size="13" :stroke-width="1.7" />{{ job.city }}</span>
                  <span class="row"><Banknote :size="13" :stroke-width="1.7" />{{ job.salary }}</span>
                  <span>{{ job.kind }} · {{ t('jobs.openings', { n: job.openings }) }}</span>
                  <span>{{ t('jobs.postedAgo', { time: timeAgo(job.posted_at) }) }}</span>
                </div>
              </div>
            </div>
          </div>

          <section class="card sect">
            <h2>{{ t('jobs.duty') }}</h2>
            <p class="body">{{ job.duty }}</p>
            <h2 style="margin-top:24px">{{ t('jobs.requirement') }}</h2>
            <p class="body">{{ job.requirement }}</p>
            <div v-if="job.tags?.length" class="tags">
              <span v-for="tag in job.tags" :key="tag" class="badge badge-gray">{{ tag }}</span>
            </div>
          </section>

          <section class="card sect">
            <h2>{{ t('jobs.similar') }}</h2>
            <ul class="sim">
              <li v-for="s in job.similar" :key="s.id">
                <router-link :to="`/jobs/${s.id}`" class="row-between">
                  <span>{{ s.title }} <span class="caption">· {{ s.company_name }}</span></span>
                  <span class="caption">{{ s.city }}</span>
                </router-link>
              </li>
            </ul>
          </section>
        </div>

        <aside class="side">
          <div class="card act">
            <template v-if="job.applied">
              <div class="applied">{{ t('jobs.applied') }}</div>
              <p class="caption">{{ t('jobs.appliedNote') }}</p>
              <Btn variant="secondary" block to="/my/applications">{{ t('jobs.viewProgress') }}</Btn>
            </template>
            <template v-else-if="job.status === 'open'">
              <Btn variant="primary" size="lg" block :loading="applying" @click="apply">{{ t('jobs.applyCta') }}</Btn>
              <p class="caption">{{ t('jobs.applyNote') }}</p>
            </template>
            <template v-else>
              <div class="applied">{{ t('jobs.closed') }}</div>
              <Btn variant="secondary" block to="/jobs">{{ t('jobs.browseMore') }}</Btn>
            </template>
          </div>

          <div class="card company">
            <div class="c-name row" style="gap:8px">
              {{ job.company_name }}
              <ShieldCheck v-if="job.company_verified" :size="15" :stroke-width="1.7" class="ok" aria-label="verified" />
            </div>
            <p class="caption" style="margin:8px 0">{{ job.company_industry }} · {{ job.company_scale }}</p>
            <p class="small muted" style="line-height:1.7">{{ job.company_intro }}</p>
            <p class="caption" style="margin-top:10px">{{ t('jobs.verifyNote', { d: fmtDate(job.verified_at) }) }}</p>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.crumbs { margin-bottom: 16px; display: flex; gap: 6px; }
.crumbs a:hover { color: var(--fg); }
.cur { color: var(--fg-2); }
.grid-2 { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; align-items: start; }
h1 { font-size: 24px; }
.head-card { padding: 22px 24px; }
.sect { margin-top: 16px; padding: 24px; }
.sect h2 { font-size: var(--fs-h3); margin-bottom: 12px; }
.body { color: var(--fg-2); line-height: 1.9; white-space: pre-line; }
.tags { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
.sim li + li { border-top: 1px solid var(--border); }
.sim a { padding: 12px 2px; font-size: var(--fs-body); }
.sim a:hover { color: var(--accent-ink); }
.side { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 16px; }
.act { padding: 20px; }
.applied { font-size: var(--fs-h3); font-weight: 600; color: var(--success); margin-bottom: 8px; }
.act .caption { margin: 10px 0; line-height: 1.65; }
.company { padding: 20px; }
.c-name { font-weight: 600; }
.ok { color: var(--success); }
@media (max-width: 1000px) { .grid-2 { grid-template-columns: 1fr; } .side { position: static; } }
</style>
