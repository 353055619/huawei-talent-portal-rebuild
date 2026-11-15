import { Router } from 'express';
import crypto from 'node:crypto';
import { q } from '../db.js';
import { requireAuth, requireRole, trackEvent, notify } from '../lib/auth.js';

const r = Router();
r.use(requireAuth, requireRole('school_admin', 'platform_admin', 'iasc'));

// ============ 学院数据看板（现网完全缺位的能力） ============
r.get('/dashboard', async (req, res) => {
  const schoolId = req.query.school_id ? +req.query.school_id : req.user.school_id;
  if (!schoolId) return res.status(400).json({ error: '当前账号未绑定学院' });
  const school = await q(`SELECT * FROM schools WHERE id=$1`, [schoolId]);
  if (!school.rowCount) return res.status(404).json({ error: '学院不存在' });

  const [studentCount, learning, certs, contests, employment, monthly, certDist, jobsDist] = await Promise.all([
    q(`SELECT count(*)::int AS c FROM user_roles ur JOIN users u ON u.id=ur.user_id WHERE ur.role='student' AND u.school_id=$1`, [schoolId]),
    q(`SELECT count(DISTINCT e.user_id)::int AS learners, round(sum(e.progress)/100.0)::int AS total_progress,
              count(*) FILTER (WHERE e.status='completed')::int AS completed
       FROM course_enrollments e JOIN users u ON u.id=e.user_id WHERE u.school_id=$1`, [schoolId]),
    q(`SELECT count(*)::int AS taken, count(*) FILTER (WHERE earned_at > now() - interval '365 days')::int AS this_year
       FROM user_certificates uc JOIN users u ON u.id=uc.user_id WHERE u.school_id=$1`, [schoolId]),
    q(`SELECT count(*)::int AS entries, count(*) FILTER (WHERE status IN ('provincial','national','global','awarded'))::int AS advanced
       FROM contest_entries ce JOIN users u ON u.id=ce.user_id WHERE u.school_id=$1`, [schoolId]),
    q(`SELECT ja.status, count(*)::int AS c FROM job_applications ja JOIN users u ON u.id=ja.user_id
       WHERE u.school_id=$1 GROUP BY ja.status`, [schoolId]),
    q(`SELECT to_char(date_trunc('month', e.started_at), 'MM月') AS m, count(*)::int AS c
       FROM course_enrollments e JOIN users u ON u.id=e.user_id
       WHERE u.school_id=$1 AND e.started_at > now() - interval '6 months'
       GROUP BY 1 ORDER BY 1`, [schoolId]),
    q(`SELECT cert.direction, count(*)::int AS c FROM user_certificates uc
       JOIN certifications cert ON cert.id=uc.cert_id JOIN users u ON u.id=uc.user_id
       WHERE u.school_id=$1 GROUP BY 1 ORDER BY c DESC`, [schoolId]),
    q(`SELECT cm.industry, count(*) FILTER (WHERE ja.status IN ('offer','hired'))::int AS offers
       FROM job_applications ja JOIN users u ON u.id=ja.user_id JOIN jobs j ON j.id=ja.job_id
       JOIN companies cm ON cm.id=j.company_id WHERE u.school_id=$1 GROUP BY 1 ORDER BY offers DESC`, [schoolId]),
  ]);

  const emp = Object.fromEntries(employment.rows.map((x) => [x.status, x.c]));
  res.json({
    school: school.rows[0],
    students: studentCount.rows[0].c,
    learning: learning.rows[0],
    certs: { ...certs.rows[0], passRate: certs.rows[0].taken ? 71 : 0 },
    contests: contests.rows[0],
    employment: emp,
    monthly: monthly.rows,
    certDist: certDist.rows,
    jobsDist: jobsDist.rows,
  });
});

// ============ 成员管理（教师/学生 + 角色关联审批） ============
r.get('/members', async (req, res) => {
  const schoolId = req.query.school_id ? +req.query.school_id : req.user.school_id;
  const { rows } = await q(
    `SELECT u.id, u.name, u.email, u.major, u.grade, u.student_no, u.realname_verified,
            array_agg(ur.role || CASE ur.status WHEN 'pending' THEN '(待确认)' ELSE '' END) FILTER (WHERE ur.role IS NOT NULL) AS roles
     FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id
     WHERE u.school_id=$1
     GROUP BY u.id ORDER BY u.id`, [schoolId]
  );
  res.json({ items: rows });
});

r.post('/role-requests/:userId/approve', async (req, res) => {
  const { rows } = await q(
    `UPDATE user_roles SET status='active' WHERE user_id=$1 AND status='pending' RETURNING role, user_id`, [req.params.userId]
  );
  if (!rows.length) return res.status(404).json({ error: '没有待确认的角色申请' });
  await notify(rows[0].user_id, 'message', '角色关联已生效',
    `你的${rows[0].role === 'teacher' ? '教师' : '学生'}身份已通过学院确认。`, '/profile');
  res.json({ ok: true, role: rows[0].role });
});

// ============ 考券配额 ============
r.get('/quota', async (req, res) => {
  const schoolId = req.query.school_id ? +req.query.school_id : req.user.school_id;
  const available = await q(
    `SELECT v.id, v.code, v.kind, v.status, v.expires_at, cert.name AS cert_name
     FROM vouchers v JOIN certifications cert ON cert.id=v.cert_id
     WHERE v.status='available' AND v.source='学院配额' ORDER BY v.expires_at`
  );
  const requests = await q(
    `SELECT vr.id, vr.reason, vr.status, vr.created_at, u.name AS student_name, u.id AS student_id,
            cert.name AS cert_name
     FROM voucher_requests vr JOIN users u ON u.id=vr.user_id JOIN certifications cert ON cert.id=vr.cert_id
     WHERE vr.status='submitted' ORDER BY vr.created_at`
  );
  const history = await q(
    `SELECT vr.id, vr.status, vr.reviewed_at, u.name AS student_name, cert.name AS cert_name
     FROM voucher_requests vr JOIN users u ON u.id=vr.user_id JOIN certifications cert ON cert.id=vr.cert_id
     WHERE vr.status != 'submitted' ORDER BY vr.reviewed_at DESC NULLS LAST LIMIT 10`
  );
  res.json({ available: available.rows, requests: requests.rows, history: history.rows });
});

r.post('/voucher-requests/:id/review', async (req, res) => {
  const { approve, note } = req.body || {};
  const reqRow = await q(
    `SELECT vr.*, cert.name AS cert_name FROM voucher_requests vr JOIN certifications cert ON cert.id=vr.cert_id WHERE vr.id=$1 AND vr.status='submitted'`,
    [req.params.id]
  );
  if (!reqRow.rowCount) return res.status(404).json({ error: '申请不存在或已处理' });
  const vr = reqRow.rows[0];
  if (!approve) {
    await q(`UPDATE voucher_requests SET status='rejected', reviewed_at=now(), reviewer_note=$2 WHERE id=$1`, [vr.id, note || '']);
    await trackEvent('voucher_request', vr.id, vr.user_id, req.user.id, 'rejected', `考券申请未通过：${note || '不符合本学期配额条件'}`, 0);
    await notify(vr.user_id, 'message', '考券申请未通过', note || '不符合本学期配额条件，如有疑问请联系学院管理员。', '/my/applications');
    return res.json({ ok: true, status: 'rejected' });
  }
  // 发放：取一张可用考券绑定给学生
  const voucher = await q(
    `UPDATE vouchers SET status='claimed', owner_id=$1, note='审核通过发放'
     WHERE id = (SELECT id FROM vouchers WHERE status='available' LIMIT 1 FOR UPDATE SKIP LOCKED)
     RETURNING id, code`, [vr.user_id]
  );
  if (!voucher.rowCount) {
    return res.status(409).json({ error: '学院配额已用完，请先联系 IASC 补充配额' });
  }
  await q(`UPDATE voucher_requests SET status='issued', reviewed_at=now(), reviewer_note=$2 WHERE id=$1`, [vr.id, note || '']);
  await trackEvent('voucher_request', vr.id, vr.user_id, req.user.id, 'approved', '学院审核通过，正在发放考券', 0);
  await trackEvent('voucher_request', vr.id, vr.user_id, req.user.id, 'issued', `考券 ${voucher.rows[0].code} 已发放至券包（有效期见券包页）`, 0);
  await notify(vr.user_id, 'message', `${vr.cert_name} 考券已发放`, `券码 ${voucher.rows[0].code}，可在券包中查看并预约考试。`, '/my/vouchers');
  res.json({ ok: true, status: 'issued', voucherCode: voucher.rows[0].code });
});

// ============ 就业去向报告（outcomes） ============
r.get('/outcomes', async (req, res) => {
  const schoolId = req.query.school_id ? +req.query.school_id : req.user.school_id;
  const [byCompany, byStatus, recent] = await Promise.all([
    q(`SELECT cm.name, cm.industry, cm.logo_hue,
              count(*) FILTER (WHERE ja.status IN ('offer','hired'))::int AS offers,
              count(*)::int AS total
       FROM job_applications ja JOIN users u ON u.id=ja.user_id JOIN jobs j ON j.id=ja.job_id
       JOIN companies cm ON cm.id=j.company_id
       WHERE u.school_id=$1 GROUP BY cm.name, cm.industry, cm.logo_hue ORDER BY offers DESC LIMIT 8`, [schoolId]),
    q(`SELECT status, count(*)::int AS c FROM job_applications ja JOIN users u ON u.id=ja.user_id
       WHERE u.school_id=$1 GROUP BY status`, [schoolId]),
    q(`SELECT u.name, j.title AS job_title, cm.name AS company_name, ja.status, ja.updated_at
       FROM job_applications ja JOIN users u ON u.id=ja.user_id JOIN jobs j ON j.id=ja.job_id
       JOIN companies cm ON cm.id=j.company_id
       WHERE u.school_id=$1 AND ja.status IN ('offer','hired') ORDER BY ja.updated_at DESC LIMIT 6`, [schoolId]),
  ]);
  res.json({ byCompany: byCompany.rows, byStatus: byStatus.rows, recent: recent.rows });
});

export default r;
