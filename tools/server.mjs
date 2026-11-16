#!/usr/bin/env node
// 复刻站应用服务器（零依赖，node >= 18）
// 静态托管 replica/ + /api/*（注册/登录/会话/课程/班级/证书/券包/消息）
// 数据库: tools/.server-db.json（首次运行自动播种；已加入 .gitignore，运行时数据不入库）
// 用法: node tools/server.mjs [port]   默认 8930
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REP = path.join(ROOT, 'replica');
const DB_FILE = path.join(ROOT, 'tools', '.server-db.json');
const PORT = Number(process.argv[2] || 8930);

/* ---------------- 数据库（JSON 文件） ---------------- */
function sha(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function seed() {
  const courses = [];
  const specs = {
    '计算机科学与技术': ['C语言编程教程', '数据结构', '操作系统原理', '计算机网络'],
    '人工智能': ['机器学习基础', '深度学习', '人工智能导论', '大模型应用开发'],
    '软件工程': ['软件工程理论与实践', '昇腾CANN开发', '软件测试与质量', 'DevOps入门'],
    '物联网工程': ['嵌入式系统开发', '物联网通信技术', '传感器技术', '边缘计算基础']
  };
  let i = 0;
  for (const [spec, list] of Object.entries(specs)) for (const t of list)
    courses.push({ id: 'c' + (++i), title: t, spec, hours: 8 + (i % 4) * 8, level: ['初级', '中级', '高级'][i % 3], type: '由教师指导,在线自学' });
  courses.push({ id: 'ascend-c', title: 'Ascend C异构并行程序设计 V2.0', spec: '人工智能', hours: 32, level: '高级', type: '由教师指导,在线自学', featured: true });
  return {
    users: [
      { account: 'hw_demo_teacher_01', pass: sha('demo123456' + '|salt-hp'), name: '演示教师', role: 'teacher' },
      { account: 'hw_demo_student_01', pass: sha('demo123456' + '|salt-hp'), name: '演示学生', role: 'student' }
    ],
    courses,
    classes: [{ id: 'k1', name: 'Ascend C 2026 秋季班', courseId: 'ascend-c', teacher: 'hw_demo_teacher_01', code: 'AC8826', students: ['hw_demo_student_01'] }],
    enrolls: [{ account: 'hw_demo_student_01', courseId: 'c2', pct: 35 }],
    certs: [{ account: 'hw_demo_student_01', name: 'HCIA-Cloud Service', date: '2026-09-12', no: 'HCIA-CS-2026-0912-0088' }],
    coupons: [{ account: 'hw_demo_student_01', kind: '笔试券', no: 'CPN-8826-XXXX', expire: '2026-12-31' }],
    exams: [{ account: 'hw_demo_student_01', name: 'HCIA-Datacom 笔试', status: '已预约', time: '2026-12-03 14:00' }],
    messages: [{ account: 'hw_demo_student_01', title: '平台升级公告', body: '平台升级，建议前往【学习】页面重新学习', time: '2026-11-01' }]
  };
}
function loadDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { const d = seed(); saveDB(d); return d; }
}
function saveDB(d) { fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 1)); }
const db = loadDB();

/* ---------------- 会话（内存 token） ---------------- */
const sessions = new Map(); // token -> account
function newToken() { return crypto.randomBytes(24).toString('hex'); }

/* ---------------- 工具 ---------------- */
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function body(req) {
  return new Promise(r => { let b = ''; req.on('data', c => b += c); req.on('end', () => { try { r(JSON.parse(b || '{}')); } catch { r({}); } }); });
}
function user(req) {
  const m = /(?:^|;\s*)hp_session=([a-f0-9]+)/.exec(req.headers.cookie || '');
  const acc = m && sessions.get(m[1]);
  return acc ? { token: m[1], user: db.users.find(u => u.account === acc) } : null;
}
function setCookie(res, token) { res.setHeader('Set-Cookie', `hp_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`); }
const pub = u => ({ account: u.account, name: u.name, role: u.role });

/* ---------------- API 路由 ---------------- */
async function api(req, res, url) {
  const p = url.pathname, me = user(req);
  if (p === '/api/register' && req.method === 'POST') {
    const { account, password, name, role } = await body(req);
    if (!account || !password) return json(res, 400, { error: '账号与密码必填' });
    if (!/^[\w.@-]{4,40}$/.test(account)) return json(res, 400, { error: '账号限 4-40 位字母数字._@-' });
    if (String(password).length < 6) return json(res, 400, { error: '密码至少 6 位' });
    if (db.users.some(u => u.account === account)) return json(res, 409, { error: '该账号已注册' });
    const u = { account, pass: sha(password + '|salt-hp'), name: name || account, role: role === 'teacher' ? 'teacher' : 'student' };
    db.users.push(u); saveDB(db);
    const t = newToken(); sessions.set(t, account); setCookie(res, t);
    return json(res, 200, { user: pub(u) });
  }
  if (p === '/api/login' && req.method === 'POST') {
    const { account, password } = await body(req);
    const u = db.users.find(x => x.account === account);
    if (!u || u.pass !== sha(String(password || '') + '|salt-hp')) return json(res, 401, { error: '账号或密码不正确' });
    const t = newToken(); sessions.set(t, account); setCookie(res, t);
    return json(res, 200, { user: pub(u) });
  }
  if (p === '/api/logout' && req.method === 'POST') {
    if (me) sessions.delete(me.token);
    res.setHeader('Set-Cookie', 'hp_session=; Path=/; Max-Age=0');
    return json(res, 200, { ok: true });
  }
  if (p === '/api/me') return me ? json(res, 200, { user: pub(me.user) }) : json(res, 401, { error: '未登录' });

  if (p === '/api/courses') return json(res, 200, { courses: db.courses });
  if (p.startsWith('/api/courses/') && req.method === 'GET') {
    const c = db.courses.find(x => x.id === p.split('/')[3]);
    return c ? json(res, 200, { course: c }) : json(res, 404, { error: '课程不存在' });
  }
  if (p.startsWith('/api/courses/') && p.endsWith('/enroll') && req.method === 'POST') {
    if (!me) return json(res, 401, { error: '请先登录' });
    const id = p.split('/')[3];
    if (!db.courses.find(x => x.id === id)) return json(res, 404, { error: '课程不存在' });
    if (!db.enrolls.some(e => e.account === me.user.account && e.courseId === id)) {
      db.enrolls.push({ account: me.user.account, courseId: id, pct: 0 }); saveDB(db);
    }
    return json(res, 200, { ok: true });
  }
  if (p === '/api/my/courses') {
    if (!me) return json(res, 401, { error: '未登录' });
    const list = db.enrolls.filter(e => e.account === me.user.account)
      .map(e => ({ ...e, course: db.courses.find(c => c.id === e.courseId) })).filter(x => x.course);
    return json(res, 200, { courses: list });
  }
  if (p === '/api/classes' && req.method === 'POST') {
    if (!me) return json(res, 401, { error: '请先登录' });
    const { name, courseId } = await body(req);
    if (!name) return json(res, 400, { error: '班级名称必填' });
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const k = { id: 'k' + crypto.randomBytes(4).toString('hex'), name, courseId: courseId || null, teacher: me.user.account, code, students: [] };
    db.classes.push(k); saveDB(db);
    return json(res, 200, { klass: k });
  }
  if (p === '/api/classes/join' && req.method === 'POST') {
    if (!me) return json(res, 401, { error: '请先登录' });
    const { code } = await body(req);
    const k = db.classes.find(x => x.code === String(code || '').trim().toUpperCase());
    if (!k) return json(res, 404, { error: '邀请码无效' });
    if (!k.students.includes(me.user.account)) { k.students.push(me.user.account); saveDB(db); }
    return json(res, 200, { klass: k });
  }
  if (p === '/api/my/classes') {
    if (!me) return json(res, 401, { error: '未登录' });
    const teaching = db.classes.filter(k => k.teacher === me.user.account);
    const joining = db.classes.filter(k => k.students.includes(me.user.account) && k.teacher !== me.user.account);
    return json(res, 200, { teaching, joining });
  }
  for (const [seg, key] of [['certs', 'certs'], ['coupons', 'coupons'], ['exams', 'exams'], ['messages', 'messages']]) {
    if (p === '/api/my/' + seg) {
      if (!me) return json(res, 401, { error: '未登录' });
      return json(res, 200, { [seg]: db[key].filter(x => x.account === me.user.account) });
    }
  }
  return json(res, 404, { error: 'no such api' });
}

/* ---------------- 静态文件 ---------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webm': 'video/webm', '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
function serveStatic(res, pathname) {
  let fp = path.normalize(path.join(REP, decodeURIComponent(pathname)));
  if (!fp.startsWith(REP)) { res.writeHead(403); return res.end('forbidden'); }
  if (pathname === '/' || pathname.endsWith('/')) fp = path.join(fp, 'index.html');
  fs.readFile(fp, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    return serveStatic(res, url.pathname);
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
});
server.listen(PORT, '127.0.0.1', () => console.log(`replica app server → http://127.0.0.1:${PORT}  (db: ${DB_FILE})`));
