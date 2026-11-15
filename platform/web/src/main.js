import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { i18n, setLocale } from './i18n';
import { getToken } from './api';
import './styles/tokens.css';
import './styles/base.css';
import './styles/hw-baseline.css';
import './styles/hw-override.css';

const app = createApp(App);
// 全局错误出口：渲染错误直接可见（避免静默白屏）
app.config.errorHandler = (err, _inst, info) => {
  console.error(err);
  const el = document.createElement('pre');
  el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#b3261e;color:#fff;padding:10px 14px;font-size:12px;white-space:pre-wrap;margin:0';
  el.textContent = `[${info}] ${err?.message || err}\n${err?.stack?.split('\n').slice(1, 4).join('\n') || ''}`;
  document.body.appendChild(el);
};
app.use(i18n);
app.use(createPinia());
app.use(router);

// 恢复登录态后再挂载，避免首屏闪烁（router.beforeEach 也会兜底 fetchMe）
async function boot() {
  if (getToken()) {
    try {
      const { useAuth } = await import('./stores/auth');
      await useAuth().fetchMe();
    } catch { /* 保持未登录 */ }
  }
  setLocale(i18n.global.locale.value);
  app.mount('#app');
}
boot();
