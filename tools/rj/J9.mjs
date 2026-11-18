/* J9 企业培训对接 · 真实操作时间线（Playwright 驱动真实页面）
 * 结构照 J2/J3。文案口径: survey/modules-combined.json # tal-corporate
 */
export default {
  id: 'J9', name: '企业培训对接', persona: '企业培训负责人',
  summary: '4 步 · 1 断点 · 企业端在本站零功能实体',
  outro: '导航「企业培训」点击无本站反应，真实落点是 elearning.huawei.com 外域；用户中心无任何企业侧记录。',
  start: 'index.html',
  steps: [
    { caption: '导航点「企业培训」', detail: '顶部导航真实 hover + 点击——本站无任何反应（现网为"新开标签外域"忠实死点）', flag: '断点：导航死点', break: true,
      async run(page, ui) {
        await ui.hover('.nav-item', '企业培训', 800);                                  // 真实悬停：无下拉（该项无子菜单）
        await ui.act('.nav-item', { text: '企业培训', focus: true, dwell: 1100 });     // 真实点击：站内零反应
        await ui.act('.nav-item', { text: '企业培训', dwell: 900 });                   // 再点一次：依然无反应
      }, dwell: 900 },

    { card: { kind: 'external', url: 'elearning.huawei.com/cn/homepage（企业培训/认证官网）', title: '企业培训落点 → elearning 外域', desc: '现网该入口真实行为是新开标签跳出独立系统 elearning.huawei.com——与「培训伙伴」HALP 落地同源，corporate 子应用路由虽存活但内容已被外链替代。',
        bullets: ['企业培训功能实体全部在 elearning', '本站 corporate 频道无自有页面'],
        note: '两套入口同 URL：企业客户与培训伙伴在本站无差异承接。' } },

    { caption: '登录查企业侧记录', detail: '登录人才在线：用户中心功能卡里翻找企业培训相关视图',
      async run(page, ui) {
        await ui.act('.topbar-right .tool', { text: '登录/注册', dwell: 600 });        // 真实进登录页
        await ui.url('**/login.html');
        await ui.act('.field.first input', { type: 'hw_demo_student_01', dwell: 320 });
        await ui.act('.field.pwd input', { type: 'demo123456', dwell: 320 });
        await ui.act('.login-btn', { dwell: 500 });                                    // 真实登录
        await ui.url('**/uc-home.html');
        await ui.scrollBy(220);                                                        // 展示全部功能卡
      }, dwell: 800 },

    { caption: '确认企业侧零实体', detail: '我的班级 / 我的课程 / 个人信息……没有任何企业培训、采购或员工管理卡片', flag: '断点：企业端零实体', break: true,
      async run(page, ui) {
        await ui.act('.uc-cards .item', { text: '我的课程', focus: true, dwell: 900 }); // 逐卡确认：只有个人学习视图
        await ui.url('**/uc-mycourse.html');
        await ui.scrollBy(200);
        await ui.act('.uc-account', { dwell: 700 });                                    // 顶栏账号 chip 真实回用户中心
        await ui.url('**/uc-home.html');
        await ui.act('.uc-cards .item', { text: '我的班级', focus: true, dwell: 1000 }); // 无企业账号/员工批量视角
      }, dwell: 1000 },
  ],
};
