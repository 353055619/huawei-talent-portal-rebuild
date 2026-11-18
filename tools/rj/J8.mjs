/* J8 培训伙伴入驻 HALP · 真实操作时间线（Playwright 驱动真实页面）
 * 结构照 J2/J3：{ caption, detail, flag?, break?, dwell?, card?, run }
 * 文案口径: survey/modules-combined.json # tal-halp
 */
export default {
  id: 'J8', name: '培训伙伴入驻 HALP', persona: '商业培训伙伴 / HCSI 讲师',
  summary: '5 步 · 2 断点 · 入驻与班级管理全在站外',
  outro: 'HALP 频道只有介绍与资讯；入驻申请外跳 partner.huawei.com，班级管理在人才在线用户中心无视图。',
  start: 'halp.html',
  steps: [
    { caption: '了解 HALP 计划', detail: 'HALP 频道：三入口条（入驻 / 讲师专区 / 教学管理）+ 计划介绍区',
      async run(page, ui) {
        await ui.act('.nav-item', { text: '培训伙伴', dwell: 700 });                   // 真实导航进 HALP 频道
        await ui.url('**/halp.html');
        await ui.hover('.hr-item', undefined, 700);                                    // hero 三入口条：成为伙伴/讲师专区/教学管理
        await ui.scrollBy(360);                                                        // HALP 介绍区（授权定义文案）
        await ui.act('.hi-btns .btn-red', { text: '查找HALP伙伴', focus: true, dwell: 800 });
        await ui.scrollBy(320);                                                        // 资讯公告区
      }, dwell: 800 },

    { card: { kind: 'external', url: 'partner.huawei.com（华为伙伴入驻门户）', title: '入驻申请新开标签 → 伙伴门户', desc: '「成为华为授权培训服务伙伴：注册/认证/续认证」入口不通本站流程，点击新开标签跳 partner.huawei.com 外域提交。',
        bullets: ['注册 / 认证 / 续认证全生命周期在伙伴门户', '本站无入驻表单、无进度回显'] },
      dwell: 700 },

    { card: { kind: 'offline', title: '资质审批 · 线下周期', desc: '提交后资质审核走华为渠道体系线下流转：结果靠邮件与伙伴经理对接，站内无审批状态页。',
        bullets: ['审核周期以周计', '无站内进度查询入口'],
        note: '对比思科 ASC：同样线下，但华为侧连申请回执都不回写本站。' } },

    { caption: '找 HALP 伙伴与资讯', detail: '回到频道页：查找HALP伙伴按钮 + 资讯公告区（公告停在 2023，更新停滞）', flag: '断点：公告停更', break: true,
      async run(page, ui) {
        await ui.scrollBy(-560);                                                       // 回到介绍区按钮位
        await ui.act('.hi-btns .btn-red', { focus: true, dwell: 800 });                // 「了解更多」焦点展示：无后续站内页
        await ui.scrollBy(680);                                                        // 滚到资讯公告列表
        await ui.act('.more-link', { text: '查看更多', focus: true, dwell: 900 });     // 最新公告停在 2023 年
      }, dwell: 800 },

    { caption: '找 HALP 班级管理', detail: '登录态用户中心翻遍功能卡：无 HALP / 教学管理视图', flag: '断点：无 HALP 视图', break: true,
      async run(page, ui) {
        await ui.go('uc-home.html', 900);                                              // 模拟新开标签回用户中心
        await ui.act('.uc-cards .item', { text: '我的班级', focus: true, dwell: 900 }); // 用户中心只有学生/教师视图
        await ui.scrollBy(200);                                                        // 翻遍卡片：无 HALP 开班/招生入口
      }, dwell: 900 },
  ],
};
