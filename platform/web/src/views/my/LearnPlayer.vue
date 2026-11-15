<script setup>
// 学习器：站内完整体验
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { PlayCircle, FlaskConical, ListChecks, FileText, Check } from 'lucide-vue-next';
import Btn from '../../components/Btn.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import { api } from '../../api';
import { useUi } from '../../stores/ui';

const { t } = useI18n();
const route = useRoute();
const ui = useUi();
const course = ref(null);
const error = ref(false);
const current = ref(0);
const completing = ref(false);

async function load() {
  error.value = false;
  try {
    course.value = await api.get(`/courses/${route.params.id}`);
    current.value = Math.min(Math.floor((course.value.progress / 100) * course.value.lessons.length), course.value.lessons.length - 1);
  } catch { error.value = true; }
}
onMounted(load);

const lesson = computed(() => course.value?.lessons[current.value]);
const KIND = { video: { icon: PlayCircle, label: 'courses.canvasVideo' }, lab: { icon: FlaskConical, label: 'courses.canvasLab' }, quiz: { icon: ListChecks, label: 'courses.canvasQuiz' }, doc: { icon: FileText, label: 'courses.canvasDoc' } };

async function complete() {
  completing.value = true;
  try {
    const r = await api.post(`/my/lessons/${lesson.value.id}/complete`);
    ui.toast(r.completed ? t('courses.courseDone') : t('courses.lessonDone', { t: lesson.value.title, n: r.progress }));
    await load();
    if (!course.value.progress || course.value.progress < 100) current.value = Math.min(current.value + 1, course.value.lessons.length - 1);
  } catch (e) { ui.toast(e.message, 'error'); }
  completing.value = false;
}
</script>

<template>
  <div>
    <LoadBlock v-if="!course && !error" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('notfound.title')" />
    <template v-if="course">
      <div class="player-grid">
        <div class="main">
          <div class="crumbs caption">
            <router-link to="/my/courses">{{ t('my.coursesTitle') }}</router-link> / <span class="cur">{{ course.title }}</span>
          </div>
          <div class="stage card">
            <div class="stage-head row-between">
              <span class="row" style="gap:10px">
                <component :is="KIND[lesson.kind].icon" :size="17" :stroke-width="1.7" class="muted" />
                <b>{{ lesson.title }}</b>
              </span>
              <span class="badge badge-gray">{{ t(KIND[lesson.kind].label) }} · {{ lesson.minutes }} {{ t('courses.minutes') }}</span>
            </div>
            <div class="canvas" :class="lesson.kind">
              <div class="ph-label">
                <component :is="KIND[lesson.kind].icon" :size="34" :stroke-width="1.2" />
                <b>{{ t(KIND[lesson.kind].label) }}</b>
                <span class="caption">{{ lesson.chapter }} · #{{ lesson.idx }} · {{ t('courses.canvasNote') }}</span>
              </div>
            </div>
            <div class="stage-foot row-between">
              <span class="caption">{{ t('courses.progress') }} {{ course.progress }}%（{{ course.lessons.length }}）</span>
              <Btn variant="primary" :loading="completing" @click="complete">
                <Check :size="15" :stroke-width="2" />{{ lesson.kind === 'quiz' ? t('courses.completeQuiz') : t('courses.completeBtn') }}
              </Btn>
            </div>
            <div class="bar"><span :style="{ width: course.progress + '%' }" :class="{ done: course.progress >= 100 }"></span></div>
          </div>
        </div>

        <aside class="toc card" aria-label="toc">
          <div class="toc-head">
            <b>{{ t('courses.chapters') }}</b>
            <span class="caption num">{{ course.progress }}%</span>
          </div>
          <div class="bar slim"><span :style="{ width: course.progress + '%' }" :class="{ done: course.progress >= 100 }"></span></div>
          <ol class="chapters">
            <template v-for="(l, i) in course.lessons" :key="l.id">
              <li v-if="i === 0 || course.lessons[i - 1].chapter !== l.chapter" class="ch-name">{{ l.chapter }}</li>
              <li>
                <button class="l-row" :class="{ cur: i === current, done: (i + 1) / course.lessons.length * 100 <= course.progress && i !== current }" @click="current = i">
                  <component :is="KIND[l.kind].icon" :size="14" :stroke-width="1.7" />
                  <span class="l-t">{{ l.title }}</span>
                  <span class="caption num">{{ l.minutes }}'</span>
                </button>
              </li>
            </template>
          </ol>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.player-grid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: start; }
.crumbs { margin-bottom: 12px; display: flex; gap: 6px; }
.crumbs a:hover { color: var(--fg); }
.cur { color: var(--fg-2); }
.stage { padding: 20px 22px; }
.stage-head { margin-bottom: 14px; }
.canvas {
  border-radius: var(--r-m); border: 1px solid var(--border);
  min-height: 340px; display: flex; align-items: center; justify-content: center;
  background:
    radial-gradient(600px 200px at 50% 0%, var(--surface-2), transparent),
    repeating-linear-gradient(-45deg, transparent 0 14px, rgba(0,0,0,0.012) 14px 28px),
    var(--surface-2);
}
.ph-label { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--muted); text-align: center; padding: 20px; }
.stage-foot { margin: 16px 0 10px; }
.bar { height: 6px; background: var(--surface-3); border-radius: 3px; overflow: hidden; }
.bar.slim { height: 4px; margin-bottom: 12px; }
.bar span { display: block; height: 100%; background: var(--accent); transition: width var(--t-mid); }
.bar span.done { background: var(--success); }

.toc { padding: 16px; position: sticky; top: 78px; }
.toc-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
.chapters { max-height: 60vh; overflow: auto; }
.ch-name { font-size: var(--fs-caption); color: var(--faint); font-weight: 600; padding: 12px 6px 6px; }
.l-row {
  width: 100%; display: flex; align-items: center; gap: 8px; text-align: left;
  padding: 8px 8px; border-radius: var(--r-s); font-size: var(--fs-small); color: var(--fg-2);
}
.l-row:hover { background: var(--surface-2); }
.l-row.cur { background: var(--accent-soft); color: var(--accent-deep); font-weight: 600; }
.l-row.done { color: var(--muted); }
.l-row.done svg { color: var(--success); }
.l-t { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 1000px) { .player-grid { grid-template-columns: 1fr; } .toc { position: static; } }
</style>
