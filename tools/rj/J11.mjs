/* J11 IASC 支持与讲师成长 · 真实操作时间线（Playwright 驱动真实页面）
 * 结构照 J2/J3。文案口径: survey/modules-combined.json # icta-iasc + icta-teacher
 */
export default {
  id: 'J11', name: 'IASC 支持与讲师成长', persona: 'ICT 学院教师',
  summary: '5 步 · 2 断点 · 关联讲师零渲染 + 认证进度无处查',
  outro: '教师身份第一步就卡在「关联-讲师」零渲染死点；IASC 四类支持只是介绍文案，HCAI 认证报名外跳，进度站内无处可查。',
  start: 'login.html',
  steps: [
    { caption: '教师登录 · 点「关联-讲师」', detail: '教师账号登录 → 个人信息点「关联-讲师」——现网缺陷：点击零渲染，点两次如实呈现', flag: '断点：零渲染', break: true,
      async run(page, ui) {
        await ui.act('.field.first input', { type: 'hw_demo_teacher_01', dwell: 320 });
        await ui.act('.field.pwd input', { type: 'demo123456', dwell: 320 });
        await ui.act('.login-btn', { dwell: 500 });                                    // 真实登录教师账号
        await ui.url('**/uc-home.html');
        await ui.act('.uc-cards .item', { text: '个人信息', dwell: 800 });              // 进个人信息
        await ui.url('**/uc-myinfo.html');
        await ui.act('.m-btn', { text: '关联-讲师', focus: true, dwell: 1000 });       // 真实点击：零渲染
        await ui.act('.m-btn', { text: '关联-讲师', dwell: 900 });                     // 再点一次：依然零渲染
      }, dwell: 900 },

    { caption: '看 IASC 四类支持', detail: 'ICT 学院频道「我需要IASC的支持」区：教师赋能 / 拓展支持 / 运营管理 / 活动支持',
      async run(page, ui) {
        await ui.act('.nav-item', { text: '华为ICT学院', dwell: 700 });                // 真实导航
        await ui.url('**/ict-academy.html');
        await ui.scrollBy(900);                                                        // 滚到 IASC 介绍区
        await ui.hover('.iasc-card', undefined, 700);                                  // 逐卡悬停：四类支持文案
        await ui.scrollBy(180);
        await ui.act('.iasc-btn-row .btn-ghost', { text: '查找IASC', focus: true, dwell: 900 });
      }, dwell: 800 },

    { card: { kind: 'external', url: 'HCAI 讲师认证 / TTT 培训报名（认证平台外域）', title: 'HCAI 认证与 TTT 报名 → 站外', desc: '讲师成长路径：课前测试 → 考取 HCIA → HCAI 线上学习与考试 → 拿证绑定院校；TTT 项目产出 HCIA+HCAI 双证。报名入口在站外认证平台，本站无表单。',
        bullets: ['HCAI = Huawei Certified Academy Instructor', 'TTT 双证：HCIA + HCAI'],
        note: '教师注册走 uniportal 统一账号，姓名确定后无法修改，无学校 SSO 式可信认证。' } },

    { caption: '查讲师认证进度', detail: '回到用户中心：翻遍功能卡，没有讲师认证 / HCAI 进度视图', flag: '断点：进度无处查', break: true,
      async run(page, ui) {
        await ui.go('uc-home.html', 900);                                              // 新开标签回用户中心
        await ui.scrollBy(200);
        await ui.act('.uc-cards .item', { text: '我的证书', focus: true, dwell: 1000 }); // 逐卡确认：无讲师认证/HCAI 视图
        await ui.scrollBy(220);
      }, dwell: 900 },
  ],
};
