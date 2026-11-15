import { createI18n } from 'vue-i18n';
import zh from './zh.js';
import en from './en.js';

const STORAGE_KEY = 'hw_talent_lang';

export function initialLocale() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'zh' || saved === 'en') return saved;
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'zh';
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'zh',
  messages: { zh, en },
});

export function setLocale(locale) {
  i18n.global.locale.value = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
  document.title = `${i18n.global.t(currentTitleKey)} · ${i18n.global.t('brand')}`;
}

// 路由标题联动：router guard 写入当前标题 key，切语言时同步刷新
let currentTitleKey = 'nav.home';
export function setPageTitleKey(key) {
  currentTitleKey = key || 'nav.home';
  document.title = `${i18n.global.t(currentTitleKey)} · ${i18n.global.t('brand')}`;
}
export function getTitleKey() { return currentTitleKey; }
