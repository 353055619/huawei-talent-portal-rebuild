# 用户旅程页重做：12 条旅程全覆盖 + 真实操作录制

## Context
功能模块图的用户旅程页现有 7 条旅程（J1-J7），调研归一化的 20 模块中有 8 个无旅程覆盖（HALP/企业培训/成功案例/资讯/横切/查找学院/IASC/产学合作）；现有视频为导演引擎模拟录制（div 合成光标+假按压+VFR 可变帧率），模拟感强、质量偏低。功能层上线后（server.mjs 14 个 API + app.js 真实行为），登录/注册/报名/开班/邀请码入班/实时列表已可真实操作——视频可升级为**真实浏览器操作录制**。用户已确认：补 5 条新旅程全覆盖、真实操作录制、不加配音。样式与逻辑保留（仅做容纳性微调）。

## 一、新增 5 条旅程（J8-J12，覆盖 8 个未覆盖模块）
| ID | 名称 | 角色 | 覆盖模块 | 步骤骨架（断点如实标注） |
|---|---|---|---|---|
| J8 | 培训伙伴入驻 HALP | 商业培训伙伴/HCSI | tal-halp | halp 频道了解计划 → ext:partner.huawei.com 入驻申请 → 线下审批 → halp 查找HALP/伙伴资讯 → 断点:HALP 班级管理无站内入口 |
| J9 | 企业培训对接 | 企业培训负责人 | tal-corporate | 首页导航企业培训 → 断点:新开标签 elearning（与 HALP 同 URL，企业端无本站功能实体）→ 回人才在线无任何记录 |
| J10 | 查找 ICT 学院 | 学生/院校合作者 | icta-find | ict-academy → 导航下拉点「查找ICT学院」（真实 hover 下拉）→ find-academy 真实表单查询 → 断点:查询结果区空白（现网未渲染缺陷）→ 学院资质无从校验 |
| J11 | IASC 支持与讲师成长 | ICT 学院教师 | icta-iasc, icta-teacher | uc-myinfo 关联-讲师（断点:点击零渲染，忠实复刻）→ ict-academy IASC 四类支持区 → ext:HCAI 讲师认证/TTT 外域 → 断点:认证进度无处可查 |
| J12 | 产学合作·众智 | 高校科研团队 | icta-industry | ict-academy 产学合作区（众智/火花奖文案）→ ext:众智平台外域 → 断点:无站内入口与进度 |

步骤文案取自 survey/modules-combined.json 对应模块的 feature 描述（保持调研口径），字段结构与现有一致（n/title/detail/module/note）。成功案例/资讯/通用横切 3 个内容型模块在旅程页标注"非旅程型模块"。

## 二、真实操作录制管线（核心新工程）
**新增 tools/record-real.mjs + tools/real-journeys.mjs**（页面文件零改动，UI 层全注入）：
- **前置**：node tools/server.mjs（8930 功能版）运行中；录制前备份 tools/.server-db.json，录完恢复（不打扰用户可能注册的账号）
- **真实光标**：page.evaluate 注入 fixed 光标 div（SVG 箭头，transform 过渡），监听 mousemove 更新；Playwright `page.mouse.move(x,y,{steps:N})` 平滑驱动 → hover 效果（导航下拉）真实触发
- **真实操作**：page.mouse.click 真实点击（nav-wiring 跳转/app.js 表单提交全走真实链路）；keyboard.type({delay:90}) 真实逐字输入（登录表单/搜索框/开班弹窗）
- **注入 UI 层**：底部字幕条（复用 player.html 字幕样式）、全屏插卡（external/offline/cut/info 四类，复用 player 样式含仿浏览器 chrome 条）、片头/片尾黑卡 → 播完 title='DONE'
- **时间线结构**：每条 J = {id,name,persona,summary,outro,steps:[{caption,detail,flag,run(page,ui)}]}，run 为真实 Playwright 操作序列；外域/线下/死点步骤用 ui.interstitial() 插卡（如 J7 商城点击无反应是现网"新开标签"的忠实死点 → 插卡表达外跳）
- **多账号旅程**（J2 教师开班→学生进班）：页面内真实"退出→登录另一账号"完成切换
- **转码**：ffmpeg `-r 30`（恒定帧率，修 VFR 卡顿）+ crf 20 + faststart；海报帧 -ss 取首个内容页时刻

**12 条全部重录**：J1-J7 步骤脚本从 timelines.js 迁移文案、操作改为真实版（如 J3 报名后 uc-mycourse 真实多一门课、J2 真实邀请码弹窗、J1 login.html 真实注册流）；J8-J12 按上表新写。

**分工**：主线写 record-real.mjs 框架 + 注入 UI 工具函数 + J3/J2 两条样例脚本；2 个 flash-worker 并行写其余步骤脚本（A: J1/J4/J5/J6/J7；B: J8-J12，附 modules-combined 对应模块 feature 清单作文案来源）；主线汇总、逐条录制、抽帧目检。

## 三、旅程页更新（原型/华为人才在线功能模块图.html）
- L158 `DATA.journeys` 追加 J8-J12（与 survey/journeys.json 同步更新）
- 左列表 12 条：加 max-height 滚动 + 条目紧凑化（样式容纳性微调，不动设计语言）
- 旅程页顶部加一行统计："12 条旅程 · 覆盖 17/20 模块（成功案例/资讯中心/通用横切为内容型模块，非旅程型）"——让"全面性"可见
- 视频引用不变（videos/{id}.mp4 + poster 动态拼路径，自动吃到新成片）

## 四、验证
1. `node tools/record-real.mjs` 录完 12 条：全部 title=DONE、时长 20-60s、ffprobe 确认 1920×1080/30fps 恒定
2. 每条抽帧 ≥2（内容页 + 插卡帧）目检：真实光标在位、字幕条正确、真实数据可见（我的课程列表/邀请码 toast）
3. 模块图旅程页浏览器验证：12 条全渲染、视频可播、统计行正确
4. 回归：test-flows 8/8（录制后 db 已恢复）、smoke-journeys 7/7（导演引擎保留共存）、health-check ALL OK、脱敏 grep 0
5. 提交推送 GitHub，主工作区同步，更新记忆与 craft-anything handoff

## 关键文件
- 新增：tools/record-real.mjs、tools/real-journeys.mjs
- 修改：原型/华为人才在线功能模块图.html（DATA+列表滚动+统计行）、survey/journeys.json（+5 条）
- 产物：原型/videos/J1-J12.mp4 + poster（12 条真实操作版）
- 不动：replica/ 全部页面、player/timelines（导演引擎保留为 fallback）、server.mjs/app.js/nav-wiring.js