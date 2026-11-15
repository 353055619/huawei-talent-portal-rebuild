import { defineStore } from 'pinia';
import { api, getToken, setToken } from '../api';

const ROLE_LABELS = {
  student: '学生', teacher: '教师', school_admin: '学院管理', iasc: 'IASC 运营',
  employer: '企业招聘', platform_admin: '平台运营',
};

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null,
    loaded: false,
    activeRole: localStorage.getItem('hw_talent_role') || null,
  }),
  getters: {
    isLogged: (s) => !!s.user,
    roles: (s) => s.user?.roles || [],
    roleLabel: (s) => (s.activeRole ? ROLE_LABELS[s.activeRole] : ''),
  },
  actions: {
    labelOf(role) { return ROLE_LABELS[role] || role; },
    async fetchMe() {
      if (!getToken()) { this.user = null; this.loaded = true; return; }
      try {
        const { user } = await api.get('/auth/me');
        this.user = user;
        if (!user) setToken(null);
        if (user && user.roles.length) {
          if (!this.activeRole || !user.roles.includes(this.activeRole)) {
            this.activeRole = user.roles[0];
            localStorage.setItem('hw_talent_role', this.activeRole);
          }
        } else {
          this.activeRole = null;
        }
      } catch {
        this.user = null;
      }
      this.loaded = true;
    },
    async login(email, password) {
      const { token, user } = await api.post('/auth/login', { email, password });
      setToken(token);
      this.user = user;
      this.activeRole = user.roles[0] || null;
      localStorage.setItem('hw_talent_role', this.activeRole || '');
      return user;
    },
    async register(payload) {
      const { token, user } = await api.post('/auth/register', payload);
      setToken(token);
      this.user = user;
      this.activeRole = user.roles[0] || null;
      return user;
    },
    switchRole(role) {
      if (this.user?.roles.includes(role)) {
        this.activeRole = role;
        localStorage.setItem('hw_talent_role', role);
      }
    },
    logout() {
      setToken(null);
      this.user = null;
      this.activeRole = null;
      localStorage.removeItem('hw_talent_role');
    },
  },
});
