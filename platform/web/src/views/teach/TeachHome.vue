<script setup>
// 教学工作台
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus } from 'lucide-vue-next';
import Btn from '../../components/Btn.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import PageHead from '../../components/PageHead.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import { api, fmtDate } from '../../api';
import { useUi } from '../../stores/ui';

const { t } = useI18n();
const ui = useUi();
const data = ref(null);
const error = ref(false);
const showForm = ref(false);
const courses = ref([]);
const form = ref({ courseId: '', name: '', term: '2027春' });
const creating = ref(false);
const formError = ref('');

async function load() {
  error.value = false;
  try { data.value = await api.get('/teach/overview'); } catch { error.value = true; }
}
onMounted(load);

async function openForm() {
  courses.value = (await api.get('/courses')).items;
  showForm.value = true;
}

async function create() {
  formError.value = '';
  if (!form.value.courseId || !form.value.name.trim()) { formError.value = t('teach.courseRequired'); return; }
  creating.value = true;
  try {
    const r = await api.post('/teach/classes', { courseId: +form.value.courseId, name: form.value.name.trim(), term: form.value.term });
    ui.toast(t('teach.createdToast', { code: r.inviteCode }));
    showForm.value = false;
    await load();
  } catch (e) { formError.value = e.message; }
  creating.value = false;
}
</script>

<template>
  <div>
    <PageHead :title="t('teach.title')" :sub="t('teach.sub')" :crumbs="[{ label: t('workbench.teacherGroup') }, { label: t('workbench.teachOverview') }]">
      <template #actions>
        <Btn variant="primary" @click="openForm"><Plus :size="15" :stroke-width="2" />{{ t('teach.newClass') }}</Btn>
      </template>
    </PageHead>

    <LoadBlock v-if="!data && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="data">
      <div v-if="showForm" class="card form">
        <h2>{{ t('teach.formTitle') }}</h2>
        <div v-if="formError" class="form-banner" role="alert">{{ formError }}</div>
        <div class="f-grid">
          <div class="field">
            <label for="c-course">{{ t('teach.courseLabel') }}</label>
            <select id="c-course" v-model="form.courseId" class="select">
              <option value="">{{ t('teach.chooseCourse') }}</option>
              <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.title }}（{{ c.code }}）</option>
            </select>
          </div>
          <div class="field">
            <label for="c-term">{{ t('teach.termLabel') }}</label>
            <select id="c-term" v-model="form.term" class="select">
              <option>2027春</option><option>2026秋</option><option>2027秋</option>
            </select>
          </div>
          <div class="field span-2">
            <label for="c-name">{{ t('teach.className') }}</label>
            <input id="c-name" v-model="form.name" class="input" :placeholder="t('teach.classNamePh')" />
          </div>
        </div>
        <div class="row" style="gap:12px; margin-top:18px">
          <Btn variant="primary" :loading="creating" @click="create">{{ t('teach.confirmCreate') }}</Btn>
          <Btn variant="ghost" @click="showForm = false">{{ t('common.cancel') }}</Btn>
        </div>
      </div>

      <div class="stat-row">
        <div class="card stat"><div class="v num">{{ data.classes.length }}</div><div class="l">{{ t('teach.classes') }}</div></div>
        <div class="card stat"><div class="v num">{{ data.totalStudents }}</div><div class="l">{{ t('teach.students') }}</div></div>
        <div class="card stat"><div class="v num">{{ data.classes.filter(c => c.status === 'ongoing').length }}</div><div class="l">{{ t('teach.ongoing') }}</div></div>
      </div>

      <EmptyState
        v-if="!data.classes.length"
        :title="t('teach.emptyTitle')"
        :desc="t('teach.emptyDesc')"
        :action-text="t('teach.newClass')"
        @action="openForm"
      />
      <div v-else class="list">
        <router-link v-for="c in data.classes" :key="c.id" :to="`/teach/classes/${c.id}`" class="card card-hover cls">
          <div class="cls-body">
            <div class="row" style="gap:10px">
              <b class="cls-t">{{ c.name }}</b>
              <StatusBadge :status="c.status" />
            </div>
            <div class="caption" style="margin-top:4px">{{ c.course_title }} · {{ c.term }} · {{ fmtDate(c.start_date) }}{{ t('my.term') }}{{ fmtDate(c.end_date) }}</div>
            <div class="bar"><span :style="{ width: c.avg_progress + '%' }"></span></div>
            <div class="caption">{{ t('teach.avgProgress') }} {{ c.avg_progress }}% · {{ c.member_count }}{{ t('teach.studentsUnit') }} · {{ c.finished }}{{ t('teach.finishedUnit') }}</div>
          </div>
          <div class="cls-side">
            <span class="caption">{{ t('teach.inviteCode') }}</span>
            <span class="code num">{{ c.invite_code }}</span>
          </div>
        </router-link>
      </div>
    </template>
  </div>
</template>

<style scoped>
.form { padding: 22px 24px; margin-bottom: 18px; }
h2 { font-size: var(--fs-h3); margin-bottom: 14px; }
.f-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.span-2 { grid-column: span 2; }
.form-banner { padding: 10px 14px; background: var(--danger-soft); color: var(--danger); border-radius: var(--r-s); font-size: var(--fs-small); margin-bottom: 14px; }

.stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 18px; }
.stat { padding: 16px 20px; }
.stat .v { font-size: 26px; font-weight: 600; }
.stat .l { font-size: var(--fs-small); color: var(--muted); }

.list { display: flex; flex-direction: column; gap: 12px; }
.cls { display: flex; gap: 20px; padding: 18px 20px; align-items: center; }
.cls-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.cls-t { font-size: var(--fs-body-l); }
.bar { height: 5px; background: var(--surface-3); border-radius: 3px; overflow: hidden; }
.bar span { display: block; height: 100%; background: var(--fg-2); }
.cls-side { text-align: right; flex: none; }
.code { font-size: 16px; font-weight: 600; color: var(--accent-ink); }
@media (max-width: 700px) { .f-grid { grid-template-columns: 1fr; } .span-2 { grid-column: span 1; } .cls { flex-direction: column; align-items: flex-start; } .cls-side { text-align: left; } }
</style>
