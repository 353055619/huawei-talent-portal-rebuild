#!/usr/bin/env node
// 导航接线点击流测试：验证 nav-wiring.js 的站内跳转
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:8930';
const CASES = [
  { start: 'index.html', sel: '.nav-item', text: '学习', expect: 'learning.html' },
  { start: 'index.html', sel: '.topbar-right .tool', text: '登录/注册', expect: 'login.html' },
  { start: 'login.html', sel: '.login-btn', expect: 'uc-home.html' },
  { start: 'uc-home.html', sel: '.uc-cards .item', text: '我的课程', expect: 'uc-mycourse.html' },
  { start: 'learning.html', sel: '.course-image-box', expect: 'course-detail.html' },
  { start: 'course-detail.html', sel: '.cd-crumb a[data-nav="learning.html"]', expect: 'learning.html' },
  { start: 'learning.html', sel: '.learning-tab', text: '全部课程', expect: 'learning-all.html' },
  { start: 'index.html', sel: '.com-footer-content-left li', text: '华为认证', expect: 'cert.html' },
  { start: 'index.html', sel: '.hw-logo', expect: 'index.html' },
  { start: 'ict-academy.html', sel: '.join-btn', text: '立即注册', expect: 'ict-academy.html' }, // 外域入口=死点
];

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message.slice(0, 80)));
let fail = 0;
for (const c of CASES) {
  try {
    await page.goto(`${BASE}/${c.start}`, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    let el;
    if (c.text) {
      const h = await page.evaluateHandle(({ sel, text }) =>
        [...document.querySelectorAll(sel)].find(e => (e.textContent || '').trim().replace(/\s+/g, '').startsWith(text.replace(/\s+/g, ''))) || null, { sel: c.sel, text: c.text });
      el = h.asElement();
    } else el = await page.$(c.sel);
    if (!el) { console.log(`✗ ${c.start} 找不到 ${c.sel}${c.text ? `[${c.text}]` : ''}`); fail++; continue; }
    await el.click();
    await page.waitForTimeout(900);
    const end = page.url().split('/').pop().split('?')[0];
    const ok = end === c.expect;
    if (!ok) fail++;
    console.log(`${ok ? '✓' : '✗'} ${c.start} 点[${c.text || c.sel}] → ${end}${ok ? '' : ` (期望 ${c.expect})`}`);
  } catch (e) { console.log(`✗ ${c.start} ${e.message.slice(0, 60)}`); fail++; }
}
console.log(errs.length ? `JS错误: ${errs.join(' ; ')}` : 'jsErr: 0');
await browser.close();
process.exit(fail ? 1 : 0);
