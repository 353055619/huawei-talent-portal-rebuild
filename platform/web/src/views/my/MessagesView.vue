<script setup>
// 消息中心：待办/消息/公告三合一
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { CheckCheck } from 'lucide-vue-next';
import Btn from '../../components/Btn.vue';
import PageHead from '../../components/PageHead.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import { api, timeAgo } from '../../api';

const { t } = useI18n();
const router = useRouter();
const data = ref(null);
const error = ref(false);
const tab = ref('todo');
const anns = ref([]);

async function load() {
  error.value = false;
  try {
    data.value = await api.get('/my/notifications', { kind: tab.value });
    anns.value = (await api.get('/announcements')).items;
  } catch { error.value = true; }
}
onMounted(load);

const TABS = computed(() => [
  ['todo', t('my.tabTodo')], ['message', t('my.tabMsg')], ['announcement', t('my.tabAnn')],
]);
const unreadCount = computed(() => data.value?.unread || {});

async function open(n) {
  if (!n.read) await api.post(`/my/notifications/${n.id}/read`).catch(() => {});
  if (n.link) router.push(n.link);
}
async function readAll() {
  await api.post('/my/notifications/read-all').catch(() => {});
  await load();
}
</script>

<template>
  <div>
    <PageHead :title="t('my.msgsTitle')" :sub="t('my.msgsSub')" :crumbs="[{ label: t('workbench.commonGroup') }, { label: t('my.msgsTitle') }]">
      <template #actions>
        <Btn variant="secondary" @click="readAll"><CheckCheck :size="14" :stroke-width="1.8" />{{ t('my.readAll') }}</Btn>
      </template>
    </PageHead>

    <LoadBlock v-if="!data && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="data">
      <div class="tabs-row">
        <div class="tabs">
          <button v-for="[k, label] in TABS" :key="k" class="tab" :class="{ on: tab === k }" @click="tab = k; load()">
            {{ label }}
            <span v-if="unreadCount[k]" class="badge badge-red num">{{ unreadCount[k] }}</span>
          </button>
        </div>
      </div>

      <div v-if="tab === 'announcement'">
        <ul class="anns">
          <li v-for="a in anns" :key="a.id" class="card ann">
            <div class="row-between">
              <span class="badge badge-gray">{{ a.category }}</span>
              <span class="caption num">{{ timeAgo(a.published_at) }}</span>
            </div>
            <b>{{ a.title }}</b>
            <p class="muted">{{ a.body }}</p>
          </li>
        </ul>
      </div>
      <div v-else>
        <EmptyState
          v-if="!data.items.length"
          :title="tab === 'todo' ? t('my.todoEmptyTitle') : t('my.msgEmptyTitle')"
          :desc="tab === 'todo' ? t('my.todoEmptyDesc') : t('my.msgEmptyDesc')"
          :action-text="t('my.msgsEmptyAction')"
          action-to="/courses"
        />
        <ul v-else class="msgs">
          <li v-for="n in data.items" :key="n.id" :class="{ unread: !n.read }">
            <button class="msg" @click="open(n)">
              <span v-if="!n.read" class="dot" :aria-label="t('my.unreadLabel')"></span>
              <span class="m-body">
                <b>{{ n.title }}</b>
                <span class="muted small">{{ n.body }}</span>
              </span>
              <span class="caption num">{{ timeAgo(n.created_at) }}</span>
            </button>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>
.tabs-row { margin-bottom: 16px; }
.tabs { display: inline-flex; gap: 4px; background: var(--surface-3); border-radius: var(--r-s); padding: 3px; }
.tab { padding: 7px 16px; border-radius: 5px; font-size: var(--fs-small); font-weight: 500; color: var(--muted); display: inline-flex; align-items: center; gap: 7px; }
.tab.on { background: var(--surface); color: var(--fg); font-weight: 600; box-shadow: var(--shadow-1); }

.msgs { display: flex; flex-direction: column; }
.msgs li { border-bottom: 1px solid var(--border); }
.msg { width: 100%; display: flex; gap: 12px; padding: 15px 12px; text-align: left; align-items: baseline; border-radius: var(--r-s); }
.msg:hover { background: var(--surface-2); }
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); flex: none; align-self: center; }
.m-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
li.unread .m-body b { color: var(--fg); }
li:not(.unread) .m-body b { color: var(--fg-2); font-weight: 500; }

.anns { display: flex; flex-direction: column; gap: 12px; }
.ann { padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
</style>
