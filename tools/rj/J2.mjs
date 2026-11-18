/* J2 教师开班 · 真实操作时间线（Playwright 驱动真实页面+真实后端）
 * 步骤结构: { caption, detail, flag?, break?, dwell?, card?:{kind,title,desc,bullets,note,dwell}, run: async (page, ui) => {} }
 * ui API: go/url/act(sel,{text,type,enter,click,dwell,focus})/hover/card/scrollBy/wait/loginAs/logout
 * 真实链路: nav-wiring 跳转 + app.js 表单 + server.mjs API（邀请码/班级为真实数据）
 */
let classCode = ''; // 第4步真实生成的邀请码，第6步学生凭码加入（跨步骤闭包传递）

export default {
  id: 'J2', name: '教师开班', persona: 'ICT学院教师',
  summary: '6 步 · 3 断点 · 邀请码线下传递',
  outro: '入口藏在课程详情页而非工作台；发码靠微信/QQ 线下；无学员进度/成绩册。',
  start: 'index.html',
  steps: [
    { caption: '注册关联讲师身份', detail: '华为账号登录 → 个人信息（关联-讲师为现网缺陷死点）',
      async run(page, ui) {
        await ui.act('.topbar-right .tool', { text: '登录/注册', dwell: 600 });      // 真实点击进登录页
        await ui.url('**/login.html');
        await ui.act('.field.first input', { type: 'hw_demo_teacher_01', dwell: 320 });
        await ui.act('.field.pwd input', { type: 'demo123456', dwell: 320 });
        await ui.act('.login-btn', { dwell: 500 });                                    // 真实登录
        await ui.url('**/uc-home.html');
        await ui.act('.uc-cards .item', { text: '个人信息', dwell: 900 });              // 进入个人信息
        await ui.url('**/uc-myinfo.html');
        await ui.act('.m-btn', { text: '关联-讲师', focus: true, dwell: 900 });         // 现网缺陷：点击零渲染（如实呈现）
      }, dwell: 900 },

    { card: { kind: 'info', title: '讲师身份需学院审批', desc: '关联讲师后由所在 ICT 学院审批——站内无审批入口，结果靠邮件/线下通知。',
        bullets: ['无讲师认证进度页', '审批流转在站外完成'] } },

    { caption: '选课找开班入口', detail: '课程详情页「我是老师-我要开班」—— 开班入口不在工作台', flag: '断点：入口藏在课程页', break: true,
      async run(page, ui) {
        await ui.act('.nav-item', { text: '学习', dwell: 600 });                       // 真实导航跳转
        await ui.url('**/learning.html');
        await ui.act('.course-image-box', { dwell: 700 });                             // 真实点课程卡
        await ui.url('**/course-detail.html');
        await ui.scrollBy(560);                                                        // 滚到角色分支区
        await ui.act('.btn-open-class', { focus: true, dwell: 600 });
      }, dwell: 700 },

    { caption: '创建班级 · 生成邀请码', detail: '弹窗输入班级名 → 创建（真实写入后台）→ 邀请码即时报出',
      async run(page, ui) {
        await ui.act('.app-kname', { type: 'Ascend C 2026 冬季班', dwell: 400 });       // 真实弹窗输入
        await ui.act('.app-mok', { dwell: 600 });                                      // 真实创建
        await ui.url('**/uc-myclass-list.html');
        await page.waitForTimeout(1100);                                               // 等实时块渲染
        classCode = await page.evaluate(() => {                                        // 读真实邀请码
          const m = document.body.textContent.match(/邀请码\s*([A-Z0-9]{6})/);
          return m ? m[1] : '';
        });
        await ui.scrollBy(120);
      }, dwell: 1200 },

    { card: { kind: 'offline', title: '线下发码', desc: '邀请码没有站内通知通道：教师把码用微信/QQ 发给学生，学生凭码加入班级。',
        note: '没有班级组织自动化：无通知、无名单导入、无批量拉人。' } },

    { caption: '学生进班', detail: '学生凭码加入 → 班级列表；无学员进度视图/成绩册', flag: '断点：无成绩册', break: true,
      async run(page, ui) {
        await ui.logout();                                                             // 真实退出教师账号
        await ui.act('.topbar-right .tool', { text: '登录/注册', dwell: 500 });
        await ui.url('**/login.html');
        await ui.act('.field.first input', { type: 'hw_demo_student_01', dwell: 300 });
        await ui.act('.field.pwd input', { type: 'demo123456', dwell: 300 });
        await ui.act('.login-btn', { dwell: 500 });
        await ui.url('**/uc-home.html');
        await ui.act('.uc-cards .item', { text: '我的班级', dwell: 700 });
        await ui.url('**/uc-myclass-list.html');
        await ui.act('input[placeholder="请输入班级邀请码"]', { type: classCode, dwell: 400 }); // 真实输入第4步生成的码
        await ui.act('.m-btn', { text: '加入', focus: true, dwell: 900 });             // 真实加入
      }, dwell: 1100 },
  ],
};
