import { Router } from 'express';
import { q } from '../db.js';
import { requireAuth, requireRole, trackEvent, notify } from '../lib/auth.js';

const r = Router();
r.use(requireAuth, requireRole('employer', 'platform_admin'));

// 雇主工作台：我的岗位 + 投递漏斗
r.get('/overview', async (req, res) => {
  const jobs = await q(
    `SELECT j.id, j.title, j.kind, j.city, j.salary, j.status, j.posted_at, j.openings, j.tags,
            (SELECT count(*) FROM job_applications ja WHERE ja.job_id=j.id)::int AS applications,
            (SELECT count(*) FROM job_applications ja WHERE ja.job_id=j.id AND ja.status IN ('submitted','screening'))::int AS pending
     FROM jobs j WHERE j.company_id=$1 ORDER BY j.posted_at DESC`,
    [req.user.employer_id]
  );
  const funnel = await q(
    `SELECT ja.status, count(*)::int AS c FROM job_applications ja JOIN jobs j ON j.id=ja.job_id
     WHERE j.company_id=$1 GROUP BY ja.status`, [req.user.employer_id]
  );
  res.json({ jobs: jobs.rows, funnel: funnel.rows });
});

// 候选人 pipeline（按岗位分组，拖拽/按钮推进状态）
r.get('/pipeline', async (req, res) => {
  const { rows } = await q(
    `SELECT ja.id, ja.status, ja.created_at, ja.updated_at, ja.stage_note, j.title AS job_title, j.id AS job_id,
            u.id AS student_id, u.name AS student_name, u.major, u.grade, u.school_id,
            s.name AS school_name, u.realname_verified,
            (SELECT count(*) FROM user_certificates uc WHERE uc.user_id=u.id)::int AS cert_count,
            (SELECT count(*) FROM contest_entries ce WHERE ce.user_id=u.id AND ce.status IN ('provincial','national','global','awarded'))::int AS contest_adv,
            r.intention, r.skills
     FROM job_applications ja JOIN jobs j ON j.id=ja.job_id JOIN users u ON u.id=ja.user_id
     LEFT JOIN schools s ON s.id=u.school_id LEFT JOIN resumes r ON r.user_id=u.id
     WHERE j.company_id=$1 ORDER BY ja.updated_at DESC`, [req.user.employer_id]
  );
  res.json({ items: rows });
});

// 推进/驳回投递（写入统一追踪 + 通知学生）
const NEXT = { submitted: 'screening', screening: 'written_test', written_test: 'interview', interview: 'offer' };
r.post('/applications/:id/stage', async (req, res) => {
  const { action, note } = req.body || {}; // advance | reject | hire
  const { rows } = await q(
    `SELECT ja.id, ja.status, ja.user_id, j.title FROM job_applications ja JOIN jobs j ON j.id=ja.job_id
     WHERE ja.id=$1 AND j.company_id=$2`, [req.params.id, req.user.employer_id]
  );
  if (!rows.length) return res.status(404).json({ error: '投递不存在' });
  const ja = rows[0];
  let next, msg;
  if (action === 'reject') {
    next = 'rejected';
    msg = note || '很遗憾本次未能匹配，已为你保留人才池，来年春招可再次投递。';
  } else if (action === 'hire') {
    next = 'hired';
    msg = note || '恭喜！offer 已发放，请留意入职指引邮件。';
  } else {
    next = NEXT[ja.status];
    if (!next) return res.status(400).json({ error: '该投递已在终态' });
    const labels = { screening: '简历通过初筛', written_test: '进入笔试环节', interview: '进入面试环节', offer: '通过面试，offer 沟通中' };
    msg = note || labels[next];
  }
  await q(`UPDATE job_applications SET status=$2, stage_note=$3, updated_at=now() WHERE id=$1`, [ja.id, next, msg]);
  await trackEvent('job_application', ja.id, ja.user_id, req.user.id, next, msg, 0);
  await notify(ja.user_id, 'message', `${ja.title}：状态更新`, msg, '/my/applications');
  res.json({ ok: true, status: next });
});

// 发布岗位
r.post('/jobs', async (req, res) => {
  const { title, kind, city, salary, openings, requirement, duty, tags } = req.body || {};
  if (!title?.trim() || !city?.trim() || !salary?.trim() || !requirement?.trim() || !duty?.trim()) {
    return res.status(400).json({ error: '标题、城市、薪资、要求与职责为必填' });
  }
  const { rows } = await q(
    `INSERT INTO jobs (company_id, title, kind, city, salary, openings, requirement, duty, tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [req.user.employer_id, title.trim(), kind || '校招', city.trim(), salary.trim(), openings || 1, requirement.trim(), duty.trim(), tags || []]
  );
  res.json({ ok: true, id: rows[0].id });
});

r.post('/jobs/:id/close', async (req, res) => {
  const { rows } = await q(
    `UPDATE jobs SET status='closed' WHERE id=$1 AND company_id=$2 RETURNING id`, [req.params.id, req.user.employer_id]
  );
  if (!rows.length) return res.status(404).json({ error: '岗位不存在' });
  res.json({ ok: true });
});

// 人才检索（授权制：仅展示已投递本校学生档案 + 脱敏）
r.get('/talents', async (req, res) => {
  const { kw, cert, advanced_contest } = req.query;
  const where = [`u.id IN (SELECT user_id FROM job_applications ja JOIN jobs j ON j.id=ja.job_id WHERE j.company_id=$1)`];
  const params = [req.user.employer_id];
  if (kw) { params.push(`%${kw}%`); where.push(`(u.name ILIKE $2 OR u.major ILIKE $2)`); }
  const { rows } = await q(
    `SELECT u.id, u.name, u.major, u.grade, s.name AS school_name, u.realname_verified,
            (SELECT count(*) FROM user_certificates uc WHERE uc.user_id=u.id)::int AS cert_count,
            (SELECT string_agg(cert.name, '、') FROM user_certificates uc JOIN certifications cert ON cert.id=uc.cert_id WHERE uc.user_id=u.id) AS certs,
            (SELECT count(*) FROM contest_entries ce WHERE ce.user_id=u.id AND ce.status IN ('provincial','national','global','awarded'))::int AS contest_adv,
            r.intention, r.skills
     FROM users u LEFT JOIN schools s ON s.id=u.school_id LEFT JOIN resumes r ON r.user_id=u.id
     WHERE ${where.join(' AND ')} ORDER BY cert_count DESC, contest_adv DESC LIMIT 20`, params
  );
  res.json({ items: rows });
});

export default r;
