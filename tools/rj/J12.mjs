/* J12 产学合作·众智 · 真实操作时间线（Playwright 驱动真实页面）
 * 结构照 J2/J3。文案口径: survey/modules-combined.json # icta-industry
 */
export default {
  id: 'J12', name: '产学合作·众智', persona: '高校科研团队',
  summary: '4 步 · 1 断点 · 众智/火花奖只在外域，申报记录无站内入口',
  outro: '频道页产学合作只有入口卡与案例展示；鲲鹏/昇腾众智、MindSpore 火花奖申报全在 edu.huaweicloud.com 外域，合作进度站内无踪。',
  start: 'ict-academy.html',
  steps: [
    { caption: '逛产学合作区', detail: 'ICT 学院频道：产学合作快捷卡（协同育人/案例展示）→ 成功案例区',
      async run(page, ui) {
        await ui.act('.nav-item', { text: '华为ICT学院', dwell: 700 });                // 真实导航
        await ui.url('**/ict-academy.html');
        await ui.act('.quick-card', { text: '产学合作', focus: true, dwell: 900 });    // 快捷卡：协同育人/案例展示（本站无落地页）
        await ui.scrollBy(760);                                                        // 滚到成功案例区
        await ui.hover('.story-feat', undefined, 700);                                 // 真实悬停案例大卡（hover 态）
        await ui.scrollBy(240);
      }, dwell: 800 },

    { card: { kind: 'external', url: 'edu.huaweicloud.com（昇腾众智 / MindSpore 火花奖申报）', title: '众智平台 / 火花奖申报 → 站外', desc: '鲲鹏众智、昇腾众智计划（框架协议+课题子协议、揭榜挂帅）与 MindSpore 火花奖面向高校科研团队，申报与课题管理全在 edu.huaweicloud.com 外域。',
        bullets: ['协同育人：智能基座 72 所高校 / 22 门专业课', '产业学院共建：鲲鹏/昇腾实训室外链'],
        note: '频道页是否聚合众智入口在现网未验证——本站只留文字与案例。' } },

    { caption: '找申报记录入口', detail: '登录态用户中心翻找：无产学合作 / 众智课题 / 火花奖任何视图', flag: '断点：无申报记录', break: true,
      async run(page, ui) {
        await ui.act('.topbar-right .tool', { text: '登录/注册', dwell: 600 });        // 真实登录（学生演示号即可见全功能卡）
        await ui.url('**/login.html');
        await ui.act('.field.first input', { type: 'hw_demo_student_01', dwell: 300 });
        await ui.act('.field.pwd input', { type: 'demo123456', dwell: 300 });
        await ui.act('.login-btn', { dwell: 500 });
        await ui.url('**/uc-home.html');
        await ui.scrollBy(220);
        await ui.act('.uc-cards .item', { text: '我的大赛', focus: true, dwell: 1000 }); // 最接近的卡也只是大赛，无产学研视图
        await ui.scrollBy(220);
      }, dwell: 900 },

    { caption: '回频道页确认', detail: '产学合作在本站止于案例展示——协同育人/产业学院/众智三项全是外链，无回写', flag: '断点：合作无回写', break: true,
      async run(page, ui) {
        await ui.act('.nav-item', { text: '华为ICT学院', dwell: 700 });                // 回频道页最后确认
        await ui.url('**/ict-academy.html');
        await ui.act('.quick-card', { text: '产学合作', focus: true, dwell: 1000 });   // 入口卡即终点：无站内落地
      }, dwell: 800 },
  ],
};
