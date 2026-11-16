#!/usr/bin/env node
// 复刻页 vs 现网截图 并排对比图生成
// 用法: node compare.mjs [pageName ...]   pageName 为 replica/<name>.html
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// 仓库根 = tools/ 上一级（任意 checkout 均可运行）
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REP = path.join(ROOT, 'replica');
const CMP = path.join(ROOT, 'replica/compare');
fs.mkdirSync(CMP, { recursive: true });

// 复刻页 -> 现网 captures 目录名
const MAP = {
  'index': 'portal-home',
  'learning': 'learning',
  'learning-all': 'learning-all',
  'course-detail': 'learning-course-detail',
  'cert': 'cert',
  'ict-academy': 'ict-academy',
  'contest': 'contest',
  'halp': 'halp',
  'stories': 'stories',
  'news': 'news',
  'find-academy': 'find-academy',
  'search-results': 'portal-search-shuangxuan',
  'login': 'uniportal-login',
  'uc-home': 'uc-home',
  'uc-mycourse': 'uc-mycourse',
  'uc-myclass-list': 'uc-myclass-list',
  'uc-mycomp': 'uc-mycomp',
  'uc-mycoupons': 'uc-mycoupons',
  'uc-mynews': 'uc-mynews',
  'uc-mycert': 'uc-mycert',
  'uc-myexam': 'uc-myexam',
  'uc-myinfo': 'uc-myinfo',
  'uc-realinfo': 'uc-realinfo',
  'uc-voucher-app': 'uc-voucher-app',
};

const args = process.argv.slice(2);
const names = args.length ? args : Object.keys(MAP).filter(n => fs.existsSync(path.join(REP, n + '.html')));

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'zh-CN' });
const page = await ctx.newPage();

for (const name of names) {
  const capName = MAP[name];
  const capPng = path.join(REP, 'captures', capName, 'full.png');
  const capVp = path.join(REP, 'captures', capName, 'viewport.png');
  const livePng = fs.existsSync(capPng) ? capPng : capVp;
  if (!fs.existsSync(livePng)) { console.log(`${name}: no live capture`); continue; }
  const repFile = path.join(REP, name + '.html');
  if (!fs.existsSync(repFile)) { console.log(`${name}: no replica page`); continue; }
  try {
    await page.goto('file://' + repFile, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(1600);
    // 关 cookie 条，与抓取口径一致
    await page.evaluate(() => { const c = document.querySelector('.cookie-close'); if (c) c.click(); });
    await page.waitForTimeout(200);
    const repPng = path.join(CMP, name + '-rep.png');
    await page.screenshot({ path: repPng, fullPage: true });
    // 拼并排图（用 sips 缩放到同宽 900 再纵向拼接）
    const out = path.join(CMP, name + '-cmp.png');
    const t1 = `/tmp/${name}-a.png`, t2 = `/tmp/${name}-b.png`;
    await page.evaluate(() => window.scrollY);
    execSync(`sips -Z 900 "${livePng}" --out "${t1}" >/dev/null 2>&1; sips -Z 900 "${repPng}" --out "${t2}" >/dev/null 2>&1`);
    const h1 = execSync(`sips -g pixelHeight "${t1}" | awk '/pixelHeight/{print $2}'`).toString().trim();
    const h2 = execSync(`sips -g pixelHeight "${t2}" | awk '/pixelHeight/{print $2}'`).toString().trim();
    const H = Math.max(+h1 || 0, +h2 || 0);
    // 拼并排图（python PIL）
    execSync(`python3 -c "
from PIL import Image, ImageDraw
a = Image.open('${t1}').convert('RGB')
b = Image.open('${t2}').convert('RGB')
H = max(a.height, b.height) + 60
W = max(a.width, b.width) + 20
canvas = Image.new('RGB', (W * 2 + 20, H), '#ffffff')
d = ImageDraw.Draw(canvas)
canvas.paste(a, (10, 40)); canvas.paste(b, (W + 10, 40))
d.text((10, 8), 'LIVE (${capName})', fill='#b3261e')
d.text((W + 10, 8), 'REPLICA (${name})', fill='#1d7a40')
canvas.save('${out}')
" 2>&1`);
    console.log(`${name}: ${out}`);
  } catch (e) {
    console.log(`${name}: ERROR ${e.message.slice(0, 100)}`);
  }
}
await browser.close();

console.log('DONE');
