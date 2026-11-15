# findings — ICT学院+大赛+HALP+成功案例+企业培训域（academy-contest）

> 勘察日期：2026-11-15。产出：`modules.json`（三层清单：平台 → 应用模块 → 功能，共 2 平台 / 12 模块 / 50 功能）。
> 状态分布：verified 45、inferred 4、copy-only 1。

## 1. 证据源

| 编号 | 来源 | 性质 | 可用性 |
|---|---|---|---|
| S1 | `research/00-现网系统信息架构笔记.md` | 2026-11-15 未登录+登录（账号 hw_353055619_qq.com_01）逐页一手记录 | 全文可用，本域主要证据 |
| S2 | `research/04-华为人才生态业务背景.md` | redirectConfig.js 还原 + 公开资料检索（业务背景、HCAI/IASC/智能基座/双选会口径） | 全文可用 |
| S3 | `research/05-重构调研总报告.md` | 旅程级补充（入驻 7 步、大赛外域考试、HALP 断更） | 关键词检索引用 |
| S4 | `https://r-h2.huaweistatic.com/s/hwtalent/lst/redirectConfig.js` | WebFetch 成功（2026-11-15），路由/子应用还原 | 成功，11 个子应用路由 |
| S5 | 4 个现网公开页 WebFetch | ict-academy/#/home、ict-academy/#/ict-contest、halp/#/home、success-stories/#/home | **全部 SPA 空壳，无渲染内容**（如实标注，未伪造） |
| S6 | `https://partner.huawei.com/eplusweb/#/cn/web/become-an-ict-academy` WebFetch | 学校入驻落点 | 空壳，仅返回 "Loading" |
| S7 | webReader 备选通道对 ict-academy/halp/success-stories 三页 | 仅取回 HTML meta 与 CSS 引用（确认 SPA 壳与静态资源域名 r-h2.huaweistatic.com/s/hwtalent/lst/） | 无渲染内容 |

**方法说明**：本域功能清单的事实主体来自 S1/S2（同日一手勘察），S4 提供 2026-11-15 当天的线上路由佐证；S5/S6 如实记录"SPA 静态抓取不可用"，不以推测冒充现网验证。

## 2. redirectConfig.js 还原结果（S4，2026-11-15 现网）

与本域相关的路由（原 path → redirectUrl）：

- `/ict-academy/home` → `/ict-academy/#/home`（ICT学院频道）
- `/ict/contest` → `/ict-academy/#/ict-contest`（ICT大赛，挂在 ict-academy 子应用下）
- `/ict/become-ict-student` → `/ict-academy/#/become-ict-student`（学生注册）
- `/halp/home` → `/halp/#/home`（HALP）
- `/corporate/home` → `/corporate/#/home`（**企业培训独立子应用存在**）
- `/success-stories` → `/success-stories/#/home`（成功案例）
- `/personal/mycompetition` → `/usercenter/#/home/myComp`（我的大赛）
- `/news/details` → `/news/#/details`（资讯详情）

其他：rootPath=`/portal/#/`；共 11 个子应用（portal/cert/news/halp/ict-academy/usercenter/learning/corporate/success-stories/mobile/search）。**文件中无 organization/search、无 become-ict-teacher/become-ict-academy 条目**（查找学院与教师入驻路由不在重定向配置内，入口为页面内链接/新标签）。

## 3. 模块级证据索引

### 平台：ICT学院（独立产品线，8 模块 33 功能）

| 模块 | 关键证据 |
|---|---|
| icta-home 频道首页与资源资讯聚合 | S1 §各频道要点>华为ICT学院（首页模块：课程目录、资源中心（课程/资料/工具）、ICT大赛、产学合作、资讯中心；数据 110+国家/3500+学院/11000+教师/年50万学生）；S1 §登录后>课程详情（ict-courses-detail：目录树/能力目标/课程团队；学生-去学习 / 老师-去学习+我要开班）；S2 §一.1（22 技术方向/14 门专业课程） |
| icta-join 学院入驻与合作 | S1 §补充发现>入驻旅程（"成为华为ICT学院"注册按钮 → uniportal → partner.huawei.com/eplusweb/#/cn/web/become-an-ict-academy，**入驻在伙伴系统、不在门户内**）；S1 §登录后>学校入驻（三步：授权函盖二级学院+公章 → metaEcpri 填表传扫描件邮件审批 → 在线签校企合作协议 → metaEcpri/#/authenApply 查进度 → 通过后回人才在线用户中心）；S2 §一.1（认证级→优选级→领先级逐年评审晋升）；S3 §旅程（7 步分解、跨 2 系统 3 应用）；S6（partner 页空壳 "Loading"） |
| icta-teacher 教师服务 | S1 §各频道要点（教师：注册关联/开班开课/资料下载）；S1 §登录后>学习器（课件下载学生版/老师版走 backplatform）；S1 §登录后>个人信息（角色关联-讲师向导：国家/学院/专业/学历/班级/学号，姓名确定后不可改，无 SSO）；S2 §一.1（HCAI 四步：课前测试→HCIA→HCAI 线上学习考试→院校绑定；TTT 双证）；S2 §一.5（智能基座奖教金，inferred） |
| icta-student 学生服务 | S1 §各频道要点（学生：注册关联/学习/资料下载）；S4（become-ict-student 路由）；S1 §登录后>个人信息（角色关联-学生向导）；S1 §登录后>学习器（outPage/#/sxz-course 第 6 套子系统：目录进度/课件下载/电子书外链 GitCode）；S1 §登录后>我的班级（邀请码进班是学生进班唯一方式） |
| icta-find 查找ICT学院 | S1 §补充发现>查找ICT学院（talent/#/organization/search?type=Academy：伙伴类型/层级/名称三条件；仅默认类型查询弹"请至少输入一个查询条件"，无全量浏览/地图/地区筛选；搜"大学"258 条：学院名/地址/网址/国家/层级（认证级、领先级·双一流）/授权产品 12 技术方向） |
| icta-iasc IASC 支持 | S1 §各频道要点（IASC：教师赋能/拓展支持/运营管理/活动支持）；S2 §一.1（Enablement/Development/Operation/Event Support 英文对应） |
| icta-industry 产学合作 | S1 §各频道要点（产学合作：协同育人/案例展示）；S2 §一.5（智能基座 72 校 22 门课+2.0 矩阵；鲲鹏/昇腾产业学院实训室共建；众智/火花计划 inferred）；S2 §五（edu.huaweicloud.com、edu.hicomputing.huawei.com 外链 URL） |
| icta-career 就业对接 | S1 §各频道要点（全球每年数十场双选会、1000+合作招聘企业、近千岗位，"优先就业"卖点）；S1 §初步观察3（**公开页面未见就业/双选会专区入口、无企业招聘端**）；S2 §一.4（双选会业务：长沙站 5000+ 岗位）→ 定级 copy-only |

### 平台：华为人才在线（本域 4 模块 17 功能）

| 模块 | 关键证据 |
|---|---|
| tal-contest 华为ICT大赛 | S1 §各频道要点>华为ICT大赛（本届 187,560 人/累计 1,180,000+/2000+ 院校/100+ 国家；7 赛道：实践赛网络/云/基础软件、创新赛、教学赛、挑战赛、编程赛、算子赛、精英赛；分区：中国区 124,758 人截止 2026-10-31 + 中东中亚/南非/亚太/北非/拉美/欧洲；手册/路演胶片 PDF filepreview；往届 1~10 届 tab、榜首SHOW、竞赛榜单+UNESCO 背书）；S1 §登录后>大赛区详情（talent/#/ict/innovation-details：网络 90,336/云 19,326/基础软件 15,096；省资格赛测试 → talent.shixizhi.huawei.com/iexam 第 7 套系统；问卷 survey.huaweicloud.com、活动报名 edu.huaweicloud.com）；S1 §登录后>我的大赛（myComp 空页面无引导）；S2 §一.3（赛制：实践赛四级、创新赛三级；报名通道：账号→身份认证→组队→报名）；S4（/ict/contest 路由） |
| tal-halp 培训伙伴 HALP | S1 §各频道要点>培训伙伴HALP（注册/认证/续认证、讲师专区 HCSI、教学管理开班/招生）；S1 §补充发现>HALP资讯公告（最新公告 2023 年，最旧 2022-2023，更新停滞）；S4（/halp/home 路由） |
| tal-corporate 企业培训 | S4（**/corporate/home → /corporate/#/home 独立子应用存在**）；S1 §站点结构（导航点击新标签打开 e.huawei.com/cn/solutions/services/learning-and-certification 及 elearning.huawei.com/cn/homepage，"与 HALP 同 URL 或外链，体验割裂"）；S1 §初步观察4（企业培训与培训伙伴导航重复；商城外链 elearning） |
| tal-stories 成功案例 | S1 §各频道要点>成功案例（全部为 ICT 大赛获奖故事（学生视角），加载更多分页）；S2 §二（页脚资源区含成功案例入口）；S4（/success-stories 路由） |

## 4. 现网验证记录（如实）

- 2026-11-15 WebFetch 四页均返回空：SPA（Vue 微前端）内容 JS 渲染，静态抓取只有壳。webReader 备选通道同样只取回 meta/CSS 引用。
- 有效补充：redirectConfig.js（S4）静态 JS 可抓取，确认子应用与路由存活；partner.huawei.com 入驻页仅 "Loading"。
- 结论：本域"功能存在性"以 S1 一手记录 + S4 路由佐证为准；**页面内表单字段、按钮细节等 UI 级证据需浏览器渲染验证（列入 gaps）**。

## 5. 关键架构事实（影响模块图绘制）

1. **ICT大赛物理上挂在 ict-academy 子应用**（路由 /ict-academy/#/ict-contest），但业务上是平台级赛事频道——模块图中作为"华为人才在线平台的应用模块"呈现并标注宿主。
2. **学校入驻跨系统**：partner.huawei.com（eplusweb+metaEcpri）承担注册/协议/认证审批，人才在线只承接入驻后管理与日常运营。
3. **就业对接无线上功能实体**：仅 ICT 学院频道一句宣传文案，双选会活动报名散落在 edu.huaweicloud.com 等外域。
4. **企业培训导航重复/外跳**：corporate 子应用路由存在但导航落地与 HALP 相同或直跳 solutions/elearning。
5. 竞赛考试（shixizhi）、问卷（survey.huaweicloud.com）、活动报名（edu.huaweicloud.com）均为外域系统，模块图以"外链功能"标注。
