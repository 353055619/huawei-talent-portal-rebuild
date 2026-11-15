<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Clock3, BookOpen } from 'lucide-vue-next';
import Btn from '../components/Btn.vue';
import LoadBlock from '../components/LoadBlock.vue';
import ErrorBlock from '../components/ErrorBlock.vue';
import { api } from '../api';
import { useAuth } from '../stores/auth';
import { useUi } from '../stores/ui';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuth();
const ui = useUi();
const cert = ref(null);
const error = ref(false);

async function load() {
  error.value = false;
  try { cert.value = await api.get(`/certifications/${route.params.id}`); }
  catch { error.value = true; }
}
onMounted(load);

function startPath() {
  if (!auth.isLogged) {
    ui.toast(t('courses.loginEnroll'), 'info');
    router.push({ path: '/login', query: { redirect: route.fullPath } });
    return;
  }
  router.push('/my/vouchers/apply');
}
</script>

<template>
  <div class="container page-enter" style="padding-top: 32px">
    <LoadBlock v-if="!cert && !error" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('notfound.title')" />
    <template v-if="cert">
      <nav class="crumbs caption">
        <router-link to="/">{{ t('nav.home') }}</router-link> /
        <router-link to="/certifications">{{ t('nav.certs') }}</router-link> /
        <span class="cur">{{ cert.name }}</span>
      </nav>

      <div class="grid-2">
        <div class="main card">
          <div class="row" style="gap:12px">
            <span class="badge badge-blue num">{{ cert.level }}</span>
            <span class="badge badge-gray">{{ cert.direction }}</span>
          </div>
          <h1 style="margin-top:14px">{{ cert.name }}</h1>
          <p class="muted" style="margin-top:12px; line-height:1.8">{{ cert.summary }}</p>

          <div class="facts">
            <div class="fact"><Clock3 :size="16" :stroke-width="1.7" /><div><b>{{ t('certs.suggestLearn') }}</b><span>{{ cert.learner_hours }} h</span></div></div>
            <div class="fact"><span class="num">{{ cert.exam_form }}</span><div><b>{{ t('certs.examForm') }}</b><span>{{ cert.exam_form === '笔试+实验' ? t('certs.formBoth') : t('certs.formWritten') }}</span></div></div>
            <div class="fact"><span>¥</span><div><b>{{ t('certs.examFee') }}</b><span class="num">¥{{ cert.price }}</span></div></div>
          </div>

          <div v-if="cert.prerequisites?.length" class="prereq">
            <b>{{ t('certs.prereq') }}</b>
            <p class="muted">{{ t('certs.prereqNote', { p: cert.prerequisites.join('、') }) }}</p>
          </div>

          <div class="path card-inner">
            <b>{{ t('certs.pathTitle') }}</b>
            <ol class="path-steps">
              <li>{{ t('certs.path1', { n: cert.courses?.length || 0 }) }}</li>
              <li>{{ t('certs.path2') }}</li>
              <li>{{ t('certs.path3') }}</li>
              <li>{{ t('certs.path4') }}</li>
            </ol>
          </div>
        </div>

        <aside class="side">
          <div class="card act">
            <Btn variant="primary" size="lg" block @click="startPath">{{ t('certs.applyCta') }}</Btn>
            <p class="caption" style="margin-top:10px; line-height:1.6">{{ t('certs.applyNote') }}</p>
          </div>
          <div v-if="cert.courses?.length" class="card related">
            <div class="t">{{ t('certs.recommend') }}</div>
            <router-link v-for="c in cert.courses" :key="c.id" :to="`/courses/${c.id}`" class="rel row">
              <BookOpen :size="15" :stroke-width="1.7" class="muted" />
              <div>
                <div class="rel-t">{{ c.title }}</div>
                <div class="caption">{{ c.level }} · {{ c.hours }} {{ t('common.hoursUnit') }}</div>
              </div>
            </router-link>
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
.main { padding: 28px; }
.facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 24px 0; }
.fact { display: flex; gap: 10px; align-items: flex-start; background: var(--surface-2); border-radius: var(--r-s); padding: 14px; }
.fact > :first-child { margin-top: 2px; }
.fact b { display: block; font-size: var(--fs-caption); color: var(--muted); font-weight: 500; }
.fact span { font-size: var(--fs-body); font-weight: 500; }
.prereq { padding: 14px 16px; background: var(--warn-soft); border-radius: var(--r-s); }
.prereq b { font-size: var(--fs-small); color: var(--warn); }
.prereq p { margin-top: 4px; font-size: var(--fs-small); }
.path { margin-top: 16px; }
.card-inner { background: var(--surface-2); border-radius: var(--r-s); padding: 18px; }
.path b { font-size: var(--fs-small); }
.path-steps { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; font-size: var(--fs-body); color: var(--fg-2); }
.path-steps li { padding-left: 22px; position: relative; }
.path-steps li::before {
  content: counter(list-item, decimal); counter-increment: list-item;
  position: absolute; left: 0; top: 1px;
  font-family: var(--font-num); font-size: 11px; font-weight: 600;
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--surface-3); color: var(--fg-2);
  display: flex; align-items: center; justify-content: center;
}
.side { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 16px; }
.act { padding: 20px; }
.related { padding: 18px 20px; }
.t { font-weight: 600; font-size: var(--fs-small); margin-bottom: 10px; }
.rel { padding: 8px 0; gap: 10px; }
.rel-t { font-weight: 500; }
.rel:hover .rel-t { color: var(--accent-ink); }
@media (max-width: 1000px) { .grid-2 { grid-template-columns: 1fr; } .side { position: static; } .facts { grid-template-columns: 1fr; } }
</style>
