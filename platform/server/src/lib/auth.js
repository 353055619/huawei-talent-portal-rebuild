import crypto from 'node:crypto';
import { q } from '../db.js';

const SECRET = process.env.TOKEN_SECRET || 'talent-portal-demo-secret-2026';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(password, salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

export function signToken(payload, ttlMs = 7 * 24 * 3600 * 1000) {
  const body = { ...payload, exp: Date.now() + ttlMs };
  const data = Buffer.from(JSON.stringify(body)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token) {
  if (!token) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expect = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (sig !== expect) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Express 中间件：解析 Authorization: Bearer <token>
export async function attachUser(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = verifyToken(token);
  if (payload?.userId) {
    try {
      const { rows } = await q(
        `SELECT u.id, u.name, u.email, u.phone, u.realname_verified, u.real_name, u.school_id,
                u.major, u.grade, u.student_no, u.employer_id, u.bio,
                s.name AS school_name, s.tier AS school_tier, s.province AS school_province,
                c.name AS employer_name
         FROM users u
         LEFT JOIN schools s ON s.id = u.school_id
         LEFT JOIN companies c ON c.id = u.employer_id
         WHERE u.id = $1`,
        [payload.userId]
      );
      if (rows[0]) {
        const roles = await q(
          `SELECT role, status FROM user_roles WHERE user_id = $1 AND status = 'active'`,
          [payload.userId]
        );
        req.user = { ...rows[0], roles: roles.rows.map((r) => r.role) };
      }
    } catch (e) {
      req.user = null;
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: '请先登录' });
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: '请先登录' });
    const has = roles.some((r) => req.user.roles.includes(r));
    if (!has) return res.status(403).json({ error: '当前账号没有该角色权限，可在个人中心申请角色关联' });
    next();
  };
}

// 记录统一追踪事件（fire-and-forget，不阻塞主流程）
export function trackEvent(entityType, entityId, userId, actorId, status, note) {
  return q(
    `INSERT INTO tracker_events (entity_type, entity_id, user_id, actor_id, status, note)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [entityType, entityId, userId, actorId ?? userId, status, note ?? null]
  ).catch(() => {});
}

// 站内通知（todo / message）
export function notify(userId, kind, title, body, link) {
  return q(
    `INSERT INTO notifications (user_id, kind, title, body, link) VALUES ($1,$2,$3,$4,$5)`,
    [userId, kind, title, body, link]
  ).catch(() => {});
}
