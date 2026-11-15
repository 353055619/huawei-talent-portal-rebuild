<script setup>
// ICT 大赛频道：赛道结构化（替代现网 PDF 手册），报名直达（登录回跳）
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { UserRound, Users2, ChevronRight } from 'lucide-vue-next';
import Btn from '../components/Btn.vue';
import EmptyState from '../components/EmptyState.vue';
import LoadBlock from '../components/LoadBlock.vue';
import ErrorBlock from '../components/ErrorBlock.vue';
import { api, fmtDate } from '../api';
import { useAuth } from '../stores/auth';
import { useUi } from '../stores/ui';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const auth = useAuth();
const ui = useUi();
const router = useRouter();
const data = ref(null);
const error = ref(false);
const entering = ref(null);

async function load() {
  error.value = false;
  try { data.value = await api.get('/contests'); }
  catch { error.value = true; }
}
onMounted(load);

async function enter(track) {
  if (!auth.isLogged) {
    ui.toast(t('contests.loginFirst'), 'info');
    router.push({ path: '/login', query: { redirect: '/contests' } });
    return;
  }
  entering.value = track.id;
  try {
    let teamName = null;
    if (track.entry_mode === '团队') {
      teamName = window.prompt(t('contests.teamPrompt'), '') || '';
      if (!teamName.trim()) { entering.value = null; return; }
    }
    await api.post('/my/contest-entries', { trackId: track.id, teamName });
    ui.toast(t('contests.appliedToast', { name: track.name }));
  } catch (e) { ui.toast(e.message, 'error'); }
  entering.value = null;
}
</script>

<template>
  <div class="container page-enter" style="padding-top: 32px">
    <header class="head">
      <div>
        <h1>{{ t('contests.title') }}</h1>
        <p class="muted">{{ t('contests.sub') }}</p>
      </div>
      <div v-if="data?.items?.[0]" class="meta card">
        <div class="m-row"><span class="m-l">{{ t('contests.regDeadline') }}</span><b class="num">{{ fmtDate(data.items[0].reg_end) }}</b></div>
        <div class="m-row"><span class="m-l">{{ t('contests.registeredCount') }}</span><b class="num">{{ data.items[0].entry_count.toLocaleString() }}</b></div>
      </div>
    </header>

    <LoadBlock v-if="!data && !error" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="data">
      <div v-if="auth.isLogged" class="my-entry card row-between">
        <span>{{ t('contests.myEntryHint') }}</span>
        <Btn variant="secondary" size="sm" to="/my/contests">{{ t('contests.viewMine') }}</Btn>
      </div>

      <div class="tracks">
        <div v-for="tr in data.tracks" :key="tr.id" class="card track">
          <div class="t-head row-between">
            <div class="row" style="gap:10px">
              <span class="t-badge" :class="tr.entry_mode === '团队' ? 'team' : 'solo'">
                <component :is="tr.entry_mode === '团队' ? Users2 : UserRound" :size="13" :stroke-width="1.9" />
                {{ tr.entry_mode === '团队' ? t('contests.team', { n: tr.team_size }) : t('contests.solo') }}
              </span>
              <h2>{{ tr.name }}</h2>
            </div>
          </div>
          <p class="muted t-desc">{{ tr.description }}</p>
          <div class="stages">
            <template v-for="(s, i) in tr.stages" :key="s">
              <span class="stage">{{ s }}</span>
              <ChevronRight v-if="i < tr.stages.length - 1" :size="13" :stroke-width="1.8" class="caption" />
            </template>
          </div>
          <div class="t-foot row-between">
            <span class="caption">{{ t('contests.deadline', { d: fmtDate(data.items[0].reg_end) }) }}</span>
            <Btn variant="secondary" size="sm" :loading="entering === tr.id" @click="enter(tr)">{{ t('contests.applyCta') }}</Btn>
          </div>
        </div>
      </div>

      <EmptyState
        v-if="!data.tracks.length"
        :title="t('contests.emptyTitle')"
        :desc="t('contests.emptyDesc')"
        :action-text="t('contests.emptyAction')"
        action-to="/announcements"
      />
    </template>
  </div>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; flex-wrap: wrap; }
.head p { margin-top: 10px; max-width: 64ch; }
.meta { padding: 14px 20px; display: flex; flex-direction: column; gap: 8px; min-width: 200px; }
.m-row { display: flex; justify-content: space-between; gap: 24px; font-size: var(--fs-small); }
.m-l { color: var(--muted); }
.my-entry { margin: 20px 0 24px; padding: 14px 20px; font-size: var(--fs-small); color: var(--muted); background: var(--surface-2); }
.tracks { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 8px; }
.track { padding: 22px 24px; display: flex; flex-direction: column; gap: 12px; }
h2 { font-size: var(--fs-h3); }
.t-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: var(--fs-caption); font-weight: 600;
  padding: 3px 10px; border-radius: var(--r-pill);
}
.solo { background: var(--info-soft); color: var(--info); }
.team { background: var(--accent-soft); color: var(--accent-deep); }
.t-desc { font-size: var(--fs-small); line-height: 1.65; }
.stages { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; padding: 10px 12px; background: var(--surface-2); border-radius: var(--r-s); }
.stage { font-size: var(--fs-small); font-weight: 500; color: var(--fg-2); }
.t-foot { margin-top: auto; }
@media (max-width: 900px) { .tracks { grid-template-columns: 1fr; } }
</style>
