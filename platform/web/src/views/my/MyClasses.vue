<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { KeyRound } from 'lucide-vue-next';
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
const items = ref(null);
const error = ref(false);
const code = ref('');
const joining = ref(false);

async function load() {
  error.value = false;
  try { items.value = (await api.get('/my/classes')).items; }
  catch { error.value = true; }
}
onMounted(load);

async function join() {
  if (!code.value.trim()) { ui.toast(t('academies.searchPh'), 'error'); return; }
  joining.value = true;
  try {
    const r = await api.post('/my/classes/join', { code: code.value.trim() });
    ui.toast(t('my.joinOk', { name: r.className }));
    code.value = '';
    await load();
  } catch (e) { ui.toast(e.message, 'error'); }
  joining.value = false;
}
</script>

<template>
  <div>
    <PageHead :title="t('my.classesTitle')" :sub="t('my.classesSub')" :crumbs="[{ label: t('workbench.studentGroup') }, { label: t('my.classesTitle') }]" />

    <div class="join card row-between">
      <span class="muted small">{{ t('my.joinHint') }}</span>
      <div class="row join-form">
        <div class="code-input">
          <KeyRound :size="15" :stroke-width="1.7" class="faint" />
          <input v-model="code" class="input" :placeholder="t('my.codePh')" aria-label="code" @keydown.enter="join" />
        </div>
        <Btn variant="secondary" :loading="joining" @click="join">{{ t('my.join') }}</Btn>
      </div>
    </div>

    <LoadBlock v-if="!items && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <EmptyState
      v-else-if="!items.length"
      :title="t('my.classesEmpty')"
      :desc="t('my.classesEmptyDesc')"
      :action-text="t('my.classesEmptyAction')"
      action-to="/courses"
    />
    <div v-else class="list">
      <div v-for="c in items" :key="c.id" class="card cls">
        <div class="row-between">
          <div>
            <b class="c-t">{{ c.name }}</b>
            <div class="caption" style="margin-top:4px">
              {{ c.course_title }} · {{ c.teacher_name }} · {{ c.term }} · {{ c.member_count }}{{ t('my.classmates') }}
            </div>
          </div>
          <StatusBadge :status="c.status" />
        </div>
        <div class="row-between prog-row">
          <div class="prog">
            <div class="bar"><span :style="{ width: c.my_progress + '%' }"></span></div>
            <span class="caption num">{{ t('my.myProgress') }} {{ c.my_progress }}%</span>
          </div>
          <div class="row" style="gap:8px">
            <span class="badge" :class="c.joined_via === 'school' ? 'badge-blue' : 'badge-gray'">
              {{ c.joined_via === 'school' ? t('my.viaSchool') : t('my.viaCode') }}
            </span>
          </div>
        </div>
        <div class="caption term">{{ fmtDate(c.start_date) }}{{ t('my.term') }}{{ fmtDate(c.end_date) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.join { padding: 14px 18px; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; }
.join-form { gap: 8px; }
.code-input { position: relative; display: flex; align-items: center; }
.code-input svg { position: absolute; left: 10px; }
.code-input .input { width: 180px; padding-left: 32px; font-family: var(--font-num); }

.list { display: flex; flex-direction: column; gap: 12px; }
.cls { padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
.c-t { font-size: var(--fs-body-l); }
.prog { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 6px; }
.bar { height: 5px; background: var(--surface-3); border-radius: 3px; overflow: hidden; }
.bar span { display: block; height: 100%; background: var(--accent); }
.prog-row { align-items: center; gap: 16px; flex-wrap: wrap; }
.term { border-top: 1px dashed var(--border); padding-top: 10px; }
</style>
