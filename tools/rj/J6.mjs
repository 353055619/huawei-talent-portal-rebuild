/* J6 就业双选（断头路） · 真实操作时间线（Playwright 驱动真实页面+真实后端）
 * 步骤结构: { caption, detail, flag?, break?, dwell?, card?:{kind,title,desc,bullets,note,dwell}, run: async (page, ui) => {} }
 */
export default {
  id: 'J6', name: '就业双选（断头路）', persona: '学生',
  summary: '宣传里存在 · 线上找不到 · 旅程终止',
  outro: '生态价值链的最后一公里，在线上是断的。',
  start: 'ict-academy.html',
  steps: [
    { caption: '被宣传触达', detail: 'ICT学院页文案：每年数十场双选会、1000+企业、近千岗位',
      async run(page, ui) {
        await ui.act('.adv-card', { dwell: 1200 });                                    // 停在宣传文案卡（不点击）
        await ui.scrollBy(200);
      }, dwell: 2600 },

    { caption: '找入口', detail: '回门户搜「双选会」—— 全站没有双选会/岗位/投递功能入口', flag: '断点：无功能入口', break: true,
      async run(page, ui) {
        await ui.go('index.html', 700);
        await ui.act('.nav-search input', { type: '双选会', enter: true, dwell: 1200 }); // 真实输入+回车：现网无反应（忠实死点）
        await ui.act('.nav-search input', { focus: true, dwell: 900 });                // 再 focus 一次：依然无反馈
      }, dwell: 2200 },

    { caption: '（无下一步）', detail: '生态价值链最后一公里在线上是断的',
      async run(page, ui) {
        await ui.go('search-results.html', 900);                                       // 模拟"新开标签"看搜索结果
        await ui.scrollBy(300);
      }, dwell: 1200 },

    { card: { kind: 'cut', title: '无下一步 —— 就业对接线上断头路',
        desc: '搜索结果只有资讯与课程，没有任何双选会报名/岗位投递功能。宣传称每年数十场双选会、1000+ 合作招聘企业、近千岗位；但全站没有线上入口。',
        bullets: ['公开页面无双选会专区入口', '无企业招聘端', '无院校管理端入口'], dwell: 3800 } },
  ],
};
