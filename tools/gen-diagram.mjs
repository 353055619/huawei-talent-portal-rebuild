// 生成《华为人才在线功能模块图》单文件 HTML（数据内嵌自 survey/*.json）
// 用法：node tools/gen-diagram.mjs  →  原型/华为人才在线功能模块图.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const modules = JSON.parse(fs.readFileSync(path.join(root, 'survey/modules-combined.json'), 'utf8'));
const journeys = JSON.parse(fs.readFileSync(path.join(root, 'survey/journeys.json'), 'utf8'));

const STATUS = {
  verified: ['现网在线', 'ok'],
  '现网在线': ['现网在线', 'ok'],
  online: ['现网在线', 'ok'],
  live: ['现网在线', 'ok'],
  external: ['外链系统', 'ext'],
  '外链系统': ['外链系统', 'ext'],
  blank: ['空白页', 'bad'],
  '空白页': ['空白页', 'bad'],
  broken: ['断档/异常', 'bad'],
  断档: ['断档/异常', 'bad'],
  inferred: ['推断(inferred)', 'inf'],
  'copy-only': ['仅宣传文案', 'copy'],
};
function stCls(s) {
  const k = String(s || 'verified').toLowerCase();
  for (const key of [k, String(s || '')]) if (STATUS[key]) return STATUS[key];
  if (k.includes('待') || k.includes('待验')) return ['待验证', 'inf'];
  return [s || '现网在线', 'ok'];
}

const totalFeatures = modules.platforms.reduce((s, p) => s + p.featureCount, 0);
const totalModules = modules.platforms.reduce((s, p) => s + p.modules.length, 0);
const totalSteps = journeys.journeys.reduce((s, j) => s + j.steps.length, 0);

const DATA = {
  platforms: modules.platforms.map(p => ({
    platform: p.platform, site: p.site, featureCount: p.featureCount,
    modules: p.modules.map(m => ({
      id: m.id, name: m.name, path: m.path, desc: m.desc, status: m.status,
      features: m.features.map(f => ({ id: f.id, name: f.name, path: f.path, desc: f.desc, status: f.status })),
    })),
  })),
  journeys: journeys.journeys,
  stats: { m: totalModules, f: totalFeatures, j: journeys.journeys.length, s: totalSteps },
};

const html = `<!doctype html>
<html lang="zh-CN" data-zcode-design>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>华为人才在线 · 功能模块图</title>
<style>
:root {
  --hw-red: #c7000b; --hw-red-press: #a50009;
  --ink: #000; --text: #333; --text-2: #595959; --text-3: #666; --faint: #999;
  --line: #e5e5e5; --page: #f7f8fa; --gray: #f2f3f5; --white: #fff;
  --ok: #1d7a40; --ok-bg: #e9f4ec; --bad: #b3261e; --bad-bg: #faecea;
  --ext: #2f4e8f; --ext-bg: #ecf1f9; --inf: #935d00; --inf-bg: #faf1dc; --copy: #777; --copy-bg: #f0f0f0;
  --font: 'PingFang SC','HarmonyOS Sans SC','Microsoft YaHei','Source Han Sans SC',sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font); background: var(--page); color: var(--text); font-size: 14px; line-height: 1.6; }
button { font: inherit; border: none; background: none; cursor: pointer; color: inherit; }
ul { list-style: none; }
:focus-visible { outline: 2px solid var(--hw-red); outline-offset: 2px; }

.topbar { background: var(--ink); color: #fff; }
.topbar .wrap { max-width: 1360px; margin: 0 auto; padding: 0 24px; height: 44px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.topbar .name { font-size: 14px; }
.topbar .stats { font-size: 12px; color: rgba(255,255,255,.7); font-variant-numeric: tabular-nums; }

.mode-tabs { background: var(--white); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 50; }
.mode-tabs .wrap { max-width: 1360px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; gap: 28px; height: 56px; }
.mode-tabs h1 { font-size: 18px; color: var(--ink); margin-right: 8px; }
.mtab { font-size: 15px; color: var(--text-2); padding: 4px 0; border-bottom: 2px solid transparent; }
.mtab.on { color: var(--hw-red); font-weight: 600; border-bottom-color: var(--hw-red); }
.searchbox { margin-left: auto; display: flex; align-items: center; gap: 8px; border: 1px solid #d9d9d9; height: 36px; padding: 0 10px; width: 240px; }
.searchbox input { border: none; outline: none; flex: 1; font-size: 13px; background: transparent; }
.searchbox svg { color: var(--hw-red); flex: none; }

.wrap { max-width: 1360px; margin: 0 auto; padding: 0 24px; }
.legend { display: flex; gap: 14px; flex-wrap: wrap; padding: 14px 0 4px; }
.legend span { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-2); }
.chip { padding: 1px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; line-height: 18px; white-space: nowrap; }
.chip.ok { background: var(--ok-bg); color: var(--ok); }
.chip.bad { background: var(--bad-bg); color: var(--bad); }
.chip.ext { background: var(--ext-bg); color: var(--ext); }
.chip.inf { background: var(--inf-bg); color: var(--inf); }
.chip.copy { background: var(--copy-bg); color: var(--copy); }

/* 平台区 */
.platform { padding: 26px 0 8px; }
.platform-head { display: flex; align-items: baseline; gap: 14px; margin-bottom: 14px; flex-wrap: wrap; }
.platform-head h2 { font-size: 20px; color: var(--ink); }
.platform-head .site { font-size: 12px; color: var(--faint); }
.platform-head .count { font-size: 12px; color: var(--hw-red); font-weight: 600; }
.mod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; padding-bottom: 8px; }
.mod-card { background: var(--white); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; transition: box-shadow .15s; }
.mod-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,.08); }
.mod-card.open { box-shadow: 0 6px 20px rgba(0,0,0,.08); }
.mod-head { width: 100%; text-align: left; padding: 14px 16px 12px; display: flex; align-items: flex-start; gap: 10px; }
.mod-head .sq { width: 9px; height: 9px; background: var(--hw-red); flex: none; margin-top: 7px; }
.mod-head .mt { flex: 1; min-width: 0; }
.mod-head .mn { font-size: 15px; font-weight: 600; color: var(--ink); }
.mod-head .mp { font-size: 11px; color: var(--faint); word-break: break-all; margin-top: 2px; max-height: 32px; overflow: hidden; }
.mod-head .mf { font-size: 12px; color: var(--text-2); margin-top: 6px; }
.mod-head .arrow { color: var(--faint); transition: transform .15s; flex: none; margin-top: 4px; }
.mod-card.open .arrow { transform: rotate(90deg); }
.mod-desc { padding: 0 16px 12px; font-size: 12px; color: var(--text-2); line-height: 1.7; border-bottom: 1px dashed var(--line); }
.feat-list { display: none; }
.mod-card.open .feat-list { display: block; }
.feat { padding: 9px 16px; border-bottom: 1px solid var(--gray); }
.feat:last-child { border-bottom: none; }
.feat .fr { display: flex; align-items: center; gap: 8px; }
.feat .fn { font-size: 13px; color: var(--ink); flex: 1; min-width: 0; }
.feat .fid { font-size: 10px; color: var(--faint); font-family: ui-monospace, Menlo, monospace; }
.feat .fp { font-size: 11px; color: var(--faint); margin-top: 2px; word-break: break-all; }
.feat .fd { font-size: 11px; color: var(--text-2); margin-top: 2px; }

/* 旅程 */
.jr-layout { display: grid; grid-template-columns: 260px 1fr; gap: 20px; padding: 24px 0 60px; }
.jr-list { position: sticky; top: 76px; align-self: start; display: flex; flex-direction: column; gap: 8px; }
.jr-item { text-align: left; background: var(--white); border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px; transition: border-color .15s; }
.jr-item.on { border-color: var(--hw-red); box-shadow: 0 4px 14px rgba(199,0,11,.10); }
.jr-item .jn { font-size: 14px; font-weight: 600; color: var(--ink); }
.jr-item .jp { font-size: 11px; color: var(--text-2); margin-top: 2px; }
.jr-item .js { font-size: 11px; color: var(--faint); margin-top: 4px; }
.jr-panel { background: var(--white); border: 1px solid var(--line); border-radius: 8px; padding: 24px 28px; }
.jr-title { font-size: 18px; color: var(--ink); }
.jr-persona { font-size: 12px; color: var(--text-2); margin: 4px 0 20px; }
.steps { position: relative; padding-left: 26px; }
.step { position: relative; padding: 0 0 20px 14px; }
.step::before { content: ''; position: absolute; left: 0; top: 8px; bottom: -6px; border-left: 1.5px solid var(--line); }
.step:last-child::before { display: none; }
.step .no { position: absolute; left: -8px; top: 1px; width: 22px; height: 22px; border-radius: 50%; background: var(--ink); color: #fff; font-size: 11px; display: flex; align-items: center; justify-content: center; font-family: ui-monospace, Menlo, monospace; }
.step.bad .no { background: var(--bad); }
.step h4 { font-size: 14px; color: var(--ink); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.step .dt { font-size: 12px; color: var(--text-2); margin-top: 3px; line-height: 1.7; }
.step .meta { font-size: 11px; margin-top: 5px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.step .mod-ref { color: var(--ext); font-family: ui-monospace, Menlo, monospace; }
.break-flag { display: inline-flex; align-items: center; gap: 4px; background: var(--bad-bg); color: var(--bad); font-size: 11px; font-weight: 600; padding: 1px 8px; border-radius: 3px; }

.footer { border-top: 1px solid var(--line); background: var(--white); }
.footer .wrap { padding: 18px 24px; font-size: 12px; color: var(--text-2); display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.dim { display: none !important; }
.hl { background: #fdecec; }
@media (max-width: 900px) {
  .jr-layout { grid-template-columns: 1fr; }
  .jr-list { position: static; flex-direction: row; flex-wrap: wrap; }
  .searchbox { width: 150px; }
}
</style>
</head>
<body>
<div class="topbar"><div class="wrap">
  <span class="name">华为人才在线 · 功能模块图（全量勘察版）</span>
  <span class="stats" id="statLine"></span>
</div></div>

<div class="mode-tabs"><div class="wrap">
  <h1>功能模块图</h1>
  <button class="mtab on" id="tabMap" aria-pressed="true">功能模块</button>
  <button class="mtab" id="tabJr" aria-pressed="false">用户旅程</button>
  <div class="searchbox" role="search">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.6" stroke="currentColor" stroke-width="1.6"/><path d="M10.6 10.6 14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    <input id="q" type="search" placeholder="搜索功能 / 模块 / 旅程" aria-label="搜索" />
  </div>
</div></div>

<main>
  <div id="viewMap">
    <div class="wrap">
      <div class="legend" id="legend"></div>
      <div id="platforms"></div>
    </div>
  </div>

  <div id="viewJr" style="display:none">
    <div class="wrap">
      <div class="legend"><span>断点 = 跨系统/零反馈/空白页/断档 等体验中断（源自一手勘察）</span></div>
      <div class="jr-layout">
        <div class="jr-list" id="jrList"></div>
        <div class="jr-panel" id="jrPanel"></div>
      </div>
    </div>
  </div>
</main>

<footer class="footer"><div class="wrap">
  <span>数据源：survey/modules-combined.json（3 域并行勘察）· survey/journeys.json · research/00-07 · 2026-11-15</span>
  <span>华为高校人才平台重构项目 · 功能模块图</span>
</div></footer>

<script>
const DATA = ${JSON.stringify(DATA)};
const STMAP = ${JSON.stringify(STATUS)};
function st(s) {
  const k = String(s || 'verified').toLowerCase();
  if (STMAP[k]) return STMAP[k];
  if (STMAP[String(s || '')]) return STMAP[String(s || '')];
  if (k.includes('待')) return ['待验证', 'inf'];
  return [s || '现网在线', 'ok'];
}
function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// —— 状态图例 ——
(function () {
  const seen = new Map();
  DATA.platforms.forEach(p => p.modules.forEach(m => {
    seen.set(st(m.status)[0], st(m.status)[1]);
    m.features.forEach(f => seen.set(st(f.status)[0], st(f.status)[1]));
  }));
  const el = document.getElementById('legend');
  el.innerHTML = [...seen].map(([label, cls]) => '<span><i class="chip ' + cls + '">' + esc(label) + '</i>' + esc(label) + '</span>').join('');
  document.getElementById('statLine').textContent = DATA.platforms.map(p => p.platform + ' ' + p.modules.length + '模块/' + p.featureCount + '功能').join(' ｜ ') + ' ｜ ' + DATA.stats.j + ' 条旅程 ' + DATA.stats.s + ' 步';
})();

// —— 模块图渲染 ——
function renderPlatforms(q) {
  const kw = (q || '').trim().toLowerCase();
  const root = document.getElementById('platforms');
  root.innerHTML = DATA.platforms.map(p => {
    const mods = p.modules.map(m => {
      const hitM = !kw || m.name.toLowerCase().includes(kw) || (m.id || '').toLowerCase().includes(kw) || (m.desc || '').toLowerCase().includes(kw);
      const feats = m.features.filter(f => !kw || hitM || f.name.toLowerCase().includes(kw) || (f.id || '').toLowerCase().includes(kw) || (f.desc || '').toLowerCase().includes(kw));
      if (kw && !hitM && feats.length === 0) return '';
      const [sl, sc] = st(m.status);
      const frows = feats.map(f => {
        const [fl, fc] = st(f.status);
        const hitF = kw && !hitM && (f.name.toLowerCase().includes(kw) || (f.id || '').toLowerCase().includes(kw));
        return '<li class="feat' + (hitF ? ' hl' : '') + '">' +
          '<div class="fr"><span class="fn">' + esc(f.name) + '</span><i class="chip ' + fc + '">' + esc(fl) + '</i></div>' +
          (f.path ? '<div class="fp">' + esc(f.path) + '</div>' : '') +
          (f.desc && kw ? '<div class="fd">' + esc(f.desc) + '</div>' : '') +
          '<div class="fid">' + esc(f.id) + '</div></li>';
      }).join('');
      return '<div class="mod-card" data-mid="' + esc(m.id) + '">' +
        '<button class="mod-head" aria-expanded="false"><span class="sq"></span><span class="mt">' +
        '<span class="mn">' + esc(m.name) + '</span>' +
        (m.path ? '<span class="mp">' + esc(m.path) + '</span>' : '') +
        '<span class="mf">' + m.features.length + ' 项功能 <i class="chip ' + sc + '">' + esc(sl) + '</i></span>' +
        '</span><svg class="arrow" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        (kw ? '' : (m.desc ? '<div class="mod-desc">' + esc(m.desc) + '</div>' : '')) +
        '<ul class="feat-list">' + (frows || '<li class="feat"><span class="fn" style="color:var(--faint)">（无匹配功能）</span></li>') + '</ul></div>';
    }).join('');
    return '<section class="platform"><div class="platform-head"><h2>' + esc(p.platform) + '</h2>' +
      '<span class="site">' + esc(p.site) + '</span><span class="count">' + p.modules.length + ' 应用模块 / ' + p.featureCount + ' 功能</span></div>' +
      '<div class="mod-grid">' + mods + '</div></section>';
  }).join('');
  // 展开/折叠（搜索时自动展开）
  root.querySelectorAll('.mod-head').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.mod-card');
      card.classList.toggle('open');
      btn.setAttribute('aria-expanded', card.classList.contains('open'));
    });
    if (kw) { const card = btn.closest('.mod-card'); card.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
  });
}
renderPlatforms();

// —— 旅程渲染 ——
let curJr = 0;
function renderJr() {
  const list = document.getElementById('jrList');
  list.innerHTML = DATA.journeys.map((j, i) =>
    '<button class="jr-item' + (i === curJr ? ' on' : '') + '" data-i="' + i + '"><div class="jn">' + esc(j.id + ' · ' + j.name) + '</div>' +
    '<div class="jp">' + esc(j.persona || '') + '</div><div class="js">' + j.steps.length + ' 步 · ' + j.steps.filter(s => (s.note || '').includes('断点')).length + ' 断点</div></button>'
  ).join('');
  list.querySelectorAll('.jr-item').forEach(b => b.addEventListener('click', () => { curJr = +b.dataset.i; renderJr(); }));
  const j = DATA.journeys[curJr];
  const panel = document.getElementById('jrPanel');
  panel.innerHTML = '<div class="jr-title">' + esc(j.name) + '</div><div class="jr-persona">角色：' + esc(j.persona || '—') + '</div>' +
    '<div class="steps">' + j.steps.map(s => {
      const bad = (s.note || '').includes('断点') || (s.note || '').includes('终止');
      return '<div class="step' + (bad ? ' bad' : '') + '"><span class="no">' + s.n + '</span>' +
        '<h4>' + esc(s.title) + (bad ? '<span class="break-flag">断点</span>' : '') + '</h4>' +
        '<div class="dt">' + esc(s.detail) + '</div>' +
        '<div class="meta"><span class="mod-ref">' + esc(s.module) + '</span>' + (s.note ? '<span class="caption" style="color:var(--bad)">' + esc(s.note) + '</span>' : '') + '</div></div>';
    }).join('') + '</div>';
}

// —— 模式切换 + 搜索 ——
const tabMap = document.getElementById('tabMap'), tabJr = document.getElementById('tabJr');
tabMap.addEventListener('click', () => setMode('map'));
tabJr.addEventListener('click', () => { setMode('jr'); renderJr(); });
function setMode(m) {
  const isMap = m === 'map';
  document.getElementById('viewMap').style.display = isMap ? '' : 'none';
  document.getElementById('viewJr').style.display = isMap ? 'none' : '';
  tabMap.classList.toggle('on', isMap); tabMap.setAttribute('aria-pressed', isMap);
  tabJr.classList.toggle('on', !isMap); tabJr.setAttribute('aria-pressed', !isMap);
}
let qt;
document.getElementById('q').addEventListener('input', e => {
  clearTimeout(qt);
  qt = setTimeout(() => {
    const v = e.target.value;
    if (document.getElementById('viewJr').style.display === 'none') renderPlatforms(v);
    else renderJr();
  }, 200);
});
</script>
</body>
</html>
`;

const outDir = path.join(root, '原型');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, '华为人才在线功能模块图.html');
fs.writeFileSync(out, html);
console.log('生成完成:', out, (fs.statSync(out).size / 1024).toFixed(1) + 'KB');
