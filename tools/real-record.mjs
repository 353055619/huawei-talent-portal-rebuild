#!/usr/bin/env node
/* 真实操作录制器：Playwright 驱动真实页面 + 真实后端（tools/server.mjs @8930）
 * 页面 UI 层（光标/字幕/插卡/片头片尾/进度条）经 addInitScript 注入，页面文件零改动。
 * 时间线定义在 tools/rj/J*.js（每旅程一文件），由本文件聚合并逐条录制。
 * 用法: node tools/real-record.mjs [J1 J2 ...]     (缺省全部)
 * 产物: 原型/videos/<id>.webm → <id>.mp4（-r 30 恒定帧率 crf20）+ <id>-poster.jpg（-ss 8）
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RJ = path.join(ROOT, 'tools', 'rj');
const OUT = path.join(ROOT, '原型', 'videos');
const DB = path.join(ROOT, 'tools', '.server-db.json');
const DB_BAK = DB + '.record-bak';
const BASE = 'http://127.0.0.1:8930';
const OVERLAY = fs.readFileSync(path.join(RJ, '_overlay.js'), 'utf8');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, '.raw'), { recursive: true });

const args = process.argv.slice(2);
const want = args.filter(a => /^[JN]\d+$/.test(a));

/* ---- 聚合时间线 ---- */
const ALL = {};
for (const f of fs.readdirSync(RJ).filter(f => /^J\d+\.mjs$/.test(f)).sort()) {
  try { const j = (await import('file://' + path.join(RJ, f))).default; ALL[j.id] = j; }
  catch (e) { console.log(`⚠ ${f}: ${e.message.split('\n')[0]}`); }
}
const list = want.length ? want.filter(id => ALL[id]) : Object.keys(ALL);
if (!list.length) { console.log('no journeys (want:', want.join(',') || 'all', 'have:', Object.keys(ALL).join(','), ')'); process.exit(1); }

/* ---- 页面侧 UI 请求桥 ---- */
function makeUI(page) {
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const ui = {
    page,
    async wait(ms) { await page.waitForTimeout(ms); },
    async go(p, settle = 900) { await page.goto(BASE + '/' + p.replace(/^\//, ''), { waitUntil: 'load', timeout: 30000 }); await page.waitForTimeout(settle); },
    async url(glob, timeout = 9000) { await page.waitForURL(glob, { timeout }); await page.waitForTimeout(500); },
    async loc(sel, text) {
      let r = await ev(({ sel, text }) => window.__realUI.locate(sel, text), { sel, text });
      if (!r) return null;
      if (r.top < 40 || r.top + r.h > 1040) { await page.waitForTimeout(750); r = await ev(({ sel, text }) => window.__realUI.locate(sel, text), { sel, text }); }
      return r;
    },
    async move(x, y, steps) { await page.mouse.move(x, y, { steps: steps || 18 }); await page.waitForTimeout(430); },
    /* 复合动作：定位→平滑移光标→(输入/点击)→停留。opts: text/type/enter/click/dwell/focus */
    async act(sel, o = {}) {
      const c = await cookieKick(page);
      const r = await ui.loc(sel, o.text);
      if (!r) { console.log(`   ⚠ miss ${sel}${o.text ? '[' + o.text + ']' : ''}`); await page.waitForTimeout(o.dwell || 1000); return false; }
      if (o.focus) ev(r => window.__realUI.focusBox(r, o?.dwell || 1600) && 0, r).catch(() => {});
      await ui.move(r.x, r.y, Math.min(42, Math.max(14, Math.round(Math.hypot(r.x, r.y) / 34))));
      if (o.type != null) {
        await page.mouse.click(r.x, r.y); await page.waitForTimeout(260);
        await page.keyboard.type(String(o.type), { delay: 85 });
        if (o.enter) await page.waitForTimeout(220).then(() => page.keyboard.press('Enter'));
      } else if (o.click !== false) {
        await page.mouse.click(r.x, r.y);
      }
      await page.waitForTimeout(o.dwell != null ? o.dwell : 900);
      return true;
    },
    async hover(sel, text, dwell = 480) {
      const r = await ui.loc(sel, text);
      if (!r) { console.log(`   ⚠ hover-miss ${sel}${text ? '[' + text + ']' : ''}`); return false; }
      await ui.move(r.x, r.y, 22);
      await page.waitForTimeout(dwell);
      return true;
    },
    async card(cfg) { await ev(cfg => window.__realUI.interstitial(cfg), cfg); },
    async scrollBy(dy) { await ev(dy => window.__realUI.scrollBy(dy), dy); },
    /* 登录（真实表单输入）；先退出已登录态 */
    async loginAs(account, password = 'demo123456') {
      await ui.go('login.html', 700);
      const c = await cookieKick(page);
      if (c) await page.waitForTimeout(300);
      await ui.act('.field.first input', { type: account, dwell: 350 });
      await ui.act('.field.pwd input', { type: password, dwell: 350 });
      await page.mouse.click(...(await center(page, '.login-btn')));
      await ui.url('**/uc-home.html');
    },
    async logout() {
      const r = await ui.loc('.app-logout');
      if (r) { await ui.move(r.x, r.y); await page.mouse.click(r.x, r.y); await ui.url('**/index.html'); }
    },
  };
  return ui;
}
async function center(page, sel) {
  const r = await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return null; const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel);
  return r || [960, 540];
}
/* cookie 条真实关闭（点 ✕，出现一次点一次） */
async function cookieKick(page) {
  try {
    return await page.evaluate(() => {
      const b = document.querySelector('.cookie-close');
      if (!b) return false;
      const r = b.getBoundingClientRect();
      if (!r.width) return false;
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const fire = (t) => { b.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, clientX: x, clientY: y })); };
      ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(fire);
      return true;
    });
  } catch { return false; }
}

/* ---- 录制一条 ---- */
async function recordOne(browser, j) {
  const t0 = Date.now();
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: path.join(OUT, '.raw'), size: { width: 1920, height: 1080 } },
  });
  await ctx.addInitScript({ content: OVERLAY });
  const page = await ctx.newPage();
  const ui = makeUI(page);
  const errs = [];
  page.on('pageerror', e => errs.push(e.message.slice(0, 80)));
  process.stdout.write(`\n=== ${j.id} ${j.name}`);
  try {
    await ui.go(j.start || 'index.html', 1000);
    await page.evaluate(j => window.__realUI.intro(j), { name: j.name, persona: j.persona, summary: j.summary });
    const steps = j.steps || [];
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      await page.evaluate(r => window.__realUI.setProgress(r), i / steps.length);
      if (s.card) { await ui.card({ ...s.card, no: i + 1 }); continue; }
      await page.evaluate(({ no, s }) => window.__realUI.setCaption(no, s), { no: i + 1, s: { title: s.caption, detail: s.detail, flag: s.flag, break_: !!s.break } });
      await page.waitForTimeout(380);
      if (s.run) await s.run(page, ui);
      await page.waitForTimeout(s.dwell != null ? s.dwell : 1300);
      if (process.env.RJ_DEBUG) {
        const st = await page.evaluate(() => ({ shown: !!document.querySelector('.ru-caption.show'), url: location.pathname })).catch(() => ({ shown: '?', url: 'gone' }));
        process.stdout.write(`\n   [dbg] step${i + 1} caption=${st.shown} @${String(st.url).split('/').pop()}`);
      }
      await page.evaluate(() => window.__realUI.hideCaption());
      await page.waitForTimeout(240);
    }
    await page.evaluate(r => window.__realUI.setProgress(1), 1);
    await page.evaluate(j => window.__realUI.outro(j), { name: j.name, outro: j.outro });
    await page.evaluate(() => { document.title = 'DONE'; });
    for (let i = 0; i < 300 && (await page.title()) !== 'DONE'; i++) await page.waitForTimeout(400);
    await page.waitForTimeout(500);
    const video = page.video();
    const file = await video.path();
    await ctx.close();
    const webm = path.join(OUT, `${j.id}.webm`);
    fs.copyFileSync(file, webm); fs.rmSync(file, { force: true });
    toMp4(j.id);
    makePoster(j.id);
    const sec = ((Date.now() - t0) / 1000).toFixed(1);
    process.stdout.write(` ✓ ${sec}s${errs.length ? ' jsErr=' + errs.length : ''}`);
    return true;
  } catch (e) {
    process.stdout.write(` ✗ ${e.message.split('\n')[0].slice(0, 90)}`);
    await ctx.close().catch(() => {});
    return false;
  }
}
function toMp4(id) {
  const ff = findFfmpeg();
  execSync(`"${ff}" -y -i "${path.join(OUT, id + '.webm')}" -r 30 -c:v libx264 -pix_fmt yuv420p -crf 20 -preset medium -movflags +faststart "${path.join(OUT, id + '.mp4')}"`, { stdio: 'ignore' });
}
function makePoster(id) {
  const ff = findFfmpeg();
  try { execSync(`"${ff}" -y -ss 8 -i "${path.join(OUT, id + '.mp4')}" -frames:v 1 -q:v 3 "${path.join(OUT, id + '-poster.jpg')}"`, { stdio: 'ignore' }); } catch {}
}
function findFfmpeg() {
  for (const p of ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg']) if (fs.existsSync(p)) return p;
  const dirs = fs.readdirSync(`${process.env.HOME}/Library/Caches/ms-playwright`).filter(d => d.startsWith('ffmpeg')).sort().pop();
  if (dirs) return `${process.env.HOME}/Library/Caches/ms-playwright/${dirs}/ffmpeg-mac`;
  throw new Error('ffmpeg not found');
}

/* ---- db 备份/恢复（不打扰用户数据） ---- */
const hadDb = fs.existsSync(DB);
if (hadDb) fs.copyFileSync(DB, DB_BAK);
if (!hadDb) fs.rmSync(DB, { force: true }); // 无库时删掉让 server 重新播种

const browser = await chromium.launch({ headless: true });
let ok = 0;
for (const id of list) { if (await recordOne(browser, ALL[id])) ok++; }
await browser.close();

if (hadDb) fs.copyFileSync(DB_BAK, DB); else fs.rmSync(DB, { force: true });
fs.rmSync(DB_BAK, { force: true });
console.log(`\nDONE ${ok}/${list.length}`);
process.exit(ok === list.length ? 0 : 1);
