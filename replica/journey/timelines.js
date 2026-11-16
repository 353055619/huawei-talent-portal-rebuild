/* 华为人才在线 · 全量用户旅程时间线 v2（点击驱动版）
 * 数据来源：survey/journeys.json（research/00/05/07 一手勘察）
 * 页面步 { page, via:{sel,text}(换页前在当前页的入口点击), caption, detail, flag, break, acts:[...], dwell }
 * 动作类型：{sel,text,focus,click,type,nav,dwell} {scrollBy:像素} —— nav=点击后换页
 * 插卡步 { kind: 'external'|'offline'|'cut'|'info', ... }
 * 无 acts 的页面步会自动补"阅读滚动"手势，避免画面静止。
 */
const TIMELINES = {

J1: {
  name: '学校入驻', persona: '二级学院管理员',
  summary: '8 步 · 跨 3 套系统 + 2 处线下 · 全程约数周',
  outro: '入驻在伙伴系统完成，管理却回到人才在线用户中心 —— 两套系统互不相认。',
  steps: [
    { page: '../ict-academy.html', caption: '发现入口', detail: 'ICT学院首页「立即注册」按钮',
      acts: [
        { scrollBy: 900 },
        { sel: '.join-btn', text: '立即注册', focus: true, dwell: 1300 },
      ], dwell: 1200 },
    { kind: 'external', url: 'partner.huawei.com/eplusweb/', newTab: true, flag: '外部系统',
      title: '新开标签页 → 华为伙伴系统', desc: '「立即注册」不在人才在线内完成，而是新开标签页跳转到 partner.huawei.com（另一套系统）。',
      bullets: ['门户与入驻系统账号、界面、流程完全分离', '调研实测：一次会话轻松累积 7+ 个标签页'],
      caption: '新开标签跳 partner.huawei.com', detail: '跨出人才在线门户' },
    { page: '../login.html', caption: '华为账号注册/登录', detail: 'uniportal.huawei.com 华为统一账号（第 2 套界面）',
      acts: [
        { sel: 'input[type=text]', type: 'hw_3530', dwell: 800 },
        { sel: '.field.pwd input', focus: true, dwell: 900 },
      ], dwell: 1400 },
    { kind: 'offline', flag: '线下步骤', title: '下载《伙伴管理员授权函》并盖章', desc: '下载授权函 → 打印 → 盖二级学院公章 → 扫描。全程线下，无任何线上校验。',
      bullets: ['纯线下步骤，系统只收扫描件', '无学信网/学校 SSO 等可信认证'],
      caption: '下载授权函盖章', detail: '盖二级学院公章（线下）' },
    { kind: 'external', url: 'partner.huawei.com/eplusweb/', newTab: false, flag: '外部系统',
      title: 'metaEcpri 填报注册信息、上传扫描件', desc: '回到伙伴系统填写注册信息、上传盖章扫描件，提交。',
      caption: '填报上传', detail: 'metaEcpri 填注册信息传扫描件' },
    { kind: 'cut', flag: '体验断点', title: '邮件等待审批 —— 无站内进度', desc: '提交后只能等邮件。站内没有任何进度页面，审批到哪一步、卡在哪完全不可见。',
      note: '调研缺陷：入驻 8 步中 5 步发生在站外或线下，站内可感知进度为 0。',
      bullets: ['无站内进度查询', '无审批状态通知（除邮件）'], dwell: 3400,
      caption: '邮件等审批', detail: '无站内进度' },
    { kind: 'external', url: 'partner.huawei.com/eplusweb/', newTab: false, flag: '外部系统',
      title: '在线签署校企合作协议', desc: '审批通过后，仍在 metaEcpri 在线签署校企合作协议。',
      caption: '在线签校企合作协议', detail: 'metaEcpri 在线签署' },
    { kind: 'info', flag: '评审分级', title: '认证分级与挂牌', desc: '认证级 / 优选级 / 领先级三级评审，authenApply 页面查询进度。',
      bullets: ['认证级 → 优选级 → 领先级', '评审周期以月计'], dwell: 2800,
      caption: '认证分级与挂牌', detail: '认证级/优选级/领先级评审；authenApply 查进度' },
    { page: '../uc-home.html', via: { sel: '.login-btn' }, caption: '入驻后管理', detail: '回到人才在线用户中心管理（与入驻系统分离）',
      break: true, flag: '断点：跨系统回切',
      acts: [{ sel: '.uc-cards .item', dwell: 1400 }], dwell: 1800 },
  ],
},

J2: {
  name: '教师开班', persona: 'ICT学院教师',
  summary: '6 步 · 开班入口藏在课程页 · 邀请码靠线下发',
  outro: '班级组织没有自动化：建班在课程页、发码在线下、进度无成绩册。',
  steps: [
    { page: '../uc-home.html', caption: '注册关联讲师身份', detail: '用户中心 → 个人信息 →「关联-讲师」自填向导（国家/学院/专业/学历/班级/学号/备注）',
      acts: [
        { sel: '.uc-cards .item', text: '个人信息', focus: true, dwell: 900, nav: '../uc-myinfo.html' },
        { sel: '.m-btn.primary', text: '关联-讲师', focus: true, dwell: 1200 },
        { sel: '.m-btn.primary', text: '关联-讲师', dwell: 1000 },
      ], dwell: 1500 },
    { kind: 'info', flag: '等待审批', title: '学院审批', desc: '关联提交后等学院/平台确认（approval-details 路由）。无学校可信认证，全靠自填 + 审批；姓名确定后不可修改。',
      note: '一手复验（2026-11-15）：关联-讲师点击后无任何弹层渲染。',
      bullets: ['无学校 SSO / 学信网式可信认证', '姓名「确定后将无法修改」'], dwell: 3200,
      caption: '学院审批', detail: '等学院/平台确认' },
    { page: '../learning.html', via: { sel: '.nav-item', text: '学习' }, caption: '选课找开班入口', detail: '课程详情页「我是老师-我要开班」按钮 —— 入口藏在课程页非工作台',
      break: true, flag: '断点：入口藏在课程页',
      acts: [
        { sel: '.collapsible-title', text: '专业', dwell: 800 },
        { sel: '.course-image-box', dwell: 700, nav: '../course-detail.html' },
        { scrollBy: 500 },
        { sel: '.btn-open-class', focus: true, dwell: 1500 },
      ], dwell: 1500 },
    { kind: 'info', flag: '开班', title: '创建班级 · 生成邀请码', desc: '点击开班后创建班级，系统生成班级邀请码。',
      caption: '创建班级', detail: '生成邀请码' },
    { kind: 'offline', flag: '线下步骤', title: '线下发码', desc: '把邀请码用微信/QQ 等方式发给学生，学生凭码加入班级。',
      note: '没有班级组织自动化：无通知、无名单导入、无批量拉人。',
      caption: '线下发码', detail: '把邀请码发给学生' },
    { page: '../uc-myclass-list.html', via: { sel: '.uc-account' }, caption: '学生进班', detail: '学生凭码加入；教师无学员进度视图',
      break: true, flag: '断点：无成绩册', dwell: 2600 },
  ],
},

J3: {
  name: '学生学习', persona: '学生',
  summary: '6 步 · 第 3 跳才到学习器 · 学习记录断档',
  outro: '从首页到开始学习要跨 3 个页面 + 第 6 套子系统，学习记录还断档。',
  steps: [
    { page: '../index.html', caption: '发现课程', detail: '首页热门课程 / 学习频道三视图+筛选',
      acts: [
        { sel: '.Course-item', focus: true, dwell: 1100 },
        { sel: '.nav-item', text: '学习', dwell: 600, nav: '../learning.html' },
        { sel: '.collapsible-title', text: '专业', dwell: 800 },
      ], dwell: 1200 },
    { page: '../course-detail.html', via: { sel: '.course-image-box' }, caption: '查看详情', detail: '课程详情：目录树 / 能力目标 / 团队',
      acts: [
        { sel: '.ct-node', text: '第一部分', focus: true, dwell: 1200 },
        { scrollBy: 300 },
      ], dwell: 1400 },
    { page: '../learning.html', via: { sel: '.cd-crumb', text: '学习' }, caption: '报名', detail: '「报名」按钮 —— 未登录时点击零反馈',
      break: true, flag: '断点：未登录零反馈',
      acts: [
        { sel: '.button-register', focus: true, dwell: 1100 },
        { sel: '.button-register', dwell: 1000 },
      ], dwell: 1600 },
    { page: '../course-detail.html', via: { sel: '.course-image-box' }, caption: '去学习', detail: '「去学习」新开标签 → outPage/sxz 学习器（第 3 跳 + 第 6 套子系统）',
      break: true, flag: '断点：第 6 套子系统',
      acts: [
        { sel: '.cd-go', focus: true, dwell: 1400 },
      ], dwell: 1200 },
    { kind: 'external', url: 'e.huawei.com/cn/talent/outPage/#/sxz-course', newTab: true, flag: '外部系统',
      title: '「去学习」新开标签 → 学习器', desc: '报名后点「去学习」跳 outPage/sxz 学习器 —— 第 3 跳 + 第 6 套子系统。',
      bullets: ['目录进度（已完成百分比）', '课件下载走 backplatform', '电子书外链 GitCode'], dwell: 3200,
      caption: '学习与课件', detail: '目录进度/课件下载（backplatform）/电子书（GitCode 外链）' },
    { page: '../uc-mycourse.html', via: { sel: '.uc-account' }, caption: '学习记录', detail: '「我的课程」公告：平台升级，建议前往【学习】页面重新学习',
      break: true, flag: '断点：记录断档',
      scrollSel: '*', scrollText: '平台升级', dwell: 2600 },
  ],
},

J4: {
  name: '学生认证考试', persona: '学生',
  summary: '7 步 · 3 套系统布局 · 2 处渲染缺陷',
  outro: '一条认证之路：全景图 → 券包 → 空白申请页 → 外部 VUE → 第三布局查证书 → 再跳 mypace。',
  steps: [
    { page: '../cert.html', caption: '了解认证', detail: '认证频道 HCIA/IP/IE 全景与方向',
      acts: [
        { sel: '.pan-live', dwell: 1000 },
        { scrollBy: 400 },
      ], dwell: 1300 },
    { page: '../uc-myinfo.html', via: { sel: '.topbar-right .tool', text: '登录' }, caption: '实名认证', detail: '个人信息 → 实名认证（点击仅改 URL，内容不渲染）',
      break: true, flag: '断点：渲染异常',
      acts: [
        { sel: '.m-btn', text: '实名认证', focus: true, dwell: 1100 },
        { sel: '.m-btn', text: '实名认证', dwell: 900, nav: '../uc-realinfo.html' },
      ], dwell: 1500 },
    { page: '../uc-mycoupons.html', via: { sel: '.uc-account' }, caption: '获得考券', detail: '学校/IASC 发放 → 我的券包（暗码/数字考券 + 24h/HCIE 7 天规则）',
      acts: [
        { scrollBy: 500 },
      ],
      scrollSel: '*', scrollText: '暗码考券有效期', dwell: 1800 },
    { page: '../uc-voucher-app.html', via: { sel: '.uc-account' }, caption: '申请考券（可选）', detail: '考券申请页 voucher/application —— 空白页',
      break: true, flag: '断点：空白页', dwell: 2400 },
    { kind: 'external', url: 'home.pearsonvue.com/huawei', newTab: true, flag: '外部系统',
      title: '预约考试 → Pearson VUE', desc: '考试预约跳转 Pearson VUE 外部系统完成，本站只保留记录。',
      note: '笔试全部由 Pearson VUE 代理；HCIE 实验考另需提前 7 个自然日预约。',
      caption: '预约考试', detail: '跳 Pearson VUE 外部系统' },
    { page: '../uc-mycert.html', via: { sel: '.uc-account' }, caption: '查证书', detail: 'talent/#/personal/mycert —— 另一套子应用布局',
      break: true, flag: '断点：第三布局', dwell: 2400 },
    { kind: 'external', url: 'mypace.huawei.com', newTab: true, flag: '外部系统',
      title: '证书企业关联 → mypace 第三系统', desc: '证书「企业关联」再跳 mypace 系统；变更间隔限制 12 个月。',
      caption: '企业关联（可选）', detail: '证书企业关联跳 mypace 第三系统；变更间隔 12 个月' },
  ],
},

J5: {
  name: '学生参赛（ICT 大赛）', persona: '学生/教师',
  summary: '6 步 · 资料非结构化 · 三个外域 · 无晋级看板',
  outro: '从了解赛道到看进度：手册是 PDF、省赛在外域考试系统、「我的大赛」是空页面。',
  steps: [
    { page: '../contest.html', caption: '了解赛道', detail: '大赛频道 7 条赛道 + 分区（中国区/海外）',
      acts: [
        { sel: '.tk', text: '实践赛', focus: true, dwell: 1000 },
        { sel: '.tk', text: '算子赛', dwell: 800 },
        { scrollBy: 500 },
      ], dwell: 1300 },
    { kind: 'info', flag: '资料下载', title: '大赛手册 / 路演胶片', desc: '手册与路演资料是 PDF 附件下载（filepreview 链接），非结构化页面。',
      note: '断点：资料非结构化 —— 报名关键信息藏在 PDF 里。',
      caption: '下载手册', detail: '大赛手册/路演胶片为 PDF 附件' },
    { page: '../contest.html', caption: '报名', detail: '线上报名（分区入口 · 截止后仅显示已结束）',
      acts: [
        { sel: '.zn-btn', text: '查看详情', focus: true, dwell: 1300 },
      ], dwell: 1400 },
    { kind: 'external', url: 'shixizhi.huawei.com/iexam', newTab: true, flag: '外部系统',
      title: '省资格赛 → iexam 外域考试系统', desc: '省资格赛测试链接跳 shixizhi.huawei.com/iexam —— 第 7 套系统。',
      caption: '省资格赛', detail: '链接跳 shixizhi.huawei.com/iexam 外域' },
    { kind: 'external', url: 'survey.huaweicloud.com / edu.huaweicloud.com', newTab: true, flag: '外部系统',
      title: '问卷 / 活动再跨两域', desc: '问卷走 survey.huaweicloud.com，活动走 edu.huaweicloud.com，又是两个外部域。',
      caption: '问卷/活动', detail: 'survey.huaweicloud.com / edu.huaweicloud.com 外域' },
    { page: '../uc-mycomp.html', via: { sel: '.uc-account' }, caption: '看进度', detail: '「我的大赛」—— 空页面，无晋级看板',
      break: true, flag: '断点：无晋级看板', dwell: 2600 },
  ],
},

J6: {
  name: '就业双选（断头路）', persona: '学生',
  summary: '宣传里存在 · 线上找不到 · 旅程终止',
  outro: '生态价值链的最后一公里，在线上是断的。',
  steps: [
    { page: '../ict-academy.html', caption: '被宣传触达', detail: 'ICT学院页文案：每年数十场双选会、1000+企业、近千岗位',
      scrollSel: '.adv-card', scrollText: '优先就业',
      acts: [{ scrollBy: 200 }], dwell: 2600 },
    { page: '../index.html', via: { sel: '.hw-logo' }, caption: '找入口', detail: '回门户搜「双选会」—— 全站没有双选会/岗位/投递功能入口',
      break: true, flag: '断点：无功能入口',
      acts: [
        { sel: '.nav-search input', type: '双选会', dwell: 500, nav: '../search-results.html' },
        { scrollBy: 300 },
      ], dwell: 2200 },
    { kind: 'cut', flag: '旅程终止', title: '无下一步 —— 就业对接线上断头路', desc: '搜索结果只有资讯与课程，没有任何双选会报名/岗位投递功能。宣传称每年数十场双选会、1000+ 合作招聘企业、近千岗位；但全站没有线上入口。',
      bullets: ['公开页面无双选会专区入口', '无企业招聘端', '无院校管理端入口'], dwell: 3800,
      caption: '（无下一步）', detail: '生态价值链最后一公里在线上是断的' },
  ],
},

J7: {
  name: '商城购课/代金券（跨系统）', persona: '个人学习者',
  summary: '3 步 · 外链第 2 系统 · 登录态反复中断',
  outro: '买课在另一套系统，学在人才在线 —— 上下文与登录态反复中断。',
  steps: [
    { page: '../index.html', caption: '导航点商城', detail: '顶部导航「商城」—— 新开标签到 elearning.huawei.com',
      break: true, flag: '断点：外链第 2 系统',
      acts: [
        { sel: '.nav-item', text: '商城', focus: true, dwell: 1300 },
      ], dwell: 1300 },
    { kind: 'external', url: 'elearning.huawei.com/cn/homepage', newTab: true, flag: '外部系统',
      title: '新开标签 → 华为认证官网（elearning）', desc: '商城入口新开标签打开 elearning.huawei.com —— 华为认证官网/商城，另一套系统。',
      bullets: ['购课 / 代金券 / 考试券购买都在该系统', '与人才在线账号体系互通但上下文不通'], dwell: 3200,
      caption: '浏览认证官网/商城', detail: '华为认证官网（购课/代金券/考试券）' },
    { page: '../index.html', caption: '回到人才在线', detail: '上下文与登录态反复中断 —— 7+ 系统碎片化全景的一环',
      break: true, flag: '7+ 系统碎片化', dwell: 2400 },
  ],
},

};
