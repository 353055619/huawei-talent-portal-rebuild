# GitHub/Gitee 开源招聘系统调研报告

> 调研日期：2026-11-15。数据来源：GitHub API（gh CLI 实测）、Gitee/搜索引擎补充。star 数与活跃度为当日快照。
> 目的：为华为高校人才 IT 系统重构提供开源界可参考的"轮子"清单与选型建议。

## 一、总体结论（先说要点）

1. **开源界没有成熟的"校招全流程"产品**。所有开源项目都只覆盖校招链条的一段（职位发布、ATS 管道、简历解析、笔试、视频面、排期），重构方案应是"自研业务中台 + 组合成熟开源组件"。
2. **ATS 领域整体老化**：OpenCATS（PHP，784★）是最完整的开源 ATS 但是 2005 年代架构；新一代 Rails 系 FreeATS 简洁但功能少（45★）；TypeScript 系 nueno（269★）已停滞 3 年。真正活跃且现代的"带招聘模块的大平台"是 Frappe HRMS（9.1k★）、Ever Gauzy（8.8k★）、Odoo（55.8k★）和 Horilla（1.5k★）。
3. **简历解析**是开源质量最高的子领域：OpenResume（9.0k★，纯前端 PDF.js 解析）+ Resume-Matcher（29.3k★，LLM 简历-JD 匹配）可直接借鉴定架。但**中文简历解析无生产级开源方案**，需 LLM 自研。
4. **笔试系统**可直接复用学之思 xzs（3.9k★，Java+Vue，国内最成熟在线考试开源项目）的设计。
5. **高校就业管理系统在开源界基本空白**，Gitee 上均为毕业设计级 SpringBoot+Vue 项目，无参考价值（仅可看其数据模型）。
6. 用户提示中的 Homerun 是商业 SaaS（非开源）；未发现名为 Cafei / openDACS 的招聘类开源项目，应为记忆偏差；dromara 社区也无招聘项目（其价值在 Sa-Token 等权限中间件）。

## 二、项目清单表

### 2.1 开源 ATS（申请跟踪系统）

| 项目 | URL | Star | 技术栈 | 活跃度 | 核心模块 | 可借鉴点 |
|---|---|---|---|---|---|---|
| OpenCATS | github.com/opencats/OpenCATS | 784 | PHP+MySQL（无前后端分离） | 活跃（2026-11 仍在提交，PHP 8.4 适配中） | 职位/候选人/公司管理、投递管道（Pipeline 阶段可配置）、简历导入解析、标签筛选、邮件模板、权限（_recruiter/admin） | 最完整的开源 ATS 数据模型：candidate→pipeline→status 状态机、extra field 自定义字段设计；简历批量导入+查重 |
| FreeATS (Toughbyte) | github.com/freeats/freeats | 45 | Ruby on Rails+Hotwire+PostgreSQL | 中等（2026-10 有更新） | 职位发布、候选人管道、笔记/评分、任务、邮件集成、PG 全文检索 | 现代单体架构范本：Docker 一键部署、无 SPA 的 Hotwire 实时交互、事件消息表（用于异步发邮件/同步）；代码量小适合通读 |
| nueno | github.com/nueno-co/nueno | 269 | TypeScript(Next.js 98%)，AGPL | 停滞（2022-07 后无 push） | 职位、候选人、看板式管道 | 前后端一体的现代 TS 技术选型（可参考目录结构，不可依赖） |
| OpenATS | github.com/chamals3n4/OpenATS | 46 | TypeScript | 活跃（2026-11） | 招聘平台基础功能 | 新兴项目，观察即可 |
| YAWIK | github.com/cross-solution/YAWIK | 132 | PHP(Zend/Doctrine)+MongoDB | 停滞（2023） | ATS+Job Board 二合一、多渠道发布 | "ATS 与职位板一体"的产品形态；_jobs 多渠道同步思路 |
| OSSAdmiral/Recruit | github.com/OSSAdmiral/Recruit | 54 | Laravel 10 + Filament 3 | 低（2025-02） | 企业招聘：职位、申请人、面试 | Filament 后台快速搭招聘管理 CRUD 的范例 |

### 2.2 现代 HR 套件（含招聘模块，活跃度高）

| 项目 | URL | Star | 技术栈 | 活跃度 | 核心模块 | 可借鉴点 |
|---|---|---|---|---|---|---|
| Odoo (hr_recruitment) | github.com/odoo/odoo | 55,797 | Python+OWL(JS) | 极活跃 | HR 应用族：招聘、员工、考勤、假勤、薪酬 | hr_recruitment 模块的"看板+阶段"模型、jod offer 与员工档案衔接、渠道来源分析（Source Analysis）报表 |
| Frappe HRMS | github.com/frappe/hrms | 9,059 | Python(Frappe)+TS，GPL-3 | 极活跃（2026-11） | 招聘(Job Opening/Applicant/Interview/Job Offer 四 DocType)、假勤、薪酬、绩效(PMS) | **招聘域模型最清晰的开源实现**：Job Opening→Job Applicant→Interview(含面试官评分反馈 Feedback)→Job Offer 全链路 DocType；面试轮次与评分表设计可直接照抄 |
| Ever Gauzy | github.com/ever-co/ever-gauzy | 8,832 | NestJS+Angular/Next.js，AGPL | 极活跃 | ERP/CRM/HRM/ATS 一体：职位、候选人、面试、评价、Offer 审批 | 大而全的微服务拆分与租户(SaaS 多租户)设计；ATS 与 PM/CRM 联动 |
| Horilla HR | github.com/horilla/horilla-hr | 1,513 | Django+jQuery | 活跃（2026-11） | 招聘(职位/阶段/候选人/面试排期)、考勤、薪酬 | 招聘管道看板、面试日程与候选人邮件通知的轻量实现 |
| OrangeHRM | github.com/orangehrm/orangehrm | 1,162 | PHP(Symfony)+Vue | 中（2026-06） | 招聘模块( vacancies/applications/ interviews)、员工、考勤 | 老牌 HRMS，招聘与员工主数据衔接方式 |
| 悟空HRM | github.com/WukongOpenSource/Wukong_HRM | 1,592 | Spring Cloud Alibaba+MyBatis-Plus+Vue2/Element | 中（2026-09） | 组织规划、招聘管理、员工、考勤、社保、绩效 | 国内 Java 微服务 HRM 的完整脚手架：spring-cloud-alibaba 服务拆分、审批流与招聘管理结合；但前端 Vue2 老旧、开源版功能不完整 |

### 2.3 国内招聘/校招项目（GitHub+Gitee）

| 项目 | 地址 | Star | 技术栈 | 活跃度 | 说明与可借鉴点 |
|---|---|---|---|---|---|
| stalary/microservice-recruit | github.com/stalary/microservice-recruit | 256 | Spring Cloud+Vue | 停（2023-12） | 微服务智能招聘系统：简历投递、推荐、HR 管理；可参考其微服务划分（user/position/recruit/common）与 RabbitMQ/Kafka 用法 |
| Jackie-LIONS/Campus-Recruit | github.com/Jackie-LIONS/Campus-Recruit | 89 | SpringBoot+Vue+MySQL | 低（2025-11） | 校园招聘三方系统（企业/学生/管理员）+**协同过滤职位推荐**，人岗匹配算法参考 |
| nature924 系列（No9 校园求职等） | github.com/nature924 | 各~20 | SpringBoot+SSM+Vue | 低 | 典型毕设级：仅可参考学生端投递/企业端发布/管理员审核三角色的用例划分 |
| 点狮 HRM | gitee.com（若依二开） | - | Spring Cloud+Vue3+Flowable，MIT | - | 若依生态最完整的开源 HRM：BPM 工作流驱动入职/审批，可借鉴"Flowable 审批流+招聘 Offer 审批" |
| 职跃星图 | gitee.com/CareerGalaxyAIRecruitmentInterviewAgentPlatform | - | RuoYi-Cloud+Vue2+小程序+Dify | - | AI 招聘方向：Dify Workflow 实现简历诊断、JD 解析、面试题生成，AI 能力接入方式可参考 |
| 毕业生就业管理系统（Gitee） | gitee.com/organization_of_ice/bys 等 | 个位数 | SpringBoot+Vue | 停 | 高校就业系统开源基本空白，仅可参考数据表（生源、就业去向、单位库） |

### 2.4 Job Board / 职位发布平台

| 项目 | URL | Star | 技术栈 | 活跃度 | 可借鉴点 |
|---|---|---|---|---|---|
| calcom/cal.com（排期） | github.com/calcom/cal.com | 50,044 | Next.js+Prisma+tRPC | 极活跃 | 见 2.6 |
| railsdevs.com | github.com/joemasilotti/railsdevs.com | 801 | Ruby on Rails+Hotwire，MIT | 中（2025-07） | 单体 Rails 职位板最佳实践：搜索、付费发布、Stripe 计费、管理后台全开源 |
| freehire | github.com/strelov1/freehire | 3,525 | Go+TS | 极活跃 | 面向求职者的开源职位聚合搜索引擎：多源职位抓取、简历索引、全文检索（Elastic）架构 |
| ZtM-Job-Board | github.com/zero-to-mastery/ZtM-Job-Board | 1,185 | React+Firebase | 活跃 | 轻量职位板前端范式（校招宣讲会列表页可参考） |
| code100x/job-board | github.com/code100x/job-board | 387 | Next.js+Prisma+Postgres | 停（2024-11） | Next.js 职位板 CRUD 教学级实现，上手快 |
| hasjob | github.com/hasgeek/hasjob | 248 | Python(Flask)+PostgreSQL，AGPL | 活跃（2026-11） | 印度最大技术职位板之一：职位生命周期(审核/置顶/过期)、地理与标签筛选 |
| JobberBase | github.com/jobberbase/jobberbase | 284 | PHP | 死亡（2019） | 仅历史参考，不建议 |

### 2.5 简历解析与人岗匹配（校招关键技术）

| 项目 | URL | Star | 技术栈 | 活跃度 | 可借鉴点 |
|---|---|---|---|---|---|
| OpenResume | github.com/xitanggg/open-resume | 8,983 | TypeScript(Next.js)+PDF.js+Redux Toolkit，AGPL | 中（2024-10，功能已稳定） | **最值得抄的简历解析器**：纯前端 PDF.js 提取文本+版式坐标 → 正则+规则解析出姓名/电话/邮箱/教育/工作经历等结构化 JSON；解析算法有公开 deep-dive 文档；另有简历生成器（react-pdf 渲染） |
| Resume-Matcher | github.com/srbhr/Resume-Matcher | 29,287 | Python(FastAPI)+Next.js，Apache-2 | 极活跃 | JD 与简历双向解析→关键词/技能向量匹配→可解释打分；已演化为可本地跑 100+ LLM 的"简历定制引擎"，人岗匹配与 LLM 工程化参考 |
| pyresparser | github.com/OmkarPathak/pyresparser | 959 | Python(spaCy/NLTK) | 低 | 经典 NER 简历解析：实体抽取字段清单可参考，但英文语料为主 |
| nlp-resume-parser | github.com/hxu296/nlp-resume-parser | 275 | Python+GPT-3 prompt | 停 | "PDF→LLM→JSON Schema"最小可行方案，提示词工程模板 |
| resume-parse-evaluation | github.com/wanghaisheng/resume-parse-evaluation | 171 | 测评集 | 低 | **对中文简历解析工具的横评**（结论：开源工具中文效果普遍差，佐证"中文解析需 LLM 自研"） |
| AI-Resume-Form-Filling-Assistant | github.com/1lck/AI-Resume-Form-Filling-Assistant | 226 | JS 浏览器插件+DeepSeek | 活跃（2026-09） | 反向思路：AI 读简历自动填网页表单——与"候选人一键导入已有简历填校招申请表"场景完全一致，可直接借鉴 |

### 2.6 笔试、面试排期与视频面试

| 项目 | URL | Star | 技术栈 | 活跃度 | 可借鉴点 |
|---|---|---|---|---|---|
| 学之思 xzs | github.com/mindskip/xzs | 3,915（MySQL 版另有 3,603） | Java(SpringBoot)+Vue+PG/MySQL，AGPL | 活跃（2026-11） | 国内最成熟开源在线考试：题库(选择/填空/判断)、试卷组卷、考试防切屏、自动判分、错题本、微信小程序端；**校招笔试可直接二开或照抄数据模型** |
| SpringBoot-Vue-OnlineExam | github.com/YXJ2018/SpringBoot-Vue-OnlineExam | 2,280 | SpringBoot+Vue | 中 | 教育机构在用，考试/题库/成绩管理模块齐全 |
| spring-boot-online-exam | github.com/lsgwr/spring-boot-online-exam | 1,694 | SpringBoot（另有 Python 版） | 活跃（2026-10） | 三角色(管理/教师/学生)考试系统，含防作弊 |
| CoderScreen | github.com/CoderScreen/coderscreen | 44 | TypeScript | 活跃 | 开源技术测评平台（新），编程笔试方向观察 |
| cal.com | github.com/calcom/cal.com | 50,044 | Next.js+Prisma，AGPL | 极活跃 | **面试预约调度事实标准**：可用性管理、时区、_round robin_ 轮询分配面试官、与邮件/日历双向同步、webhook——校招"群面/多轮面试自动排期"可基于其轮询路由与 availability 模型设计 |
| msrecruit-scheduling-engine | github.com/microsoft/msrecruit-scheduling-engine | 17 | C#，MIT | 停（2024-01） | **微软招聘平台开源的面试排期约束求解引擎**：把面试排期建模为 CSP（面试官时间/房间/技能约束），虽然小众但为"批量校招排期"提供算法参考 |
| Jitsi Meet | github.com/jitsi/jitsi-meet | 30,238 | JS(React)+Java JVB | 极活跃 | 自托管视频会议，WebRTC SFU；校招视频面试可自建（无录像审计则需二开） |
| LiveKit | github.com/livekit/livekit | 22,212 | Go SFU+TS SDK | 极活跃 | 现代 WebRTC SFU，SDK 完善（服务端录像、Token 鉴权、房间管理），**更适合作为视频面试底座二次开发** |
| BigBlueButton | github.com/bigbluebutton/bigbluebutton | 9,278 | TS+Java | 极活跃 | 面向教学：白板、举手、录像、回放——宣讲会/双选会直播场景更合适 |

## 三、按校招业务域归类

| 业务域 | 首选参考 | 次选参考 | 说明 |
|---|---|---|---|
| 职位管理（发布/审批/多渠道） | Frappe HRMS(Job Opening DocType)、Odoo hr_recruitment | OpenCATS、YAWIK、hasjob | 职位状态机、审批、渠道来源分析 |
| 投递管理（申请/管道/状态流转） | OpenCATS（最完整管道）、FreeATS（现代实现） | Frappe HRMS Job Applicant、Horilla | candidate pipeline 阶段可配置 + 权限 |
| 简历解析 | OpenResume（规则+版式）、nlp-resume-parser（LLM 模板） | resume-parse-evaluation（中文横评）、Resume-Matcher | 中文必须走 LLM 路线，开源仅提供字段 schema 与评测基准 |
| 人岗匹配/推荐 | Resume-Matcher | Jackie-LIONS/Campus-Recruit（协同过滤） | JD-Resume 双向解析+可解释打分 |
| 面试管理（排期/评价） | cal.com（排期模型）、msrecruit-scheduling-engine（约束求解） | Frappe HRMS Interview+Feedback、Horilla | 面试轮次、面试官打分表、Round-Robin 分配 |
| 笔试 | 学之思 xzs | lsgwr/online-exam、CoderScreen | 题库/组卷/判分/防作弊 |
| Offer 管理 | Frappe HRMS(Job Offer)、Odoo | 悟空HRM、点狮HRM(Flowable 审批) | Offer 审批流+签约回传+到期跟踪 |
| 视频面试/宣讲 | LiveKit（面试）、BigBlueButton（宣讲直播） | Jitsi Meet | 自建 vs 二开权衡见下 |
| 校企合作/宣讲会 | 开源空白 | ZtM-Job-Board（活动列表页） | 需自研，参考 CRM 公司库模型（OpenCATS Companies） |
| 数据报表 | Odoo(渠道分析)、Frappe(报表框架) | 悟空HRM 后台 | 漏斗转化、渠道 ROI 报表自研 |

## 四、技术选型建议（面向华为高校人才系统重构）

1. **业务中台自研，组件取自开源**：开源 ATS 无一能整体落地华为体量（OpenCATS 架构老旧、FreeATS 面向中小企业），但它们的**领域模型（10+ 年沉淀的实体与状态机）是最佳需求分析素材**。建议重构启动前精读 OpenCATS 表结构与 Frappe HRMS 招聘 DocType。
2. **简历解析双引擎**：结构化解析先用 OpenResume 的 PDF.js+规则方案兜底（零成本、可离线、AGPL 需注意隔离部署或参考重写），中文复杂简历走 LLM（DeepSeek/GLM + JSON Schema 输出，参考 nlp-resume-parser 模式）；用 resume-parse-evaluation 的思路自建中文评测集。
3. **面试排期**：不要自研调度 UI，直接引入 cal.com（AGPL，可商业版或参考其 availability/round-robin 模型自研）；批量群面排期参考 msrecruit-scheduling-engine 的 CSP 建模。
4. **笔试**：短期直接部署学之思 xzs（AGPL）或按其模型自建题库/考试/监考三域；长期对接内部人才测评。
5. **视频底座**：面试用 LiveKit（Go SFU、可服务端录像、性能好），宣讲/双选用 BigBlueButton（自带互动与回放）；Jitsi 作为快速验证。
6. **技术栈组合建议**：若沿用 Java 生态——Spring Cloud Alibaba（参考悟空HRM 服务拆分）+ Vue3/Element Plus + Flowable（Offer 审批，参考点狮HRM）+ xxl-job；若新建——NestJS/Next.js 全 TS 栈可参考 Ever Gauzy 与 OpenResume。
7. **合规提示**：OpenCATS（无标准 OSI 许可证）、Frappe HRMS（GPL-3）、Ever Gauzy/OpenResume/xzs/cal.com（AGPL-3）均有传染性，企业内网部署可控，但代码级借用需法务评估；MIT/Apache 系（Resume-Matcher、railsdevs、msrecruit-engine、LiveKit）可放心借鉴。

## 五、URL 列表

- https://github.com/opencats/OpenCATS
- https://github.com/freeats/freeats
- https://github.com/nueno-co/nueno
- https://github.com/chamals3n4/OpenATS
- https://github.com/cross-solution/YAWIK
- https://github.com/OSSAdmiral/Recruit
- https://github.com/odoo/odoo
- https://github.com/frappe/hrms
- https://github.com/ever-co/ever-gauzy
- https://github.com/horilla/horilla-hr
- https://github.com/orangehrm/orangehrm
- https://github.com/WukongOpenSource/Wukong_HRM
- https://github.com/stalary/microservice-recruit
- https://github.com/Jackie-LIONS/Campus-Recruit
- https://github.com/nature924/No9Campus-job-search-and-recruitment-system
- https://github.com/joemasilotti/railsdevs.com
- https://github.com/strelov1/freehire
- https://github.com/zero-to-mastery/ZtM-Job-Board
- https://github.com/code100x/job-board
- https://github.com/hasgeek/hasjob
- https://github.com/jobberbase/jobberbase
- https://github.com/xitanggg/open-resume （官网 https://open-resume.com/resume-parser）
- https://github.com/srbhr/Resume-Matcher
- https://github.com/OmkarPathak/pyresparser
- https://github.com/hxu296/nlp-resume-parser
- https://github.com/wanghaisheng/resume-parse-evaluation
- https://github.com/1lck/AI-Resume-Form-Filling-Assistant
- https://github.com/mindskip/xzs
- https://github.com/YXJ2018/SpringBoot-Vue-OnlineExam
- https://github.com/lsgwr/spring-boot-online-exam
- https://github.com/CoderScreen/coderscreen
- https://github.com/calcom/cal.com
- https://github.com/microsoft/msrecruit-scheduling-engine
- https://github.com/jitsi/jitsi-meet
- https://github.com/livekit/livekit
- https://github.com/bigbluebutton/bigbluebutton
- https://gitee.com/y_project/RuoYi （若依基座）
- https://gitee.com/organization_of_ice/bys （毕业生就业管理系统）
- https://gitee.com/fengzengfly03/Graduate-Employment-Management-System
- https://gitee.com/CareerGalaxyAIRecruitmentInterviewAgentPlatform （职跃星图，RuoYi-Cloud+Dify）
