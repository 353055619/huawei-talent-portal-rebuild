import { Router } from 'express';
import crypto from 'node:crypto';
import { q } from '../db.js';
import { requireAuth, trackEvent } from '../lib/auth.js';

const r = Router();

// 学院入驻（旅程A 全线上化）：提交即建申请，电子授权函在本向导内“签署”
r.post('/apply', requireAuth, async (req, res) => {
  const { school_name, province, city, contact_name, contact_title, contact_email, intent_tier } = req.body || {};
  if (!school_name?.trim() || !province?.trim() || !contact_name?.trim() || !contact_title?.trim()) {
    return res.status(400).json({ error: '学校名称、省份、联系人与职务为必填' });
  }
  const dup = await q(`SELECT 1 FROM school_applications WHERE applicant_id=$1 AND status NOT IN ('active','rejected')`, [req.user.id]);
  if (dup.rowCount) return res.status(409).json({ error: '已有进行中的入驻申请，请查看进度' });
  const { rows } = await q(
    `INSERT INTO school_applications (applicant_id, school_name, province, city, contact_name, contact_title, contact_email, intent_tier, authorization_signed)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [req.user.id, school_name.trim(), province.trim(), city?.trim(), contact_name.trim(), contact_title.trim(),
     contact_email?.trim(), intent_tier || '认证级', true]
  );
  await trackEvent('school_application', rows[0].id, req.user.id, null, 'submitted',
    `提交入驻资料与电子授权函（${school_name.trim()}）`, 0);
  res.json({ ok: true, id: rows[0].id });
});

// 我的入驻申请（申请人视角，含时间线）
r.get('/mine', requireAuth, async (req, res) => {
  const { rows } = await q(
    `SELECT * FROM school_applications WHERE applicant_id=$1 ORDER BY created_at DESC`, [req.user.id]
  );
  if (!rows.length) return res.json({ items: [] });
  const events = await q(
    `SELECT status, note, created_at FROM tracker_events WHERE entity_type='school_application' AND entity_id=ANY($1) ORDER BY created_at`,
    [rows.map((x) => x.id)]
  );
  res.json({ items: rows, events: events.rows });
});

export default r;
