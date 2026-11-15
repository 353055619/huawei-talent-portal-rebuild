<script setup>
// 人才检索：授权制
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Search } from 'lucide-vue-next';
import PageHead from '../../components/PageHead.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import { api } from '../../api';

const { t } = useI18n();
const items = ref(null);
const error = ref(false);
const kw = ref('');
const onlyCert = ref(false);
const onlyContest = ref(false);

async function load() {
  error.value = false;
  try { items.value = (await api.get('/employer/talents')).items; }
  catch { error.value = true; }
}
onMounted(load);

const filtered = computed(() =>
  (items.value || []).filter((tal) =>
    (!kw.value || tal.name.includes(kw.value) || (tal.major || '').includes(kw.value)) &&
    (!onlyCert.value || tal.cert_count > 0) &&
    (!onlyContest.value || tal.contest_adv > 0)
  )
);
</script>

<template>
  <div>
    <PageHead :title="t('employer.talentsTitle')" :sub="t('employer.talentsSub')" :crumbs="[{ label: t('workbench.employerGroup') }, { label: t('workbench.talentSearch') }]">
      <template #actions>
        <div class="search">
          <Search :size="15" :stroke-width="1.7" />
          <input v-model="kw" class="input" type="search" :placeholder="t('employer.searchTalents')" aria-label="search" />
        </div>
      </template>
    </PageHead>

    <div class="quick-filters">
      <button class="chip" :class="{ on: onlyCert }" @click="onlyCert = !onlyCert">{{ t('employer.filterCert') }}</button>
      <button class="chip" :class="{ on: onlyContest }" @click="onlyContest = !onlyContest">{{ t('employer.filterContest') }}</button>
    </div>

    <LoadBlock v-if="!items && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <EmptyState
      v-else-if="!filtered.length"
      :title="t('employer.talentsEmpty')"
      :desc="t('employer.talentsEmptyDesc')"
    />
    <div v-else class="list">
      <article v-for="tal in filtered" :key="tal.id" class="card row-between talent">
        <div class="t-body">
          <div class="row" style="gap:8px; flex-wrap:wrap">
            <b>{{ tal.name }}</b>
            <span v-if="tal.cert_count" class="badge badge-blue">{{ t('employer.certCount', { n: tal.cert_count }) }}</span>
            <span v-if="tal.contest_adv" class="badge badge-amber">{{ t('employer.contestAdv') }}</span>
            <span v-if="tal.realname_verified" class="badge badge-green">{{ t('employer.verifiedBadge') }}</span>
          </div>
          <div class="caption" style="margin-top:4px">{{ tal.school_name }} · {{ tal.major }} · {{ tal.grade }}</div>
          <p v-if="tal.certs" class="caption certs">{{ tal.certs }}</p>
          <p v-if="tal.intention" class="caption">{{ t('employer.intentionOf', { v: tal.intention }) }}</p>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.search { position: relative; display: flex; align-items: center; }
.search svg { position: absolute; left: 10px; color: var(--faint); }
.search .input { width: 240px; padding-left: 32px; }
.quick-filters { display: flex; gap: 8px; margin-bottom: 14px; }
.chip { padding: 6px 14px; border-radius: var(--r-pill); border: 1px solid var(--border-strong); font-size: var(--fs-small); background: var(--surface); }
.chip.on { background: var(--inverse-bg); color: var(--inverse-fg); border-color: var(--inverse-bg); }
.list { display: flex; flex-direction: column; gap: 12px; }
.talent { padding: 16px 20px; }
.certs { margin-top: 6px; }
</style>
