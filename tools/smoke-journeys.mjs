#!/usr/bin/env node
// 冒烟测试：逐条播放 journey/player.html，结束后读取 window.missLog（选择器未命中清单）
// 用法: node tools/smoke-journeys.mjs [J1 J2 ...]   前置: 8930 端口服务 replica/
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'http://127.0.0.1:8930';
const args = process.argv.slice(2);
const ids = args.length ? args : ['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7'];

const browser = await chromium.launch({ headless: true });
let totalMiss = 0;
for (const id of ids) {
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.slice(0, 100)));
  try {
    await page.goto(`${BASE}/journey/player.html?j=${id}`, { waitUntil: 'load', timeout: 30000 });
    let title = '';
    for (let i = 0; i < 360; i++) {  // 上限 3 分钟
      await page.waitForTimeout(500);
      title = await page.title();
      if (title === 'DONE') break;
    }
    const misses = await page.evaluate(() => window.missLog || []);
    totalMiss += misses.length;
    console.log(`${title === 'DONE' ? '✓' : '✗ TIMEOUT'} ${id}: miss=${misses.length} jsErr=${errs.length}` +
      (misses.length ? '\n   ' + misses.map(m => `step${m.step} ${m.where} ${m.sel}${m.text ? ` [${m.text}]` : ''}`).join('\n   ') : '') +
      (errs.length ? '\n   JS: ' + errs.join(' ; ') : ''));
  } catch (e) {
    console.log(`✗ ${id}: ${e.message.slice(0, 100)}`);
  }
  await page.close();
}
await browser.close();
console.log(totalMiss ? `MISSES: ${totalMiss}` : 'ALL HIT');
process.exit(totalMiss ? 1 : 0);
