/* 复刻站功能层（登录注册/会话/课程报名/开班/我的数据）
 * 仅当页面经 tools/server.mjs（同源 /api/*）打开时启用；
 * file:// 或纯静态打开时自动降级为纯静态复刻（无任何外部请求）。
 * 注入方式：页尾 <script src="app.js" defer></script>（在 nav-wiring.js 之后）
 */
(function () {
  'use strict';
  if (location.protocol === 'file:') return; // 静态模式
  var page = location.pathname.split('/').pop() || 'index.html';
  var qs = new URLSearchParams(location.search);
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return document.querySelectorAll(s); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  function toast(msg, ok) {
    var t = document.createElement('div');
    t.className = 'app-toast';
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;top:64px;transform:translateX(-50%);z-index:9999;'
      + 'padding:10px 22px;border-radius:6px;font-size:14px;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.2);'
      + 'background:' + (ok === false ? '#d13438' : '#333');
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 2200);
    setTimeout(function () { t.remove(); }, 2700);
  }
  function api(path, opts) {
    return fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' }, opts))
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, json: j }; }); });
  }

  /* ---------- 顶栏账号态 ---------- */
  function mountAccount(u) {
    // 门户壳顶栏：登录/注册 → 账号 chip + 退出
    $$('.topbar-right .tool, .com-header .tool').forEach(function (tool) {
      if (tool.classList.contains('uc-account') || tool.querySelector('.uc-account')) return;
      if ((tool.textContent || '').trim().indexOf('登录/注册') === -1) return;
      tool.innerHTML = '<span class="uc-account" style="display:inline-flex;align-items:center;color:#fff;cursor:pointer;font-size:12px;white-space:nowrap">'
        + '<span>Uniportal账号 : </span><span style="margin-left:4px">' + u.account + '</span></span>'
        + '<span class="app-logout" style="margin-left:12px;cursor:pointer;color:#fff;font-size:12px;opacity:.85">退出</span>';
    });
    // uc 壳：账号 chip 换成真实账号 + 退出
    $$('.uc-account').forEach(function (chip) {
      var spans = chip.querySelectorAll('span');
      if (spans.length >= 2) spans[spans.length - 1].textContent = u.account;
    });
    // 所有壳（门户/uc）顶栏右侧保证有一个退出按钮（幂等）
    $$('.topbar-right').forEach(function (tr) {
      if (tr.querySelector('.app-logout')) return;
      var lg = document.createElement('span');
      lg.className = 'app-logout';
      lg.textContent = '退出';
      lg.style.cssText = 'margin-left:12px;cursor:pointer;color:#fff;font-size:12px;opacity:.85';
      tr.appendChild(lg);
    });
    document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('.app-logout') : null;
      if (!el) return;
      api('/api/logout', { method: 'POST' }).then(function () { location.href = 'index.html'; });
    });
  }

  /* ---------- 登录页 ---------- */
  function wireLogin() {
    var reg = $('.login-links a');
    if (reg && reg.textContent.trim() === '注册') { reg.style.cursor = 'pointer'; reg.addEventListener('click', function () { location.href = 'login-register.html'; }); }
    var btn = $('.login-btn');
    if (!btn) return;
    btn.addEventListener('click', submit);
    $('.field.pwd input').addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    function submit() {
      var acc = $('.field.first input').value.trim(), pwd = $('.field.pwd input').value;
      if (!acc || !pwd) { toast('请输入账号与密码', false); return; }
      btn.textContent = '登录中…';
      api('/api/login', { method: 'POST', body: JSON.stringify({ account: acc, password: pwd }) }).then(function (r) {
        if (r.status === 200) { location.href = 'uc-home.html'; }
        else { btn.textContent = '登录'; toast(r.json.error || '登录失败', false); }
      }).catch(function () { btn.textContent = '登录'; toast('服务未启动（node tools/server.mjs）', false); });
    }
  }

  /* ---------- 课程详情：去学习/我要开班 ---------- */
  function wireCourse() {
    var courseId = qs.get('course') || 'ascend-c';
    var go = $('.btn-go-study') || $('.cd-go');
    if (go) go.addEventListener('click', function () {
      api('/api/me').then(function (r) {
        if (r.status !== 200) { location.href = 'login.html'; return; }
        return api('/api/courses/' + courseId + '/enroll', { method: 'POST' }).then(function (r2) {
          if (r2.status === 200) { toast('报名成功，已加入我的课程'); setTimeout(function () { location.href = 'uc-mycourse.html'; }, 900); }
          else toast(r2.json.error || '报名失败', false);
        });
      }).catch(function () { location.href = 'login.html'; });
    });
    var open = $('.btn-open-class');
    if (open) open.addEventListener('click', function () {
      api('/api/me').then(function (r) {
        if (r.status !== 200) { location.href = 'login.html'; return; }
        openClassModal(courseId);
      }).catch(function () { location.href = 'login.html'; });
    });
    $$('.rf-btn').forEach(function (b) {
      if (b.classList.contains('btn-open-class') || b.classList.contains('btn-go-study')) return;
      if ((b.textContent || '').trim() === '去学习') b.addEventListener('click', function () {
        api('/api/me').then(function (r) { r.status === 200 ? enrollAndGo(courseId) : (location.href = 'login.html'); });
      });
    });
    function enrollAndGo(id) {
      api('/api/courses/' + id + '/enroll', { method: 'POST' }).then(function (r2) {
        if (r2.status === 200) { toast('报名成功'); setTimeout(function () { location.href = 'uc-mycourse.html'; }, 900); }
      });
    }
  }
  function openClassModal(courseId) {
    if ($('.app-modal')) return;
    var m = document.createElement('div');
    m.className = 'app-modal';
    m.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center';
    m.innerHTML = '<div style="background:#fff;border-radius:8px;padding:28px 32px;width:420px">'
      + '<h3 style="margin:0 0 18px;font-size:17px;color:#333">创建班级（我要开班）</h3>'
      + '<input class="app-kname" placeholder="请输入班级名称" style="width:100%;height:42px;border:1px solid #ccc;border-radius:4px;padding:0 12px;font-size:14px;outline:none"/>'
      + '<div class="app-merr" style="color:#d13438;font-size:12px;margin-top:8px;min-height:16px"></div>'
      + '<div style="display:flex;gap:12px;justify-content:flex-end;margin-top:10px">'
      + '<button class="app-mcancel" style="padding:8px 22px;border:1px solid #ccc;border-radius:4px;background:#fff;font-size:14px;cursor:pointer">取消</button>'
      + '<button class="app-mok" style="padding:8px 22px;border:none;border-radius:4px;background:#c7000b;color:#fff;font-size:14px;cursor:pointer">创建</button></div></div>';
    document.body.appendChild(m);
    m.querySelector('.app-mcancel').addEventListener('click', function () { m.remove(); });
    m.querySelector('.app-mok').addEventListener('click', function () {
      var name = m.querySelector('.app-kname').value.trim();
      if (!name) { m.querySelector('.app-merr').textContent = '班级名称必填'; return; }
      api('/api/classes', { method: 'POST', body: JSON.stringify({ name: name, courseId: courseId }) }).then(function (r) {
        if (r.status === 200) { m.remove(); toast('开班成功，邀请码 ' + r.json.klass.code); setTimeout(function () { location.href = 'uc-myclass-list.html'; }, 1100); }
        else m.querySelector('.app-merr').textContent = r.json.error || '创建失败';
      });
    });
  }

  /* ---------- 用户中心各页 API 化 ---------- */
  function renderMy() {
    if (page === 'uc-mycourse.html') {
      api('/api/my/courses').then(function (r) {
        if (r.status !== 200) return;
        var list = $('.crs-list');
        if (!list || !r.json.courses.length) return;
        list.innerHTML = r.json.courses.map(function (e) {
          return '<div class="new-card-course"><div class="img" style="background:linear-gradient(135deg,#f7e8e8,#fbeaea)"></div>'
            + '<div class="text" title="' + e.course.title + '">' + e.course.title + '</div>'
            + '<div class="process-box"><div class="process-grey"><b style="width:' + (e.pct || 0) + '%"></b></div>'
            + '<div class="process-right"><span>' + (e.pct || 0).toFixed(2) + '%</span></div></div></div>';
        }).join('');
      }).catch(function () {});
    }
    if (page === 'uc-myclass-list.html') {
      api('/api/my/classes').then(function (r) {
        if (r.status !== 200) return;
        var rows = [];
        r.json.teaching.forEach(function (k) { rows.push([k.name, k.code, '我创建的', k.students.length + '人']); });
        r.json.joining.forEach(function (k) { rows.push([k.name, k.code, '已加入', '']); });
        if (!rows.length) return;
        var box = document.createElement('div');
        box.style.cssText = 'margin:0 20px 16px;padding:14px 18px;background:#fff;border:1px solid #eee;border-radius:4px;font-size:13px';
        box.innerHTML = '<b style="color:#333">我的班级（实时）</b>' + rows.map(function (rw) {
          return '<div style="display:flex;gap:24px;padding:9px 0;border-top:1px dashed #eee;margin-top:9px"><span style="flex:1;color:#333">' + rw[0]
            + '</span><span style="width:90px;color:#c7000b">邀请码 ' + rw[1] + '</span><span style="width:90px;color:#666">' + rw[2]
            + '</span><span style="width:60px;color:#666">' + rw[3] + '</span></div>';
        }).join('');
        var anchor = $('.aui-pager') || $('.crs-list') || document.body.firstChild;
        anchor.parentNode.insertBefore(box, anchor);
      }).catch(function () {});
      var joinBtn = $$('.m-btn').length && [...$$('.m-btn')].find(function (b) { return (b.textContent || '').trim() === '加入'; });
      if (joinBtn) joinBtn.addEventListener('click', function () {
        var code = [...$$('input')].find(function (i) { return i.placeholder === '请输入班级邀请码'; });
        if (!code || !code.value.trim()) { toast('请输入班级邀请码', false); return; }
        api('/api/classes/join', { method: 'POST', body: JSON.stringify({ code: code.value.trim() }) }).then(function (r) {
          if (r.status === 200) { toast('已加入班级 ' + r.json.klass.name); setTimeout(function () { location.reload(); }, 900); }
          else toast(r.json.error || '加入失败', false);
        });
      });
    }
    [['uc-mycert.html', '/api/my/certs'], ['uc-myexam.html', '/api/my/exams'], ['uc-mycoupons.html', '/api/my/coupons'], ['uc-mynews.html', '/api/my/messages']].forEach(function (pair) {
      if (page !== pair[0]) return;
      api('/api/me').then(function (r) {
        if (r.status === 200) mountAccount(r.json.user);
        return api(pair[1]);
      }).then(function (r) {
        if (!r || r.status !== 200 || !r.json[pair[1].split('/').pop()].length) return;
        var data = r.json[pair[1].split('/').pop()];
        var box = document.createElement('div');
        box.style.cssText = 'margin:12px 20px;padding:12px 16px;background:#fff;border:1px dashed #d9d9d9;border-radius:4px;font-size:13px';
        box.innerHTML = '<b style="color:#333">实时数据（登录账号）</b>' + data.map(function (d) {
          var line = d.name || d.title || d.kind || '';
          var extra = d.date ? ' · ' + d.date : d.time ? ' · ' + d.time : d.expire ? ' · 有效期至 ' + d.expire : d.body ? ' · ' + d.body : '';
          return '<div style="padding:7px 0;border-top:1px dashed #eee;margin-top:7px;color:#555">' + line + extra + '</div>';
        }).join('');
        var anchor = $('.aui-pager') || document.body.firstChild;
        anchor.parentNode.insertBefore(box, anchor);
      }).catch(function () {});
    });
    if (page === 'uc-home.html' || page === 'uc-myinfo.html' || page === 'uc-realinfo.html' || page === 'uc-mycomp.html') {
      api('/api/me').then(function (r) { if (r.status === 200) mountAccount(r.json.user); }).catch(function () {});
    }
  }

  /* ---------- 启动 ---------- */
  window.addEventListener('DOMContentLoaded', function () {
    if (page === 'login.html') { wireLogin(); return; }
    if (page === 'login-register.html') { wireRegister(); return; }
    api('/api/me').then(function (r) {
      if (r.status === 200) mountAccount(r.json.user);
      renderMy();
      if (page === 'course-detail.html') wireCourse();
    }).catch(function () { /* 静态模式 */ });
  });

  /* ---------- 注册页 ---------- */
  function wireRegister() {
    var btn = $('.login-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var acc = $('.field.first input').value.trim();
      var pwd = $('.field.pwd input').value;
      var pwd2 = $('.field.pwd2 input').value;
      var role = $('.field.role select') ? $('.field.role select').value : 'student';
      var err = function (m) { var e = $('.app-reg-err'); if (e) e.textContent = m; toast(m, false); };
      if (!acc || acc.length < 4) return err('账号至少 4 位');
      if (!pwd || pwd.length < 6) return err('密码至少 6 位');
      if (pwd !== pwd2) return err('两次密码不一致');
      btn.textContent = '注册中…';
      api('/api/register', { method: 'POST', body: JSON.stringify({ account: acc, password: pwd, role: role }) }).then(function (r) {
        if (r.status === 200) { toast('注册成功，已自动登录'); setTimeout(function () { location.href = 'uc-home.html'; }, 900); }
        else { btn.textContent = '注册'; err(r.json.error || '注册失败'); }
      }).catch(function () { btn.textContent = '注册'; err('服务未启动（node tools/server.mjs）'); });
    });
  }
})();
