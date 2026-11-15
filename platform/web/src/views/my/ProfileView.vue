<script setup>
// 个人中心：资料/实名/角色关联/成长档案简历
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ShieldCheck, BadgeCheck } from 'lucide-vue-next';
import Btn from '../../components/Btn.vue';
import PageHead from '../../components/PageHead.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import LoadBlock from '../../components/LoadBlock.vue';
import { api } from '../../api';
import { useAuth } from '../../stores/auth';
import { useUi } from '../../stores/ui';

const { t } = useI18n();
const auth = useAuth();
const ui = useUi();
const data = ref(null);
const schools = ref([]);
const saving = ref(false);
const savingReal = ref(false);
const savingRole = ref(false);
const savingResume = ref(false);

const profile = ref({ name: '', phone: '', major: '', grade: '', student_no: '', bio: '' });
const realname = ref({ real_name: '', id_no: '' });
const roleForm = ref({ role: 'student', school_id: '', major: '', student_no: '' });
const resumeForm = ref({ intention: '', skills: '', awards: '' });

onMounted(async () => {
  data.value = await api.get('/my/profile');
  const p = data.value;
  profile.value = { name: p.name, phone: p.phone || '', major: p.major || '', grade: p.grade || '', student_no: p.student_no || '', bio: p.bio || '' };
  if (p.resume) resumeForm.value = { intention: p.resume.intention || '', skills: (p.resume.skills || []).join('；'), awards: (p.resume.awards || []).join('；') };
  schools.value = (await api.get('/academies')).items;
});

async function saveProfile() {
  if (!profile.value.name.trim()) { ui.toast(t('register.nameErr'), 'error'); return; }
  saving.value = true;
  try { await api.put('/my/profile', profile.value); ui.toast(t('my.profileSaved')); await auth.fetchMe(); }
  catch (e) { ui.toast(e.message, 'error'); }
  saving.value = false;
}
async function saveReal() {
  if (!realname.value.real_name.trim() || !realname.value.id_no.trim()) { ui.toast(t('my.realnameRequired'), 'error'); return; }
  if (!/^\d{17}[\dXx]$/.test(realname.value.id_no.trim())) { ui.toast(t('my.idErr'), 'error'); return; }
  savingReal.value = true;
  try { await api.post('/my/profile/realname', realname.value); ui.toast(t('my.realnameOk')); data.value = await api.get('/my/profile'); await auth.fetchMe(); }
  catch (e) { ui.toast(e.message, 'error'); }
  savingReal.value = false;
}
async function applyRole() {
  savingRole.value = true;
  try {
    const r = await api.post('/my/profile/roles', { ...roleForm.value, school_id: roleForm.value.school_id ? +roleForm.value.school_id : null });
    ui.toast(r.message || t('my.roleApplied'));
    data.value = await api.get('/my/profile');
  } catch (e) { ui.toast(e.message, 'error'); }
  savingRole.value = false;
}
async function saveResume() {
  savingResume.value = true;
  try {
    await api.put('/my/resume', {
      intention: resumeForm.value.intention,
      skills: resumeForm.value.skills.split(/[；;]/).map(s => s.trim()).filter(Boolean),
      awards: resumeForm.value.awards.split(/[；;]/).map(s => s.trim()).filter(Boolean),
    });
    ui.toast(t('my.growSaved'));
  } catch (e) { ui.toast(e.message, 'error'); }
  savingResume.value = false;
}
</script>

<template>
  <div v-if="data">
    <PageHead :title="t('my.profileTitle')" :sub="t('my.profileSub')" :crumbs="[{ label: t('workbench.commonGroup') }, { label: t('my.profileTitle') }]" />

    <div class="cols">
      <div class="main-col">
        <section class="card sect">
          <h2>{{ t('my.basicInfo') }}</h2>
          <div class="p-grid">
            <div class="field"><label for="p-name">{{ t('my.name') }}</label>
              <input id="p-name" v-model="profile.name" class="input" maxlength="20" />
            </div>
            <div class="field"><label for="p-phone">{{ t('my.phone') }}</label>
              <input id="p-phone" v-model="profile.phone" class="input" inputmode="tel" />
            </div>
            <div class="field"><label for="p-major">{{ t('my.major') }}</label>
              <input id="p-major" v-model="profile.major" class="input" />
            </div>
            <div class="field"><label for="p-grade">{{ t('my.grade') }}</label>
              <input id="p-grade" v-model="profile.grade" class="input" :placeholder="t('my.gradePh')" />
            </div>
            <div class="field"><label for="p-no">{{ t('my.studentNo') }}</label>
              <input id="p-no" v-model="profile.student_no" class="input" />
            </div>
            <div class="field"><label>{{ t('my.school') }}</label>
              <input class="input" :value="data.school_name || t('my.noSchool')" disabled />
            </div>
          </div>
          <Btn variant="primary" :loading="saving" style="margin-top:18px" @click="saveProfile">{{ t('my.saveProfile') }}</Btn>
        </section>

        <section class="card sect">
          <h2 class="row" style="gap:8px">{{ t('my.realname') }}
            <StatusBadge v-if="data.realname_verified" status="active" />
          </h2>
          <p class="muted small" style="margin-bottom:14px">{{ t('my.realnameNote') }}</p>
          <template v-if="!data.realname_verified">
            <div class="p-grid">
              <div class="field"><label for="r-name">{{ t('my.realNameLabel') }}</label>
                <input id="r-name" v-model="realname.real_name" class="input" />
              </div>
              <div class="field"><label for="r-id">{{ t('my.idNo') }}</label>
                <input id="r-id" v-model="realname.id_no" class="input num" inputmode="numeric" maxlength="18" :placeholder="t('my.idPh')" />
              </div>
            </div>
            <Btn variant="primary" :loading="savingReal" style="margin-top:16px" @click="saveReal">{{ t('my.realnameSubmit') }}</Btn>
          </template>
          <div v-else class="done row"><ShieldCheck :size="16" :stroke-width="1.7" class="ok" />{{ t('my.realnameDone', { r: data.real_name, n: data.name }) }}</div>
        </section>

        <section class="card sect">
          <h2>{{ t('my.roles') }}</h2>
          <div class="role-now">
            <span v-for="r in data.roleList" :key="r.role" class="row" style="gap:6px">
              <BadgeCheck :size="14" :stroke-width="1.8" :class="r.status === 'active' ? 'ok' : 'faint'" />
              {{ r.role === 'teacher' ? t('my.roleTeacher') : r.role === 'student' ? t('my.roleStudent') : auth.labelOf(r.role) }}
              <span v-if="r.status === 'pending'" class="badge badge-amber">{{ t('my.pendingConfirm') }}</span>
            </span>
          </div>
          <p class="muted small" style="margin:8px 0 14px">{{ t('my.rolesNote') }}</p>
          <div class="p-grid">
            <div class="field"><label for="ro-role">{{ t('my.roles') }}</label>
              <select id="ro-role" v-model="roleForm.role" class="select">
                <option value="student">{{ t('my.roleStudent') }}</option>
                <option value="teacher">{{ t('my.roleTeacher') }}</option>
              </select>
            </div>
            <div class="field"><label for="ro-school">{{ t('my.school') }}</label>
              <select id="ro-school" v-model="roleForm.school_id" class="select">
                <option value="">{{ t('my.chooseSchool') }}</option>
                <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div class="field"><label for="ro-major">{{ t('my.majorStudent') }}</label>
              <input id="ro-major" v-model="roleForm.major" class="input" />
            </div>
            <div class="field"><label for="ro-no">{{ t('my.noStudent') }}</label>
              <input id="ro-no" v-model="roleForm.student_no" class="input" />
            </div>
          </div>
          <Btn variant="secondary" :loading="savingRole" style="margin-top:16px" @click="applyRole">{{ t('my.applyRole') }}</Btn>
        </section>
      </div>

      <div class="side-col">
        <section class="card sect">
          <h2>{{ t('my.growTitle') }}</h2>
          <p class="muted small" style="margin:4px 0 12px">{{ t('my.growNote') }}</p>
          <div class="field">
            <label for="re-int">{{ t('my.intention') }}</label>
            <input id="re-int" v-model="resumeForm.intention" class="input" :placeholder="t('my.intentionPh')" />
          </div>
          <div class="field" style="margin-top:12px">
            <label for="re-sk">{{ t('my.skills') }}</label>
            <textarea id="re-sk" v-model="resumeForm.skills" class="textarea" :placeholder="t('my.skillsPh')"></textarea>
          </div>
          <div class="field" style="margin-top:12px">
            <label for="re-aw">{{ t('my.awards') }}</label>
            <textarea id="re-aw" v-model="resumeForm.awards" class="textarea" :placeholder="t('my.awardsPh')"></textarea>
          </div>
          <Btn variant="primary" :loading="savingResume" block style="margin-top:14px" @click="saveResume">{{ t('my.updateGrow') }}</Btn>
        </section>
      </div>
    </div>
  </div>
  <LoadBlock v-else :rows="4" />
</template>

<style scoped>
.cols { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; align-items: start; }
.main-col, .side-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.sect { padding: 22px 24px; }
h2 { font-size: var(--fs-h3); margin-bottom: 14px; }
.p-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.done { font-weight: 500; }
.ok { color: var(--success); }
.role-now { display: flex; flex-wrap: wrap; gap: 14px; }
@media (max-width: 1000px) { .cols { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .p-grid { grid-template-columns: 1fr; } }
</style>
