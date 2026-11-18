/* J7 商城购课/代金券（跨系统） · 真实操作时间线（Playwright 驱动真实页面+真实后端）
 * 步骤结构: { caption, detail, flag?, break?, dwell?, card?:{kind,title,desc,bullets,note,dwell}, run: async (page, ui) => {} }
 */
export default {
  id: 'J7', name: '商城购课/代金券（跨系统）', persona: '个人学习者',
  summary: '3 步 · 外链第 2 系统 · 登录态反复中断',
  outro: '买课在另一套系统，学在人才在线 —— 上下文与登录态反复中断。',
  start: 'index.html',
  steps: [
    { caption: '导航点商城', detail: '顶部导航「商城」—— 新开标签到 elearning.huawei.com', flag: '断点：外链第 2 系统', break: true,
      async run(page, ui) {
        await ui.hover('.nav-item', '商城', 800);                                      // 真实悬停商城项
        await ui.act('.nav-item', { text: '商城', focus: true, dwell: 1300 });         // 现网点击无反应（"新开标签"忠实死点，如实呈现）
      }, dwell: 1300 },

    { card: { kind: 'external', url: 'elearning.huawei.com/cn/homepage', title: '新开标签 → 华为认证官网（elearning）',
        desc: '商城入口新开标签打开 elearning.huawei.com —— 华为认证官网/商城，另一套系统。',
        bullets: ['购课 / 代金券 / 考试券购买都在该系统', '与人才在线账号体系互通但上下文不通'], dwell: 3200 } },

    { caption: '回到人才在线', detail: '上下文与登录态反复中断 —— 7+ 系统碎片化全景的一环', flag: '7+ 系统碎片化', break: true,
      async run(page, ui) {
        await ui.go('index.html', 900);                                                // 回门户，展示碎片化文案
      }, dwell: 2400 },
  ],
};
