<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowRight } from 'lucide-vue-next';
import Btn from '../../components/Btn.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import PageHead from '../../components/PageHead.vue';
import HueSquare from '../../components/HueSquare.vue';
import { api, fmtDate } from '../../api';

const { t } = useI18n();
const items = ref(null);
const error = ref(false);
const tab = ref('all');

async function load() {
  error.value = false;
  try { items.value = (await api.get('/my/courses')).items; }
  catch { error.value = true; }
}
onMounted(load);

function filtered() {
  if (tab.value === 'learning') return items.value.filter((c) => c.status === 'learning');
  if (tab.value === 'completed') return items.value.filter((c) => c.status === 'completed');
  return items.value;
}
const TABS = [['all', 'my.tabAll'], ['learning', 'my.tabLearning'], ['completed', 'my.tabCompleted']];
</script>

<template>
  <div>
    <PageHead :title="t('my.coursesTitle')" :sub="t('my.coursesSub')" :crumbs="[{ label: t('workbench.studentGroup') }, { label: t('my.coursesTitle') }]">
      <template #actions>
        <Btn variant="secondary" to="/courses">{{ t('my.findNew') }}</Btn>
      </template>
    </PageHead>

    <div class="tabs">
      <button v-for="[k, label] in TABS" :key="k" class="tab" :class="{ on: tab === k }" @click="tab = k">{{ t(label) }}</button>
    </div>

    <LoadBlock v-if="!items && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <EmptyState
      v-else-if="!filtered().length"
      :title="t('my.coursesEmpty')"
      :desc="tab === 'all' ? t('my.coursesEmptyDesc') : t('my.appsEmptyFilter')"
      :action-text="t('my.coursesEmptyAction')"
      action-to="/courses"
    />
    <div v-else class="list">
      <div v-for="c in filtered()" :key="c.enrollment_id" class="card row course">
        <HueSquare :hue="c.cover_hue" :name="c.title.slice(0, 1)" :size="48" />
        <div class="c-body">
          <div class="row-between">
            <b class="c-t">{{ c.title }}</b>
            <span class="caption num">{{ c.progress }}%</span>
          </div>
          <div class="caption">{{ c.track }} · {{ c.category }} · {{ c.lesson_count }} · {{ fmtDate(c.started_at) }}{{ t('my.enrolledAt') }}</div>
          <div class="bar"><span :style="{ width: c.progress + '%' }" :class="{ done: c.status === 'completed' }"></span></div>
        </div>
        <Btn variant="secondary" size="sm" :to="`/my/courses/${c.id}/learn`">
          {{ c.status === 'completed' ? t('my.review') : t('common.continueLearning') }}
          <ArrowRight :size="14" :stroke-width="1.8" />
        </Btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tabs { display: flex; gap: 4px; margin-bottom: 18px; background: var(--surface-3); border-radius: var(--r-s); padding: 3px; width: fit-content; }
.tab { padding: 7px 18px; border-radius: 5px; font-size: var(--fs-small); font-weight: 500; color: var(--muted); }
.tab.on { background: var(--surface); color: var(--fg); font-weight: 600; box-shadow: var(--shadow-1); }

.list { display: flex; flex-direction: column; gap: 12px; }
.course { padding: 16px 20px; gap: 18px; }
.c-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.c-t { font-size: var(--fs-body-l); }
.bar { height: 5px; background: var(--surface-3); border-radius: 3px; overflow: hidden; }
.bar span { display: block; height: 100%; background: var(--accent); border-radius: 3px; }
.bar span.done { background: var(--success); }
@media (max-width: 640px) { .course { flex-wrap: wrap; } }
</style>
