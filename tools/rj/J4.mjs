/* J4 学生认证考试 · 真实操作时间线（Playwright 驱动真实页面+真实后端）
 * 步骤结构: { caption, detail, flag?, break?, dwell?, card?:{kind,title,desc,bullets,note,dwell}, run: async (page, ui) => {} }
 */
export default {
  id: 'J4', name: '学生认证考试', persona: '学生',
  summary: '7 步 · 3 套系统布局 · 2 处渲染缺陷',
  outro: '一条认证之路：全景图 → 券包 → 空白申请页 → 外部 VUE → 第三布局查证书 → 再跳 mypace。',
  start: 'index.html',
  steps: [
    { caption: '了解认证', detail: '认证频道 HCIA/IP/IE 全景与方向',
      async run(page, ui) {
        await ui.act('.nav-item', { text: '认证', dwell: 600 });                       // 真实点导航进认证频道
        await ui.url('**/cert.html');
        await ui.act('.pan-live', { dwell: 1000 });                                    // 真实悬停全景区
        await ui.scrollBy(400);
      }, dwell: 1300 },

    { caption: '实名认证', detail: '个人信息 → 实名认证（点击仅改 URL，内容不渲染）', flag: '断点：渲染异常', break: true,
      async run(page, ui) {
        await ui.act('.topbar-right .tool', { text: '登录/注册', dwell: 500 });        // 真实登录学生账号
        await ui.url('**/login.html');
        await ui.act('.field.first input', { type: 'hw_demo_student_01', dwell: 300 });
        await ui.act('.field.pwd input', { type: 'demo123456', dwell: 300 });
        await ui.act('.login-btn', { dwell: 500 });
        await ui.url('**/uc-home.html');
        await ui.act('.uc-cards .item', { text: '个人信息', dwell: 800 });
        await ui.url('**/uc-myinfo.html');
        await ui.act('.m-btn', { text: '实名认证', focus: true, dwell: 1100 });        // 现网缺陷：点击零反应（如实呈现）
        await ui.act('.m-btn', { text: '实名认证', dwell: 900 });                      // 点两次：依然无反应
      }, dwell: 1500 },

    { caption: '获得考券', detail: '学校/IASC 发放 → 我的券包（暗码/数字考券 + 24h/HCIE 7 天规则）',
      async run(page, ui) {
        await ui.go('uc-mycoupons.html', 800);                                         // 从用户中心进入券包
        await ui.scrollBy(500);                                                        // 展示考券规则区
      }, dwell: 1800 },

    { caption: '申请考券（可选）', detail: '考券申请页 voucher/application —— 空白页', flag: '断点：空白页', break: true,
      async run(page, ui) {
        await ui.go('uc-voucher-app.html', 900);                                       // 真实到达空白页
      }, dwell: 2400 },

    { card: { kind: 'external', url: 'home.pearsonvue.com/huawei', title: '预约考试 → Pearson VUE',
        desc: '考试预约跳转 Pearson VUE 外部系统完成，本站只保留记录。',
        note: '笔试全部由 Pearson VUE 代理；HCIE 实验考另需提前 7 个自然日预约。' } },

    { caption: '查证书', detail: 'talent/#/personal/mycert —— 另一套子应用布局', flag: '断点：第三布局', break: true,
      async run(page, ui) {
        await ui.go('uc-mycert.html', 900);                                            // 真实进入第三布局证书页
      }, dwell: 2400 },

    { card: { kind: 'external', url: 'mypace.huawei.com', title: '证书企业关联 → mypace 第三系统',
        desc: '证书「企业关联」再跳 mypace 系统；变更间隔限制 12 个月。' } },
  ],
};
