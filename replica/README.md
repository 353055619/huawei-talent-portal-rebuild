# 华为人才在线 · 前端样式复刻（独立项目）

**目标**：原样复刻现网 https://e.huawei.com/cn/talent/portal/#/ 的首页前端样式，作为样式基线固定下来；后续所有优化在基线之上叠加。

## 查看

```zsh
cd replica && python3 -m http.server 8930
# 打开 http://localhost:8930/index.html
```

或直接双击 `index.html`（file:// 可用，素材全部本地化）。

## 复刻范围（v1，2026-11-15 现网实测）

| 区块 | 还原依据 |
|---|---|
| Cookie 提示条 | #EDEDED / 38px / 红色链接 + 圆形关闭钮 |
| 黑色工具条 | #000 / 40px / 华为人才在线 · 消息红徽标0 · 中/EN · 登录/注册 |
| 白色主导航 | 72px / HUAWEI logo + 8 菜单项（带▼）+ 边框搜索框（红放大镜） |
| 轮播 Banner | **现网 10 张原始营销图**（2880×840，已下载本地），横线指示器，5s 自动播 |
| 热门课程 | 浅灰底 / 居中 28px 标题+副标 / 一行 5 卡：渐变封面+HUAWEI ACADEMY 水印+白底图标块+蓝"慕课"标签+红 NEW 角标+"免费"红字+人数 |
| 热门认证 | 白底 / 5 列 / 官方卡背景图 + 金色徽章 + 认证条目列表 + 了解更多>> |
| 成功案例 | 浅灰底 / 3 卡轮播位 / 渐变封面 + 标题摘要 |
| 人才双选 | 白底 / 居中标题 + 官方 talentBridge 大图 |
| 页脚 | 4 列链接（18px 标题/14px 链接）+ 二维码 + 社交图标 + 版权条（红链接）|
| 悬浮联系我们 | 右侧中部红钮（横排 4px 圆角） |

## 文件

- `index.html` — 复刻页（class 命名与现网一致）
- `tokens.css` — **固定样式基线**（颜色/字号/尺寸/组件规格的单一事实来源；优化层不得改基线值，只能叠加 override）
- `assets/` — 现网原始素材（10 banner、认证卡背景、人才双选大图、图标）
- `compare-hero.png` — 与现网并排对比图

## 后续"逐步优化"的用法

1. 以 `tokens.css` 为基线接入全栈 demo（`../platform/`）的公共壳与门户页，替换现行自定义设计系统；
2. 优化样式写在 override 层（如 `optimize.css`），保持基线可回溯；
3. 每次优化与现网截图对比，防止风格漂移。


## 全量复刻 v2（2026-11-15 第三阶段）

复刻范围扩展为**全站 24 页**（见下表）。像素依据：`captures/<页面名>/full.png`（现网 1920 宽整页截图）+ `dom.html`（渲染后 DOM，文本逐字来源）。素材本地化在 `assets/<页面名>/`。并排对比图：`compare/<页面名>-cmp.png`（LIVE | REPLICA）。

| 页面 | 文件 | 现网来源 |
|---|---|---|
| 门户首页 | index.html | portal/#/（v1 已验收） |
| 学习频道 | learning.html | learning/#/ict-academy（三视图+筛选+课程卡） |
| 全部课程 | learning-all.html | learning/#/all-course |
| 课程详情 | course-detail.html | ict-academy/#/ict-courses-detail（跨 SPA 新标签） |
| 认证频道 | cert.html | cert/#/careerCert（全景图用现网裁图保真） |
| ICT学院 | ict-academy.html | ict-academy/#/home |
| ICT大赛 | contest.html | ict-academy/#/ict-contest |
| 培训伙伴 | halp.html | halp/#/home?navType=halp |
| 成功案例 | stories.html | success-stories/#/home |
| 资讯中心 | news.html | news/#/ |
| 查找ICT学院 | find-academy.html | talent/#/organization/search?type=Academy |
| 搜索结果 | search-results.html | search/#/home?productName=双选会 |
| 登录页 | login.html | uniportal.huawei.com（独立系统壳） |
| 用户中心 ×11 | uc-home / uc-mycourse / uc-myclass-list / uc-mycomp / uc-mycoupons / uc-mynews / uc-mycert / uc-myexam / uc-myinfo / uc-realinfo / uc-voucher-app | usercenter/#/home 及子路由（登录态抓取；含券包规则全文、空白申请页、菜单仅首页渲染等缺陷忠实复刻） |

**共享基建**：`shell.css`（壳样式基线，源自已验收首页）+ `_shell-top/bottom.tpl.html`（壳模板）+ `SPEC.md`（构建规范）+ `parts/`（主线自建页的源片段）。

**用户旅程演示引擎**：`journey/player.html?j=J1..J7`（iframe 承载复刻页 + 模拟光标 + 步骤字幕 + 外链/线下插卡 + 片头片尾），时间线 `journey/timelines.js`；录制 `tools/record-journeys.mjs`（Playwright recordVideo → ffmpeg 转 mp4），成片与封面帧在 `../原型/videos/J*.mp4|-poster.jpg`，已嵌入功能模块图每条旅程下。

**工具**（tools/，需 `npm i playwright`）：`capture-live.mjs`（现网抓取）、`fetch-assets.mjs`（素材下载）、`compare.mjs`（并排对比图）、`record-journeys.mjs`（旅程录制）。

**预览**：`cd replica && python3 -m http.server 8930`（常驻已起）→ http://localhost:8930/ict-academy.html 等；旅程播放器需 HTTP（iframe 同源）。
