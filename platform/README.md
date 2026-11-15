# 华为高校人才平台 · 重构概念 Demo

基于《华为高校人才 IT 系统重构调研》（`../research/`）结论构建的全栈概念验证：
把现网「营销门户 + 7 套交易系统」重组为**一个账号、一个工作台、四类角色端、九大业务域**的一体化平台。

## 技术栈

- **前端**：Vue 3 + Vue Router + Pinia + vue-i18n（中/EN 双语，顶栏切换）+ Vite（自建设计系统，无 UI 框架）
- **后端**：Express + node-postgres（统一状态机注册表 + 事件溯源式追踪）
- **数据库**：PostgreSQL 18（Apple Container `hindsight-db` 实例中的 `talent_portal` 库，与 hindsight_db 隔离）

## 启动

```zsh
./start.sh          # 构建前端并启动，访问 http://localhost:3001
./start.sh dev      # 只启动 API（3001）；前端 cd web && npm run dev（5173，代理 /api）
```

重置演示数据：`cd server && npm run seed`

## 演示账号（密码均为 demo1234）

| 账号 | 角色 | 预置状态 |
|---|---|---|
| student@hw.dev | 学生 林晓澜 | 覆盖六条旅程的进行时：学习中课程×3、班级、考券申请、约考、大赛省赛、双选会报名、两笔投递 |
| teacher@hw.dev | 教师 陈明远 | 2 个班级、19 人成绩册、开班向导 |
| schooladmin@hw.dev | 院管 王建国 | 学院数据看板、考券审批、成员审批、就业去向报告 |
| employer@hw.dev | 企业(软通动力) 苏婉晴 | 岗位管理、候选人管线（推进即通知学生）、人才检索 |
| iasc@hw.dev | IASC 郑浩 | 入驻审批推进、全生态运营看板 |

## 架构要点（对应调研报告第五节）

1. **统一追踪注册表** `server/src/lib/tracker.js`：N 种申请（投递/考券/大赛/双选会/入驻/约考/学习）共享一套「状态-步骤」状态机 + `tracker_events` 事件表，前端一个 StepsBar 组件全站复用——「一切状态皆可追踪」的通用解法。
2. **常驻双壳**：AppShell（公共门户）+ Workbench（登录后按角色渲染的常驻侧栏）——修复现网「usercenter 子页面丢失左侧菜单」「一次会话 7+ 新标签」的结构性缺陷。
3. **角色叠加**：一个账号多角色（user_roles），顶栏菜单切换角色即切换工作台视角。
4. **空态即入口**：所有空列表都带「为什么为空 + 下一步 CTA」。
5. **四端数据闭环**：学生学习 → 院管看板 → 雇主管线 → 就业去向报告，同一份数据四个视角。

## 目录

```
server/src/
  schema.sql        # 九大业务域表结构
  seed.js           # 基于调研真实结构的种子数据
  lib/tracker.js    # 统一状态机注册表（架构核心）
  routes/           # auth/public/my/teach/school/employer/iasc/onboarding
web/src/
  layouts/          # AppShell / Workbench 双壳
  components/       # 设计系统（StepsBar/EmptyState/StatusBadge/…）
  views/            # 公共页 + my/teach/school/employer/iasc 五组视图
```
