<script setup>
// 门户首页 v2：换用复刻基线 —— 官方原图轮播 + 居中区块标题 + 复刻课程卡/认证卡。
// demo 独有内容（双选会/四端入口/案例/动态）以基线组件样式呈现。
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChevronRight, Users2 } from 'lucide-vue-next';
import Btn from '../components/Btn.vue';
import ErrorBlock from '../components/ErrorBlock.vue';
import { api, fmtDate } from '../api';

const { t } = useI18n();
const data = ref(null);
const error = ref(false);
const stories = ref([]);
const certs = ref([]);

const BANNERS = Array.from({ length: 10 }, (_, i) => `/assets/replica/banner-${i + 1}.jpg`);

// banner 轮播（5s 自动播，横线指示器）
const bannerIdx = ref(0);
let bannerTimer = null;
function goBanner(i) { bannerIdx.value = (i + BANNERS.length) % BANNERS.length; }

async function load() {
  error.value = false;
  try {
    data.value = await api.get('/home');
    stories.value = (await api.get('/stories')).items.slice(0, 3);
    certs.value = (await api.get('/certifications')).items;
  } catch { error.value = true; }
}
onMounted(() => {
  load();
  bannerTimer = setInterval(() => goBanner(bannerIdx.value + 1), 5000);
});
onBeforeUnmount(() => clearInterval(bannerTimer));

// 认证五列（与现网首页一致的方向分组）
const CERT_GROUPS = ref([]);
function buildGroups(list) {
  const byDir = new Map();
  for (const c of list) {
    if (!byDir.has(c.direction)) byDir.set(c.direction, []);
    byDir.get(c.direction).push(c.name);
  }
  CERT_GROUPS.value = [...byDir.entries()].slice(0, 5).map(([dir, names]) => ({ dir, names: names.slice(0, 3) }));
}
import { watch } from 'vue';
watch(certs, buildGroups, { immediate: false });

// 课程封面（渐变 + 图标）轮换
const COVERS = [
  { g: 'linear-gradient(135deg,#f6c8a8,#fbe3d0)' },
  { g: 'linear-gradient(135deg,#b9d4f2,#e2edfa)' },
  { g: 'linear-gradient(135deg,#c9e3d4,#e8f4ee)' },
  { g: 'linear-gradient(135deg,#d8cdec,#efe8fa)' },
  { g: 'linear-gradient(135deg,#f4d2cb,#fae8e4)' },
  { g: 'linear-gradient(135deg,#f2e3ac,#faf3d6)' },
  { g: 'linear-gradient(135deg,#b8e0ea,#e0f2f6)' },
  { g: 'linear-gradient(135deg,#e3c8e8,#f4e6f8)' },
];
function coverOf(i) { return COVERS[i % COVERS.length].g; }

const ROLE_CARDS = [
  { to: '/home', k: 'home.roleStudent', d: 'home.roleStudentD' },
  { to: '/teach', k: 'home.roleTeacher', d: 'home.roleTeacherD' },
  { to: '/school', k: 'home.roleAdmin', d: 'home.roleAdminD' },
  { to: '/employer', k: 'home.roleEmployer', d: 'home.roleEmployerD' },
];
</script>

<template>
  <div>
    <!-- 官方原图轮播（基线） -->
    <div class="hw-banner">
      <div class="track" :style="{ transform: `translateX(-${bannerIdx * 100}%)` }">
        <div v-for="(src, i) in BANNERS" :key="i" class="slide">
          <img :src="src" :loading="i === 0 ? 'eager' : 'lazy'" :alt="i === 0 ? '华为ICT学院新一代信息技术领域数字教材' : ''" />
        </div>
      </div>
      <div class="dots" role="tablist" aria-label="banner">
        <button v-for="i in BANNERS.length" :key="i" :class="{ on: bannerIdx === i - 1 }" role="tab"
          :aria-label="`banner ${i}`" @click="goBanner(i - 1)" />
      </div>
    </div>

    <div v-if="!data && !error" class="container-wide"><div class="skeleton" style="height:200px;margin:24px 0"></div></div>
    <ErrorBlock v-else-if="error" :message="$t('common.loading')" @retry="load" />

    <template v-if="data">
      <!-- 热门课程（基线：居中标题 + 复刻课程卡） -->
      <section class="hw-section" style="background: var(--gray-bg)">
        <div class="container-wide">
          <div class="hw-section-title" style="display:flex;align-items:baseline;justify-content:space-between">
            <div style="text-align:left">
              <h2>{{ t('home.hotSec') }}</h2>
              <p>{{ t('courses.sub') }}</p>
            </div>
            <router-link class="more" to="/courses">{{ t('home.allCourses') }}（{{ data.stats.courses }}）<ChevronRight :size="14" :stroke-width="1.8" style="vertical-align:-2px" /></router-link>
          </div>
          <div class="hw-course-grid">
            <router-link v-for="(c, i) in data.hotCourses" :key="c.id" :to="`/courses/${c.id}`" class="hw-course">
              <div class="cover" :style="{ background: coverOf(i) }">
                <span class="mooc">{{ t('courses.general') === '通识课' ? '慕课' : 'MOOC' }}</span>
                <span class="icoblock" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </span>
                <div class="mark">HUAWEI ACADEMY</div>
                <div class="meta">{{ c.track }}<br/>{{ c.level }} · {{ c.hours }} {{ t('common.hoursUnit') }}</div>
              </div>
              <div class="info">
                <div class="t" :title="c.title">{{ c.title }}</div>
                <div class="tip">
                  <span class="free">{{ t('courses.hot') === '最热' ? '免费' : 'Free' }}</span>
                  <span class="cnt">
                    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="5" cy="4.6" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M1.8 11.8c.5-1.9 1.7-2.8 3.2-2.8s2.7.9 3.2 2.8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="10" cy="5.4" r="1.6" stroke="currentColor" stroke-width="1.1"/><path d="M10.6 9.2c1.1.1 2 .8 2.4 2.2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>
                    <span class="num">{{ c.learners.toLocaleString() }}</span>
                  </span>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </section>

      <!-- 热门认证（基线：官方卡背景 + 金徽章 + 方向条目） -->
      <section v-if="CERT_GROUPS.length" class="hw-section" style="background: var(--surface)">
        <div class="container-wide">
          <div class="hw-section-title" style="display:flex;align-items:baseline;justify-content:space-between">
            <div style="text-align:left">
              <h2>{{ t('home.certSec') }}</h2>
              <p>{{ t('certs.sub').slice(0, 30) }}</p>
            </div>
            <router-link class="more" to="/certifications">{{ t('home.certAll') }}<ChevronRight :size="14" :stroke-width="1.8" style="vertical-align:-2px" /></router-link>
          </div>
          <div class="hw-cert-grid">
            <router-link v-for="g in CERT_GROUPS" :key="g.dir" to="/certifications" class="hw-cert">
              <span class="badge" aria-hidden="true">
                <svg viewBox="0 0 40 40" fill="none" style="width:40px;height:40px"><g fill="#c7000b"><path d="M20 5c2.4 2.8 2.6 6.4 1 9.2 3.4-1.2 7-.2 9 2.6-3.3 1.4-6.9.6-9.2-1.6 1.6 3.4.8 7.4-1.8 10.2-2.2-3-2.6-6.8-1.2-10-2.6 2-6.2 2.4-9.2.8 2.2-2.8 5.8-3.6 9-2.4C16.4 11.6 17 8 20 5z"/><circle cx="20" cy="35" r="1.6"/></g></svg>
              </span>
              <div class="items">
                <div v-for="n in g.names" :key="n">{{ n }}</div>
              </div>
              <span class="more">{{ t('certs.recommend') === '推荐课程' ? '了解更多>>' : 'Learn more >>' }}</span>
            </router-link>
          </div>
        </div>
      </section>

      <!-- 双选会（demo 核心能力，基线组件样式） -->
      <section class="hw-section" style="background: var(--gray-bg); padding-bottom: 24px">
        <div class="container-wide">
          <div class="hw-section-title" style="display:flex;align-items:baseline;justify-content:space-between">
            <div style="text-align:left">
              <h2>{{ t('home.fairSec') }}</h2>
              <p>{{ t('fairs.sub') }}</p>
            </div>
            <router-link class="more" to="/fairs">{{ t('home.allFairs') }}<ChevronRight :size="14" :stroke-width="1.8" style="vertical-align:-2px" /></router-link>
          </div>
          <router-link v-if="data.fair" :to="`/fairs/${data.fair.id}`" class="card card-hover" style="display:flex;align-items:center;gap:22px;padding:22px 26px">
            <div class="num" style="width:72px;height:76px;border-radius:var(--r-m);background:var(--accent-soft);color:var(--accent-deep);display:flex;flex-direction:column;align-items:center;justify-content:center;flex:none">
              <span style="font-size:12px;font-weight:600">{{ new Date(data.fair.fair_date).getMonth() + 1 }}月</span>
              <b style="font-size:30px;line-height:1">{{ new Date(data.fair.fair_date).getDate() }}</b>
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:var(--fs-h3);font-weight:600">{{ data.fair.name }}</div>
              <div class="caption" style="margin-top:6px">{{ data.fair.venue }} · {{ fmtDate(data.fair.fair_date) }}</div>
              <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                <span class="badge badge-red">{{ data.fair.companies_count }}{{ t('home.companies') }}</span>
                <span class="badge badge-gray">{{ data.fair.jobs_count }}{{ t('home.jobsCount') }}</span>
                <span class="badge badge-gray">{{ data.fair.booths }}{{ t('home.booths') }}</span>
              </div>
            </div>
            <Btn variant="primary" size="sm">{{ t('fairs.registerCta') }}</Btn>
          </router-link>
        </div>
      </section>

      <!-- 人才双选大图（基线官方素材） -->
      <section style="background: var(--surface); padding: 40px 0 64px">
        <div class="container-wide" style="text-align:center">
          <img class="hw-bridge" src="/assets/replica/talent-bridge.png" :alt="t('fairs.title')" loading="lazy" />
        </div>
      </section>

      <!-- 四端入口（基线卡片） -->
      <section class="hw-section" style="background: var(--gray-bg); padding-top: 48px">
        <div class="container-wide">
          <div class="hw-section-title">
            <h2>{{ t('home.rolesSec') }}</h2>
          </div>
          <div class="grid" style="grid-template-columns: repeat(4, 1fr); gap: 24px">
            <router-link v-for="r in ROLE_CARDS" :key="r.k" :to="r.to" class="card card-hover" style="padding:20px 22px">
              <div style="display:flex;align-items:center;gap:8px"><span class="sq-mark sm"></span><b style="font-size:var(--fs-h3)">{{ t(r.k) }}</b></div>
              <p class="muted" style="font-size:var(--fs-small);margin-top:10px;line-height:1.7">{{ t(r.d) }}</p>
            </router-link>
          </div>
        </div>
      </section>

      <!-- 成功案例（基线卡片） -->
      <section v-if="stories.length" class="hw-section" style="background: var(--surface)">
        <div class="container-wide">
          <div class="hw-section-title" style="display:flex;align-items:baseline;justify-content:space-between">
            <div style="text-align:left">
              <h2>{{ t('home.storiesSec') }}</h2>
              <p>I . C . The Future</p>
            </div>
            <router-link class="more" to="/stories">{{ t('home.allStories') }}<ChevronRight :size="14" :stroke-width="1.8" style="vertical-align:-2px" /></router-link>
          </div>
          <div class="grid" style="grid-template-columns: repeat(3, 1fr); gap: 24px">
            <router-link v-for="s in stories" :key="s.id" to="/stories" class="card card-hover" style="overflow:hidden">
              <div style="height:120px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:600"
                :style="{ background: ['linear-gradient(135deg,#3556c6,#7190e8)', 'linear-gradient(135deg,#b5491f,#e08a5a)', 'linear-gradient(135deg,#1f7a58,#58b58e)'][s.id % 3] }">
                {{ s.track }}
              </div>
              <div style="padding:14px 16px 16px">
                <b style="font-size:15px">{{ s.student_name }}</b>
                <p class="muted" style="font-size:var(--fs-small);margin-top:6px;line-height:1.7;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">「{{ s.quote }}」</p>
                <p class="caption" style="margin-top:8px;color:var(--success);font-weight:600">{{ s.outcome }}</p>
              </div>
            </router-link>
          </div>
        </div>
      </section>

      <!-- 平台动态（基线列表） -->
      <section class="hw-section" style="background: var(--gray-bg); padding-bottom: 72px">
        <div class="container">
          <div class="hw-section-title" style="display:flex;align-items:baseline;justify-content:space-between">
            <div style="text-align:left"><h2>{{ t('home.newsSec') }}</h2></div>
            <router-link class="more" to="/announcements">{{ t('home.allNews') }}<ChevronRight :size="14" :stroke-width="1.8" style="vertical-align:-2px" /></router-link>
          </div>
          <ul class="card" style="padding:8px 16px">
            <li v-for="a in data.announcements" :key="a.title" style="border-bottom:1px solid var(--line)">
              <router-link to="/announcements" style="display:flex;justify-content:space-between;align-items:center;padding:13px 0;gap:12px">
                <span style="display:flex;align-items:center;gap:12px;min-width:0">
                  <span class="badge badge-gray">{{ a.category }}</span>
                  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ a.title }}</span>
                </span>
                <span class="caption num">{{ fmtDate(a.published_at) }}</span>
              </router-link>
            </li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>
