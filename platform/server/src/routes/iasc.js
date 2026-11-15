import { Router } from 'express';
import { q } from '../db.js';
import { requireAuth, requireRole, trackEvent, notify } from '../lib/auth.js';

const r = Router();
r.use(requireAuth, requireRole('iasc', 'platform_admin'));

// IASC 运营看板：全生态概览
r.get('/dashboard', async (_req, res) => {
  const [academies, pendingOnboarding, vouchers, fairs, funnel] = await Promise.all([
    q(`SELECT count(*)::int AS total,
              count(*) FILTER (WHERE tier='领先级')::int AS leading,
              count(*) FILTER (WHERE status='applying')::int AS applying
       FROM schools`),
    q(`SELECT sa.id, sa.school_name, sa.province, sa.status, sa.updated_at, u.name AS applicant
       FROM school_applications sa JOIN users u ON u.id=sa.applicant_id
       WHERE sa.status NOT IN ('active','rejected') ORDER BY sa.updated_at`),
    q(`SELECT status, count(*)::int AS c FROM vouchers GROUP BY status`),
    q(`SELECT id, name, city, fair_date, status, companies_count, jobs_count,
              (SELECT count(*) FROM fair_registrations fr WHERE fr.fair_id=job_fairs.id)::int AS registered
       FROM job_fairs ORDER BY fair_date DESC`),
    q(`SELECT status, count(*)::int AS c FROM job_applications GROUP BY status`),
  ]);
  res.json({
    academies: academies.rows[0],
    pendingOnboarding: pendingOnboarding.rows,
    vouchers: Object.fromEntries(vouchers.rows.map((x) => [x.status, x.c])),
    fairs: fairs.rows,
    funnel: funnel.rows,
  });
});

// 入驻申请分级评审推进
const NEXT_STAGE = { submitted: 'material_review', material_review: 'contract_signing', contract_signing: 'tier_evaluation', tier_evaluation: 'active' };
r.post('/onboarding/:id/advance', async (req, res) => {
  const { note } = req.body || {};
  const { rows } = await q(`SELECT * FROM school_applications WHERE id=$1 AND status != 'rejected'`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: '申请不存在' });
  const sa = rows[0];
  const next = NEXT_STAGE[sa.status];
  if (!next) return res.status(400).json({ error: '该申请已完成' });
  await q(`UPDATE school_applications SET status=$2, updated_at=now() WHERE id=$1`, [sa.id, next]);
  const labels = {
    material_review: '材料评审中：IASC 核验授权函与院系信息',
    contract_signing: '材料评审通过，进入校企合作协议在线签署',
    tier_evaluation: '协议已签署，进入分级评审（认证/优选/领先）',
    active: '分级评审通过，正式挂牌华为 ICT 学院',
  };
  await trackEvent('school_application', sa.id, sa.applicant_id, req.user.id, next, note || labels[next], 0);
  await notify(sa.applicant_id, 'message', `学院入驻进度更新：${sa.school_name}`, note || labels[next], '/onboarding/mine');
  if (next === 'active') {
    await q(`UPDATE schools SET status='active', joined_at=current_date WHERE name=$1`, [sa.school_name]);
  }
  res.json({ ok: true, status: next });
});

r.post('/onboarding/:id/reject', async (req, res) => {
  const { note } = req.body || {};
  const { rows } = await q(`SELECT * FROM school_applications WHERE id=$1 AND status NOT IN ('active','rejected')`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: '申请不存在' });
  await q(`UPDATE school_applications SET status='rejected', updated_at=now() WHERE id=$1`, [req.params.id]);
  await trackEvent('school_application', req.params.id, rows[0].applicant_id, req.user.id, 'rejected', note || '材料不符合要求，可修改后重新提交', 0);
  await notify(rows[0].applicant_id, 'message', '学院入驻申请未通过', note || '材料不符合要求，可修改后重新提交。', '/onboarding/mine');
  res.json({ ok: true });
});

export default r;
