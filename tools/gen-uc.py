#!/usr/bin/env python3
# 生成用户中心全家族 replica/uc-*.html（共享壳 + 每页内容）
# 依据 captures/uc-*/full.png 像素测量 + dom.html 文本
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REP = os.path.join(ROOT, 'replica')

# ---------------------------------------------------------------- shell top
SHELL_TOP = '''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{TITLE}（复刻）</title>
<link rel="stylesheet" href="shell.css" />
<style>
/* ===== 用户中心共享壳覆盖（对照 captures 实测：cookie 44px #ccc / 黑条 32px / 导航 78px） ===== */
.cookie-bar{{background:#cccccc;font-size:13px;color:#333}}
.cookie-bar .container{{height:44px}}
.cookie-bar a.red{{color:#333;text-decoration:underline;text-underline-offset:3px}}
.topbar{{height:32px}}
.topbar .container{{height:32px}}
.topbar-left{{font-size:13px}}
.topbar-right{{gap:26px;font-size:12px}}
.mainnav .container{{height:78px}}
.nav-search{{height:40px}}
/* 现网 usercenter 全站容器实测 1180（截图 370-1550 @1910 宽） */
.container{{width:1180px;max-width:94vw}}
.mainnav .container{{gap:54px}}
.nav-list{{gap:28px}}
.nav-item{{font-size:16px}}
.hw-logo .word{{font-size:21px;letter-spacing:.03em}}
.uc-account{{display:inline-flex;align-items:center;color:#fff;cursor:pointer;font-size:12px;white-space:nowrap}}
.uc-account:hover{{text-decoration:underline;text-underline-offset:3px}}
/* 页脚密度对照实测（链接行距 36px，版权行紧随其后） */
.com-footer-content{{padding:55px 0 26px}}
.com-footer-content-left li{{margin-bottom:13px}}
.com-footer-content-left li:first-child{{margin-bottom:13px}}
.footer-bottom{{padding:16px 0 0}}
/* ===== 内容区公共 ===== */
body{{background:var(--page-bg)}}
.uc-main{{background:var(--page-bg)}}
.uc-crumbs{{width:1200px;max-width:94vw;margin:0 auto;padding:17px 0 0;font-size:13px;color:#666;line-height:1.5}}
.uc-crumbs .crumb{{color:#666}}
.uc-crumbs .sep{{margin:0 10px;color:#a6a6a6}}
.uc-card{{width:1200px;max-width:94vw;margin:12px auto 0;background:#fff;position:relative}}
.uc-main{{padding-bottom:10px}}
/* 空态 */
.uc-nodata{{text-align:center;padding:20px;margin-top:50px;color:#999;font-size:14px}}
/* m-button 复刻（现网 usercenter 组件库） */
.m-btn{{display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 14px;border:1px solid var(--hw-red);border-radius:2px;color:var(--hw-red);background:#fff;font-size:13px;cursor:pointer;line-height:1}}
.m-btn:hover{{opacity:.85}}
.m-btn.primary{{background:var(--hw-red);color:#fff}}
.m-btn.disabled{{border-color:#d9d9d9;background:#f5f5f5;color:#bfbfbf;cursor:not-allowed}}
/* 输入框 */
.m-input{{display:inline-flex;align-items:center;height:32px;border:1px solid #dcdfe6;border-radius:2px;background:#fff;padding:0 10px;font-size:13px;color:#606266}}
.m-input input{{border:none;outline:none;font-size:13px;color:#606266;width:100%;background:transparent}}
.m-input input::placeholder{{color:#bfbfbf}}
.m-input .ph{{color:#bfbfbf}}
.m-input .caret{{width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid #b0b0b0;margin-left:6px}}
{PAGE_CSS}
</style>
</head>
<body>

<!-- Cookie 提示条（截图口径：无关闭按钮） -->
<div class="cookie-bar">
  <div class="container">
    本站点使用Cookies，继续浏览表示您同意我们使用Cookies。
    <a class="red">Cookies和隐私政策</a>
  </div>
</div>

<!-- 黑色工具条（登录态） -->
<div class="topbar">
  <div class="container">
    <div class="topbar-left">华为人才在线</div>
    <div class="topbar-right">
      <span class="tool">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 3.5h12v7H8.5L5 13.5v-3H2v-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
        <span class="msg-badge">0</span>
      </span>
      <span class="tool lang-group">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.2"/><path d="M2 8h12M8 1.8c-2.2 2.4-2.2 10 0 12.4M8 1.8c2.2 2.4 2.2 10 0 12.4" stroke="currentColor" stroke-width="1.1"/></svg>
        <button class="cur">中</button>
        <button>EN</button>
      </span>
      <span class="tool uc-account"><span>Uniportal账号 : </span><span>hw_353055619_qq.com_01</span></span>
    </div>
  </div>
</div>

<!-- 白色主导航 -->
<header class="mainnav">
  <div class="container">
    <a class="hw-logo" aria-label="华为官网首页">
      <span class="petal" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span class="word">HUAWEI</span>
    </a>
    <nav class="nav-list" aria-label="主导航">
      <a class="nav-item">学习<span class="caret"></span></a>
      <a class="nav-item">认证<span class="caret"></span></a>
      <a class="nav-item">华为ICT学院<span class="caret"></span></a>
      <a class="nav-item">华为ICT大赛</a>
      <a class="nav-item">培训伙伴<span class="caret"></span></a>
      <a class="nav-item">企业培训</a>
      <a class="nav-item">成功案例</a>
      <a class="nav-item">商城</a>
    </nav>
    <div class="nav-search" role="search">
      <input type="search" placeholder="搜索全部" aria-label="搜索全部" />
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="4.6" stroke="currentColor" stroke-width="1.5"/><path d="M10.6 10.6 14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </div>
  </div>
</header>
'''

SHELL_BOTTOM = '''<!-- 页脚 -->
<footer class="com-footer-wrapper">
  <div class="container">
    <div class="com-footer-content">
      <div class="com-footer-content-left">
        <ul>
          <li>关于我们</li>
          <li>华为认证</li>
          <li>华为ICT学院</li>
          <li>华为培训合作伙伴</li>
          <li>资讯中心</li>
        </ul>
        <ul>
          <li>资源</li>
          <li>资源中心</li>
          <li>合作伙伴（HALP）下载专区</li>
          <li>ICT学院下载专区</li>
          <li>工具专区</li>
          <li>成功案例</li>
        </ul>
        <ul>
          <li>快速链接</li>
          <li>集团网站</li>
          <li>企业业务网站</li>
          <li>华为人才发展中心</li>
          <li>华为招聘</li>
          <li>华为认证论坛</li>
          <li>华为云</li>
        </ul>
        <ul>
          <li>联系我们</li>
          <li>智能客服</li>
          <li>提交问题单</li>
        </ul>
      </div>
      <div class="com-footer-content-right">
        <div class="qr-box">
          <div class="qr" aria-label="微信公众号二维码（示意）">
            <i></i><i></i><i class="o"></i><i></i><i class="o"></i><i></i><i></i>
            <i></i><i class="o"></i><i></i><i></i><i></i><i class="o"></i><i></i>
            <i class="o"></i><i></i><i></i><i class="o"></i><i></i><i></i><i class="o"></i>
            <i></i><i></i><i class="o"></i><i></i><i class="o"></i><i></i><i></i>
            <i></i><i class="o"></i><i></i><i></i><i></i><i class="o"></i><i></i>
            <i class="o"></i><i></i><i></i><i class="o"></i><i></i><i class="o"></i><i></i>
            <i></i><i></i><i class="o"></i><i></i><i></i><i></i><i class="o"></i>
          </div>
          <p>官方微信</p>
        </div>
        <div class="social-col">
          <a class="social-btn" aria-label="微信公众号">
            <svg viewBox="0 0 20 20" fill="none"><path d="M5.5 8.6c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4-.6 1.4-1.4 1.4-1.4-.6-1.4-1.4zM11.7 8.6c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4-.6 1.4-1.4 1.4-1.4-.6-1.4-1.4z" fill="currentColor"/><path d="M3 6.8C3 4.9 5.2 3.5 8 3.5h4c2.8 0 5 1.4 5 3.3v3.9c0 1.9-2.2 3.3-5 3.3-.4 0-.8 0-1.2-.1l-2.6 1.8v-2.4C5.2 12.8 3 11.4 3 9.5V6.8z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
          </a>
          <a class="social-btn" aria-label="微博">
            <svg viewBox="0 0 20 20" fill="none"><circle cx="9.5" cy="11" r="4.4" stroke="currentColor" stroke-width="1.3"/><path d="M13.2 6.2c1 .2 1.9.9 2.3 1.9M13.5 3.9c1.6.4 2.9 1.5 3.5 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          </a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container" style="padding:0">
        <span>版权所有 © 华为技术有限公司 1998-2026。保留一切权利。 <a class="red">粤A2-20044005号</a></span>
        <span class="footer-links">
          <a>联系我们</a><a>隐私保护</a><a>法律声明</a>
        </span>
      </div>
    </div>
  </div>
</footer>

<!-- 右侧悬浮联系我们 -->
<a class="float-contact">联系我们</a>

'''

# ================================================================ pages
PAGES = {}

# ---------------------------------------------------------------- uc-home
HOME_CSS = '''
.uc-home-wrap{width:1180px;max-width:94vw;margin:0 auto}
.uc-line{background:#fff;padding:16px 0 34px}
.uc-line-title{font-size:16px;font-weight:600;color:#333;display:flex;align-items:center;gap:6px;padding-left:12px}
.uc-line-title .q{width:14px;height:14px;border:1px solid #b3b3b3;border-radius:50%;color:#999;font-size:11px;display:inline-flex;align-items:center;justify-content:center;font-weight:400}
.uc-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:22px 16px;margin-top:12px;padding:0 12px}
.uc-cards .item{border:1px solid #e8e8e8;border-radius:4px;height:79px;display:flex;align-items:center;padding-left:15px;background:#fff;cursor:pointer}
.uc-cards .item:hover{box-shadow:0 4px 14px rgba(0,0,0,.08)}
.uc-cards .item img{width:48px;height:48px}
.uc-cards .item span{margin-left:12px;font-size:15px;color:#666}
'''
HOME_BODY = '''<div class="uc-main" style="min-height:702px">
  <div class="uc-crumbs" style="width:1180px"><a class="crumb">首页</a><span class="sep">&gt;</span><a class="crumb">用户中心</a><span class="sep">&gt;</span></div>
  <div class="uc-home-wrap">
    <div class="uc-line">
      <div class="uc-line-title">个人中心
        <span class="q" title="以学习者身份在talent平台的学习记录及权益">?</span>
      </div>
      <div class="uc-cards">
        <a class="item"><img src="assets/usercenter/icon-course.png" alt=""/><span>我的课程</span></a>
        <a class="item"><img src="assets/usercenter/icon-class.png" alt=""/><span>我的班级</span></a>
        <a class="item"><img src="assets/usercenter/icon-comp.png" alt=""/><span>我的大赛</span></a>
        <a class="item"><img src="assets/usercenter/icon-person.png" alt=""/><span>个人信息</span></a>
        <a class="item"><img src="assets/usercenter/icon-coupon.png" alt=""/><span>我的券包</span></a>
        <a class="item"><img src="assets/usercenter/icon-cert.png" alt=""/><span>我的证书</span></a>
        <a class="item"><img src="assets/usercenter/icon-exam.png" alt=""/><span>我的考试</span></a>
        <a class="item"><img src="assets/usercenter/icon-news.png" alt=""/><span>我的消息</span></a>
      </div>
    </div>
  </div>
</div>
<!-- REPLICA-NOTE: 8 张卡片图标取自 dom.html 内嵌 base64 原图；? 气泡(以学习者身份在talent平台的学习记录及权益)为 hover 态，截图不可见，用 title 呈现；面包屑尾随 “>” 为现网缺陷，如实复刻 -->
'''
PAGES['uc-home'] = ('用户中心-个人中心', HOME_CSS, HOME_BODY)
PAGES['uc-mycomp'] = ('用户中心-我的大赛', HOME_CSS, HOME_BODY)

# ---------------------------------------------------------------- uc-mycourse
COURSE_CSS = '''
.myclass-card{min-height:650px;padding:10px 12px 0}
.alert{display:flex;align-items:flex-start;justify-content:space-between;background:#f0f7ff;border-radius:2px;padding:11px 14px;margin-bottom:22px}
.alert-left{display:flex;gap:10px;align-items:flex-start}
.alert-left svg{flex:none;margin-top:2px}
.alert-left p{font-size:12.5px;color:#333;line-height:21px}
.alert-left a{color:#1f70c1}
.alert-right{color:#999;font-size:14px;cursor:pointer;padding:0 4px}
.nav_container{display:flex;justify-content:space-between;align-items:center;padding:4px 0 14px}
.nav_box{display:flex;gap:34px}
.nav_box div{font-size:14px;color:#333;cursor:pointer}
.nav_box div.sortColor{color:var(--hw-red)}
.crs-list{display:grid;grid-template-columns:repeat(4,1fr);gap:20px 14px;padding-bottom:26px}
.new-card-course{border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;background:#fff}
.new-card-course:hover{box-shadow:0 4px 14px rgba(0,0,0,.08)}
.new-card-course .img{position:relative;height:158px;overflow:hidden}
.new-card-course .img img{width:100%;height:100%;object-fit:cover}
.new-card-course .img span{position:absolute;left:0;top:10px;background:#2b7cf5;color:#fff;font-size:12px;padding:2px 9px 2px 7px;border-radius:0 3px 3px 0}
.new-card-course .text{padding:10px 12px 6px;font-size:15px;color:#262626;line-height:22px;height:58px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.process-box{display:flex;align-items:center;padding:0 12px 14px;gap:10px}
.process-grey{flex:1;height:6px;background:#ededed;border-radius:3px;overflow:hidden}
.process-grey b{display:block;height:100%;background:#f66913;width:0}
.process-right span{font-size:12px;color:#666}
.aui-pager{display:flex;justify-content:space-between;align-items:center;padding:6px 4px 18px;font-size:13px;color:#606266}
.aui-pager .pg-total{color:#606266}
.aui-pager .pg-right{display:flex;align-items:center;gap:8px}
.aui-pager button{width:28px;height:28px;border:1px solid #e1e1e1;border-radius:2px;color:#c0c4cc;display:inline-flex;align-items:center;justify-content:center;cursor:not-allowed;background:#fff}
.aui-pager .pg-num{min-width:28px;height:28px;border:1px solid var(--hw-red);color:var(--hw-red);border-radius:2px;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}
.aui-pager .pg-goto{display:inline-flex;align-items:center;gap:6px;color:#606266}
.aui-pager .pg-goto input{width:42px;height:28px;border:1px solid #dcdfe6;border-radius:2px;outline:none;text-align:center}
'''
COURSE_BODY = '''<div class="uc-main" style="min-height:702px">
  <div class="uc-crumbs"><a class="crumb">首页</a><span class="sep">&gt;</span><a class="crumb">用户中心</a><span class="sep">&gt;</span><a class="crumb">我的课程</a><span class="sep">&gt;</span></div>
  <div class="uc-card myclass-card">
    <div class="alert">
      <div class="alert-left">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.6" stroke="#2b7cf5" stroke-width="1.4"/><path d="M8 7.2v4M8 4.8v.6" stroke="#2b7cf5" stroke-width="1.4" stroke-linecap="round"/></svg>
        <div>
          <p>1、【我的课程】不包括您通过班级进入的课程,如需查看,请前往【用户中心】-【我的班级】。</p>
          <p>2、由于平台升级，建议前往<a>【学习】</a>页面重新学习，给您造成不便，敬请谅解！</p>
        </div>
      </div>
      <span class="alert-right">✕</span>
    </div>
    <div class="nav_container">
      <div class="nav_box">
        <div class="sortColor" style="width:90px">全部</div>
        <div style="width:90px">在线课程</div>
        <div style="width:200px">实验案例</div>
      </div>
      <div class="nav_box">
        <div class="sortColor" style="width:90px">学习中</div>
        <div style="width:90px">已结束</div>
      </div>
    </div>
    <div class="crs-list">
      <div class="new-card-course">
        <div class="img"><img src="assets/usercenter/course-cover-ascend.png" alt=""/><span>慕课</span></div>
        <div class="text" title="Ascend C异构并行程序设计 V2.0">Ascend C异构并行程序设计 V2.0</div>
        <div class="process-box">
          <div class="process-grey"><b style="width:0%"></b></div>
          <div class="process-right"><span>0.00%</span></div>
        </div>
      </div>
    </div>
    <div class="aui-pager">
      <span class="pg-total">共 <b style="color:#333;font-weight:600">1</b> 条</span>
      <span class="pg-right">
        <button><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6.5 1.5 3 5l3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <span class="pg-num">1</span>
        <button><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 1.5 7 5 3.5 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <span class="pg-goto">跳至 <input type="text" /></span>
      </span>
    </div>
  </div>
</div>
<!-- REPLICA-NOTE: 课程封面为现网原图(course-cover-ascend.png)；进度条为 0%（橙填充宽 0）；面包屑尾随 “>” 如实复刻 -->
'''
PAGES['uc-mycourse'] = ('用户中心-我的课程', COURSE_CSS, COURSE_BODY)

# ---------------------------------------------------------------- uc-myclass-list
MYCLASS_CSS = '''
.myclass-card{min-height:650px;padding:16px 12px 0}
.mc-row{display:flex;justify-content:space-between;align-items:flex-start}
.search-line{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.search-title{font-size:13px;color:#606266;width:56px;text-align:right}
.selectStatus{width:190px;height:32px}
.row-right{display:flex;align-items:center;gap:10px;margin-right:22px}
.row-right-input{width:200px}
.noData-box{margin-top:110px}
.noData{text-align:center;color:#999;font-size:14px}
'''
MYCLASS_BODY = '''<div class="uc-main" style="min-height:702px">
  <div class="uc-crumbs"><a class="crumb">首页</a><span class="sep">&gt;</span><a class="crumb">用户中心</a><span class="sep">&gt;</span><a class="crumb">我的班级</a><span class="sep">&gt;</span></div>
  <div class="uc-card myclass-card">
    <div class="mc-row">
      <div class="mc-left">
        <div class="search-line">
          <span class="search-title">组织方</span>
          <div class="m-input selectStatus"><input readonly placeholder="请选择" /><span class="ph"></span><span class="caret"></span></div>
        </div>
        <div class="search-line">
          <span class="search-title">班级状态</span>
          <div class="m-input selectStatus"><input readonly placeholder="请选择" /><span class="ph"></span><span class="caret"></span></div>
        </div>
        <div class="search-line">
          <div class="m-input selectStatus" style="width:260px"><input placeholder="请输入班级名称" /><svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="margin-left:6px;color:#999"><circle cx="7" cy="7" r="4.6" stroke="currentColor" stroke-width="1.5"/><path d="M10.6 10.6 14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>
        </div>
      </div>
      <div class="row-right">
        <div class="m-input row-right-input"><input placeholder="请输入班级邀请码" /></div>
        <button class="m-btn">加入</button>
      </div>
    </div>
    <div class="noData-box"><div class="noData">暂无数据</div></div>
  </div>
</div>
<!-- REPLICA-NOTE: 面包屑尾随 “>” 如实复刻；筛选下拉为静态表现层 -->
'''
PAGES['uc-myclass-list'] = ('用户中心-我的班级', MYCLASS_CSS, MYCLASS_BODY)

# ---------------------------------------------------------------- uc-mycoupons
COUPONS_CSS = '''
.myCoupons{padding:0 24px}
.myCoupons__menuTabs ul{display:flex;gap:44px;border-bottom:1px solid #e8e8e8}
.myCoupons__menuTabs li{font-size:14px;color:#333;padding:12px 0 10px;cursor:pointer;position:relative}
.myCoupons__menuTabs li.selected{color:var(--hw-red);font-weight:600}
.myCoupons__menuTabs li.selected:after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--hw-red)}
.coupon-head{display:flex;justify-content:space-between;align-items:center;margin-top:10px}
.coupon-head .m-btn{margin-right:0}
.myCoupons__content_topTip{font-size:12.5px;color:#333;line-height:24px;padding:14px 2px 10px}
.myCoupons__content_topTip a{color:#1f70c1;word-break:break-all}
.uc-nodata Coupons{{}}
'''
COUPONS_BODY = '''<div class="uc-main" style="min-height:830px">
  <div class="uc-crumbs"><a class="crumb">首页</a><span class="sep">&gt;</span><a class="crumb">用户中心</a><span class="sep">&gt;</span><a class="crumb">我的券包</a><span class="sep">&gt;</span></div>
  <div class="uc-card myCoupons">
    <div class="coupon-head" style="border-bottom:1px solid #e8e8e8">
      <div class="m-tabs myCoupons__menuTabs" style="flex:1">
        <ul>
          <li class="selected">暗码考券</li>
          <li>数字考券</li>
        </ul>
      </div>
      <button class="m-btn">考券记录</button>
    </div>
    <div class="myCoupons__content_topTip">1.暗码考券有效期请以考券上呈现有效期为准（有效期从发放日开始计算），您需要在考券有效期内参加考试。考券发放之后不予延期或更换。<br>
 2.请您至少在HCIE实验考试券到期前7个自然日完成预约。华为不接受任何因考试资源不足的实验延期理由。<br>
 3.使用暗码考券预约考试时，直接勾选符合条件的暗码考券即可，不需要输入暗码考券号，暗码号无法用于预约考试。<br>
 4.考券使用操作指引： <a>https://e.huawei.com/cn/talent/news/#/details?consultationId=4678</a><br>
 5.如您的考券状态为”已占用“，请在【用户中心】-【我的考试】中查看考试预约记录并继续预约，或等待24小时系统自动取消待支付订单后再重新预约。</div>
    <div class="m-tabs myCoupons__menuTabs">
      <ul>
        <li class="selected">全部（0）</li>
        <li>可用（0）</li>
        <li>不可用（0）</li>
      </ul>
    </div>
    <div><p class="uc-nodata">暂无数据</p></div>
  </div>
</div>
<!-- REPLICA-NOTE: 规则 5 条逐字取自 dom.html；“考券记录”为右侧按钮（非 tab），与 dom 一致；面包屑尾随 “>” 如实复刻 -->
'''
PAGES['uc-mycoupons'] = ('用户中心-我的券包', COUPONS_CSS, COUPONS_BODY)

# ---------------------------------------------------------------- uc-mynews
NEWS_CSS = '''
.my-news{padding:0 24px;min-height:650px}
.tabs{display:flex;gap:56px;border-bottom:1px solid #e8e8e8}
.tab .tabTitle{font-size:15px;color:#333;padding:12px 0 10px;cursor:pointer}
.tab .tabTitle.isSelected{color:var(--hw-red);font-weight:600}
.tab .radius{height:2px;background:var(--hw-red);margin-top:-1px;position:relative}
.info{text-align:center;color:#999;font-size:14px;padding:60px 0 40px}
.learning-home-footer{border-top:1px solid #f0f0f0;padding:14px 2px}
.m-pagination-wrapper{display:flex;align-items:center;gap:10px;font-size:13px;color:#606266;justify-content:flex-end}
.m-pagination-prev,.m-pagination-next{width:28px;height:28px;border:1px solid #e1e1e1;border-radius:2px;display:inline-flex;align-items:center;justify-content:center;color:#c0c4cc;background:#fff}
.m-pagination-jump{display:inline-flex;align-items:center;gap:6px;margin-left:8px}
.m-pagination-jump .m-input{width:120px;height:28px}
.m-pagination-jump input[type=number]{width:46px;height:28px;border:1px solid #dcdfe6;border-radius:2px;text-align:center;outline:none}
'''
NEWS_BODY = '''<div class="uc-main" style="min-height:702px">
  <div class="uc-crumbs"><a class="crumb">首页</a><span class="sep">&gt;</span><a class="crumb">用户中心</a><span class="sep">&gt;</span><a class="crumb">我的消息</a><span class="sep">&gt;</span></div>
  <div class="uc-card my-news">
    <div class="tabs">
      <div class="tab"><p class="tabTitle isSelected">待办事项(0)</p><div class="radius"></div></div>
      <div class="tab"><p class="tabTitle">消息提醒(0)</p><div class="radius" style="display:none"></div></div>
      <div class="tab"><p class="tabTitle">平台公告(0)</p><div class="radius" style="display:none"></div></div>
    </div>
    <div class="info">暂无消息</div>
    <div class="learning-home-footer">
      <div class="m-pagination-wrapper">
        <span class="m-pagination-total">总0条</span>
        <div class="m-input" style="width:90px;height:28px"><span class="ph" style="color:#606266">20条/页</span><span class="caret"></span></div>
        <span class="m-pagination-prev"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6.5 1.5 3 5l3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <span class="m-pagination-next"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 1.5 7 5 3.5 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <span class="m-pagination-jump">前往 <input type="number" placeholder="请输入" /> 页</span>
      </div>
    </div>
  </div>
</div>
<!-- REPLICA-NOTE: 三 tab 均为 0；分页器空态（无页码）；面包屑尾随 “>” 如实复刻 -->
'''
PAGES['uc-mynews'] = ('用户中心-我的消息', NEWS_CSS, NEWS_BODY)

# ---------------------------------------------------------------- uc-mycert (talent 子应用)
CERT_CSS = '''
.t-crumbs{width:1200px;max-width:94vw;margin:0 auto;padding:14px 0 0;font-size:13px;color:#666}
.t-crumbs .sep{margin:0 9px;color:#a6a6a6}
.cert-tabsbar{width:1200px;max-width:94vw;margin:12px auto 0;background:#fff;display:flex;justify-content:space-between;align-items:center;padding:0 25px}
.aui-tabs__nav{display:flex;gap:28px;height:49px;align-items:stretch}
.aui-tabs__item{font-size:16px;color:#333;display:flex;align-items:center;cursor:pointer;position:relative}
.aui-tabs__item.is-active{color:var(--hw-red)}
.aui-tabs__item.is-active:after{content:'';position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--hw-red)}
.cert-btns{display:flex;gap:12px}
.cert-btns .m-btn{height:30px}
.cert-main{width:1200px;max-width:94vw;margin:21px auto 0;background:#fff;min-height:813px;padding:30px 62px 40px}
.inner-tabs{display:flex;gap:30px;border-bottom:1px solid #e8e8e8;margin-bottom:22px}
.inner-tabs .it{font-size:14px;color:#333;padding:8px 0;cursor:pointer;position:relative}
.inner-tabs .it.is-active{color:var(--hw-red)}
.inner-tabs .it.is-active:after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--hw-red)}
.faq p{font-size:13.5px;color:#333;line-height:26px;margin-bottom:18px}
.faq b{font-weight:600;color:#333}
.faq a{color:#1890ff;word-break:break-all}
.cert-empty{text-align:center}
.cert-empty img{width:226px;height:185px;margin:56px auto 0}
.cert-empty .nd{margin-top:26px;font-size:14px;color:#333;margin-bottom:16px}
/* 右侧悬浮 HCIE 关注面板（对照截图：右缘中部） */
.panel-main{position:absolute;right:0;top:504px;width:150px;text-align:center;z-index:50}
.panel-main img.hcieImg{width:130px;margin:0 auto}
.panel-main .joinHcietip{font-size:12px;color:#333;margin-top:2px}
.panel-main .my-btn2{color:#ccc;font-size:12px;cursor:pointer;margin-top:2px}
'''
CERT_BODY = '''<div class="uc-main" style="min-height:930px">
  <div class="t-crumbs"><a>首页</a><span class="sep">&gt;</span><a>用户中心</a><span class="sep">&gt;</span><a>我的证书</a><span class="sep">&gt;</span></div>
  <div class="cert-tabsbar">
    <div class="aui-tabs__nav">
      <div class="aui-tabs__item is-active" style="min-width:72px">认证证书</div>
      <div class="aui-tabs__item">结课证书</div>
    </div>
    <div class="cert-btns">
      <button class="m-btn primary">关联其他账号证书</button>
      <button class="m-btn primary">关联Upgrade成绩</button>
    </div>
  </div>
  <div class="cert-main">
    <div class="inner-tabs">
      <div class="it is-active">证书获取</div>
      <div class="it">常见问题处理</div>
    </div>
    <div class="faq">
      <p><span style="font-weight:600;color:#333">一、电子证书获取</span><br> 通过全部认证考试后，系统将于最后一科成绩发布后<span style="font-weight:600;color:#333">1-3个工作日</span>内生成电子证书，请至本页面下载。</p>
      <p><span style="font-weight:600;color:#333">二、纸质证书套件申领（首次获得HCIE证书者适用）</span><br> 纸质证书套件可在本页面直接申请。<br>制作时效：中国大陆地区15个工作日 / 非中国大陆地区30个工作日（含制作及邮寄时间）。<br> 温馨提示：请妥善保管大礼包，遗失不补。</p>
      <p><span style="font-weight:600;color:#333">三、重认证规则</span><br> 若您期望重认证，需在证书到期前通过相关考试。重认证规则详见：<a>https://e.huawei.com/cn/talent/#/cert/re-certification</a> </p>
      <p><span style="font-weight:600;color:#333">四、企业关联服务</span><br>企业证书绑定入口：<a>https://e.huawei.com/cn/myspace/accountinformation#/uipm/formLoadRelationOrgInfo </a>。<br> 重要政策：企业关联变更需间隔<span style="font-weight:600;color:#333">12个月</span>。 <br> 政策咨询：请联系属地代表处服务经理。</p>
    </div>
    <div class="cert-empty">
      <img src="assets/usercenter/bear.png" alt=""/>
      <div class="nd">暂无数据</div>
    </div>
    <div class="panel-main">
      <img class="hcieImg" src="assets/usercenter/join-hcie.png" alt=""/>
      <div class="joinHcietip">扫码关注获得实时动态</div>
      <div class="my-btn2">✕</div>
    </div>
  </div>
</div>
<!-- REPLICA-NOTE: bear.png / join-hcie.png 为现网原图（curl 下载）；截图中页底重复出现一套壳（cookie/黑条/导航）为抓屏缝合伪影，非页面真实结构，未复刻；dom 中的隐藏弹窗（温馨提示×3 等）不渲染；面包屑尾随 “>” 如实复刻 -->
'''
PAGES['uc-mycert'] = ('用户中心-我的证书', CERT_CSS, CERT_BODY)

# ---------------------------------------------------------------- uc-myexam (talent 子应用)
EXAM_CSS = '''
.t-crumbs{width:1200px;max-width:94vw;margin:0 auto;padding:14px 0 0;font-size:13px;color:#666}
.t-crumbs .sep{margin:0 9px;color:#a6a6a6}
.exam-strip{width:1200px;max-width:94vw;margin:10px auto 0;background:#fff;padding:12px 25px 0}
.exam-main{width:1200px;max-width:94vw;margin:3px auto 0;background:#fff;min-height:687px;padding:0 25px}
.exam-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e8e8e8}
.exam-tabs{display:flex;gap:36px}
.exam-tabs .tabTitle{font-size:16px;color:#333;padding:12px 0 10px;cursor:pointer}
.exam-tabs .tabTitle.isSelected{color:var(--hw-red);position:relative}
.exam-tabs .tabTitle.isSelected:after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--hw-red)}
.exam-search{display:flex;align-items:center;gap:10px;padding:9px 0}
.exam-searchTitle{font-size:13px;color:#606266}
.exam-searchTitle i{color:var(--hw-red);font-style:normal;margin-right:2px}
.exam-select{width:110px;height:30px}
.exam-searchInput{width:190px;height:30px;border:1px solid #dcdfe6;border-radius:2px;outline:none;font-size:13px;color:#606266;padding:0 10px}
.exam-searchInput::placeholder{color:#bfbfbf}
.goBtn{display:inline-flex;gap:10px;margin-right:12px}
.exam-content .noData{text-align:center;color:#999;font-size:14px;padding:30px 0 0}
.exam-footer{padding:20px 0 26px}
'''
EXAM_BODY = '''<div class="uc-main" style="min-height:774px">
  <div class="t-crumbs"><a>首页</a><span class="sep">&gt;</span><a>用户中心</a><span class="sep">&gt;</span><span>我的考试</span><span class="sep">&gt;</span></div>
  <div class="exam-strip">
    <div class="exam-header">
      <div class="exam-tabs">
        <p class="tabTitle isSelected">职业&amp;专业认证考试</p>
        <p class="tabTitle">其他考试</p>
      </div>
      <div class="exam-search">
        <span class="goBtn">
          <button class="m-btn">VUE考试记录</button>
          <button class="m-btn">VUE考试收据</button>
        </span>
        <span class="exam-searchTitle isRequired"><i style="color:var(--hw-red)">*</i>是否在线预约</span>
        <div class="m-input exam-select"><input readonly placeholder="请选择" /><span class="caret"></span></div>
        <input class="exam-searchInput" placeholder="请输入考试预约号/名称/代码" />
        <button class="m-btn exambtn-query">查询</button>
      </div>
    </div>
  </div>
  <div class="exam-main">
    <div class="exam-content"><div class="noData">暂无数据</div></div>
    <div class="exam-footer">
      <div class="aui-pager" style="display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#606266">
        <span class="pg-total">共 <b style="color:#333;font-weight:600">0</b> 条</span>
        <span style="display:flex;align-items:center;gap:8px">
          <button style="width:28px;height:28px;border:1px solid #e1e1e1;border-radius:2px;color:#c0c4cc;display:inline-flex;align-items:center;justify-content:center;cursor:not-allowed"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6.5 1.5 3 5l3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <span style="min-width:28px;height:28px;border:1px solid var(--hw-red);color:var(--hw-red);border-radius:2px;display:inline-flex;align-items:center;justify-content:center;padding:0 6px">1</span>
          <button style="width:28px;height:28px;border:1px solid #e1e1e1;border-radius:2px;color:#c0c4cc;display:inline-flex;align-items:center;justify-content:center;cursor:not-allowed"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 1.5 7 5 3.5 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <span style="display:inline-flex;align-items:center;gap:6px">跳至 <input type="text" style="width:42px;height:28px;border:1px solid #dcdfe6;border-radius:2px;outline:none;text-align:center" /></span>
        </span>
      </div>
    </div>
  </div>
</div>
<!-- REPLICA-NOTE: 截图底部重复壳为抓屏伪影未复刻；共0条 分页器截图内不可见（DOM 存在），按 DOM 渲染在卡片底部 -->
'''
PAGES['uc-myexam'] = ('用户中心-我的考试', EXAM_CSS, EXAM_BODY)

# ---------------------------------------------------------------- uc-myinfo
MYINFO_CSS = '''
.myinfo-card{min-height:507px;padding:0 12px}
.headBtn_row{display:flex;justify-content:space-between;align-items:center;padding:24px 12px 20px;border-bottom:1px solid #f0f0f0}
.row_box{display:flex;justify-content:space-between;align-items:center;width:100%}
.headBtn_row .left{display:flex;align-items:center;gap:14px}
.headBtn_row .left img{width:56px;height:56px}
.headBtn_row .left .uname{font-size:15px;color:#333}
.headBtn_row .right{display:flex;gap:12px}
.personal-center{padding:26px 12px 8px}
.personal-center b{display:block;font-size:15px;color:#333;margin-bottom:20px}
.user-info-form{display:grid;grid-template-columns:repeat(3,1fr);gap:22px 30px}
.fi{display:flex;align-items:center}
.fi label{width:100px;text-align:right;font-size:13px;color:#666;margin-right:8px;flex:none}
.fi label i{color:var(--hw-red);font-style:normal;margin-left:2px}
.fi .infoText{font-size:13px;color:#333}
.uipe-button-box{display:flex;flex-direction:column;gap:18px}
.uipe-btns{display:flex;gap:15px}
.uipe-btns .m-btn{height:32px;min-width:104px}
.noneRoleTips{font-size:13px;color:#666;line-height:22px}
'''
MYINFO_BODY = '''<div class="uc-main" style="min-height:559px">
  <div class="uc-crumbs"><a class="crumb">首页</a><span class="sep">&gt;</span><a class="crumb">用户中心</a><span class="sep">&gt;</span><a class="crumb">个人信息</a><span class="sep">&gt;</span></div>
  <div class="uc-card myinfo-card">
    <div class="headBtn_row">
      <div class="row_box">
        <div class="left">
          <img src="assets/usercenter/icon-person.png" alt=""/>
          <div class="uname"> hw_353055619_qq.com_01 </div>
        </div>
        <div class="right">
          <button class="m-btn">实名认证</button>
          <button class="m-btn">认证基础信息</button>
          <button class="m-btn primary">编辑</button>
        </div>
      </div>
    </div>
    <div class="personal-center">
      <div class="contest">
        <b>个人信息</b>
        <div class="user-info-form">
          <div class="fi"><label>姓<i>*</i></label><span class="infoText">hw_353055619_qq.com_01</span></div>
          <div class="fi"><label>名<i>*</i></label><span class="infoText"></span></div>
          <div class="fi"><label>姓名</label><span class="infoText"> hw_353055619_qq.com_01</span></div>
          <div class="fi"><label>性别:</label><span class="infoText"></span></div>
          <div class="fi"><label>邮箱<i>*</i></label><span class="infoText">3***619@qq.com</span></div>
          <div class="fi"><label>手机</label><span class="infoText" style="display:flex;gap:8px"><span>+86</span><span>187***3007</span></span></div>
        </div>
      </div>
      <div class="contest" style="margin-top:34px">
        <b>角色信息</b>
        <div class="uipe-button-box">
          <div class="uipe-btns">
            <button class="m-btn primary">关联-讲师</button>
            <button class="m-btn primary associateStudenBtn">关联-学生</button>
          </div>
          <div>
            <p class="noneRoleTips"> 如果您是ICT学院/HALP讲师，或HALP教学管理员，请点击【关联-讲师】进行权限申请; <br> 如果您是ICT学院学生，请点击【关联-学生】按钮进行权限申请; </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<!-- REPLICA-NOTE: “姓=hw_353055619_qq.com_01、名为空”为现网数据缺陷，逐字如实复刻；头像用个人信息卡片同款图标(dom 内嵌 base64)；隐藏弹窗(邮箱换绑提示)不渲染 -->
'''
PAGES['uc-myinfo'] = ('用户中心-个人信息', MYINFO_CSS, MYINFO_BODY)

# ---------------------------------------------------------------- uc-realinfo
REALINFO_CSS = '''
.realAuth{padding:24px 60px 40px}
.realAuth h2{font-size:18px;color:#333;font-weight:600;text-align:center;margin-bottom:28px}
.realAuth__form_wrapper{display:flex;align-items:flex-start;margin-bottom:18px}
.realAuth__form_left{width:110px;text-align:right;font-size:13px;color:#666;flex:none;margin-right:12px}
.realAuth__form_left i{color:var(--hw-red);font-style:normal}
.formInputWrapper{flex:1;max-width:420px}
.formInput{width:100%;height:36px}
.realAuth__form_lastName_input_tip{font-size:12px;color:#999;margin-top:4px;line-height:18px}
.m-input.m-disabled{background:#f5f5f5}
.m-input.m-disabled input{color:#c0c4cc}
.realAuth__checkbox{margin:26px 0 10px;display:flex;flex-direction:column;gap:16px}
.realAuth__checkbox_item{display:flex;align-items:flex-start;gap:0}
.realAuth__checkbox_item .m-checkbox{margin-top:2px}
.realAuth__checkbox_item .checkbox{width:14px;height:14px;border:1px solid #dcdfe6;border-radius:2px;display:inline-block;background:#fff}
.realAuth__checkbox_item .txt{font-size:12.5px;color:#666;line-height:22px}
.realAuth__checkbox_item .txt b{font-weight:600;color:#333}
.realAuth__checkbox_item .txt a{color:#1890ff}
.realAuth__bottom{display:flex;gap:14px;margin-top:26px}
.realAuth__bottom .m-btn{height:34px;min-width:88px}
'''
REALINFO_BODY = '''<div class="uc-main" style="min-height:986px">
  <div class="uc-crumbs"><a class="crumb">首页</a><span class="sep">&gt;</span><a class="crumb">实名认证</a><span class="sep">&gt;</span></div>
  <div class="uc-card realAuth">
    <h2>实名认证</h2>
    <div class="realAuth__form_wrapper">
      <div class="realAuth__form_left"><i>*</i> 姓拼音 </div>
      <div class="formInputWrapper"><div class="m-input formInput"><input placeholder="请输入" /></div></div>
    </div>
    <div class="realAuth__form_wrapper">
      <div class="realAuth__form_left"><i>*</i> 名拼音 </div>
      <div class="formInputWrapper"><div class="m-input formInput"><input placeholder="请输入" /></div></div>
    </div>
    <div class="realAuth__form_wrapper">
      <div class="realAuth__form_left"> 全名拼音 </div>
      <div class="formInputWrapper"><div class="m-input formInput m-disabled"><input placeholder="请输入" disabled /></div><div class="realAuth__form_lastName_input_tip">全名拼音自动生成规则为“名+姓”</div></div>
    </div>
    <div class="realAuth__form_wrapper">
      <div class="realAuth__form_left"><i>*</i> 邮箱 </div>
      <div class="formInputWrapper"><div class="m-input formInput"><input placeholder="请输入" /></div></div>
    </div>
    <div class="realAuth__form_wrapper">
      <div class="realAuth__form_left"><i>*</i> 证件类型 </div>
      <div class="formInputWrapper"><div class="m-input formInput m-disabled" style="justify-content:space-between"><input placeholder="" disabled value="中华人民共和国居民身份证" /><span class="caret"></span></div></div>
    </div>
    <div class="realAuth__form_wrapper">
      <div class="realAuth__form_left"><i>*</i> 输入证件号 </div>
      <div class="formInputWrapper"><div class="m-input formInput"><input placeholder="请输入" /></div></div>
    </div>
    <div class="realAuth__form_wrapper">
      <div class="realAuth__form_left"><i>*</i> 确认证件号 </div>
      <div class="formInputWrapper"><div class="m-input formInput"><input placeholder="请输入" /></div></div>
    </div>
    <div class="realAuth__form_wrapper">
      <div class="realAuth__form_left"><i>*</i> 中文姓 </div>
      <div class="formInputWrapper"><div class="m-input formInput"><input placeholder="请输入" /></div><div class="realAuth__form_lastName_input_tip">提交后将无法修改！请确认填写的是正确的“中文”姓和名！</div></div>
    </div>
    <div class="realAuth__form_wrapper">
      <div class="realAuth__form_left"><i>*</i> 中文名 </div>
      <div class="formInputWrapper"><div class="m-input formInput"><input placeholder="请输入" /></div><div class="realAuth__form_lastName_input_tip">提交后将无法修改！请确认填写的是正确的“中文”姓和名！</div></div>
    </div>
    <div class="realAuth__form_wrapper">
      <div class="realAuth__form_left">中文全名</div>
      <div class="m-input formInput m-disabled" style="width:420px"><input placeholder="请输入" disabled /></div>
    </div>
    <div class="realAuth__checkbox">
      <div class="realAuth__checkbox_item">
        <span class="m-checkbox"><span class="checkbox"></span></span>
        <span style="color:red;margin:0 6px">*</span>
        <div class="txt"><span>按照华为认证管理规定，华为将会在考生参加华为认证考试时，校验考生的证件信息。因此在您申请华为认证考券、预约华为认证考试、绑定华为证书、使用培训基金兑换学习产品等活动时，需按华为认证管理规定完成实名证件信息登记，以便正常使用华为提供的相关服务</span><span style="font-weight:600">一经提交，不允许修改。</span><span>有关华为实名认证的详细说明，请点击</span><a>此处</a><span>了解更多。</span></div>
      </div>
      <div class="realAuth__checkbox_item">
        <span class="m-checkbox"><span class="checkbox"></span></span>
        <span style="color:red;margin:0 6px">*</span>
        <div class="txt"> 我已阅读并同意华为的 <a>隐私声明</a></div>
      </div>
      <div class="realAuth__checkbox_item">
        <div class="txt" style="padding-left:38px"><span>若实名认证过程中遇到任何问题，请点击</span><a style="margin:0 5px">此处</a><span>获得帮助。</span></div>
      </div>
    </div>
    <div class="realAuth__bottom">
      <button class="m-btn">重置</button>
      <button class="m-btn primary disabled" disabled>提交</button>
    </div>
  </div>
</div>
<!-- REPLICA-NOTE: 本页为 #/realinfosystem 实名认证表单页（面包屑仅 首页>实名认证>，与个人信息页不同）——URL 变化后整页换成实名认证表单即现网实际表现；证件类型为禁用下拉(唯一选项 中华人民共和国居民身份证)，取自 dom 隐藏下拉 -->
'''
PAGES['uc-realinfo'] = ('用户中心-实名认证', REALINFO_CSS, REALINFO_BODY)

# ---------------------------------------------------------------- uc-voucher-app
VOUCHER_CSS = '''
.voucher-blank{background:#fff;min-height:56px}
'''
VOUCHER_BODY = '''<div class="uc-main voucher-blank" style="min-height:56px">
</div>
<!-- REPLICA-NOTE: #/voucher/application 考券申请为空白缺陷页——壳渲染但内容区完全为空（dom: m-content-wrapper 空、无面包屑），如实复刻 -->
'''
PAGES['uc-voucher-app'] = ('用户中心-考券申请', VOUCHER_CSS, VOUCHER_BODY)

# ---------------------------------------------------------------- emit
for name, (title, css, body) in PAGES.items():
    top = SHELL_TOP.replace('{{', '\x01').replace('}}', '\x02').replace('\x01', '{').replace('\x02', '}')
    html = top.replace('{TITLE}', title).replace('{PAGE_CSS}', css) + body + SHELL_BOTTOM + '</body>\n</html>\n'
    # uc-home 系列内容区容器为 1180（现网该页白卡实测 370-1550）
    out = os.path.join(REP, name + '.html')
    open(out, 'w', encoding='utf-8').write(html)
    print('wrote', out, len(html))
