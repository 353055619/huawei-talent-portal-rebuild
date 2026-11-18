/* 真实操作录制 · 页面注入 UI 层（由 tools/real-record.mjs 经 addInitScript 注入每个页面）
 * 提供: 真实跟随光标 / 底部步骤字幕条 / 全屏插卡(external|offline|cut|info) / 片头片尾 / 顶部进度条 / 聚焦框
 * 全部 overlay 均 pointer-events:none，不拦截真实点击；幂等（防重复注入）。
 * 注意: addInitScript 在 document_start 执行 —— API 先定义，DOM 挂载等 readyState。
 * 页面侧 API: window.__realUI.{setCaption,hideCaption,interstitial,intro,outro,setProgress,focusBox,locate,scrollBy,sleep}
 */
(function () {
  if (window.__realUI) return;
  var UA = window.__realUI = {};
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  UA.sleep = sleep;

  var CSS = ''
    + '.ru-cursor{position:fixed;left:0;top:0;z-index:99999;pointer-events:none;width:30px;height:30px;'
    + '  transition:transform .42s cubic-bezier(.42,.06,.24,1);filter:drop-shadow(1px 2px 3px rgba(0,0,0,.35));}'
    + '.ru-cursor.pressed{transition:transform .1s}'
    + '.ru-cursor svg{display:block;width:30px;height:30px}'
    + '.ru-progress{position:fixed;left:0;top:0;height:4px;background:#c7000b;z-index:99998;width:0;transition:width .5s;pointer-events:none}'
    + '.ru-caption{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:99997;pointer-events:none;'
    + '  display:flex;align-items:center;gap:14px;max-width:1400px;background:rgba(0,0,0,.82);border-radius:8px;'
    + '  padding:12px 22px;opacity:0;transition:opacity .25s;color:#fff}'
    + '.ru-caption.show{opacity:1}'
    + '.ru-caption .no{width:34px;height:34px;border-radius:50%;background:#c7000b;color:#fff;font-weight:700;'
    + '  display:flex;align-items:center;justify-content:center;font-size:17px;flex:none}'
    + '.ru-caption .tx{display:flex;flex-direction:column;gap:3px}'
    + '.ru-caption .t1{font-size:17px;font-weight:600;line-height:1.3}'
    + '.ru-caption .t2{font-size:13.5px;color:rgba(255,255,255,.74);line-height:1.45}'
    + '.ru-caption .chip{align-self:flex-start;font-size:12px;padding:3px 10px;border-radius:99px;background:rgba(255,255,255,.14);flex:none}'
    + '.ru-caption .chip.warn{background:#c7000b}'
    + '.ru-int{position:fixed;inset:0;z-index:99996;display:none;align-items:center;justify-content:center;'
    + '  background:rgba(6,8,12,.86);backdrop-filter:blur(4px);pointer-events:none;opacity:0;transition:opacity .35s}'
    + '.ru-int.show{display:flex;opacity:1}'
    + '.ru-card{width:1080px;max-width:92vw;background:#fff;border-radius:12px;padding:40px 48px;position:relative;overflow:hidden}'
    + '.ru-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:#c7000b}'
    + '.ru-kind{display:inline-flex;align-items:center;gap:8px;font-size:13px;padding:5px 14px;border-radius:99px;background:#f4f4f4;color:#555;margin-bottom:18px}'
    + '.ru-kind.ext{background:#fdeeee;color:#c7000b}.ru-kind.off{background:#eef3fe;color:#2070f3}'
    + '.ru-kind.cut{background:#fdeeee;color:#c7000b}.ru-kind.ok{background:#eef7ee;color:#2e7d32}'
    + '.ru-chrome{display:flex;align-items:center;gap:8px;background:#f2f2f2;border-radius:8px;padding:9px 14px;margin:0 0 18px;font-size:13px;color:#555}'
    + '.ru-chrome i{width:11px;height:11px;border-radius:50%;display:inline-block}'
    + '.ru-chrome .url{flex:1;background:#fff;border-radius:5px;padding:5px 12px;color:#666;font-size:12.5px}'
    + '.ru-chrome .newtab{background:#c7000b;color:#fff;font-size:11.5px;padding:3px 9px;border-radius:4px;flex:none}'
    + '.ru-card h3{font-size:30px;color:#1a1a1a;margin:0 0 12px;line-height:1.3}'
    + '.ru-card .desc{font-size:16.5px;color:#555;line-height:1.65;margin:0 0 18px}'
    + '.ru-card .li{display:flex;gap:12px;align-items:flex-start;font-size:15px;color:#333;line-height:1.6;margin:9px 0}'
    + '.ru-card .li::before{content:"";width:9px;height:9px;background:#c7000b;flex:none;margin-top:9px}'
    + '.ru-card .note{margin-top:20px;padding:12px 16px;background:#fdeeee;border-left:3px solid #c7000b;color:#a0060a;font-size:14px;border-radius:0 6px 6px 0}'
    + '.ru-int .stepno{position:absolute;top:18px;right:22px;color:#c7000b;font-weight:700;font-size:14px}'
    + '.ru-intro,.ru-outro{position:fixed;inset:0;z-index:99999;background:#0a0c10;display:none;align-items:center;justify-content:center;'
    + '  color:#fff;flex-direction:column;gap:16px;opacity:0;transition:opacity .3s;pointer-events:none}'
    + '.ru-intro.show,.ru-outro.show{display:flex;opacity:1}'
    + '.ru-intro .kicker,.ru-outro .kicker{font-size:15px;letter-spacing:.3em;color:rgba(255,255,255,.55)}'
    + '.ru-intro h1{font-size:54px;margin:0;font-weight:700;letter-spacing:.02em}'
    + '.ru-intro .persona{font-size:19px;color:rgba(255,255,255,.75)}'
    + '.ru-intro .sum{font-size:15.5px;color:rgba(255,255,255,.5);max-width:760px;text-align:center;line-height:1.7}'
    + '.ru-outro h1{font-size:44px;margin:0;font-weight:700}'
    + '.ru-outro .sum{font-size:17px;color:rgba(255,255,255,.65);max-width:800px;text-align:center;line-height:1.8}'
    + '.ru-focus{position:fixed;z-index:99995;border:2.5px solid #c7000b;border-radius:4px;pointer-events:none;'
    + '  box-shadow:0 0 0 3000px rgba(0,0,0,.18)}';

  var cur, prog, cap; // DOM 引用（init 后可用）

  /* 跨导航持久化：真实导航会销毁页面 DOM，字幕/进度存 sessionStorage 换页恢复 */
  function saveState(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function loadState(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } }

  /* ---------- API（定义期不碰 DOM） ---------- */
  UA.setProgress = function (r) { saveState('ruProg', r); if (prog) prog.style.width = (r * 100) + '%'; };
  UA.setCaption = function (no, s) {
    var st = { no: no, title: s.title, detail: s.detail, flag: s.flag, break_: s.break_ };
    saveState('ruCap', st);
    renderCap(st);
  };
  function renderCap(st) {
    if (!cap || !st) return;
    cap.querySelector('.no').textContent = st.no;
    cap.querySelector('.t1').textContent = st.title || '';
    cap.querySelector('.t2').textContent = st.detail || '';
    var chip = cap.querySelector('.chip');
    var flag = st.flag || (st.break_ ? '断点' : '');
    chip.textContent = flag;
    chip.className = 'chip' + ((st.break_ || /断点|缺陷|无|终止/.test(flag)) ? ' warn' : '');
    chip.style.display = flag ? '' : 'none';
    cap.classList.add('show');
  }
  UA.hideCaption = function () { saveState('ruCap', null); if (cap) cap.classList.remove('show'); };

  var KIND = { external: ['ext', '外部系统'], offline: ['off', '线下步骤'], cut: ['cut', '体验断点'], info: ['ok', '说明'] };
  UA.interstitial = function (cfg) {
    var it = document.createElement('div');
    it.className = 'ru-int';
    var k = KIND[cfg.kind] || KIND.info;
    var chrome = cfg.kind === 'external'
      ? '<div class="ru-chrome"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i>'
        + '<span class="url">' + (cfg.url || '') + '</span><span class="newtab">新开标签页</span></div>'
      : '';
    var lis = (cfg.bullets || []).map(function (t) { return '<div class="li">' + t + '</div>'; }).join('');
    var note = cfg.note ? '<div class="note">' + cfg.note + '</div>' : '';
    it.innerHTML = '<div class="ru-card"><span class="stepno">第 ' + cfg.no + ' 步</span>'
      + '<div class="ru-kind ' + k[0] + '">' + (cfg.flag || k[1]) + '</div>' + chrome
      + '<h3>' + cfg.title + '</h3><div class="desc">' + (cfg.desc || '') + '</div>' + lis + note + '</div>';
    document.body.appendChild(it);
    requestAnimationFrame(function () { it.classList.add('show'); });
    return sleep(cfg.dwell || 3200).then(function () {
      it.classList.remove('show');
      return sleep(420).then(function () { it.remove(); });
    });
  };

  UA.intro = function (j) {
    var d = document.createElement('div');
    d.className = 'ru-intro';
    d.innerHTML = '<div class="kicker">华为人才在线 · 现网用户旅程实拍</div><h1>' + j.name + '</h1>'
      + (j.persona ? '<div class="persona">角色：' + j.persona + '</div>' : '')
      + (j.summary ? '<div class="sum">' + j.summary + '</div>' : '');
    document.body.appendChild(d);
    requestAnimationFrame(function () { d.classList.add('show'); });
    return sleep(2600).then(function () { d.classList.remove('show'); return sleep(380).then(function () { d.remove(); }); });
  };
  UA.outro = function (j) {
    var d = document.createElement('div');
    d.className = 'ru-outro';
    d.innerHTML = '<div class="kicker">旅程结束</div><h1>' + j.name + ' · 完</h1>'
      + (j.outro ? '<div class="sum">' + j.outro + '</div>' : '');
    document.body.appendChild(d);
    requestAnimationFrame(function () { d.classList.add('show'); });
    return sleep(2200).then(function () { d.classList.remove('show'); return sleep(400).then(function () { d.remove(); }); });
  };

  UA.focusBox = function (rect, ms) {
    var b = document.createElement('div');
    b.className = 'ru-focus';
    b.style.left = (rect.x - 6) + 'px'; b.style.top = (rect.y - 6) + 'px';
    b.style.width = (rect.w + 12) + 'px'; b.style.height = (rect.h + 12) + 'px';
    document.body.appendChild(b);
    setTimeout(function () { b.remove(); }, ms || 1600);
  };

  UA.locate = async function (sel, text) {
    var list = [];
    try { list = Array.prototype.slice.call(document.querySelectorAll(sel)); } catch (e) { return null; }
    var el = null;
    if (text) el = list.find(function (e) { return ((e.textContent || '').trim().replace(/\s+/g, '').indexOf(String(text).replace(/\s+/g, '')) >= 0) && e.getBoundingClientRect().width > 2; }) || null;
    else el = list[0] || null;
    if (!el) return null;
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;
    if (r.top < 40 || r.bottom > window.innerHeight - 40) {
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
      await sleep(760);                       // 等平滑滚动完成
      r = el.getBoundingClientRect();          // 复测：滚动后的真实坐标
      if (r.top < 0 || r.bottom > window.innerHeight) { // 兜底：瞬时滚
        try { el.scrollIntoView({ block: 'center' }); } catch (e) {}
        await sleep(120); r = el.getBoundingClientRect();
      }
    }
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, top: r.top, left: r.left };
  };
  UA.scrollBy = function (dy) { window.scrollBy({ top: dy, behavior: 'smooth' }); return sleep(900); };

  /* ---------- DOM 初始化（readyState 安全） ---------- */
  function init() {
    var st = document.createElement('style');
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);

    cur = document.createElement('div');
    cur.className = 'ru-cursor';
    cur.innerHTML = '<svg viewBox="0 0 30 30" fill="none"><path d="M4 2l0.5 22 6-5.5 4 8.5 4.5-2-4-8 7.5-1z" fill="#fff" stroke="#1a1a1a" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(cur);
    var mx = -60, my = -60;
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      cur.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
    }, true);
    document.addEventListener('mousedown', function () { cur.classList.add('pressed'); cur.style.transform = 'translate(' + (mx - 3) + 'px,' + (my - 2) + 'px) scale(.86)'; }, true);
    document.addEventListener('mouseup', function () { cur.classList.remove('pressed'); cur.style.transform = 'translate(' + mx + 'px,' + my + 'px)'; }, true);

    prog = document.createElement('div');
    prog.className = 'ru-progress';
    document.body.appendChild(prog);

    cap = document.createElement('div');
    cap.className = 'ru-caption';
    cap.innerHTML = '<div class="no">1</div><div class="tx"><div class="t1"></div><div class="t2"></div></div><div class="chip"></div>';
    document.body.appendChild(cap);

    /* 恢复上一页的字幕/进度 */
    var stc = loadState('ruCap'); if (stc) renderCap(stc);
    var stp = loadState('ruProg'); if (stp != null) prog.style.width = (stp * 100) + '%';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
