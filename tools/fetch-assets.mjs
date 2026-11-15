#!/usr/bin/env node
// 从 captures/*/assets.json 下载图片素材到 replica/assets/<page>/，建立映射 index
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = '/Users/godw/GodwGarage/sandbox/高校人才';
const CAP = path.join(ROOT, 'replica/captures');
const AST = path.join(ROOT, 'replica/assets');
fs.mkdirSync(AST, { recursive: true });

const idxPath = path.join(AST, 'index.json');
const index = fs.existsSync(idxPath) ? JSON.parse(fs.readFileSync(idxPath, 'utf8')) : {};

for (const page of fs.readdirSync(CAP)) {
  const aj = path.join(CAP, page, 'assets.json');
  if (!fs.existsSync(aj)) continue;
  const { imgs } = JSON.parse(fs.readFileSync(aj, 'utf8'));
  const dir = path.join(AST, page);
  fs.mkdirSync(dir, { recursive: true });
  index[page] = index[page] || {};
  let n = 0;
  for (const url of imgs) {
    if (!/^https?:/.test(url)) continue;
    const h = crypto.createHash('md5').update(url).digest('hex').slice(0, 10);
    if (index[page][url]) continue;
    const ext = (url.match(/\.(png|jpe?g|webp|svg|gif)(\?|$)/i)?.[1] || 'png').toLowerCase().replace('jpeg', 'jpg');
    const file = `${h}.${ext}`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://e.huawei.com/' } });
      if (!res.ok) throw new Error(res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1024) throw new Error('too small ' + buf.length);
      fs.writeFileSync(path.join(dir, file), buf);
      index[page][url] = `assets/${page}/${file}`;
      n++;
    } catch (e) { index[page][url] = null; }
  }
  process.stdout.write(`${page}: +${n} (total ${Object.values(index[page]).filter(Boolean).length}/${imgs.length})\n`);
}
fs.writeFileSync(path.join(AST, 'index.json'), JSON.stringify(index, null, 2));
console.log('DONE');
