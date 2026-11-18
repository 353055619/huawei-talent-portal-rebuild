# 华为高校人才IT系统 · 重构调研与全站复刻基线

华为人才在线（e.huawei.com/cn/talent）重构项目的调研与复刻工作区：业界调研、现网缺陷一手勘察、全栈重构 demo、**全站 24 页像素级复刻**（含可运行的登录/注册/课程管理功能层）与 **7 条用户旅程演示视频**。

## 目录导览

| 目录 | 内容 |
|---|---|
| [replica/](replica/) | **全站像素级复刻（24 页）**：9 个公开频道页 + 课程详情（跨 SPA）+ 查找ICT学院 + 搜索结果 + uniportal 登录页 + 用户中心 11 页（登录态一手复刻，含现网缺陷的忠实呈现）。像素依据在 [replica/captures/](replica/captures/)（27 组现网整页截图+DOM），并排对比图在 [replica/compare/](replica/compare/) |
| [原型/华为人才在线功能模块图.html](原型/华为人才在线功能模块图.html) | 功能模块图网站：2 平台 / 20 模块 / 124 功能 / 7 条用户旅程，**每条旅程下嵌入实拍演示视频**（videos/J1–J7.mp4） |
| [replica/journey/](replica/journey/) | 旅程演示导演引擎 v1（iframe 承载复刻页 + 模拟光标，`player.html?j=J1..J7`）；**v2 真实操作录制**见 tools/real-record.mjs（Playwright 真实点击/表单/后端 + 注入光标字幕插卡，1080p·30fps 恒定帧率），时间线在 [tools/rj/](tools/rj/)（每旅程一文件 J1-J12） |
| [research/](research/) | 调研报告 00–07：现网信息架构一手笔记、国内大厂/海外平台/GitHub 开源调研、业务背景、重构总报告、demo 验收对比报告、登录态补验笔记 |
| [survey/](survey/) | 三域并行勘察归一化数据：modules-combined.json（20 模块/124 功能）+ journeys.json（7 条全量用户旅程） |
| [platform/](platform/) | 重构全栈 demo（Vue3 + Express + PostgreSQL，tracker 统一状态机），详见 [platform/README](platform/) 与 research/06 验收报告 |
| [tools/](tools/) | 复刻工具链：capture-live（现网抓取）/ fetch-assets（素材本地化）/ compare（并排比对）/ record-journeys（旅程录制）/ health-check（全站健康检查）/ smoke-journeys（时间线选择器冒烟）/ **server.mjs（功能版应用服务器）** / test-flows（功能全流程用例）。脚本从自身位置解析仓库根，任意 checkout 可直接运行 |

## 快速开始

```bash
# 方式一（推荐）：功能版复刻站 —— 注册/登录/会话/课程报名/教师开班/我的数据 全部可用
node tools/server.mjs          # http://127.0.0.1:8930  零依赖，数据存 tools/.server-db.json
# 演示账号：hw_demo_teacher_01 / demo123456（教师，可开班）
#          hw_demo_student_01 / demo123456（学生，已有一门课 35% 进度）
# 或在登录页点「注册」新建学生/教师账号

# 方式二：纯静态复刻站（无功能层，file:// 也可直接打开）
cd replica && python3 -m http.server 8931
# 旅程演示（两种方式均可）：http://localhost:8930/journey/player.html?j=J3

# 功能模块图（双击或 file:// 直接打开）
open 原型/华为人才在线功能模块图.html
```

## 功能层（server.mjs + app.js）

- **静态保真不变**：所有页面 file:// 直开仍是像素级静态复刻；功能层只在经 server.mjs 打开时接管（`replica/app.js` 同源探测 `/api/*`，纯静态打开自动降级，无外网请求）
- **已实现**：注册（学生/教师身份）→ 自动登录；登录/退出/会话（cookie）；顶栏账号态（登录后 `登录/注册` → `Uniportal账号 : xxx + 退出`）；课程报名（课程详情「去学习」）→ 我的课程实时列表（进度条）；**教师开班**（课程详情「我要开班」弹窗创建）→ 我的班级（邀请码/人数）；学生凭邀请码加入班级；我的证书/考试/券包/消息实时数据卡；站内导航接线（nav-wiring.js：导航互跳/课程卡/用户中心卡/面包屑/页脚链接）与 hover 下拉菜单（现网 t-popSelect 逐字菜单）
- **流程验收**：`node tools/test-flows.mjs`（8 用例：注册→登录→报名→我的课程；开班→我的班级；跨账号邀请码加入；退出；file:// 降级）

## 核心发现（详见 research/05 总报告）

- 门户是"壳"：≥10 个独立 SPA 子应用拼装（portal/learning/cert/ict-academy/usercenter/halp/stories/news/outPage/backplatform），另跨 7+ 外部系统（elearning/partner/iexam/survey/myspace/Pearson VUE/uniportal）
- 课程详情从学习频道点击会**新开标签跨 SPA**；查找ICT学院是**第 8 套界面**；全站搜索由 talent/search 子应用承接
- 用户中心三处渲染缺陷一手复验：关联-讲师零渲染、实名认证仅改 URL、考券申请空白页
- 就业双选是"断头路"：宣传每年数十场双选会、1000+ 企业，线上无任何功能入口（J6 视频）

## 声明

本项目为高校课程/企业重构调研用途的内部研究基线；`replica/` 为现网页面的研究性复刻，华为相关商标、文案与图片版权归华为所有。
