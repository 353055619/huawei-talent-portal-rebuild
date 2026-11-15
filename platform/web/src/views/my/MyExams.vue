<script setup>
// 我的考试：站内预约 + 取消/改期规则透明
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
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
const data = ref(null);
const error = ref(false);
const showBook = ref(false);

const certs = ref([]);
const form = ref({ certId: '', voucherId: '', date: '', city: '成都', venue: 'Pearson VUE 成都考试中心（高新区天府五街）' });
const booking = ref(false);
const formError = ref('');

async function load() {
  error.value = false;
  try {
    data.value = await api.get('/my/exams');
    certs.value = (await api.get('/certifications')).items;
  } catch { error.value = true; }
}
onMounted(load);

const CITIES = ['成都', '重庆', '北京', '深圳', '西安', '杭州', '武汉'];

async function book() {
  formError.value = '';
  if (!form.value.certId) { formError.value = t('certs.chooseCertPh'); return; }
  if (!form.value.date) { formError.value = t('my.examDate'); return; }
  booking.value = true;
  try {
    await api.post('/my/exams', {
      certId: +form.value.certId,
      voucherId: form.value.voucherId ? +form.value.voucherId : null,
      date: form.value.date,
      city: form.value.city,
      venue: form.value.venue,
    });
    ui.toast(t('my.bookOk'));
    showBook.value = false;
    await load();
  } catch (e) { formError.value = e.message; }
  booking.value = false;
}

async function cancel(id) {
  try {
    await api.post(`/my/exams/${id}/cancel`);
    ui.toast(t('my.cancelOk'));
    await load();
  } catch (e) { ui.toast(e.message, 'error'); }
}
</script>

<template>
  <div>
    <PageHead :title="t('my.examsTitle')" :sub="t('my.examsSub')" :crumbs="[{ label: t('workbench.studentGroup') }, { label: t('workbench.myExams') }]">
      <template #actions>
        <Btn variant="primary" @click="showBook = !showBook">{{ t('my.bookExam') }}</Btn>
      </template>
    </PageHead>

    <LoadBlock v-if="!data && !error" :rows="3" />
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />
    <template v-if="data">
      <div v-if="showBook" class="card book-form">
        <h2>{{ t('my.bookExam') }}</h2>
        <div v-if="formError" class="form-banner" role="alert">{{ formError }}</div>
        <div class="b-grid">
          <div class="field">
            <label for="b-cert">{{ t('my.certId') }}</label>
            <select id="b-cert" v-model="form.certId" class="select">
              <option value="">{{ t('certs.chooseCertPh') }}</option>
              <option v-for="c in certs" :key="c.id" :value="c.id">{{ c.name }}（¥{{ c.price }}）</option>
            </select>
          </div>
          <div class="field">
            <label for="b-voucher">{{ t('my.useVoucher') }}</label>
            <select id="b-voucher" v-model="form.voucherId" class="select">
              <option value="">{{ t('my.noVoucher') }}</option>
              <option v-for="v in data.usableVouchers" :key="v.id" :value="v.id">{{ v.cert_name }} · {{ v.code }}</option>
            </select>
          </div>
          <div class="field">
            <label for="b-date">{{ t('my.examDate') }}</label>
            <input id="b-date" v-model="form.date" type="date" class="input" :min="new Date(Date.now() + 86400000).toISOString().slice(0, 10)" />
            <span class="hint">{{ t('my.hcieRule') }}</span>
          </div>
          <div class="field">
            <label for="b-city">{{ t('my.examCity') }}</label>
            <select id="b-city" v-model="form.city" class="select" @change="form.venue = `Pearson VUE ${form.city}`">
              <option v-for="c in CITIES" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="field span-2">
            <label for="b-venue">{{ t('my.examVenue') }}</label>
            <input id="b-venue" v-model="form.venue" class="input" />
          </div>
        </div>
        <div class="row" style="gap:12px; margin-top:18px">
          <Btn variant="primary" :loading="booking" @click="book">{{ t('my.confirmBook') }}</Btn>
          <Btn variant="ghost" @click="showBook = false">{{ t('common.cancel') }}</Btn>
        </div>
      </div>

      <EmptyState
        v-if="!data.items.length"
        :title="t('my.examEmpty')"
        :desc="t('my.examEmptyDesc')"
        :action-text="t('my.examEmptyAction')"
        action-to="/certifications"
      />
      <div v-else class="list">
        <div v-for="x in data.items" :key="x.id" class="card exam row-between">
          <div class="x-body">
            <div class="row" style="gap:10px">
              <b>{{ x.cert_name }}</b>
              <StatusBadge :status="x.status" />
            </div>
            <div class="caption x-meta">
              {{ fmtDate(x.exam_date) }} · {{ x.city }} · {{ x.venue }}
              <span v-if="x.score !== null && x.score !== undefined"> · {{ t('my.scoreOf') }} <b class="num">{{ x.score }}</b>/1000</span>
            </div>
          </div>
          <div class="row" style="gap:8px">
            <template v-if="x.status === 'booked'">
              <Btn variant="secondary" size="sm" to="/my/vouchers">{{ t('my.vouchersNote') }}</Btn>
              <Btn variant="ghost" size="sm" @click="cancel(x.id)">{{ t('my.cancelBook') }}</Btn>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.book-form { padding: 22px 24px; margin-bottom: 20px; }
h2 { font-size: var(--fs-h3); margin-bottom: 16px; }
.b-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.span-2 { grid-column: span 2; }
.form-banner { padding: 10px 14px; background: var(--danger-soft); color: var(--danger); border-radius: var(--r-s); font-size: var(--fs-small); margin-bottom: 16px; }
.list { display: flex; flex-direction: column; gap: 12px; }
.exam { padding: 16px 20px; }
.x-meta { margin-top: 6px; }
@media (max-width: 700px) { .b-grid { grid-template-columns: 1fr; } .span-2 { grid-column: span 1; } }
</style>
