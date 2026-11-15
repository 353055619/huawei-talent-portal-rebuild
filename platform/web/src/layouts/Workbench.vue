<script setup>
// 工作台壳：常驻左侧导航（修复现网“usercenter 子页面丢失左侧菜单”硬伤）。
// 侧栏项按账号全部角色展示，当前角色高亮；顶部面包屑由 PageHead 承担。
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  LayoutGrid, BookOpen, GraduationCap, Ticket, CalendarCheck, Award, Trophy,
  Users, Briefcase, FolderKanban, Bell, UserRound, ChevronLeft,
  Presentation, PieChart, UserCog, TicketCheck, TrendingUp, Search, Factory, ClipboardList,
} from 'lucide-vue-next';
import { useAuth } from '../stores/auth';

const { t } = useI18n();
const auth = useAuth();
const route = useRoute();

const SECTIONS = computed(() => [
  {
    key: 'student', label: t('workbench.studentGroup'), roles: ['student', 'platform_admin'],
    items: [
      { to: '/home', label: t('workbench.overview'), icon: LayoutGrid },
      { to: '/my/courses', label: t('workbench.myCourses'), icon: BookOpen },
      { to: '/my/classes', label: t('workbench.myClasses'), icon: GraduationCap },
      { to: '/my/applications', label: t('workbench.progressCenter'), icon: FolderKanban },
      { to: '/my/vouchers', label: t('workbench.vouchers'), icon: Ticket },
      { to: '/my/exams', label: t('workbench.myExams'), icon: CalendarCheck },
      { to: '/my/certificates', label: t('workbench.myCerts'), icon: Award },
      { to: '/my/contests', label: t('workbench.myContests'), icon: Trophy },
      { to: '/my/fairs', label: t('workbench.myFairs'), icon: Users },
    ],
  },
  {
    key: 'teacher', label: t('workbench.teacherGroup'), roles: ['teacher', 'platform_admin'],
    items: [{ to: '/teach', label: t('workbench.teachOverview'), icon: Presentation }],
  },
  {
    key: 'school', label: t('workbench.schoolGroup'), roles: ['school_admin', 'platform_admin', 'iasc'],
    items: [
      { to: '/school', label: t('workbench.dash'), icon: PieChart },
      { to: '/school/members', label: t('workbench.members'), icon: UserCog },
      { to: '/school/quota', label: t('workbench.quota'), icon: TicketCheck },
      { to: '/school/outcomes', label: t('workbench.outcomes'), icon: TrendingUp },
    ],
  },
  {
    key: 'employer', label: t('workbench.employerGroup'), roles: ['employer', 'platform_admin'],
    items: [
      { to: '/employer', label: t('workbench.jobMgmt'), icon: Briefcase },
      { to: '/employer/pipeline', label: t('workbench.pipeline'), icon: ClipboardList },
      { to: '/employer/talents', label: t('workbench.talentSearch'), icon: Search },
    ],
  },
  {
    key: 'iasc', label: t('workbench.iascGroup'), roles: ['iasc', 'platform_admin'],
    items: [{ to: '/iasc', label: t('workbench.opsDash'), icon: Factory }],
  },
  {
    key: 'common', label: t('workbench.commonGroup'), roles: ['*'],
    items: [
      { to: '/my/messages', label: t('my.msgsTitle'), icon: Bell },
      { to: '/my/profile', label: t('my.profileTitle'), icon: UserRound },
    ],
  },
].filter((s) => s.roles.includes('*') || s.roles.some((r) => auth.roles.includes(r))));

function isActive(to) {
  if (to === '/home') return route.path === '/home';
  return route.path === to || route.path.startsWith(to + '/');
}
</script>

<template>
  <div class="wb">
    <header class="wb-top">
      <div class="container-wide wb-bar">
        <router-link to="/" class="brand" aria-label="home">
          <span class="sq-mark" aria-hidden="true"></span>
          <span class="t">华为高校人才</span>
        </router-link>
        <router-link to="/" class="back">
          <ChevronLeft :size="15" :stroke-width="1.8" />{{ t('nav.backPortal') }}
        </router-link>
      </div>
    </header>

    <div class="container-wide wb-body">
      <aside class="side" :aria-label="t('nav.myWorkbench')">
        <section v-for="s in SECTIONS" :key="s.key" class="sec">
          <div class="sec-t">{{ s.label }}</div>
          <router-link
            v-for="it in s.items" :key="it.to" :to="it.to"
            class="s-item" :class="{ on: isActive(it.to) }"
            :aria-current="isActive(it.to) ? 'page' : undefined"
          >
            <component :is="it.icon" :size="16" :stroke-width="1.7" aria-hidden="true" />
            <span>{{ it.label }}</span>
          </router-link>
        </section>
        <div class="side-foot caption">
          {{ auth.user?.name }} · {{ auth.roleLabel || t('workbench.noRole') }}
        </div>
      </aside>

      <main class="wb-main page-enter">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.wb { min-height: 100dvh; background: var(--bg); }
.wb-top { background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: var(--z-nav); }
.wb-bar { display: flex; align-items: center; justify-content: space-between; height: 54px; }
.brand { display: flex; align-items: center; gap: 9px; font-weight: 600; }
.back { display: flex; align-items: center; gap: 2px; color: var(--muted); font-size: var(--fs-small); }
.back:hover { color: var(--fg); }

.wb-body { display: flex; gap: var(--sp-6); padding: var(--sp-6) var(--sp-5) var(--sp-16); align-items: flex-start; }

.side {
  width: 216px; flex: none; position: sticky; top: 78px;
  display: flex; flex-direction: column; gap: var(--sp-5);
}
.sec { display: flex; flex-direction: column; gap: 2px; }
.sec-t {
  font-size: var(--fs-caption); color: var(--faint); font-weight: 600;
  padding: 0 10px 6px; letter-spacing: 0.02em;
}
.s-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: var(--r-s);
  color: var(--fg-2); font-size: var(--fs-body);
  transition: background var(--t-fast), color var(--t-fast);
}
.s-item:hover { background: var(--surface-3); color: var(--fg); }
.s-item.on {
  background: var(--surface); color: var(--fg); font-weight: 600;
  box-shadow: var(--shadow-1);
  border-left: none;
}
.s-item.on svg { color: var(--accent-ink); }
.side-foot { padding: var(--sp-3) 10px; border-top: 1px solid var(--border); margin-top: var(--sp-2); }

.wb-main { flex: 1; min-width: 0; }

@media (max-width: 900px) {
  .wb-body { flex-direction: column; }
  .side { width: 100%; position: static; flex-direction: row; flex-wrap: wrap; gap: var(--sp-4); }
  .sec { min-width: 140px; }
}
</style>
