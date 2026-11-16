#!/usr/bin/env node
// 导航下拉测试：hover 出菜单、子项跳转、死点子项不跳
import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:8930';
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message.slice(0, 80)));

await page.goto(`${BASE}/index.html`, { waitUntil: 'load' });
await page.waitForTimeout(700);

// 1) 每个导航的下拉项数
const menus = await page.evaluate(() => [...document.querySelectorAll('.nav-item')]
  .map(n => `${n.textContent.trim().slice(0, 6)}:${n.querySelector('.nav-drop') ? n.querySelectorAll('.nav-drop-item').length : '无'}`).join(' | '));
console.log('menus:', menus);

// 2) hover 学习 → 下拉显示
await page.hover('.nav-item:has(.caret) >> nth=0');
await page.waitForTimeout(400);
const vis = await page.evaluate(() => {
  const d = document.querySelector('.nav-item .nav-drop');
  return d ? getComputedStyle(d).display : 'no-drop';
});
console.log('hover 学习 display:', vis);

// 3) 点子项 查找ICT学院 → find-academy.html（先 hover 华为ICT学院 使其下拉可见）
const ictNav = await page.evaluateHandle(() => [...document.querySelectorAll('.nav-item')].find(n => n.textContent.includes('华为ICT学院')));
await ictNav.asElement().hover();
await page.waitForTimeout(400);
const item = await page.evaluateHandle(() => [...document.querySelectorAll('.nav-drop-item')].find(e => e.textContent === '查找ICT学院'));
await item.asElement().click();
await page.waitForTimeout(900);
console.log('click 查找ICT学院 →', page.url().split('/').pop());

// 4) 死点子项 书籍 → 不跳转（hover 学习）
await page.goto(`${BASE}/index.html`, { waitUntil: 'load' });
await page.waitForTimeout(600);
await page.hover('.nav-item:has(.caret) >> nth=0');
await page.waitForTimeout(400);
const dead = await page.evaluateHandle(() => [...document.querySelectorAll('.nav-drop-item')].find(e => e.textContent === '书籍'));
await dead.asElement().click();
await page.waitForTimeout(900);
console.log('click 书籍(死点) →', page.url().split('/').pop());

console.log('jsErr:', errs.length ? errs.join(';') : 0);
await browser.close();
