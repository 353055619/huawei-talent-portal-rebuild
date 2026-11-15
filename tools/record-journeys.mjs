#!/usr/bin/env node
// 录制用户旅程演示视频：驱动 journey/player.html 自动播放并录屏
// 前置: replica 目录需经 HTTP 服务（python3 -m http.server 8930 -d replica）
// 用法: node record-journeys.mjs [J1 J2 ...] [--mp4]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = '/Users/godw/GodwGarage/sandbox/高校人才';
const OUT = path.join(ROOT, '原型/videos');
fs.mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2);
const doMp4 = args.includes('--mp4');
const ids = args.filter(a => !a.startsWith('--'));
const list = ids.length ? ids : ['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7'];

const BASE = 'http://127.0.0.1:8930';
const browser = await chromium.launch({ headless: true });

for (const id of list) {
  const t0 = Date.now();
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: path.join(OUT, '.raw'), size: { width: 1920, height: 1080 } },
  });
  const page = await ctx.newPage();
  process.stdout.write(`\n=== ${id} recording...`);
  try {
    await page.goto(`${BASE}/journey/player.html?j=${id}`, { waitUntil: 'load', timeout: 30000 });
    // 等 DONE（片尾后 title 变 DONE），上限 3 分钟
    let title = '';
    for (let i = 0; i < 360; i++) {
      await page.waitForTimeout(500);
      title = await page.title();
      if (title === 'DONE') break;
    }
    await page.waitForTimeout(600);
    const video = page.video();
    const file = await video.path();
    await ctx.close();
    const dst = path.join(OUT, `${id}.webm`);
    fs.copyFileSync(file, dst);
    fs.rmSync(file, { force: true });
    const sec = ((Date.now() - t0) / 1000).toFixed(1);
    process.stdout.write(` done in ${sec}s → ${dst} (${fs.statSync(dst).size} bytes, title=${title})`);
    if (doMp4) await toMp4(id);
  } catch (e) {
    process.stdout.write(` ERROR: ${e.message}`);
    await ctx.close().catch(() => {});
  }
}
await browser.close();
process.stdout.write('\nDONE\n');

function toMp4(id) {
  const ff = findFfmpeg();
  const src = path.join(OUT, `${id}.webm`);
  const dst = path.join(OUT, `${id}.mp4`);
  execSync(`"${ff}" -y -i "${src}" -c:v libx264 -pix_fmt yuv420p -crf 20 -preset medium -movflags +faststart "${dst}"`, { stdio: 'ignore' });
  process.stdout.write(` | mp4 ${(fs.statSync(dst).size / 1e6).toFixed(1)}MB`);
}
function findFfmpeg() {
  for (const p of ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg']) if (fs.existsSync(p)) return p;
  const cached = fs.readdirSync(`${process.env.HOME}/Library/Caches/ms-playwright`).filter(d => d.startsWith('ffmpeg')).sort().pop();
  if (cached) return `${process.env.HOME}/Library/Caches/ms-playwright/${cached}/ffmpeg-mac-arm64`;
  throw new Error('ffmpeg not found');
}
