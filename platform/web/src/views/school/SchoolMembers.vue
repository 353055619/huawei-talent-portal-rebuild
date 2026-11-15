<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Check } from 'lucide-vue-next';
import Btn from '../../components/Btn.vue';
import PageHead from '../../components/PageHead.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import { api } from '../../api';
import { useUi } from '../../stores/ui';

const { t } = useI18n();
const ui = useUi();
const items = ref(null);
const error = ref(false);
const kw = ref('');
const onlyPending = ref(false);

async function load() {
  error.value = false;
  try { items.value = (await api.get('/school/members')).items; }
  catch { error.value = true; }
}
onMounted(load);

function filtered() {
  let list = items.value || [];
  if (kw.value) list = list.filter((m) => m.name.includes(kw.value) || (m.roles || []).some((r) => r.includes(kw.value)));
  if (onlyPending.value) list = list.filter((m) => (m.roles || []).some((r) => r.includes('待确认')));
  return list;
}

async function approve(id) {
  try {
    const r = await api.post(`/school/role-requests/${id}/approve`);
    ui.toast(t('school.approvedToast', { role: r.role === 'teacher' ? t('my.roleTeacher') : t('my.roleStudent') }));
    await load();
  } catch (e) { ui.toast(e.message, 'error'); }
}

function roleLabel(r) {
  const pending = r.includes('待确认');
  const name = r.startsWith('teacher') ? t('my.roleTeacher') : r.startsWith('school_admin') ? t('workbench.schoolGroup') : r.startsWith('iasc') ? t('workbench.iascGroup') : r.startsWith('employer') ? t('workbench.employerGroup') : t('my.roleStudent');
  return pending ? `${name} · ${t('my.pendingConfirm')}` : name;
}
</script>

<template>
  <div>
    <PageHead :title="t('school.membersTitle')" :sub="t('school.membersSub')" :crumbs="[{ label: t('workbench.schoolGroup') }, { label: t('workbench.members') }]">
      <template #actions>
        <div class="row" style="gap:10px">
          <input v-model="kw" class="input" type="search" :placeholder="t('school.searchMembers')" aria-label="search" style="width:200px" />
          <button class="chip" :class="{ on: onlyPending }" @click="onlyPending = !onlyPending">
            {{ t('school.onlyPending') }}
          </button>
        </div>
      </template>
    </PageHead>

    <LoadBlock v-if="!items && !error" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <EmptyState v-else-if="!filtered().length" :title="t('school.membersEmpty')" :desc="t('school.membersEmptyDesc')" />
    <div v-else class="card table-wrap">
      <table class="table">
        <thead>
          <tr><th>{{ t('my.name') }}</th><th>{{ t('school.email') }}</th><th>{{ t('teach.majorGrade') }}</th><th>{{ t('school.roleCol') }}</th><th>{{ t('teach.realnameCol') }}</th><th>{{ t('common.actions') }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="m in filtered()" :key="m.id">
            <td><b>{{ m.name }}</b><div class="caption num">{{ m.student_no || '' }}</div></td>
            <td class="small muted">{{ m.email }}</td>
            <td class="small muted">{{ [m.major, m.grade].filter(Boolean).join(' · ') || '—' }}</td>
            <td>
              <span v-for="r in m.roles" :key="r" class="badge" :class="r.includes('待确认') ? 'badge-amber' : 'badge-gray'">
                {{ roleLabel(r) }}
              </span>
            </td>
            <td><span :class="m.realname_verified ? 'ok small' : 'muted small'">{{ m.realname_verified ? t('teach.realnameYes') : t('teach.realnameNo') }}</span></td>
            <td>
              <Btn v-if="(m.roles || []).some(r => r.includes('待确认'))" variant="secondary" size="sm" @click="approve(m.id)">
                <Check :size="13" :stroke-width="2" />{{ t('school.confirmBtn') }}
              </Btn>
              <span v-else class="caption">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-wrap { padding: 6px 10px; overflow-x: auto; }
.ok { color: var(--success); }
.chip { padding: 6px 14px; border-radius: var(--r-pill); border: 1px solid var(--border-strong); font-size: var(--fs-small); background: var(--surface); }
.chip.on { background: var(--inverse-bg); color: var(--inverse-fg); border-color: var(--inverse-bg); }
</style>
