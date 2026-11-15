# findings.md — 华为人才在线"用户中心+门户壳+入驻+商城+资讯域"勘察证据

> 勘察日期：2026-11-15。方法：只读勘察——仓库调研报告 2 份（research/00 含登录后逐模块实测）+ WebFetch 静态验证 4 次（portal / news / elearning / redirectConfig.js），未开浏览器、未登录。结论与 modules.json 一一对应。

## 一、证据源清单

| 编号 | 证据源 | 类型 | 可信度 |
|---|---|---|---|
| E1 | `/Users/godw/GodwGarage/sandbox/wt-user/research/00-现网系统信息架构笔记.md` | 2026-11-15 逐页一手实测（未登录 + 登录账号 hw_353055619_qq.com_01） | 高（一手） |
| E2 | `/Users/godw/GodwGarage/sandbox/wt-user/research/04-华为人才生态业务背景.md` | 官网抓取（redirectConfig.js 路由反解）+ 公开资料检索 | 高（一手+二手） |
| E3 | WebFetch `https://r-h2.huaweistatic.com/s/hwtalent/lst/redirectConfig.js`（2026-11-15） | 路由配置一手反解 | 高（一手） |
| E4 | WebFetch `https://elearning.huawei.com/cn/homepage`（2026-11-15） | 静态抓取 | 中（仅得 SEO 标题，正文动态加载） |
| E5 | WebFetch `https://e.huawei.com/cn/talent/portal/#/` 与 `https://e.huawei.com/cn/talent/news/`（2026-11-15） | 静态抓取 | 低（SPA 空壳，仅证明"静态无内容"这一事实本身） |
| E6 | 任务范围输入（主线给定功能点） | 传导 | 低（标 inferred，见 gaps） |

## 二、E3 redirectConfig.js 一手反解（本次新增证据，核心）

子应用路径（11 个）：`/portal/`（rootPath）、`/cert/`、`/news/`、`/halp/`、`/ict-academy/`、`/usercenter/`、`/learning/`、`/corporate/`、`/success-stories/`、`/mobile/`、`/search/`。

usercenter 相关路由（12 条，原路径 → 目标）：

| 原路径 | 目标 | 含义（对应 modules.json 功能） |
|---|---|---|
| `/usercenter` | `/usercenter/#/home`（pageCode PACF0EC4FC2CD9B） | uc-home-frame |
| `/personal/myinfo`、`/admin/personal/info` | `/usercenter/#/home/myinfo` | uc-info-profile |
| `/admin/approval-details` | `/usercenter/#/home/approval-details` | cross-issue（关联审批详情） |
| `/personal/mycourse` | `/usercenter/#/home/mycourse` | uc-course-list / uc-course-notice |
| `/personal/myclass/list` | `/usercenter/#/home/myclass-list` | uc-class-list / uc-class-join |
| `/personal/my-coupons` | `/usercenter/#/home/my-coupons` | uc-coupon-* |
| `/realinfosystem` | `/usercenter/#/realinfosystem` | uc-info-realname（不在 #/home 下） |
| `/issue/history` | `/usercenter/#/home/issue-history` | cross-issue（历史问题单） |
| `/personal/my-news` | `/usercenter/#/home/my-news` | uc-news-tabs |
| `/personal/mycompetition` | `/usercenter/#/home/myComp` | uc-comp-empty |
| `/personal/voucher/application` | `/usercenter/#/home/voucher/application` | uc-coupon-apply（空白页） |

news：`/news/details` → `/news/#/details`（news-detail）。`backplatform`、`outPage` **不在 redirectConfig.js 中**——两者来自 E1 登录后实测（学习器/下载专区直连），属"配置外隐藏子应用"。

## 三、E4/E5 WebFetch 实测记录

1. `elearning.huawei.com/cn/homepage`：返回标题 `华为认证_华为认证考试_华为认证课程培训_HCIA/HCIP/HCIE官网_赢自认证，智驭未来`，正文为脚本动态加载。**确认 elearning 即华为认证官网/商城域**（E1 交叉印证：门户"商城"频道新标签打开此地址）。
2. `e.huawei.com/cn/talent/portal/#/` 与 `/cn/talent/news/`：body 为空，仅 SPA 壳。**印证门户为微前端 SPA、静态无内容**——与 E2"Vue 微前端"结论一致，也解释了未开浏览器勘察的边界。

## 四、逐模块证据摘录（引 E1 原文关键句）

### M1 门户壳 portal（12 功能）
- 顶部导航 8 频道 + 9 落地页 URL 表：E1 §站点结构表；"顶部导航 8 个频道中，至少 3 个（企业培训/商城/部分资源）跳出到独立系统；'企业培训'与'培训伙伴'落地页相同"。
- banner/热门课程：E1 频道表首页行"热门课程轮播"；E2 §二"/portal/ 新首页：轮播banner、热门课程、页脚导航"。
- 页脚四栏完整清单：E2 §二"关于我们（华为认证/ICT学院/培训合作伙伴/资讯中心）、资源（资源中心/HALP下载专区/ICT学院下载专区/工具专区/成功案例）、快速链接（华为招聘/华为云/认证论坛等）、联系我们（智能客服/提交问题单）"。
- 消息中心入口未登录"0"占位：E1 §登录"顶栏未登录时显示'登录/注册'，还有一个'0'（疑似消息中心未登录占位）"。
- inferred（E6，未独立验证）：热门认证板块、人才双选图区、中/EN 切换、Cookies 条。

### M2 用户中心 usercenter（22 功能，9 子模块）
- 首页框架三硬伤：E1 §用户中心"首页主区域空白：无概览、无待办聚合、无快捷入口"；"左侧菜单只在 #/home 渲染；进入任何子页面后菜单消失"；"账号下拉菜单仅 4 项"。
- 我的课程：五视图（全部/在线课程/实验案例/学习中/已结束）+ 断档公告"由于平台升级，建议前往【学习】页面重新学习"——学习记录迁移断档（status=断档）。
- 我的班级："组织方/班级状态/名称筛选 + 邀请码加入——学生进班唯一方式是邀请码，无'本校班级'浏览"。
- 我的大赛："空页面，空态无任何引导 CTA"（status=空白页）。
- 我的券包："暗码考券/数字考券、考券记录；占用后 24h 自动取消、HCIE 需提前 7 天约考"；"#/voucher/application 考券申请路由空白页"（status=空白页，E3 路由一手确认存在）。
- 我的证书：跳 `talent/#/personal/mycert` 另一子应用；认证/结课证书、关联其他账号证书、关联 Upgrade 成绩、电子证书 1-3 工作日、HCIE 纸质 15/30 工作日、企业关联跳 `e.huawei.com/cn/myspace` 且"变更需间隔 12 个月"（外链系统）。
- 我的考试：跳 `talent/#/personal/myappointments/list`；职业&专业/其他考试、VUE 考试记录/收据按钮、是否在线预约筛选。
- 我的消息："待办事项(0)/消息提醒(0)/平台公告(0) 三 tab"（实测均空）。
- 个人信息："姓字段被填成账号 ID"；"实名认证按钮点击后只改 URL（#/realinfosystem）内容不变"（status=空白页/渲染缺陷）；角色关联向导字段全录：国家/我的学院选择器/专业/学历/班级/学号/入学毕业年月/备注+隐私声明，"姓名确定后将无法修改"，"无学校 SSO/学信网式可信认证，靠自填+审批"。

### M3 账号与入驻（9 功能）
- uniportal：E1 §登录"手机号/邮箱/账号名+密码、短信验证码登录、注册、忘记密码"。
- 入驻旅程（E1 §补充发现+§学校入驻）："立即注册"→ uniportal 登录 → `partner.huawei.com/eplusweb/#/cn/web/become-an-ict-academy`（**学校注册在伙伴系统，不在门户内**）；三步旅程：授权函（ihelp-center 下载、盖二级学院+公章、metaEcpri 上传扫描件、邮件审批）→ 在线签校企合作协议 → 认证分级申请/进度查询（`metaEcpri/#/authenApply`）→ 回人才在线用户中心管理；"全程邮件通知、线下盖章、跨 2 个系统 3 个应用"。
- 分级体系：E2 §一"认证级 → 优选级 → 领先级，逐年评审晋升"。

### M4 商城与外部系统（4 功能）
- 商城外链：E1 频道表"商城：新标签打开 elearning.huawei.com/cn/homepage（华为认证官网/elearning，另一套系统）"；E4 标题证据（见 §三）。
- 代金券：E6+ E2"考试券（voucher，含 HALP 渠道券、学生优惠券）"+ E2 URL 列表 pearsonvue vouchers 页（inferred，商城内部未抓到正文）。
- 外部系统全景（7+ 系统/域名清单）：E1 §系统碎片化全景逐条记录。

### M5 资讯 news（2 功能）
- E3：`/news/` 独立子应用 + `/news/details → /news/#/details`；E2 §二"/news/ 资讯中心 新闻详情"；E5 静态空壳。列表分页/分类方式未验证（gaps）。

### M6 横切功能（5 功能）
- 站内搜索：E3 `/search/` 子应用 + E2"learning 承接 /search"。
- 问题单工单：E3 `issue-history`/`approval-details` 两条路由一手确认 + E2 页脚"提交问题单"。
- 下载专区：E1 §学习器"课件下载（学生版/老师版走 backplatform）"；backplatform 不在 redirectConfig（配置外子应用）。
- 智能客服：E2 页脚"联系我们（智能客服/提交问题单）"。

## 五、status 口径说明

- 现网在线（36）：E1 实测可见或 E3 路由存在且无异常记录。
- 空白页（3）：myComp（空态无引导）、voucher/application（路由在、页面白）、realinfosystem（点击仅改 URL）。
- 断档（1）：我的课程平台升级迁移公告。
- 外链系统（14）：跳出到 uniportal/partner/elearning/myspace 等独立域名。
- inferred（5，含在上述 status 内）：热门认证、人才双选图区、中/EN 切换、Cookies 条、商城代金券。
