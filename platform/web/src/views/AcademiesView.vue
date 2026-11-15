<script setup>
// ICT 学院目录：免强制条件即可浏览 + 分省汇总条
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Search } from 'lucide-vue-next';
import HueSquare from '../components/HueSquare.vue';
import FilterChips from '../components/FilterChips.vue';
import EmptyState from '../components/EmptyState.vue';
import LoadBlock from '../components/LoadBlock.vue';
import ErrorBlock from '../components/ErrorBlock.vue';
import { api } from '../api';

const { t } = useI18n();
const items = ref(null);
const byProvince = ref(null);
const error = ref(false);
const kw = ref('');
const tier = ref('');
const province = ref('');

async function load() {
  error.value = false;
  try {
    const d = await api.get('/academies');
    items.value = d.items;
    byProvince.value = d.byProvince;
  } catch { error.value = true; }
}
onMounted(load);

const filtered = computed(() =>
  (items.value || []).filter((s) =>
    (!kw.value || s.name.includes(kw.value.trim())) &&
    (!tier.value || s.tier === tier.value) &&
    (!province.value || s.province === province.value)
  )
);
const provinces = computed(() => (byProvince.value || []).map((p) => p.province));
const maxStudents = computed(() => Math.max(...(byProvince.value || []).map((p) => p.students), 1));
</script>

<template>
  <div class="container page-enter" style="padding-top: 32px">
    <header class="head">
      <div>
        <h1>{{ t('academies.title') }}</h1>
        <p class="muted">{{ t('academies.sub') }}</p>
      </div>
      <router-link class="apply-link" to="/apply/school">{{ t('academies.applyLink') }}</router-link>
    </header>

    <LoadBlock v-if="!items && !error" :rows="4" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="byProvince">
      <section class="card prov" :aria-label="t('academies.provinceScale')">
        <div
          v-for="p in byProvince" :key="p.province"
          class="p-row" :class="{ on: province === p.province }"
          role="button" tabindex="0"
          @click="province = province === p.province ? '' : p.province"
          @keydown.enter="province = province === p.province ? '' : p.province"
        >
          <span class="p-name">{{ p.province }}</span>
          <span class="p-bar"><span :style="{ width: (p.students / maxStudents) * 100 + '%' }"></span></span>
          <span class="p-num num">{{ p.c }} · {{ p.students.toLocaleString() }} {{ t('academies.studentsScale') }}</span>
        </div>
      </section>

      <div class="filters">
        <div class="f-row">
          <span class="f-label">{{ t('academies.tier') }}</span>
          <FilterChips v-model="tier" :all-label="t('common.all')" :options="[{ label: t('academies.certify'), value: '认证级' }, { label: t('academies.prefer'), value: '优选级' }, { label: t('academies.lead'), value: '领先级' }]" />
        </div>
        <div class="f-row">
          <span class="f-label">{{ t('academies.province') }}</span>
          <FilterChips v-model="province" :all-label="t('common.all')" :options="provinces.map(p => ({ label: p, value: p }))" />
        </div>
        <div class="f-row">
          <span class="f-label">{{ t('common.search') }}</span>
          <div class="search">
            <Search :size="15" :stroke-width="1.7" />
            <input v-model="kw" class="input" type="search" :placeholder="t('academies.searchPh')" aria-label="search" />
          </div>
        </div>
      </div>

      <p class="result-line caption">{{ t('academies.resultCount', { n: filtered.length }) }}</p>

      <EmptyState
        v-if="filtered.length === 0"
        :title="t('academies.emptyTitle')"
        :desc="t('academies.emptyDesc')"
        :action-text="t('academies.emptyAction')"
        action-to="/apply/school"
      />
      <div v-else class="a-grid">
        <div v-for="s in filtered" :key="s.id" class="card a-card">
          <div class="a-head">
            <HueSquare :hue="s.logo_hue" :name="s.short_name || s.name.slice(0, 1)" :size="42" />
            <div class="a-t">
              <div class="a-name">{{ s.name }}</div>
              <div class="caption">{{ s.province }}{{ s.city ? ' · ' + s.city : '' }}</div>
            </div>
            <span class="badge" :class="s.tier === '领先级' ? 'badge-red' : s.tier === '优选级' ? 'badge-blue' : 'badge-gray'">
              {{ s.tier === '领先级' ? t('academies.lead') : s.tier === '优选级' ? t('academies.prefer') : t('academies.certify') }}
            </span>
          </div>
          <div class="a-nums caption">
            <span><b class="num">{{ s.students_count.toLocaleString() }}</b> {{ t('academies.studentsCount') }}</span>
            <span><b class="num">{{ s.teachers_count }}</b> {{ t('academies.teachersCount') }}</span>
            <span v-if="s.joined_at"><b class="num">{{ new Date(s.joined_at).getFullYear() }}</b>{{ t('academies.partnerSince') }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; margin-bottom: 24px; }
.head p { margin-top: 10px; max-width: 64ch; }
.apply-link { color: var(--accent-ink); font-size: var(--fs-small); font-weight: 500; }
.apply-link:hover { text-decoration: underline; }

.prov { padding: 20px 24px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 40px; }
.p-row { display: grid; grid-template-columns: 110px 1fr auto; align-items: center; gap: 12px; padding: 6px 8px; border-radius: var(--r-s); cursor: pointer; transition: background var(--t-fast); }
.p-row:hover, .p-row.on { background: var(--surface-2); }
.p-name { font-size: var(--fs-small); color: var(--fg-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.p-bar { height: 6px; background: var(--surface-3); border-radius: 3px; overflow: hidden; }
.p-bar span { display: block; height: 100%; background: var(--fg-2); border-radius: 3px; }
.p-row.on .p-bar span { background: var(--accent); }
.p-num { font-size: 11px; color: var(--muted); white-space: nowrap; }

.filters { display: flex; flex-direction: column; gap: 10px; margin: 22px 0; padding: 16px; background: var(--surface-2); border-radius: var(--r-m); border: 1px solid var(--border); }
.f-row { display: flex; gap: 12px; align-items: center; }
.f-label { font-size: var(--fs-caption); color: var(--faint); width: 34px; flex: none; font-weight: 600; }
.search { position: relative; display: flex; align-items: center; }
.search svg { position: absolute; left: 10px; color: var(--faint); }
.search .input { width: 240px; padding-left: 32px; }
.result-line { margin-bottom: 12px; }

.a-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.a-card { padding: 18px 20px; }
.a-head { display: flex; gap: 12px; align-items: center; }
.a-t { flex: 1; min-width: 0; }
.a-name { font-weight: 600; }
.a-nums { display: flex; gap: 16px; margin-top: 12px; }
.a-nums b { font-size: 14px; color: var(--fg); font-weight: 600; }
@media (max-width: 1000px) { .a-grid { grid-template-columns: repeat(2, 1fr); } .prov { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .a-grid { grid-template-columns: 1fr; } }
</style>
