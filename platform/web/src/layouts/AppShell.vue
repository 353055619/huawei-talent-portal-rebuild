<script setup>
// 门户壳 v2：换用复刻基线（三层顶栏：Cookie 条 / 黑工具条 / 白主导航）。
// 功能保留：全站搜索下拉、消息未读、中/EN 切换、账号菜单（多角色）、移动端汉堡。
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Search, ChevronDown, Menu, X, LogOut, LayoutGrid, UserRound } from 'lucide-vue-next';
import { useAuth } from '../stores/auth';
import { api, getToken } from '../api';
import { setLocale } from '../i18n';

const { t } = useI18n();
const auth = useAuth();
const route = useRoute();
const router = useRouter();

const NAV = computed(() => [
  { to: '/', label: t('nav.home'), exact: true },
  { to: '/courses', label: t('nav.courses') },
  { to: '/certifications', label: t('nav.certs') },
  { to: '/contests', label: t('nav.contests') },
  { to: '/fairs', label: t('nav.fairs') },
  { to: '/jobs', label: t('nav.jobs') },
  { to: '/academies', label: t('nav.academies') },
  { to: '/stories', label: t('nav.stories') },
]);

const cookieOpen = ref(!localStorage.getItem('hw_cookie_ok'));
function closeCookie() {
  cookieOpen.value = false;
  localStorage.setItem('hw_cookie_ok', '1');
}

const mobileOpen = ref(false);
const accountOpen = ref(false);
const unread = ref(0);

const workbenchTo = computed(() => {
  if (!auth.isLogged) return null;
  const r = auth.activeRole;
  if (r === 'teacher') return '/teach';
  if (r === 'school_admin') return '/school';
  if (r === 'iasc') return '/iasc';
  if (r === 'employer') return '/employer';
  return '/home';
});

async function refreshUnread() {
  if (!getToken()) { unread.value = 0; return; }
  try {
    const { unread: u } = await api.get('/my/notifications');
    unread.value = (u.todo || 0) + (u.message || 0);
  } catch { /* 静默 */ }
}
onMounted(refreshUnread);
watch(() => auth.user?.id, refreshUnread);

// 全站搜索
const kw = ref('');
const results = ref(null);
let timer = null;
function onSearch(v) {
  kw.value = v;
  clearTimeout(timer);
  if (!v.trim()) { results.value = null; return; }
  timer = setTimeout(async () => {
    try { results.value = await api.get('/search', { q: v.trim() }); }
    catch { results.value = null; }
  }, 260);
}
function go(to) {
  results.value = null;
  kw.value = '';
  router.push(to);
}
function submitSearch() {
  if (kw.value.trim()) go({ path: '/courses', query: { q: kw.value.trim() } });
}
const GROUP_LABELS = computed(() => ({
  courses: t('search.groupCourses'), jobs: t('search.groupJobs'),
  certs: t('search.groupCerts'), fairs: t('search.groupFairs'),
}));

function switchLang(l) { setLocale(l); }
function logout() {
  auth.logout();
  accountOpen.value = false;
  router.push('/');
}
function isActive(n) {
  return n.exact ? route.path === n.to : route.path.startsWith(n.to);
}
</script>

<template>
  <div class="shell">
    <a class="skip" href="#main">{{ t('nav.skipMain') }}</a>

    <!-- Cookie 提示条（基线） -->
    <div v-if="cookieOpen" class="hw-cookie">
      <div class="container-wide">
        本站点使用Cookies，继续浏览表示您同意我们使用Cookies。
        <a class="red" href="#" @click.prevent>{{ t('footer.announcements') === 'Announcements' ? 'Cookies & privacy policy' : 'Cookies和隐私政策' }}</a>
        <button class="close" aria-label="close" @click="closeCookie">✕</button>
      </div>
    </div>

    <!-- 黑色工具条（基线） -->
    <div class="hw-topbar">
      <div class="container-wide">
        <span class="site-name">华为人才在线</span>
        <div class="tools">
          <router-link v-if="auth.isLogged" to="/my/messages" class="tool" :aria-label="`${t('my.msgsTitle')} ${unread}`">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 3.5h12v7H8.5L5 13.5v-3H2v-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
            <span class="msg-badge num">{{ unread > 99 ? '99+' : unread }}</span>
          </router-link>
          <span class="tool hw-lang" role="group" :aria-label="t('nav.switchRoleHint')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.2"/><path d="M2 8h12M8 1.8c-2.2 2.4-2.2 10 0 12.4M8 1.8c2.2 2.4 2.2 10 0 12.4" stroke="currentColor" stroke-width="1.1"/></svg>
            <button :class="{ on: $i18n.locale === 'zh' }" :aria-pressed="$i18n.locale === 'zh'" @click="switchLang('zh')">中</button>
            <button :class="{ on: $i18n.locale === 'en' }" :aria-pressed="$i18n.locale === 'en'" @click="switchLang('en')">EN</button>
          </span>
          <router-link v-if="!auth.isLogged" class="tool" :to="{ path: '/login', query: { redirect: route.fullPath } }">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="5.4" r="2.6" stroke="currentColor" stroke-width="1.3"/><path d="M2.8 13.6c.8-2.6 2.8-4 5.2-4s4.4 1.4 5.2 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            {{ t('nav.login') }}/{{ t('nav.register') }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- 白色主导航（基线） -->
    <header class="hw-mainnav">
      <div class="container-wide">
        <router-link to="/" class="hw-logo" :aria-label="t('brand')">
          <span class="petal" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <span class="word">HUAWEI</span>
        </router-link>

        <nav class="hw-nav" :aria-label="t('nav.home')">
          <router-link v-for="n in NAV" :key="n.to" :to="n.to" :class="{ on: isActive(n) }">{{ n.label }}</router-link>
        </nav>

        <div class="hw-search" role="search">
          <Search :size="15" :stroke-width="1.8" aria-hidden="true" />
          <input v-model="kw" type="search" :placeholder="t('nav.searchPlaceholder')" aria-label="search"
            @input="onSearch($event.target.value)" @keydown.enter="submitSearch" />
          <div v-if="results" class="drop">
            <template v-for="(list, key) in { courses: results.courses, jobs: results.jobs, certs: results.certs, fairs: results.fairs }" :key="key">
              <template v-if="list?.length">
                <div class="sg">{{ GROUP_LABELS[key] }}</div>
                <button v-for="it in list" :key="it.id" class="sr" @click="go(key === 'courses' ? `/courses/${it.id}` : key === 'jobs' ? `/jobs/${it.id}` : key === 'certs' ? `/certifications/${it.id}` : `/fairs/${it.id}`)">
                  {{ it.title || it.name }}
                  <span class="caption">{{ it.track || it.company_name || it.level || it.city }}</span>
                </button>
              </template>
            </template>
            <div v-if="!results.courses?.length && !results.jobs?.length && !results.certs?.length && !results.fairs?.length" class="sg">
              {{ t('search.none', { q: kw }) }}
            </div>
          </div>
        </div>

        <div v-if="auth.isLogged" class="hw-account" @mouseleave="accountOpen = false">
          <button class="btn-face" :aria-expanded="accountOpen" @click="accountOpen = !accountOpen" @mouseover="accountOpen = true">
            <span class="avatar num" aria-hidden="true">{{ auth.user.name.slice(0, 1) }}</span>
            <span class="hide-md">{{ auth.user.name }}</span>
            <ChevronDown :size="14" :stroke-width="1.8" aria-hidden="true" />
          </button>
          <div v-if="accountOpen" class="menu" role="menu">
            <div class="head">
              <div style="font-weight:600">{{ auth.user.name }}</div>
              <div class="caption">{{ auth.user.email }}</div>
              <div v-if="auth.roles.length" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
                <button v-for="r in auth.roles" :key="r" class="role-chip" :class="{ on: auth.activeRole === r }"
                  @click="auth.switchRole(r); accountOpen = false; router.push(r === 'teacher' ? '/teach' : r === 'school_admin' ? '/school' : r === 'iasc' ? '/iasc' : r === 'employer' ? '/employer' : '/home')">
                  {{ auth.labelOf(r) }}
                </button>
              </div>
            </div>
            <router-link v-if="workbenchTo" class="menu-i" :to="workbenchTo" @click="accountOpen = false"><LayoutGrid :size="15" :stroke-width="1.7" />{{ t('nav.myWorkbench') }}</router-link>
            <router-link class="menu-i" to="/my/profile" @click="accountOpen = false"><UserRound :size="15" :stroke-width="1.7" />{{ t('nav.profile') }}</router-link>
            <button class="menu-i" role="menuitem" @click="logout"><LogOut :size="15" :stroke-width="1.7" />{{ t('nav.logout') }}</button>
          </div>
        </div>

        <button v-if="!auth.isLogged" class="btn btn-primary btn-sm" style="flex:none" :to="''" @click="router.push({ path: '/register' })">{{ t('nav.register') }}</button>

        <button class="icon-btn hw-burger" :aria-expanded="mobileOpen" aria-label="menu" @click="mobileOpen = !mobileOpen" style="flex:none">
          <X v-if="mobileOpen" :size="20" :stroke-width="1.7" />
          <Menu v-else :size="20" :stroke-width="1.7" />
        </button>
      </div>

      <div v-if="mobileOpen" class="mobile-nav">
        <router-link v-for="n in NAV" :key="n.to" :to="n.to" class="m-link" @click="mobileOpen = false">{{ n.label }}</router-link>
        <div class="m-row">
          <template v-if="auth.isLogged">
            <router-link :to="workbenchTo || '/home'" class="m-link" @click="mobileOpen = false">{{ t('nav.myWorkbench') }}</router-link>
            <button class="m-link" @click="logout">{{ t('nav.logout') }}</button>
          </template>
          <template v-else>
            <router-link to="/login" class="m-link" @click="mobileOpen = false">{{ t('nav.login') }}</router-link>
            <router-link to="/register" class="m-link" @click="mobileOpen = false">{{ t('nav.register') }}</router-link>
          </template>
        </div>
      </div>
    </header>

    <main id="main" class="main">
      <router-view />
    </main>

    <!-- 页脚（基线四列） -->
    <footer class="hw-footer">
      <div class="container-wide cols">
        <div class="cols-left">
          <ul>
            <li>{{ t('footer.business') }}</li>
            <li><router-link to="/courses">{{ t('nav.courses') }}</router-link></li>
            <li><router-link to="/certifications">{{ t('nav.certs') }}</router-link></li>
            <li><router-link to="/contests">{{ t('nav.contests') }}</router-link></li>
          </ul>
          <ul>
            <li>{{ t('footer.employment') }}</li>
            <li><router-link to="/fairs">{{ t('nav.fairs') }}</router-link></li>
            <li><router-link to="/jobs">{{ t('nav.jobs') }}</router-link></li>
            <li><router-link to="/jobs?kind=实习">{{ t('footer.intern') }}</router-link></li>
          </ul>
          <ul>
            <li>{{ t('footer.school') }}</li>
            <li><router-link to="/academies">{{ t('nav.academies') }}</router-link></li>
            <li><router-link to="/apply/school">{{ t('footer.onboarding') }}</router-link></li>
            <li><router-link to="/stories">{{ t('nav.stories') }}</router-link></li>
          </ul>
          <ul>
            <li>{{ t('workbench.iascGroup') }}</li>
            <li><router-link to="/announcements">{{ t('footer.announcements') }}</router-link></li>
            <li><router-link to="/home">{{ t('nav.myWorkbench') }}</router-link></li>
          </ul>
        </div>
        <div style="text-align:center">
          <div style="width:92px;height:92px;border:1px solid var(--line);display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(7,1fr);gap:1px;padding:5px" aria-hidden="true">
            <i v-for="(c, i) in 49" :key="i" :style="{ background: (i*7+i*3)%5 < 2 ? 'var(--ink)' : 'transparent' }"></i>
          </div>
          <p class="caption" style="margin-top:8px">{{ t('brand') }}</p>
        </div>
      </div>
      <div class="bottom">
        <div class="container-wide">
          <span>{{ t('footer.copyright') }}</span>
          <span class="flinks">
            <router-link to="/announcements">{{ t('footer.announcements') }}</router-link>
          </span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.shell { min-height: 100dvh; display: flex; flex-direction: column; }
.skip { position: absolute; left: -9999px; top: 0; z-index: 999; background: var(--inverse-bg); color: var(--inverse-fg); padding: 8px 16px; }
.skip:focus { left: 8px; top: 8px; }
.main { flex: 1; }

.mobile-nav { display: none; padding: 12px 20px 16px; border-top: 1px solid var(--line); background: var(--surface); }
.m-link { display: block; padding: 12px 4px; font-size: 16px; border-bottom: 1px solid var(--line); color: var(--fg-2); }
.m-row { display: flex; gap: 20px; }
@media (max-width: 1000px) {
  .mobile-nav { display: block; }
}
</style>
