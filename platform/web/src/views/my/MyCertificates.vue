<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Award, BookCheck, Download } from 'lucide-vue-next';
import Btn from '../../components/Btn.vue';
import EmptyState from '../../components/EmptyState.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';
import PageHead from '../../components/PageHead.vue';
import { api, fmtDate } from '../../api';
import { useUi } from '../../stores/ui';

const { t } = useI18n();
const ui = useUi();
const data = ref(null);
const error = ref(false);

async function load() {
  error.value = false;
  try { data.value = await api.get('/my/certificates'); }
  catch { error.value = true; }
}
onMounted(load);

function download(name) {
  ui.toast(t('my.dlToast', { name }), 'info');
}
</script>

<template>
  <div>
    <PageHead :title="t('my.certsTitle')" :sub="t('my.certsSub')" :crumbs="[{ label: t('workbench.studentGroup') }, { label: t('workbench.myCerts') }]" />

    <LoadBlock v-if="!data && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="data">
      <section v-if="data.items.length">
        <h2 class="sec-t">{{ t('my.certCerts') }}</h2>
        <div class="cert-grid">
          <div v-for="c in data.items" :key="c.id" class="card cert">
            <div class="c-band" :class="c.level.toLowerCase()">
              <Award :size="26" :stroke-width="1.5" />
              <span class="num">{{ c.level }}</span>
            </div>
            <div class="c-body">
              <b>{{ c.name }}</b>
              <span class="caption">{{ t('my.serial') }} {{ c.serial }} · {{ fmtDate(c.earned_at) }}{{ t('my.earnedAt') }}</span>
              <span v-if="c.score" class="caption">{{ t('my.scoreOf') }} <b class="num">{{ c.score }}</b>/1000</span>
              <Btn variant="secondary" size="sm" @click="download(c.name)"><Download :size="14" :stroke-width="1.8" />{{ t('my.download') }}</Btn>
            </div>
          </div>
        </div>
      </section>

      <section v-if="data.courseCerts.length" style="margin-top: 26px">
        <h2 class="sec-t">{{ t('my.courseCerts') }}</h2>
        <div class="cert-grid">
          <div v-for="c in data.courseCerts" :key="c.code" class="card cert">
            <div class="c-band course">
              <BookCheck :size="26" :stroke-width="1.5" />
            </div>
            <div class="c-body">
              <b>{{ c.title }}</b>
              <span class="caption">{{ c.code }} · {{ fmtDate(c.completed_at) }}</span>
              <Btn variant="secondary" size="sm" @click="download(c.title)"><Download :size="14" :stroke-width="1.8" />{{ t('my.downloadCourse') }}</Btn>
            </div>
          </div>
        </div>
      </section>

      <EmptyState
        v-if="!data.items.length && !data.courseCerts.length"
        :title="t('my.certsEmpty')"
        :desc="t('my.certsEmptyDesc')"
        :action-text="t('my.certsEmptyAction')"
        action-to="/courses"
      />
    </template>
  </div>
</template>

<style scoped>
.sec-t { font-size: var(--fs-h3); margin-bottom: 14px; }
.cert-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.cert { overflow: hidden; }
.c-band {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; color: #fff;
}
.c-band.hcia { background: var(--info); }
.c-band.hcip { background: var(--success); }
.c-band.hcie { background: var(--inverse-bg); }
.c-band.course { background: var(--surface-3); color: var(--fg-2); }
.c-band span { font-weight: 600; font-size: 18px; }
.c-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
.c-body .btn { margin-top: 8px; }
</style>
