/* J5 学生参赛（ICT 大赛） · 真实操作时间线（Playwright 驱动真实页面+真实后端）
 * 步骤结构: { caption, detail, flag?, break?, dwell?, card?:{kind,title,desc,bullets,note,dwell}, run: async (page, ui) => {} }
 */
export default {
  id: 'J5', name: '学生参赛（ICT 大赛）', persona: '学生/教师',
  summary: '6 步 · 资料非结构化 · 三个外域 · 无晋级看板',
  outro: '从了解赛道到看进度：手册是 PDF、省赛在外域考试系统、「我的大赛」是空页面。',
  start: 'index.html',
  steps: [
    { caption: '了解赛道', detail: '大赛频道 7 条赛道 + 分区（中国区/海外）',
      async run(page, ui) {
        await ui.act('.nav-item', { text: '大赛', dwell: 600 });                       // 真实点导航进大赛频道
        await ui.url('**/contest.html');
        await ui.act('.tk', { text: '实践赛', focus: true, dwell: 1000 });             // 真实点赛道标签
        await ui.act('.tk', { text: '算子赛', dwell: 800 });
        await ui.scrollBy(500);
      }, dwell: 1300 },

    { card: { kind: 'info', title: '大赛手册 / 路演胶片', desc: '手册与路演资料是 PDF 附件下载（filepreview 链接），非结构化页面。',
        note: '断点：资料非结构化 —— 报名关键信息藏在 PDF 里。' } },

    { caption: '报名', detail: '线上报名（分区入口 · 截止后仅显示已结束）',
      async run(page, ui) {
        await ui.scrollBy(700);                                                        // 滚到报名分区区
        await ui.act('.zn-link', { text: '查看详情', focus: true, dwell: 1300 });      // 真实 focus 报名入口
      }, dwell: 1400 },

    { card: { kind: 'external', url: 'shixizhi.huawei.com/iexam', title: '省资格赛 → iexam 外域考试系统',
        desc: '省资格赛测试链接跳 shixizhi.huawei.com/iexam —— 第 7 套系统。' } },

    { card: { kind: 'external', url: 'survey.huaweicloud.com / edu.huaweicloud.com', title: '问卷 / 活动再跨两域',
        desc: '问卷走 survey.huaweicloud.com，活动走 edu.huaweicloud.com，又是两个外部域。' } },

    { caption: '看进度', detail: '「我的大赛」—— 空页面，无晋级看板', flag: '断点：无晋级看板', break: true,
      async run(page, ui) {
        await ui.act('.topbar-right .tool', { text: '登录/注册', dwell: 500 });        // 真实登录学生账号
        await ui.url('**/login.html');
        await ui.act('.field.first input', { type: 'hw_demo_student_01', dwell: 300 });
        await ui.act('.field.pwd input', { type: 'demo123456', dwell: 300 });
        await ui.act('.login-btn', { dwell: 500 });
        await ui.url('**/uc-home.html');
        await ui.act('.uc-cards .item', { text: '我的大赛', dwell: 800 });             // 真实点卡片进我的大赛
        await ui.url('**/uc-mycomp.html');
      }, dwell: 2600 },
  ],
};
