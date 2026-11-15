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
