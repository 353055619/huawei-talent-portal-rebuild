<script setup>
// 课程详情：公开可看；报名引导登录回跳（修复现网“未登录点报名零反馈”）
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PlayCircle, CheckCircle2, Clock3, Users2, BarChart3, FileText, FlaskConical, ListChecks } from 'lucide-vue-next';
import Btn from '../components/Btn.vue';
import HueSquare from '../components/HueSquare.vue';
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
const course = ref(null);
const error = ref(false);
const enrolling = ref(false);

async function load() {
  error.value = false;
  try { course.value = await api.get(`/courses/${route.params.id}`); }
  catch { error.value = true; }
}
onMounted(load);

async function enroll() {
  if (!auth.isLogged) {
    ui.toast(t('courses.loginEnroll'), 'info');
    router.push({ path: '/login', query: { redirect: route.fullPath } });
    return;
  }
  enrolling.value = true;
  try {
    await api.post(`/my/courses/${route.params.id}/enroll`);
    ui.toast(t('courses.enrollOk'));
    await load();
  } catch (e) { ui.toast(e.message, 'error'); }
  enrolling.value = false;
}

const KIND_ICON = { video: PlayCircle, lab: FlaskConical, quiz: ListChecks, doc: FileText };
const KIND_LABEL = { video: 'courses.canvasVideo', lab: 'courses.canvasLab', quiz: 'courses.canvasQuiz', doc: 'courses.canvasDoc' };
function catClass(c) { return c.category === '核心课' ? 'badge-blue' : c.category === '实践课' ? 'badge-amber' : 'badge-gray'; }
function catLabel(c) { return c.category === '核心课' ? t('courses.core') : c.category === '实践课' ? t('courses.practice') : t('courses.general'); }
</script>

<template>
  <div class="container page-enter" style="padding-top: 32px">
    <LoadBlock v-if="!course && !error" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('notfound.title')" @retry="load" />
    <template v-if="course">
      <nav class="crumbs caption" aria-label="breadcrumb">
        <router-link to="/">{{ t('nav.home') }}</router-link> / <router-link to="/courses">{{ t('nav.courses') }}</router-link> / <span class="cur">{{ course.title }}</span>
      </nav>

      <div class="detail-grid">
        <div>
          <div class="hero card">
            <div class="hero-band" :style="{ background: `hsl(${course.cover_hue} 45% 94%)` }">
              <HueSquare :hue="course.cover_hue" :name="course.title.slice(0, 1)" :size="72" />
              <div class="hero-badges">
                <span class="badge" :class="catClass(course)">{{ catLabel(course) }}</span>
                <span class="badge badge-gray">{{ course.level }}</span>
                <span class="badge badge-red">{{ course.track }}</span>
              </div>
            </div>
            <div class="hero-body">
              <h1>{{ course.title }}</h1>
              <div class="meta row">
                <span class="row caption"><Clock3 :size="14" :stroke-width="1.7" />{{ course.hours }} {{ t('common.hoursUnit') }}</span>
                <span class="row caption"><BarChart3 :size="14" :stroke-width="1.7" />{{ course.lesson_count }}</span>
                <span class="row caption"><Users2 :size="14" :stroke-width="1.7" />{{ course.learners.toLocaleString() }} {{ t('courses.learned') }}</span>
                <span class="row caption num">{{ t('courses.rating') }} {{ course.rating }}</span>
              </div>
              <p class="summary">{{ course.summary }}</p>
              <div class="tags">
                <span v-for="tag in course.tags" :key="tag" class="badge badge-gray">{{ tag }}</span>
              </div>
            </div>
          </div>

          <section class="card sect">
            <h2>{{ t('courses.detailOutcomes') }}</h2>
            <ul class="outcomes">
              <li v-for="o in course.outcomes" :key="o" class="row"><CheckCircle2 :size="16" :stroke-width="1.7" class="ok" />{{ o }}</li>
            </ul>
          </section>

          <section class="card sect">
            <h2>{{ t('courses.detailSyllabusOf', { n: course.lessons.length }) }}</h2>
            <ul class="lessons">
              <li v-for="l in course.lessons" :key="l.id" class="lesson row-between">
                <span class="row l-body">
                  <span class="l-ic"><component :is="KIND_ICON[l.kind]" :size="15" :stroke-width="1.7" /></span>
                  <span class="l-title">{{ l.title }}</span>
                </span>
                <span class="caption num">{{ l.minutes }} {{ t('courses.minutes') }}</span>
              </li>
            </ul>
          </section>
        </div>

        <aside class="side">
          <div class="card action-card">
            <template v-if="course.enrolled">
              <div class="enrolled-note">
                <CheckCircle2 :size="16" :stroke-width="1.7" class="ok" />
                {{ t('courses.enrolledNote', { n: course.progress }) }}
              </div>
              <div class="progress"><span :style="{ width: course.progress + '%' }"></span></div>
              <Btn variant="primary" size="lg" block :to="`/my/courses/${course.id}/learn`">
                {{ course.progress > 0 ? t('common.continueLearning') : t('common.startLearning') }}
              </Btn>
            </template>
            <template v-else>
              <Btn variant="primary" size="lg" block :loading="enrolling" @click="enroll">
                {{ t('common.enrollNow') }}
              </Btn>
              <p class="caption act-note">{{ auth.isLogged ? '' : t('courses.enrollNote') }}</p>
            </template>
          </div>

          <div v-if="course.linkedCerts?.length" class="card side-card">
            <div class="side-t">{{ t('certs.linkedCerts') }}</div>
            <router-link v-for="c in course.linkedCerts" :key="c.id" :to="`/certifications/${c.id}`" class="row-between cert-link">
              <span>{{ c.name }}</span>
              <span class="badge badge-gray">{{ c.level }}</span>
            </router-link>
          </div>

          <div v-if="course.related.length" class="card side-card">
            <div class="side-t">{{ t('certs.recommend') }}</div>
            <router-link v-for="c in course.related" :key="c.id" :to="`/courses/${c.id}`" class="rel">
              <div class="rel-t">{{ c.title }}</div>
              <div class="caption">{{ c.level }} · {{ c.hours }} {{ t('common.hoursUnit') }} · {{ c.learners }} {{ t('courses.learned') }}</div>
            </router-link>
          </div>

          <div class="card side-card teacher-hint">
            <div class="side-t">{{ t('courses.teacherEntry') }}</div>
            <p class="caption">{{ t('courses.teacherHint') }}</p>
            <Btn variant="secondary" size="sm" :to="auth.isLogged ? '/teach' : { path: '/login', query: { redirect: '/teach' } }">
              {{ t('courses.goTeach') }}
            </Btn>
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

.detail-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; align-items: start; }
.hero { overflow: hidden; }
.hero-band { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; }
.hero-badges { display: flex; gap: 8px; flex-wrap: wrap; }
.hero-body { padding: 20px 24px 24px; }
h1 { font-size: 26px; }
.meta { gap: 16px; margin-top: 10px; flex-wrap: wrap; }
.summary { margin-top: 14px; color: var(--fg-2); line-height: 1.8; max-width: 70ch; }
.tags { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }

.sect { margin-top: 20px; padding: 24px; }
.sect h2 { font-size: var(--fs-h3); margin-bottom: 16px; }
.outcomes { display: flex; flex-direction: column; gap: 10px; }
.ok { color: var(--success); }
.lessons { display: flex; flex-direction: column; }
.lesson { padding: 11px 4px; border-bottom: 1px solid var(--border); }
.lesson:last-child { border-bottom: none; }
.l-ic { color: var(--muted); width: 22px; display: inline-flex; }
.l-title { font-size: var(--fs-body); }

.side { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 16px; }
.action-card { padding: 20px; }
.enrolled-note { display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 10px; }
.progress { height: 6px; background: var(--surface-3); border-radius: 3px; overflow: hidden; margin-bottom: 16px; }
.progress span { display: block; height: 100%; background: var(--accent); border-radius: 3px; transition: width var(--t-mid); }
.act-note { margin-top: 10px; line-height: 1.6; }
.side-card { padding: 18px 20px; }
.side-t { font-weight: 600; font-size: var(--fs-small); margin-bottom: 12px; }
.cert-link { padding: 9px 0; border-bottom: 1px solid var(--border); font-size: var(--fs-body); }
.cert-link:last-child { border-bottom: none; }
.cert-link:hover span:first-child { color: var(--accent-ink); }
.rel { display: block; padding: 9px 0; border-bottom: 1px solid var(--border); }
.rel:last-child { border-bottom: none; }
.rel-t { font-size: var(--fs-body); font-weight: 500; }
.rel:hover .rel-t { color: var(--accent-ink); }
.teacher-hint p { margin: 4px 0 12px; line-height: 1.6; }

@media (max-width: 1000px) { .detail-grid { grid-template-columns: 1fr; } .side { position: static; } }
</style>
