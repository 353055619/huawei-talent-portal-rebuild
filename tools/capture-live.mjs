#!/usr/bin/env node
// 现网公开页批量抓取：整页截图 + 渲染后 DOM + 样式表 + 图片资源清单
// 用法: node tools/capture-live.mjs [name ...]   (只抓指定的页面)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/Users/godw/GodwGarage/sandbox/高校人才';
const OUT = path.join(ROOT, 'replica/captures');

// name, url, 抓取后的动作(clicks: [selector]) —— clicks 用于进入 SPA 子视图
const PAGES = [
  { name: 'portal-home', url: 'https://e.huawei.com/cn/talent/portal/#/', settle: 6000 },
  { name: 'learning', url: 'https://e.huawei.com/cn/talent/learning/#/ict-academy', settle: 8000 },
  { name: 'learning-all', url: 'https://e.huawei.com/cn/talent/learning/#/all-course', settle: 8000 },
  { name: 'cert', url: 'https://e.huawei.com/cn/talent/cert/#/careerCert', settle: 8000 },
  { name: 'ict-academy', url: 'https://e.huawei.com/cn/talent/ict-academy/#/home', settle: 8000 },
  { name: 'contest', url: 'https://e.huawei.com/cn/talent/ict-academy/#/ict-contest', settle: 8000 },
  { name: 'halp', url: 'https://e.huawei.com/cn/talent/halp/#/home?navType=halp', settle: 8000 },
  { name: 'stories', url: 'https://e.huawei.com/cn/talent/success-stories/#/home', settle: 8000 },
  { name: 'news', url: 'https://e.huawei.com/cn/talent/news/#/', settle: 8000 },
  // 轻量抓取（外部系统，仅视口截图，用于外链插卡背景）
  { name: 'ext-partner', url: 'https://partner.huawei.com/eplusweb/', settle: 8000, viewportOnly: true },
  { name: 'ext-elearning', url: 'https://elearning.huawei.com/cn/homepage', settle: 8000, viewportOnly: true },
];

const only = process.argv.slice(2);
const list = only.length ? PAGES.filter(p => only.includes(p.name)) : PAGES;

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  locale: 'zh-CN',
});
const page = await ctx.newPage();

for (const p of list) {
  const dir = path.join(OUT, p.name);
  fs.mkdirSync(dir, { recursive: true });
  process.stdout.write(`\n=== ${p.name} ${p.url}\n`);
  try {
    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(p.settle ?? 6000);
    // 尽量关掉 cookie 提示条（保持原样截图前先截一张带提示条的？—— 现网首页已复刻过 cookie 条，这里直接关）
    for (const sel of ['.cookie-close', '.cookies-close', '[class*=cookie] [class*=close]', '#cookie_close']) {
      const el = await page.$(sel);
      if (el) { try { await el.click({ timeout: 1500 }); await page.waitForTimeout(400); } catch {} }
    }
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    if (!p.viewportOnly) {
      await page.screenshot({ path: path.join(dir, 'full.png'), fullPage: true });
    }
    await page.screenshot({ path: path.join(dir, 'viewport.png') });

    if (!p.viewportOnly) {
      const html = await page.content();
      fs.writeFileSync(path.join(dir, 'dom.html'), html);

      // 收集样式表与图片资源
      const assets = await page.evaluate(() => {
        const styles = [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href);
        const imgs = [...document.querySelectorAll('img')].map(i => i.currentSrc || i.src).filter(Boolean);
        // 背景图
        const bgs = [];
        for (const el of document.querySelectorAll('*')) {
          const b = getComputedStyle(el).backgroundImage;
          if (b && b.includes('url(')) {
            const m = b.match(/url\(["']?([^"')]+)["']?\)/);
            if (m) bgs.push(m[1]);
          }
        }
        return { styles: [...new Set(styles)], imgs: [...new Set([...imgs, ...bgs])] };
      });
      fs.writeFileSync(path.join(dir, 'assets.json'), JSON.stringify(assets, null, 2));
      process.stdout.write(`    styles=${assets.styles.length} imgs=${assets.imgs.length}\n`);
    }
  } catch (e) {
    process.stdout.write(`    ERROR: ${e.message}\n`);
  }
}

// uniportal 登录页：从门户点「登录/注册」
if (!only.length || only.includes('uniportal-login')) {
  const dir = path.join(OUT, 'uniportal-login');
  fs.mkdirSync(dir, { recursive: true });
  process.stdout.write(`\n=== uniportal-login (via portal click)\n`);
  try {
    await page.goto('https://e.huawei.com/cn/talent/portal/#/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);
    const popup = page.waitForEvent('popup', { timeout: 15000 }).catch(() => null);
    // 顶栏登录/注册
    const login = await page.$('text=登录/注册').catch(() => null)
      ?? await page.$('text=登录').catch(() => null);
    if (login) {
      await login.click({ timeout: 3000 });
      let target = await popup;
      if (!target) { await page.waitForTimeout(4000); target = page; }
      else await target.setViewportSize?.({ width: 1920, height: 1080 }).catch(() => {});
      await target.waitForTimeout(5000);
      await target.screenshot({ path: path.join(dir, 'viewport.png') });
      fs.writeFileSync(path.join(dir, 'url.txt'), target.url());
      fs.writeFileSync(path.join(dir, 'dom.html'), await target.content());
      process.stdout.write(`    landed: ${target.url()}\n`);
    } else {
      process.stdout.write('    login button not found\n');
    }
  } catch (e) {
    process.stdout.write(`    ERROR: ${e.message}\n`);
  }
}

await browser.close();
process.stdout.write('\nDONE\n');
