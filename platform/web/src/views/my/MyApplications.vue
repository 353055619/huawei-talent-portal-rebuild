<script setup>
// 统一进度中心：投递/考券/大赛/双选会/入驻/约考/学习 全部在一个页面追踪。
// 「一切状态皆可追踪」的落地页 —— 替代现网“邮件等通知”。
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import StepsBar from '../../components/StepsBar.vue';
import FilterChips from '../../components/FilterChips.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import PageHead from '../../components/PageHead.vue';
import { api, timeAgo, fmtDateTime } from '../../api';
import { trackerLabel, trackerSteps } from '../../tracker-ui';

const { t, tm } = useI18n();
const data = ref(null);
const error = ref(false);
const typeFilter = ref('');

async function load() {
  error.value = false;
  try { data.value = await api.get('/my/trackers'); }
  catch { error.value = true; }
}
onMounted(load);

const items = computed(() =>
  (data.value?.items || []).filter((i) => !typeFilter.value || i.type === typeFilter.value)
);
const TYPE_OPTIONS = computed(() => {
  const seen = new Map();
  for (const i of data.value?.items || []) {
    seen.set(i.type, (seen.get(i.type) || 0) + 1);
  }
  return [...seen.entries()].map(([type, count]) => ({
    label: `${trackerLabel(t, type)} ${count}`, value: type,
  }));
});
</script>

<template>
  <div>
    <PageHead
      :title="t('my.appsTitle')"
      :sub="t('my.appsSub')"
      :crumbs="[{ label: t('workbench.studentGroup') }, { label: t('my.appsTitle') }]"
    />

    <LoadBlock v-if="!data && !error" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="data">
      <div class="filters card">
        <FilterChips v-model="typeFilter" :all-label="t('common.all')" :options="TYPE_OPTIONS" />
      </div>

      <EmptyState
        v-if="!items.length"
        :title="t('my.appsEmpty')"
        :desc="typeFilter ? t('my.appsEmptyFilter') : t('my.appsEmptyDesc')"
        :action-text="t('my.appsEmptyAction')"
        action-to="/courses"
      />

      <div class="list">
        <article v-for="it in items" :key="it.type + ':' + it.id" class="card item">
          <div class="i-head">
            <span class="badge" :class="it.failed ? 'badge-amber' : 'badge-gray'">{{ trackerLabel(t, it.type) }}</span>
            <span class="i-title">{{ it.title }}</span>
            <span class="caption i-time">{{ timeAgo(it.at) }}</span>
          </div>
          <StepsBar :steps="trackerSteps(tm, it.type)" :current="it.current" :failed="it.failed" :failed-label="t('tracker.failedLabel')" />
          <div class="i-foot">
            <span v-if="it.sub" class="caption">{{ it.sub }}</span>
            <span class="caption">{{ t('my.stepsOf', { cur: it.current + 1, total: it.total }) }}</span>
          </div>
        </article>
      </div>

      <!-- 事件时间线 -->
      <section class="card timeline-sect">
        <h2>{{ t('my.recent') }}</h2>
        <ol class="timeline">
          <li v-for="(e, i) in data.events" :key="i" class="tl-item">
            <span class="tl-dot" :class="{ fail: /rejected|eliminated/.test(e.status) }"></span>
            <div class="tl-body">
              <div class="tl-note">{{ e.note }}</div>
              <div class="caption">{{ trackerLabel(t, e.entity_type) }} · {{ fmtDateTime(e.created_at) }}</div>
            </div>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>

<style scoped>
.filters { padding: 14px 16px; margin-bottom: 18px; }
.list { display: flex; flex-direction: column; gap: 14px; }
.item { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }
.i-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.i-title { font-weight: 600; font-size: var(--fs-body-l); flex: 1; min-width: 0; }
.i-time { flex: none; }
.i-foot { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }

.timeline-sect { margin-top: 24px; padding: 22px 24px; }
h2 { font-size: var(--fs-h3); margin-bottom: 16px; }
.timeline { position: relative; padding-left: 18px; }
.tl-item { position: relative; padding: 0 0 18px 14px; }
.tl-item::before { content: ''; position: absolute; left: 3px; top: 10px; bottom: 0; border-left: 1.5px solid var(--border); }
.tl-item:last-child::before { display: none; }
.tl-dot {
  position: absolute; left: -2px; top: 5px;
  width: 11px; height: 11px; border-radius: 50%;
  background: var(--surface); border: 2.5px solid var(--fg-2);
}
.tl-dot.fail { border-color: var(--danger); }
.tl-note { font-size: var(--fs-body); }
</style>
