<script setup>
// 学生工作台：待办聚合 + 进行中旅程 + 关键截止。修复现网 usercenter 首页主区域空白。
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ArrowRight, CalendarCheck } from 'lucide-vue-next';
import Btn from '../../components/Btn.vue';
import StepsBar from '../../components/StepsBar.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import { api, timeAgo, fmtDate } from '../../api';
import { useAuth } from '../../stores/auth';
import { trackerLabel, trackerSteps } from '../../tracker-ui';

const { t, tm } = useI18n();
const auth = useAuth();
const router = useRouter();
const data = ref(null);
const error = ref(false);

async function load() {
  error.value = false;
  try { data.value = await api.get('/my/home'); }
  catch { error.value = true; }
}
onMounted(load);

const QUICK = [
  { to: '/courses', key: 'nav.courses' },
  { to: '/my/vouchers/apply', key: 'my.applyVoucher' },
  { to: '/contests', key: 'nav.contests' },
  { to: '/fairs', key: 'nav.fairs' },
  { to: '/jobs', key: 'nav.jobs' },
];

const TRACKS = ref(null);
api.get('/my/trackers').then((d) => { TRACKS.value = d.items.filter(i => !i.failed).slice(0, 4); }).catch(() => {});

function daysUntil(d) {
  return Math.ceil((new Date(d) - Date.now()) / 86400000);
}
</script>

<template>
  <div>
    <header class="hello">
      <h1>{{ t('my.homeHello', { name: auth.user?.name }) }}</h1>
      <p class="muted">{{ auth.user.school_name || t('my.noSchool') }}{{ auth.user.major ? ' · ' + auth.user.major : '' }}{{ auth.user.grade ? ' · ' + auth.user.grade : '' }}</p>
    </header>

    <LoadBlock v-if="!data && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="data">
      <div class="grid-main">
        <div class="col">
          <!-- 待办 -->
          <section class="card sect">
            <div class="s-head row-between">
              <h2>{{ t('my.todos') }} <span v-if="data.todos.length" class="badge badge-red num">{{ data.todos.length }}</span></h2>
              <router-link class="more" to="/my/messages">{{ t('my.messages') }}</router-link>
            </div>
            <ul v-if="data.todos.length" class="todos">
              <li v-for="todo in data.todos" :key="todo.id">
                <button class="todo row-between" @click="router.push(todo.link)">
                  <span class="t-body">
                    <b>{{ todo.title }}</b>
                    <span class="muted small">{{ todo.body }}</span>
                  </span>
                  <ArrowRight :size="15" :stroke-width="1.7" class="faint" />
                </button>
              </li>
            </ul>
            <div v-else class="all-done">
              <p class="muted">{{ t('my.todoEmpty') }}</p>
            </div>
          </section>

          <!-- 进行中的旅程（统一进度条预览） -->
          <section class="card sect">
            <div class="s-head row-between">
              <h2>{{ t('my.journeys') }}</h2>
              <router-link class="more" to="/my/applications">{{ t('workbench.progressCenter') }}</router-link>
            </div>
            <ul v-if="TRACKS?.length" class="journeys">
              <li v-for="it in TRACKS" :key="it.type + it.id" class="j">
                <div class="row-between">
                  <span class="j-t row">
                    <span class="badge badge-gray">{{ trackerLabel(t, it.type) }}</span>
                    <b>{{ it.title }}</b>
                  </span>
                  <span class="caption">{{ timeAgo(it.at) }}</span>
                </div>
                <StepsBar :steps="trackerSteps(tm, it.type)" :current="it.current" compact />
              </li>
            </ul>
            <p v-else class="muted small" style="padding: 8px 0">{{ t('my.journeysEmpty') }}</p>
          </section>
        </div>

        <div class="col side-col">
          <!-- 下次考试倒计时 -->
          <section v-if="data.nextExam" class="card sect exam-card">
            <div class="row-between">
              <h2 class="row" style="gap:8px"><CalendarCheck :size="16" :stroke-width="1.7" />{{ t('my.nextExam') }}</h2>
              <StatusBadge status="booked" />
            </div>
            <div class="count num">{{ daysUntil(data.nextExam.exam_date) }}</div>
            <div class="caption">{{ t('my.daysToExam') }}</div>
            <div class="e-body">
              <b>{{ data.nextExam.cert_name }}</b>
              <span class="muted small">{{ fmtDate(data.nextExam.exam_date) }} · {{ data.nextExam.city }}</span>
              <span class="muted small">{{ data.nextExam.venue }}</span>
            </div>
            <Btn variant="secondary" size="sm" block to="/my/exams">{{ t('my.examDetail') }}</Btn>
          </section>

          <!-- 快捷入口 -->
          <section class="card sect">
            <h2>{{ t('my.quick') }}</h2>
            <div class="quick">
              <router-link v-for="q in QUICK" :key="q.to" :to="q.to" class="q-item">{{ t(q.key) }}</router-link>
            </div>
          </section>

          <!-- 成长档案 -->
          <section class="card sect grow">
            <h2>{{ t('my.grow') }}</h2>
            <p class="muted small">{{ t('my.growDesc') }}</p>
            <Btn variant="secondary" size="sm" block to="/my/profile">{{ t('my.viewProfile') }}</Btn>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.hello { margin-bottom: 24px; }
.hello p { margin-top: 6px; }
.grid-main { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 20px; align-items: start; }
.col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.sect { padding: 20px 22px; }
.s-head { margin-bottom: 12px; }
h2 { font-size: var(--fs-h3); }
.more { font-size: var(--fs-small); color: var(--muted); }
.more:hover { color: var(--fg); }

.todos li + li { border-top: 1px solid var(--border); }
.todo { width: 100%; text-align: left; padding: 12px 2px; gap: 12px; }
.todo:hover b { color: var(--accent-ink); }
.t-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.all-done { padding: 12px 0; }

.journeys { display: flex; flex-direction: column; gap: 16px; }
.j { display: flex; flex-direction: column; gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.j:last-child { border-bottom: none; }
.j-t { gap: 10px; min-width: 0; flex-wrap: wrap; }

.exam-card .count { font-size: 44px; font-weight: 600; line-height: 1.1; color: var(--accent-ink); margin-top: 8px; }
.e-body { display: flex; flex-direction: column; gap: 3px; margin: 10px 0 14px; }

.quick { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.q-item {
  padding: 10px; text-align: center; font-size: var(--fs-small); font-weight: 500;
  border: 1px solid var(--border); border-radius: var(--r-s);
  transition: all var(--t-fast);
}
.q-item:hover { border-color: var(--fg-2); background: var(--surface-2); }
.grow p { margin: 4px 0 12px; line-height: 1.65; }
@media (max-width: 1000px) { .grid-main { grid-template-columns: 1fr; } }
</style>
