<script setup>
// 班级详情：学员名单 + 进度成绩册
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Btn from '../../components/Btn.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import PageHead from '../../components/PageHead.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import { api, fmtDate } from '../../api';
import { useUi } from '../../stores/ui';

const { t } = useI18n();
const route = useRoute();
const ui = useUi();
const cls = ref(null);
const error = ref(false);
const changing = ref(false);

async function load() {
  error.value = false;
  try { cls.value = await api.get(`/teach/classes/${route.params.id}`); }
  catch { error.value = true; }
}
onMounted(load);

async function setStatus(status) {
  changing.value = true;
  try {
    await api.post(`/teach/classes/${route.params.id}/status`, { status });
    ui.toast(status === 'ongoing' ? t('teach.openedToast') : status === 'ended' ? t('teach.endedToast') : t('teach.title'));
    await load();
  } catch (e) { ui.toast(e.message, 'error'); }
  changing.value = false;
}
</script>

<template>
  <div>
    <LoadBlock v-if="!cls && !error" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('notfound.title')" />
    <template v-if="cls">
      <PageHead
        :title="cls.name"
        :sub="`${cls.course_title} · ${cls.term} · ${fmtDate(cls.start_date)}${t('my.term')}${fmtDate(cls.end_date)}`"
        :crumbs="[
          { label: t('workbench.teacherGroup') },
          { label: t('workbench.teachOverview'), to: '/teach' },
          { label: cls.name },
        ]"
      >
        <template #actions>
          <StatusBadge :status="cls.status" />
          <Btn v-if="cls.status === 'upcoming'" variant="primary" size="sm" :loading="changing" @click="setStatus('ongoing')">{{ t('teach.openClass') }}</Btn>
          <Btn v-else-if="cls.status === 'ongoing'" variant="secondary" size="sm" :loading="changing" @click="setStatus('ended')">{{ t('teach.endClass') }}</Btn>
        </template>
      </PageHead>

      <div class="top-row">
        <div class="card invite">
          <span class="caption">{{ t('teach.inviteNote') }}</span>
          <b class="code num">{{ cls.invite_code }}</b>
          <span class="caption">{{ t('teach.inviteHint') }}</span>
        </div>
        <div class="card fact"><b class="num v">{{ cls.members.length }}</b><span class="l">{{ t('teach.member') }}</span></div>
        <div class="card fact"><b class="num v">{{ Math.round(cls.members.reduce((s, m) => s + m.progress, 0) / Math.max(cls.members.length, 1)) }}%</b><span class="l">{{ t('teach.avg') }}</span></div>
        <div class="card fact"><b class="num v">{{ cls.members.filter(m => m.progress >= 100).length }}</b><span class="l">{{ t('teach.finished') }}</span></div>
      </div>

      <section class="card roster">
        <h2>{{ t('teach.roster') }}</h2>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('teach.member') }}</th><th>{{ t('teach.majorGrade') }}</th><th>{{ t('teach.joinWay') }}</th><th style="width:220px">{{ t('teach.progressCol') }}</th><th>{{ t('common.status') }}</th><th>{{ t('teach.realnameCol') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in cls.members" :key="m.user_id">
                <td>
                  <div class="row" style="gap:8px">
                    <span class="avatar num">{{ m.name.slice(0, 1) }}</span>
                    <div>
                      <b>{{ m.name }}</b>
                      <div class="caption num">{{ m.student_no || '—' }}</div>
                    </div>
                  </div>
                </td>
                <td class="small muted">{{ m.major }} · {{ m.grade }}</td>
                <td><span class="badge" :class="m.joined_via === 'school' ? 'badge-blue' : 'badge-gray'">{{ m.joined_via === 'school' ? t('teach.viaSchool') : t('teach.viaCode') }}</span></td>
                <td>
                  <div class="p row" style="gap:8px">
                    <div class="bar"><span :style="{ width: m.progress + '%' }" :class="{ done: m.progress >= 100 }"></span></div>
                    <span class="caption num">{{ m.progress }}%</span>
                  </div>
                </td>
                <td><StatusBadge :status="m.progress >= 100 ? 'completed' : 'learning'" /></td>
                <td><span :class="m.realname_verified ? 'ok small' : 'muted small'">{{ m.realname_verified ? t('teach.realnameYes') : t('teach.realnameNo') }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.top-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 14px; margin-bottom: 18px; }
.invite { padding: 16px 20px; display: flex; flex-direction: column; gap: 4px; }
.code { font-size: 22px; font-weight: 600; color: var(--accent-ink); letter-spacing: 0.06em; }
.fact { padding: 16px 20px; display: flex; flex-direction: column; justify-content: center; }
.fact .v { font-size: 26px; font-weight: 600; }
.fact .l { font-size: var(--fs-caption); color: var(--muted); }

.roster { padding: 20px 22px; }
h2 { font-size: var(--fs-h3); margin-bottom: 14px; }
.table-wrap { overflow-x: auto; }
.avatar {
  width: 30px; height: 30px; border-radius: 50%; flex: none;
  background: var(--surface-3); color: var(--fg-2);
  display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600;
}
.bar { flex: 1; height: 5px; background: var(--surface-3); border-radius: 3px; overflow: hidden; }
.bar span { display: block; height: 100%; background: var(--accent); border-radius: 3px; }
.bar span.done { background: var(--success); }
.ok { color: var(--success); }
@media (max-width: 1000px) { .top-row { grid-template-columns: 1fr 1fr; } }
</style>
