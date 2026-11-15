import { Router } from 'express';
import { q } from '../db.js';
import { signToken, verifyPassword, hashPassword } from '../lib/auth.js';

const r = Router();

async function loadFullUser(id) {
  const { rows } = await q(
    `SELECT u.id, u.name, u.email, u.phone, u.realname_verified, u.real_name, u.school_id,
            u.major, u.grade, u.student_no, u.employer_id, u.bio,
            s.name AS school_name, s.tier AS school_tier,
            c.name AS employer_name
     FROM users u LEFT JOIN schools s ON s.id=u.school_id LEFT JOIN companies c ON c.id=u.employer_id
     WHERE u.id=$1`, [id]
  );
  if (!rows[0]) return null;
  const roles = await q(`SELECT role FROM user_roles WHERE user_id=$1 AND status='active'`, [id]);
  return { ...rows[0], roles: roles.rows.map((r) => r.role) };
}

r.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: '请输入账号和密码' });
  const { rows } = await q(`SELECT id, password_hash FROM users WHERE lower(email)=lower($1)`, [email.trim()]);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: '账号或密码不正确。演示账号见登录页右侧列表。' });
  }
  const full = await loadFullUser(user.id);
  res.json({ token: signToken({ userId: user.id }), user: full });
});

r.post('/register', async (req, res) => {
  const { name, email, password, school_id, role = 'student' } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ error: '姓名、账号与密码均为必填' });
  if (password.length < 8) return res.status(400).json({ error: '密码至少 8 位' });
  const exists = await q(`SELECT 1 FROM users WHERE lower(email)=lower($1)`, [email.trim()]);
  if (exists.rowCount) return res.status(409).json({ error: '该账号已注册，可直接登录' });
  const { rows } = await q(
    `INSERT INTO users (name, email, password_hash, school_id) VALUES ($1,$2,$3,$4) RETURNING id`,
    [name.trim(), email.trim(), hashPassword(password), school_id || null]
  );
  await q(`INSERT INTO user_roles (user_id, role) VALUES ($1,$2)`, [rows[0].id, role]);
  const full = await loadFullUser(rows[0].id);
  res.json({ token: signToken({ userId: rows[0].id }), user: full });
});

r.post('/logout', (_req, res) => res.json({ ok: true }));
r.get('/me', (req, res) => res.json({ user: req.user || null }));

export default r;
