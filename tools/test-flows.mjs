#!/usr/bin/env node
// 功能全流程用例：注册→登录→报名→我的课程 / 教师开班→我的班级 / 加入班级 / 退出登录
// 前置: node tools/server.mjs（默认 8930）
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'http://127.0.0.1:8930';
const STAMP = Date.now().toString().slice(-6);
const STU = `hw_test_s_${STAMP}`, TEA = `hw_test_t_${STAMP}`;
let pass = 0, fail = 0;
function ok(cond, label, extra) { cond ? pass++ : fail++; console.log(`${cond ? '✓' : '✗'} ${label}${cond ? '' : ' — ' + (extra || '')}`); }

const browser = await chromium.launch({ headless: true });

async function login(page, acc) {
  await page.goto(`${BASE}/login.html`, { waitUntil: 'load' });
  await page.fill('.field.first input', acc);
  await page.fill('.field.pwd input', 'demo123456');
  await page.click('.login-btn');
  await page.waitForURL('**/uc-home.html', { timeout: 8000 });
}

/* 1. 注册学生 → 自动登录 → 顶栏账号态 */
{
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/login-register.html`, { waitUntil: 'load' });
  await p.fill('.field.first input', STU);
  await p.fill('.field.pwd input', 'demo123456');
  await p.fill('.field.pwd2 input', 'demo123456');
  await p.click('.login-btn');
  await p.waitForURL('**/uc-home.html', { timeout: 8000 });
  await p.waitForTimeout(700);
  const chip = await p.evaluate(() => document.querySelector('.uc-account span:last-child')?.textContent);
  ok(chip === STU, '注册→自动登录→uc 顶栏显示新账号', `chip=${chip}`);

  /* 2. 退出 → 重新登录 */
  const lg = p.locator('.app-logout').first();
  if (await lg.count()) { await lg.click(); await p.waitForURL('**/index.html', { timeout: 8000 }); }
  else { await p.goto(`${BASE}/index.html`); }
  await p.waitForTimeout(600);
  const backToLogin = await p.evaluate(() => [...document.querySelectorAll('.tool')].some(t => t.textContent.includes('登录/注册')));
  ok(backToLogin, '退出后门户顶栏恢复 登录/注册');
  await login(p, STU);
  ok(p.url().endsWith('uc-home.html'), '重新登录成功');

  /* 3. 学习→课程卡→课程详情→去学习→报名→我的课程 */
  await p.goto(`${BASE}/learning.html`, { waitUntil: 'load' });
  await p.waitForTimeout(600);
  await p.click('.course-image-box >> nth=0');
  await p.waitForURL('**/course-detail.html', { timeout: 8000 });
  await p.waitForTimeout(700);
  await p.click('.btn-go-study');
  await p.waitForURL('**/uc-mycourse.html', { timeout: 8000 });
  await p.waitForTimeout(800);
  const myList = await p.evaluate(() => document.querySelectorAll('.crs-list .new-card-course').length);
  ok(myList >= 1, '报名后我的课程实时列表有数据', `items=${myList}`);

  /* 4. 加入班级（教师班 AC8826） */
  await p.goto(`${BASE}/uc-myclass-list.html`, { waitUntil: 'load' });
  await p.fill('input[placeholder="请输入班级邀请码"]', 'AC8826');
  await p.evaluate(() => [...document.querySelectorAll('.m-btn')].find(b => b.textContent.trim() === '加入').click());
  await p.waitForTimeout(1200);
  const joined = await p.evaluate(() => document.body.textContent.includes('已加入'));
  ok(joined, '学生凭邀请码加入演示班级 AC8826');
  await ctx.close();
}

/* 5. 注册教师 → 开班 → 我的班级实时块 */
let classCode = '';
{
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/login-register.html`, { waitUntil: 'load' });
  await p.fill('.field.first input', TEA);
  await p.fill('.field.pwd input', 'demo123456');
  await p.fill('.field.pwd2 input', 'demo123456');
  await p.selectOption('.field.role select', 'teacher');
  await p.click('.login-btn');
  await p.waitForURL('**/uc-home.html', { timeout: 8000 });
  await p.goto(`${BASE}/course-detail.html`, { waitUntil: 'load' });
  await p.waitForTimeout(600);
  await p.click('.btn-open-class');
  await p.waitForSelector('.app-modal', { timeout: 5000 });
  await p.fill('.app-kname', `测试班级 ${STAMP}`);
  await p.click('.app-mok');
  await p.waitForURL('**/uc-myclass-list.html', { timeout: 8000 });
  await p.waitForTimeout(900);
  const box = await p.evaluate(() => {
    const b = [...document.querySelectorAll('div')].find(d => d.textContent.includes('我的班级（实时）'));
    return b ? b.textContent : '';
  });
  classCode = (box.match(/邀请码\s*([A-Z0-9]{6})/) || [])[1] || '';
  ok(box.includes(`测试班级 ${STAMP}`) && !!classCode, '教师开班→我的班级实时块含新班级与邀请码', `box=${box.slice(0, 80)} code=${classCode}`);
  /* 退出登录（清理上下文状态） */
  const lg = p.locator('.app-logout').first();
  if (await lg.count()) { await lg.click(); await p.waitForURL('**/index.html', { timeout: 8000 }); }
  await ctx.close();
}

/* 6. 另一学生用新班级码加入（跨账号闭环） */
if (classCode) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await login(p, 'hw_demo_student_01');
  await p.goto(`${BASE}/uc-myclass-list.html`, { waitUntil: 'load' });
  await p.fill('input[placeholder="请输入班级邀请码"]', classCode);
  await p.evaluate(() => [...document.querySelectorAll('.m-btn')].find(b => b.textContent.trim() === '加入').click());
  await p.waitForTimeout(1100);
  const joined2 = await p.evaluate(() => document.body.textContent.includes('已加入'));
  ok(joined2, `演示学生用新班邀请码 ${classCode} 加入成功`);
  await ctx.close();
}

/* 7. 静态降级：file:// 打开无 JS 错误、无功能层痕迹 */
{
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(ROOT, 'replica', 'index.html'), { waitUntil: 'load' });
  await p.waitForTimeout(900);
  ok(errs.length === 0, 'file:// 静态打开 index 无 JS 错误', errs.join(';'));
  await ctx.close();
}

await browser.close();
console.log(`\n${fail ? 'FAILURES: ' + fail : 'ALL PASS'} (${pass} passed)`);
process.exit(fail ? 1 : 0);
