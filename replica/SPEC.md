# 华为人才在线 · 全量复刻页构建规范（agent 必读）

## 目标
把分配给你的现网页面像素级复刻为 `replica/` 下的独立 HTML 页。验收口径：与现网整页截图**肉眼无显著差异**（布局结构、间距、配色、字号、内容完全一致）。

## 输入（都在本仓库）
- `replica/captures/<name>/full.png` — 现网整页截图（1920 宽，**像素依据，用 Read 工具看图**）
- `replica/captures/<name>/dom.html` — 现网渲染后 DOM（**文本内容/结构/原生 class 名的依据**；用 grep/Read 查，别整读，很大）
- `replica/assets/index.json` — 图片 URL→本地文件映射；本地文件在 `replica/assets/<page>/*.png|jpg`（先看有什么可用）
- `replica/_shell-top.tpl.html` / `replica/_shell-bottom.tpl.html` — 共享壳（cookie 条+黑工具条+白导航 / 页脚+悬浮钮）
- `replica/shell.css` — 共享壳样式基线（**不得修改**；页面自身样式写在页内 `<style>`）
- `replica/index.html` — 已验收的首页复刻（质量标杆，可参考其组件写法：课程卡/认证卡/页脚）

## 硬规则
1. 每页是**独立 HTML 文件**，`file://` 直接打开可用，禁止外网请求（图片只用 `assets/` 本地文件或 CSS 渐变/SVG）。
2. `<head>` 里 `<link rel="stylesheet" href="shell.css">`（usercenter/login 等特殊壳除外，见分配说明），页面样式全部在页内 `<style>`。
3. 壳顶部：把 `_shell-top.tpl.html` 内容贴进来，把当前频道对应的 `.nav-item` 加 `style="color:var(--hw-red)"` 或包一层 `<span style="color:var(--hw-red)">` 表示选中态（对照截图里导航红字态）。顶栏右侧登录态对照截图：截图显示 `登录/注册` 用模板原文；显示 `Uniportal账号 : hw_353055619_qq.com_01` 就替换成该按钮（黑底白字、hover 下划线，截图里是顶栏右端的一块）。
4. 文本内容（标题/副标/列表项/按钮字/数字/时间）**逐字取自 dom.html**，不得自己编。数量大的列表（如课程卡 133 门）按截图可见范围复刻 + 分页器示意即可，不必全量。
5. 布局像素依据是 full.png：区块顺序、留白、分栏数、卡片高度比例、底色分区都要对上。设计宽度 1920、内容容器 1200px 居中（`.container` 已有）。
6. 图片：优先 `assets/` 里的现网原图（按 index.json 的 URL 线索和文件名试读图片确认内容，Read 工具可以看 PNG/JPG）；没有下载到的图用与截图同色调的 CSS 渐变占位（参考 index.html 的 cover-g1..g5 写法），并在页尾 `<!-- REPLICA-NOTE: -->` 注释里列出占位项。
7. 现网的**缺陷也要忠实复刻**（这是调研目的）：例如 usercenter 左侧菜单只在首页渲染、考券申请空白页、个人信息点击无响应等，按截图原样呈现。
8. 交互只做表现层：tab 切换、hover 态、轮播用少量原生 JS；不做真实数据逻辑。
9. 完成后运行 `cd tools && node compare.mjs <你的页面名...>` 自查（生成 `replica/compare/<name>-cmp.png` 并排图），用 Read 看对比图，修掉明显差异，至少迭代一轮。
10. 不改动：`shell.css`、`tokens.css`、`index.html`、`captures/`、`assets/index.json`。

## 页面命名（写成 replica/<name>.html）
index(已有) / learning / learning-all / course-detail / cert / ict-academy / contest / halp / stories / news / find-academy / search-results / login / uc-home / uc-mycourse / uc-myclass-list / uc-mycomp / uc-mycoupons / uc-mynews / uc-mycert / uc-myexam / uc-myinfo / uc-realinfo / uc-voucher-app
