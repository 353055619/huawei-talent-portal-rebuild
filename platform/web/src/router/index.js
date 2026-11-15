import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../stores/auth';
import { setPageTitleKey } from '../i18n';

// 路由名 → i18n 标题 key（切语言时 document.title 同步刷新）
const TITLE_KEYS = {
  home: 'nav.home', courses: 'nav.courses', 'course-detail': 'courses.title',
  certs: 'nav.certs', 'cert-detail': 'certs.title', contests: 'nav.contests',
  fairs: 'nav.fairs', 'fair-detail': 'fairs.title', jobs: 'nav.jobs', 'job-detail': 'jobs.title',
  academies: 'nav.academies', stories: 'nav.stories',
  onboarding: 'onboarding.crumbsApply', 'onboarding-mine': 'onboarding.mineTitle',
  announcements: 'announcements.title', login: 'login.title', register: 'register.title',
  'my-home': 'workbench.overview', 'my-courses': 'my.coursesTitle', learn: 'courses.title',
  'my-classes': 'my.classesTitle', 'my-vouchers': 'my.vouchersTitle', 'voucher-apply': 'my.voucherApplyTitle',
  'my-exams': 'my.examsTitle', 'my-certs': 'my.certsTitle', 'my-contests': 'my.contestsTitle',
  'my-fairs': 'my.fairsTitle', 'my-applications': 'my.appsTitle', profile: 'my.profileTitle',
  messages: 'my.msgsTitle', teach: 'teach.title', 'teach-class': 'teach.roster',
  school: 'workbench.dash', 'school-members': 'school.membersTitle', 'school-quota': 'school.quotaTitle',
  'school-outcomes': 'school.outcomesTitle', employer: 'employer.title',
  'employer-pipeline': 'employer.pipelineTitle', 'employer-talents': 'employer.talentsTitle',
  iasc: 'iasc.title', NotFound: 'notfound.title',
};

// 布局
import AppShell from '../layouts/AppShell.vue';
import Workbench from '../layouts/Workbench.vue';

const T = (title) => (to) => `${title ? title + ' · ' : ''}华为高校人才平台`;

const routes = [
  {
    path: '/login', component: () => import('../views/LoginView.vue'),
    meta: { title: '登录', guestOnly: true },
  },
  {
    path: '/register', component: () => import('../views/RegisterView.vue'),
    meta: { title: '注册', guestOnly: true },
  },
  {
    path: '/', component: AppShell, children: [
      { path: '', name: 'home', component: () => import('../views/HomeView.vue'), meta: { title: '' } },
      { path: 'courses', name: 'courses', component: () => import('../views/CoursesView.vue'), meta: { title: '学习' } },
      { path: 'courses/:id', name: 'course-detail', component: () => import('../views/CourseDetailView.vue'), meta: { title: '课程详情' } },
      { path: 'certifications', name: 'certs', component: () => import('../views/CertsView.vue'), meta: { title: '认证' } },
      { path: 'certifications/:id', name: 'cert-detail', component: () => import('../views/CertDetailView.vue'), meta: { title: '认证详情' } },
      { path: 'contests', name: 'contests', component: () => import('../views/ContestView.vue'), meta: { title: 'ICT 大赛' } },
      { path: 'fairs', name: 'fairs', component: () => import('../views/FairsView.vue'), meta: { title: '双选会' } },
      { path: 'fairs/:id', name: 'fair-detail', component: () => import('../views/FairDetailView.vue'), meta: { title: '双选会详情' } },
      { path: 'jobs', name: 'jobs', component: () => import('../views/JobsView.vue'), meta: { title: '岗位' } },
      { path: 'jobs/:id', name: 'job-detail', component: () => import('../views/JobDetailView.vue'), meta: { title: '岗位详情' } },
      { path: 'academies', name: 'academies', component: () => import('../views/AcademiesView.vue'), meta: { title: 'ICT 学院' } },
      { path: 'stories', name: 'stories', component: () => import('../views/StoriesView.vue'), meta: { title: '成功案例' } },
      { path: 'apply/school', name: 'onboarding', component: () => import('../views/OnboardingWizard.vue'), meta: { title: '学院入驻', auth: true } },
      { path: 'onboarding/mine', name: 'onboarding-mine', component: () => import('../views/OnboardingMine.vue'), meta: { title: '入驻进度', auth: true } },
      { path: 'announcements', name: 'announcements', component: () => import('../views/AnnouncementsView.vue'), meta: { title: '平台公告' } },
    ],
  },
  // ---- 登录后的工作台（常驻侧边导航，修复现网“子页面丢失左侧菜单”） ----
  { path: '/home', component: Workbench, meta: { auth: true }, children: [
    { path: '', name: 'my-home', component: () => import('../views/my/MyHome.vue'), meta: { title: '我的工作台' } },
  ]},
  { path: '/my', component: Workbench, meta: { auth: true }, children: [
    { path: 'courses', name: 'my-courses', component: () => import('../views/my/MyCourses.vue'), meta: { title: '我的课程' } },
    { path: 'courses/:id/learn', name: 'learn', component: () => import('../views/my/LearnPlayer.vue'), meta: { title: '学习器' } },
    { path: 'classes', name: 'my-classes', component: () => import('../views/my/MyClasses.vue'), meta: { title: '我的班级' } },
    { path: 'vouchers', name: 'my-vouchers', component: () => import('../views/my/MyVouchers.vue'), meta: { title: '我的券包' } },
    { path: 'vouchers/apply', name: 'voucher-apply', component: () => import('../views/my/VoucherApply.vue'), meta: { title: '考券申请' } },
    { path: 'exams', name: 'my-exams', component: () => import('../views/my/MyExams.vue'), meta: { title: '我的考试' } },
    { path: 'certificates', name: 'my-certs', component: () => import('../views/my/MyCertificates.vue'), meta: { title: '我的证书' } },
    { path: 'contests', name: 'my-contests', component: () => import('../views/my/MyContests.vue'), meta: { title: '我的大赛' } },
    { path: 'fairs', name: 'my-fairs', component: () => import('../views/my/MyFairs.vue'), meta: { title: '我的双选会' } },
    { path: 'applications', name: 'my-applications', component: () => import('../views/my/MyApplications.vue'), meta: { title: '进度中心' } },
    { path: 'profile', name: 'profile', component: () => import('../views/my/ProfileView.vue'), meta: { title: '个人中心' } },
    { path: 'messages', name: 'messages', component: () => import('../views/my/MessagesView.vue'), meta: { title: '消息中心' } },
  ]},
  { path: '/teach', component: Workbench, meta: { auth: true, roles: ['teacher', 'school_admin', 'platform_admin'] }, children: [
    { path: '', name: 'teach', component: () => import('../views/teach/TeachHome.vue'), meta: { title: '教学工作台' } },
    { path: 'classes/:id', name: 'teach-class', component: () => import('../views/teach/TeachClass.vue'), meta: { title: '班级管理' } },
  ]},
  { path: '/school', component: Workbench, meta: { auth: true, roles: ['school_admin', 'platform_admin', 'iasc'] }, children: [
    { path: '', name: 'school', component: () => import('../views/school/SchoolDashboard.vue'), meta: { title: '学院看板' } },
    { path: 'members', name: 'school-members', component: () => import('../views/school/SchoolMembers.vue'), meta: { title: '成员管理' } },
    { path: 'quota', name: 'school-quota', component: () => import('../views/school/SchoolQuota.vue'), meta: { title: '考券配额' } },
    { path: 'outcomes', name: 'school-outcomes', component: () => import('../views/school/SchoolOutcomes.vue'), meta: { title: '就业去向' } },
  ]},
  { path: '/employer', component: Workbench, meta: { auth: true, roles: ['employer', 'platform_admin'] }, children: [
    { path: '', name: 'employer', component: () => import('../views/employer/EmployerHome.vue'), meta: { title: '企业工作台' } },
    { path: 'pipeline', name: 'employer-pipeline', component: () => import('../views/employer/EmployerPipeline.vue'), meta: { title: '候选人管线' } },
    { path: 'talents', name: 'employer-talents', component: () => import('../views/employer/EmployerTalents.vue'), meta: { title: '人才检索' } },
  ]},
  { path: '/iasc', component: Workbench, meta: { auth: true, roles: ['iasc', 'platform_admin'] }, children: [
    { path: '', name: 'iasc', component: () => import('../views/iasc/IascDashboard.vue'), meta: { title: 'IASC 运营' } },
  ]},
  { path: '/:pathMatch(.*)*', component: AppShell, children: [
    { path: '', component: () => import('../views/NotFound.vue'), meta: { title: '页面不存在' } },
  ]},
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    return saved || { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const auth = useAuth();
  if (!auth.loaded) await auth.fetchMe();
  setPageTitleKey(TITLE_KEYS[to.name]);

  if (to.meta.auth && !auth.isLogged) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  if (to.meta.roles && !to.meta.roles.some((r) => auth.roles.includes(r))) {
    return auth.isLogged ? { path: '/home' } : { path: '/login', query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && auth.isLogged) {
    return { path: '/home' };
  }
  return true;
});

export default router;
