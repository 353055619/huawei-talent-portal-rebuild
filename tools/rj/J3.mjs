/* J3 学生学习 · 真实操作时间线 */
export default {
  id: 'J3', name: '学生学习', persona: '学生',
  summary: '6 步 · 第 3 跳才到学习器 · 学习记录断档',
  outro: '从首页到开始学习要跨 3 个页面 + 第 6 套子系统，学习记录还断档。',
  start: 'index.html',
  steps: [
    { caption: '发现课程', detail: '首页热门课程 / 学习频道三视图 + 筛选',
      async run(page, ui) {
        await ui.hover('.Course-item', undefined, 600);                                // 真实悬停卡片（hover 态）
        await ui.act('.nav-item', { text: '学习', dwell: 600 });
        await ui.url('**/learning.html');
        await ui.act('.collapsible-title', { text: '专业', dwell: 800 });              // 真实点筛选器
        await ui.scrollBy(260);
      }, dwell: 700 },

    { caption: '查看详情', detail: '课程详情：目录树 / 能力目标 / 团队（跨 SPA 第 2 套界面）',
      async run(page, ui) {
        await ui.act('.course-image-box', { dwell: 600 });                             // 真实点课程卡 → 详情
        await ui.url('**/course-detail.html');
        await ui.act('.ct-node', { text: '第一部分', focus: true, dwell: 1000 });      // 展开目录
        await ui.scrollBy(300);
      }, dwell: 800 },

    { caption: '报名', detail: '「报名」按钮 —— 未登录时点击零反馈（现网缺陷如实呈现）', flag: '断点：零反馈', break: true,
      async run(page, ui) {
        await ui.go('learning.html', 800);
        await ui.act('.button-register', { focus: true, dwell: 1100 });                // 真实点击：无任何反馈
        await ui.act('.button-register', { dwell: 900 });                              // 再点一次：依然无反馈
      }, dwell: 800 },

    { caption: '去学习', detail: '登录后「去学习」→ 真实报名入班 → 跳我的课程', flag: '断点：第 6 套子系统', break: true,
      async run(page, ui) {
        await ui.go('course-detail.html', 800);
        await ui.act('.btn-go-study', { dwell: 600 });                                 // 未登录 → 真实跳登录页
        await ui.url('**/login.html');
        await ui.act('.field.first input', { type: 'hw_demo_student_01', dwell: 300 });
        await ui.act('.field.pwd input', { type: 'demo123456', dwell: 300 });
        await ui.act('.login-btn', { dwell: 500 });
        await ui.url('**/uc-home.html');
        await ui.act('.nav-item', { text: '学习', dwell: 600 });                       // 回课程详情再点去学习
        await ui.url('**/learning.html');
        await ui.act('.course-image-box', { dwell: 600 });
        await ui.url('**/course-detail.html');
        await ui.act('.btn-go-study', { focus: true, dwell: 800 });                    // 真实报名 → toast → 跳我的课程
        await ui.url('**/uc-mycourse.html');
      }, dwell: 700 },

    { card: { kind: 'external', url: 'outPage/sxz 学习器（e.huawei.com 子应用）', title: '「去学习」新开标签 → 学习器', desc: '报名后进入学习器 —— 第 3 跳 + 第 6 套子系统。',
        bullets: ['目录进度（已完成百分比）', '课件下载走 backplatform', '电子书外链 GitCode'] } },

    { caption: '学习记录', detail: '「我的课程」公告：平台升级，建议前往【学习】页面重新学习', flag: '断点：记录断档', break: true,
      async run(page, ui) {
        await page.waitForTimeout(900);                                                // 实时列表渲染（含刚报名的课程）
        await ui.scrollBy(140);
      }, dwell: 1500 },
  ],
};
