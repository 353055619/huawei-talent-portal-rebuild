#!/usr/bin/env node
// 全站健康检查：逐页打开 replica/*.html（file://），收集 JS 错误、失效本地资源、页面高度
// 用法: node tools/health-check.mjs [name ...]   (不传参 = 全部页面)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 仓库根 = tools/ 上一级（任意 checkout 均可运行）
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REP = path.join(ROOT, 'replica');

const args = process.argv.slice(2);
const names = args.length
  ? args
  : fs.readdirSync(REP).filter(f => f.endsWith('.html') && !f.startsWith('_')).map(f => f.replace(/\.html$/, ''));

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'zh-CN' });
const page = await ctx.newPage();

let bad = 0;
for (const name of names) {
  const file = path.join(REP, name + '.html');
  if (!fs.existsSync(file)) { console.log(`${name}: NO FILE`); bad++; continue; }
  const errs = [], badReqs = [];
  const onErr = e => errs.push(e.message.slice(0, 120));
  const onReqFail = r => { if (r.url().startsWith('file://')) badReqs.push(r.url().split('/').pop()); };
  page.on('pageerror', onErr); page.on('requestfailed', onReqFail);
  try {
    await page.goto('file://' + file, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(1200);
  } catch (e) {
    console.log(`${name}: LOAD FAIL ${e.message.slice(0, 80)}`); bad++;
    page.off('pageerror', onErr); page.off('requestfailed', onReqFail);
    continue;
  }
  page.off('pageerror', onErr); page.off('requestfailed', onReqFail);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const flag = (errs.length || badReqs.length) ? '⚠' : '✓';
  if (errs.length || badReqs.length) bad++;
  console.log(`${flag} ${name}: h=${h} jsErr=${errs.length}${errs.length ? ' | ' + errs.join(' ; ') : ''}${badReqs.length ? ' | missing: ' + [...new Set(badReqs)].join(',') : ''}`);
}
await browser.close();
console.log(bad ? `PROBLEMS: ${bad}` : 'ALL OK');
process.exit(bad ? 1 : 0);
