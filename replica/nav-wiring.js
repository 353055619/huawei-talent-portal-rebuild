/* 站内导航接线（复刻页导航增强，非页面内容的一部分）
 * 原则：只接现网真实可跳转的入口（导航条/logo/登录/课程卡/用户中心卡片/面包屑/页脚站内链接）；
 *      现网真实缺陷保持死点（关联-讲师、实名认证、uc 子页菜单、商城/企业培训等外域入口）。
 * 接入方式：页面 </body> 前 <script src="nav-wiring.js" defer></script>
 */
(function () {
  'use strict';
  var PAGES = {
    '首页': 'index.html',
    '学习': 'learning.html',
    '认证': 'cert.html',
    '华为ICT学院': 'ict-academy.html',
    '华为ICT大赛': 'contest.html',
    '培训伙伴': 'halp.html',
    '成功案例': 'stories.html',
    '资讯中心': 'news.html',
    '华为认证': 'cert.html',
    '华为培训合作伙伴': 'halp.html',
    '全部课程': 'learning-all.html',
    '专业课程目录': 'learning.html'
  };
  var UC_CARDS = {
    '我的课程': 'uc-mycourse.html',
    '我的班级': 'uc-myclass-list.html',
    '我的大赛': 'uc-mycomp.html',
    '个人信息': 'uc-myinfo.html',
    '我的券包': 'uc-mycoupons.html',
    '我的证书': 'uc-mycert.html',
    '我的考试': 'uc-myexam.html',
    '我的消息': 'uc-mynews.html'
  };
  /* 导航下拉菜单（取自现网 portal-home DOM 的 t-popSelect-list 逐字菜单项；
   * p=映射复刻页，无复刻页的子项保持死点——现网各自跳子路由/外域） */
  var DROPS = {
    '学习': [
      { t: '课程', p: 'learning.html' },
      { t: '书籍', p: null }
    ],
    '认证': [
      { t: '职业认证', p: 'cert.html' }, { t: '专业认证', p: 'cert.html' },
      { t: '1+X认证', p: 'cert.html' }, { t: 'HCIE专区', p: 'cert.html' },
      { t: '微认证', p: 'cert.html' }, { t: '资源中心', p: 'cert.html' },
      { t: '认证资讯', p: 'cert.html' }, { t: '认证课程', p: 'cert.html' }
    ],
    '华为ICT学院': [
      { t: 'ICT学院', p: 'ict-academy.html' }, { t: 'IASC', p: 'ict-academy.html' },
      { t: '课程目录', p: 'ict-academy.html' }, { t: '岗位推荐课程', p: 'ict-academy.html' },
      { t: '人才双选', p: 'ict-academy.html' }, { t: '产学合作', p: 'ict-academy.html' },
      { t: '查找ICT学院', p: 'find-academy.html' }, { t: '资源中心', p: 'ict-academy.html' },
      { t: '学院资讯', p: 'ict-academy.html' }
    ],
    '培训伙伴': [
      { t: '培训伙伴HALP', p: 'halp.html' }, { t: '查找HALP', p: 'halp.html' },
      { t: '资源中心', p: 'halp.html' }, { t: '伙伴资讯', p: 'halp.html' },
      { t: 'HALP班级', p: 'halp.html' }
    ]
  };
  function here() { return location.pathname.split('/').pop() || 'index.html'; }
  function go(p) { if (p && p !== here()) location.href = p; }
  function txt(el) { return (el.textContent || '').trim().replace(/\s+/g, ''); }
  /* 导航项主标签：排除注入的下拉菜单文字 */
  function navLabel(nav) {
    var clone = nav.cloneNode(true);
    var d = clone.querySelector('.nav-drop');
    if (d) d.remove();
    return txt(clone);
  }

  /* 课程详情面包屑：把"首页 > 学习 >"动态包成链接（不改页面文件） */
  function wireCrumb() {
    document.querySelectorAll('.cd-crumb .container').forEach(function (c) {
      if (c.dataset.wired) return; c.dataset.wired = '1';
      c.innerHTML = c.innerHTML
        .replace(/(^|>)\s*首页/, '$1<a data-nav="index.html" style="color:inherit;cursor:pointer">首页</a>')
        .replace(/(&gt;|>)\s*学习\s*(&gt;|>)/, '$1 <a data-nav="learning.html" style="color:inherit;cursor:pointer">学习</a> $2');
    });
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!(t instanceof Element)) return;
    /* 显式 data-nav 优先 */
    var dn = t.closest('[data-nav]');
    if (dn) { go(dn.dataset.nav); return; }
    /* 登录页"登录"按钮：静态打开(file://)时降级直跳用户中心；服务模式下由 app.js 走真实登录 */
    var lb = t.closest('.login-btn');
    if (lb && location.protocol === 'file:' && /login\.html$/.test(location.pathname)) { go('uc-home.html'); return; }
    /* 已有真实 href/onclick 的元素不劫持 */
    var a = t.closest('a[href],[onclick],button,input,label,select,textarea');
    if (a) return;

    var ucCard = t.closest('.uc-cards .item');
    if (ucCard) { go(UC_CARDS[txt(ucCard)]); return; }

    var nav = t.closest('.nav-item');
    /* 下拉菜单内无 data-nav 的子项 = 外域/未复刻入口，保持死点（不冒泡成频道跳转） */
    if (nav && !t.closest('.nav-drop')) { go(PAGES[navLabel(nav)]); return; }        /* 商城/企业培训等不在表内 → 保持死点（外域） */

    if (t.closest('.hw-logo')) { go('index.html'); return; }

    /* 顶栏"登录/注册"入口 */
    var tool = t.closest('.tool');
    if (tool && /^登录\/注册$/.test(txt(tool))) { go('login.html'); return; }

    /* 用户中心顶栏账号 chip → 用户中心首页 */
    if (t.closest('.uc-account')) { go('uc-home.html'); return; }

    /* 学习页三视图 tab 中的跳转项（全部课程↔专业课程目录），页内 tab 切换由页面自身 JS 处理，不受影响 */
    var tab = t.closest('.learning-tab');
    if (tab) { go(PAGES[txt(tab)]); return; }

    /* 课程卡（learning / learning-all / index 热门课程）→ 课程详情 */
    var card = t.closest('.course-image-box') || t.closest('.Course-item') || t.closest('.new-card-course');
    if (card) { go('course-detail.html'); return; }

    /* 页脚站内链接 */
    var li = t.closest('.com-footer-content-left li');
    if (li) { go(PAGES[txt(li)]); return; }
  });

  /* 可点击性提示（光标手型） */
  var st = document.createElement('style');
  st.textContent = '.nav-item,.hw-logo,.uc-cards .item,.learning-tab,.course-image-box,.Course-item,.new-card-course,.login-btn,[data-nav]{cursor:pointer}'
    /* 导航下拉（样式依据现网 t-popSelect-list：hover 弹出白卡） */
    + '.nav-item{position:relative}'
    + '.nav-drop{display:none;position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:2px;'
    + 'background:#fff;border-radius:0 0 8px 8px;box-shadow:0 8px 24px rgba(0,0,0,.14);padding:8px 0;min-width:128px;z-index:3000}'
    + '.nav-item:hover>.nav-drop{display:block}'
    + '.nav-drop-item{padding:9px 24px;font-size:14px;line-height:1.4;color:#333;white-space:nowrap;text-align:center;cursor:pointer}'
    + '.nav-drop-item:hover{color:#c7000b}'
    + '.nav-item .caret{transition:transform .18s}'
    + '.nav-item:hover>.caret{transform:rotate(180deg)}';
  document.head.appendChild(st);

  /* 给带 caret 的导航项注入下拉菜单（现网 t-popSelect 结构的静态化） */
  function injectDrops() {
    document.querySelectorAll('.nav-item').forEach(function (nav) {
      var label = navLabel(nav).replace(/▼|▾|⌄/g, '');
      var items = DROPS[label];
      if (!items || nav.querySelector('.nav-drop')) return;
      var d = document.createElement('div');
      d.className = 'nav-drop';
      items.forEach(function (it) {
        var li = document.createElement('div');
        li.className = 'nav-drop-item';
        li.textContent = it.t;
        if (it.p) { li.dataset.nav = it.p; li.style.cursor = 'pointer'; }
        else li.style.cursor = 'default';
        d.appendChild(li);
      });
      nav.appendChild(d);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { wireCrumb(); injectDrops(); });
  else { wireCrumb(); injectDrops(); }
})();
