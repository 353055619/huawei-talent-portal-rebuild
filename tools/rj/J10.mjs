/* J10 查找 ICT 学院 · 真实操作时间线（Playwright 驱动真实页面）
 * 结构照 J2/J3。文案口径: survey/modules-combined.json # icta-find
 */
export default {
  id: 'J10', name: '查找ICT学院', persona: '学生 / 院校合作者',
  summary: '5 步 · 2 断点 · 查询表单真可用但结果区空白',
  outro: '筛选+名称检索表单真实提交，但查询结果区现网未渲染——学院信息卡（地址/层级/授权产品）无从展示，资质无从校验。',
  start: 'ict-academy.html',
  steps: [
    { caption: '进 ICT 学院频道', detail: '频道首页：角色入口 / 快捷卡 / 3500+ 学院数据条',
      async run(page, ui) {
        await ui.act('.nav-item', { text: '华为ICT学院', dwell: 700 });                // 真实导航
        await ui.url('**/ict-academy.html');
        await ui.scrollBy(300);                                                        // 快捷入口卡区
        await ui.hover('.quick-card', undefined, 600);                                 // 真实悬停「产学合作」卡（hover 态）
        await ui.scrollBy(300);                                                        // 数据统计条：110+ 国家 / 3,500+ 学院
      }, dwell: 700 },

    { caption: '导航下拉找「查找ICT学院」', detail: '真实下拉菜单：hover 华为ICT学院 → 点下拉项 → 真实跳转检索页',
      async run(page, ui) {
        await ui.hover('.nav-item', '华为ICT学院', 700);                               // 真实悬停展开下拉
        await ui.act('.nav-drop-item', { text: '查找ICT学院', dwell: 700 });           // 点下拉项
        await ui.url('**/find-academy.html');                                          // 真实跳转
        await ui.scrollBy(160);
      }, dwell: 700 },

    { caption: '填查询表单', detail: '伙伴类型（默认 ICT 学院）+ 伙伴层级下拉 + 名称模糊检索——必须至少一个条件',
      async run(page, ui) {
        await ui.hover('.fa-select', '请选择', 600);                                   // 伙伴层级下拉（第二个 .fa-select，hover 展开）
        await ui.act('.fa-opts a', { text: '认证级华为ICT学院', dwell: 700 });          // 真实选项（层级）
        await ui.act('.fa-field input', { type: '大学', dwell: 500 });                 // 名称模糊检索（现网"大学"返回 258 条）
        await ui.act('.fa-query', { click: true, dwell: 900 });                        // 真实点查询
      }, dwell: 800 },

    { caption: '看查询结果', detail: '结果区一片空白——现网未渲染缺陷，学院信息卡（地址/层级/授权产品）不出现', flag: '断点：结果空白', break: true,
      async run(page, ui) {
        await ui.scrollBy(220);                                                        // 滚到结果区
        await ui.act('.fa-blank', { focus: true, dwell: 1200 });                       // 空白区：无任何卡片渲染（如实呈现）
        await ui.act('.fa-query', { dwell: 900 });                                     // 再查一次：依然空白
      }, dwell: 1000 },

    { card: { kind: 'cut', title: '资质无从校验', desc: '结果区空白意味着：学院名/地址/网址/层级（认证级·优选级·领先级·双一流）/12 个技术方向授权产品全部无法展示——学生想核实一所"华为ICT学院"的真伪，站内无路。',
        note: '且不支持全量浏览/地图视图/地区筛选（对比思科 NetAcad Academy Locator）。' } },
  ],
};
