<<<<<<< HEAD
# 学习+认证域 勘察证据说明（findings）

> 勘察日期：2026-11-15。范围：华为人才在线（e.huawei.com/cn/talent/portal）的"学习中心（/learning/）"与"认证中心（/cert/）"两个应用模块。
> 证据等级说明：**一手遍历** = research/00 中未登录/登录态逐页浏览记录（本次最可靠来源）；**架构还原** = research/04 通过 redirectConfig.js 还原的子应用路由表；**WebFetch** = 本次抓取现网公开页的结果（SPA 均为壳）。

## 一、WebFetch 抓取结果汇总（如实记录）

| URL | 抓取结果 |
|---|---|
| https://e.huawei.com/cn/talent/learning/#/ict-academy | **SPA 壳，无渲染内容**。仅 title 可辨：指向华为人才在线"学习"频道（课程目录页）。筛选器/课程卡等 UI 字段在源码中不存在 |
| https://e.huawei.com/cn/talent/cert/#/careerCert | 第 1 次抓取**超时（60s）**；重试成功，确认为 **SPA 壳，无渲染内容**，无 title/meta 可提取 |
| https://e.huawei.com/cn/talent/cert/#/specialistCert | **SPA 壳，无渲染内容**，无 title/meta 可提取 |
| https://e.huawei.com/cn/talent/cert/#/course-details | **SPA 壳且空内容**；URL 缺课程 ID 等参数，无任何静态字段可提取 |

结论：门户为 Vue 微前端 SPA，服务端不输出功能内容。**所有功能字段均以 research/00 一手遍历为准，WebFetch 仅证明页面/路由存活**。hash 路由（`#/`）不发给服务器，learning/cert 四个 URL 实际只对应两个服务端 HTML。

## 二、模块层证据

### LC1 学习中心（/learning/）
- 存在性与定位：research/04 §信息架构表（/learning/ 子应用，"课程搜索与学习，承接 /search"）+ research/00 站点结构表（学习频道 → `e.huawei.com/cn/talent/learning/#/ict-academy`，课程目录/全部课程/我的学习）。
- WebFetch：/learning/ 服务端 HTML 存在，title 指向学习频道。

### LC2 认证中心（/cert/）
- 存在性与定位：research/04 §信息架构表（/cert/ 关键路由：careerCert 职业认证、specialistCert 专业认证、course-details 认证课程详情）+ research/00 站点结构表（认证频道 → 职业认证全景图）。
- WebFetch：/cert/ 服务端 HTML 存在（SPA 壳），careerCert 重试后确认。

## 三、功能条目证据（对应 modules.json 逐条）

### LC1 学习中心

| 功能 | 证据来源 | 说明 |
|---|---|---|
| lc-1-1 课程目录-专业课程视图 | research/00 §学习（一手遍历） | 专业维度 4 个：计算机科学与技术、人工智能、软件工程、物联网工程 |
| lc-1-2 课程目录-岗位课程视图 | research/00 §学习（一手遍历） | "课程目录三种视图：专业课程目录 / 岗位课程目录 / 全部课程" |
| lc-1-3 课程目录-全部课程视图 | research/00 §学习（一手遍历） | 133 条 / 12 页；课程三层：实践课/核心课/通识课 |
| lc-1-4 课程筛选器 | research/00 §学习（一手遍历） | 专业/岗位/技术方向/课程类型/难度级别 |
| lc-1-5 课程排序 | research/00 §学习（一手遍历） | 学习量 / 发布时间 |
| lc-1-6 课程卡 | research/00 §学习（一手遍历） | 类型标签（院校课程）、学习人数、时长(h)、难度、报名、分享 |
| lc-1-7 慕课卡片 | research/00 §学习（一手遍历） | 频道首页另有慕课卡片（免费+人数） |
| lc-1-8 我的学习 | research/00 §学习 + §登录后记录 | 入口需登录；与 usercenter/#/mycourse 关联；存在"平台升级建议重新学习"迁移断档公告 |
| lc-1-9 课程详情页 | research/00 §登录后记录 §课程详情 | 路径在 ict-academy 子应用（/ict-academy/#/ict-courses-detail），从学习频道课程卡进入；目录树/能力目标/课程团队/学生-去学习/老师-我要开班 |
| lc-1-10 学习器 | research/00 §登录后记录 §学习器 | outPage/#/sxz-course，独立子系统（第 6 套），新标签+iframe；目录进度/课件下载（学生版/老师版走 backplatform）/电子书外链 GitCode |

### LC2 认证中心

| 功能 | 证据来源 | 说明 |
|---|---|---|
| lc-2-1 职业认证全景图 | research/00 §认证（一手遍历）+ WebFetch（SPA 壳确认存活） | HCIA/HCIP/HCIE 三级 |
| lc-2-2 认证方向分类 | research/00 §认证 + research/04 §华为认证体系 | ICT基础设施（Datacom/WLAN/Security/Transmission/Access/5G/LTE/MDC）、基础软硬件（Computing/Storage）、云平台及云服务、项目管理；research/04 口径 22 方向 |
| lc-2-3 专业认证 | research/04 §信息架构表 + research/00 §认证 + WebFetch（SPA 壳） | 路由 specialistCert 存在；具体认证清单未逐项摘录 |
| lc-2-4 认证课程详情 | research/04 §信息架构表 + WebFetch（空壳，缺参数） | 路由 course-details 存在；字段未确认 |
| lc-2-5 参加考试 | research/00 §认证 + research/04 §华为认证体系 | Pearson VUE 外链约考；电子证书考后 1 个工作日（HCIE 例外）；2024-10 起先实名登记再约考 |
| lc-2-6 考券规则 | research/00 §登录后记录 §我的券包 + research/04 §华为认证体系 | 规则文本（24h 自动取消、HCIE 提前 7 天）来自登录后券包；**认证频道内规则页入口未逐一确认 → 标 inferred** |
| lc-2-7 重认证规则 | research/00 §认证（一手遍历） | 条目存在；具体条款未摘录 |
| lc-2-8 授权培训机构查询 | research/00 §认证 + research/04 §HALP | 条目存在；查询维度未确认 |
| lc-2-9 认证丛书 | research/00 §认证（一手遍历） | 《华为ICT认证系列丛书》 |
| lc-2-10 认证资讯公告 | research/00 §认证（一手遍历） | 公告列表存在 |

## 四、周边关联事实（有助于理解域边界）

- 系统碎片化：学习器是 outPage 子系统、考试预约在 talent.shixizhi.huawei.com/iexam、我的证书/我的考试在 talent/#/personal/* 子应用、考券在 usercenter——"学习+认证域"的用户旅程横跨 7+ 系统（research/00 §系统碎片化全景）。
- 课程详情路由挂在 ict-academy 子应用而非 learning，说明 learning 频道与 ICT 学院频道共用课程数据层（research/00 登录后记录）。
- 商城/华为认证官网（elearning.huawei.com）是另一套系统，不在本域内（research/00 站点结构表）。

## 五、未覆盖点（本次勘察范围外，主线可酌情补）

- 认证频道内各规则页（重认证/考券）的具体文本内容。
- 专业认证（specialistCert）当前在线的认证数量与方向清单。
- 学习频道"岗位课程视图"的具体岗位清单（research/00 只记录了视图存在与专业维度清单）。
=======
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
>>>>>>> wt/academy-contest
