/* J1 学校入驻 · 真实操作时间线（Playwright 驱动真实页面+真实后端）
 * 步骤结构: { caption, detail, flag?, break?, dwell?, card?:{kind,title,desc,bullets,note,dwell}, run: async (page, ui) => {} }
 * 入驻主线在伙伴系统（站外）+ 线下盖章；站内只完成注册与登录态展示
 */
export default {
  id: 'J1', name: '学校入驻', persona: '二级学院管理员',
  summary: '9 步 · 跨 3 套系统 + 2 处线下 · 全程约数周',
  outro: '入驻在伙伴系统完成，管理却回到人才在线用户中心 —— 两套系统互不相认。',
  start: 'ict-academy.html',
  steps: [
    { caption: '发现入口', detail: 'ICT学院首页「立即注册」按钮',
      async run(page, ui) {
        await ui.scrollBy(900);                                                        // 滚到入驻宣传区
        await ui.act('.join-btn', { text: '立即注册', focus: true, dwell: 1300 });     // 真实 focus 入口按钮
      }, dwell: 1200 },

    { card: { kind: 'external', url: 'partner.huawei.com/eplusweb/', title: '新开标签页 → 华为伙伴系统',
        desc: '「立即注册」不在人才在线内完成，而是新开标签页跳转到 partner.huawei.com（另一套系统）。',
        bullets: ['门户与入驻系统账号、界面、流程完全分离', '调研实测：一次会话轻松累积 7+ 个标签页'] } },

    { caption: '华为账号注册/登录', detail: 'uniportal 华为统一账号（第 2 套界面）→ 真实注册自动登录',
      async run(page, ui) {
        await ui.go('login.html', 700);
        await ui.act('.login-links a', { text: '注册', dwell: 700 });                  // 真实点「注册」切注册页
        await ui.url('**/login-register.html');
        await ui.act('.field.first input', { type: 'hw_video_school_01', dwell: 320 });
        await ui.act('.field.pwd input', { type: 'demo123456', dwell: 320 });
        await ui.act('.field.pwd2 input', { type: 'demo123456', dwell: 320 });
        await ui.act('.login-btn', { dwell: 600 });                                    // 真实注册 → 自动登录
        await ui.url('**/uc-home.html');
      }, dwell: 1400 },

    { card: { kind: 'offline', title: '下载《伙伴管理员授权函》并盖章',
        desc: '下载授权函 → 打印 → 盖二级学院公章 → 扫描。全程线下，无任何线上校验。',
        bullets: ['纯线下步骤，系统只收扫描件', '无学信网/学校 SSO 等可信认证'] } },

    { card: { kind: 'external', url: 'partner.huawei.com/eplusweb/', title: 'metaEcpri 填报注册信息、上传扫描件',
        desc: '回到伙伴系统填写注册信息、上传盖章扫描件，提交。' } },

    { card: { kind: 'cut', title: '邮件等待审批 —— 无站内进度',
        desc: '提交后只能等邮件。站内没有任何进度页面，审批到哪一步、卡在哪完全不可见。',
        bullets: ['无站内进度查询', '无审批状态通知（除邮件）'],
        note: '调研缺陷：入驻 8 步中 5 步发生在站外或线下，站内可感知进度为 0。', dwell: 3400 } },

    { card: { kind: 'external', url: 'partner.huawei.com/eplusweb/', title: '在线签署校企合作协议',
        desc: '审批通过后，仍在 metaEcpri 在线签署校企合作协议。' } },

    { card: { kind: 'info', title: '认证分级与挂牌', desc: '认证级 / 优选级 / 领先级三级评审，authenApply 页面查询进度。',
        bullets: ['认证级 → 优选级 → 领先级', '评审周期以月计'], dwell: 2800 } },

    { caption: '入驻后管理', detail: '回到人才在线用户中心管理（与入驻系统分离）', flag: '断点：跨系统回切', break: true,
      async run(page, ui) {
        await ui.url('**/uc-home.html');                                               // 登录态已在（真实注册自动登录）
        await ui.act('.uc-cards .item', { dwell: 1400 });                              // 展示登录态顶栏 hw_video_school_01
      }, dwell: 1800 },
  ],
};
