import { Router } from 'express';
import { q } from '../db.js';
import { requireAuth, trackEvent, notify } from '../lib/auth.js';
import { trackerMeta } from '../lib/tracker.js';

const r = Router();
r.use(requireAuth);

// ============ 个人首页（待办聚合 + 快捷入口 + 进行中事项） ============
r.get('/home', async (req, res) => {
  const uid = req.user.id;
  const [todos, doing, deadlines] = await Promise.all([
    q(`SELECT id, title, body, link FROM notifications WHERE user_id=$1 AND kind='todo' AND NOT read ORDER BY created_at DESC LIMIT 5`, [uid]),
    q(`SELECT entity_type, status, count(*)::int AS c FROM tracker_events te
       JOIN (
         SELECT 'job_application' AS et, max(updated_at) AS t FROM job_applications WHERE user_id=$1 AND status NOT IN ('hired','rejected')
         UNION ALL SELECT 'enrollment', max(started_at) FROM course_enrollments WHERE user_id=$1 AND status='learning'
         UNION ALL SELECT 'contest_entry', max(created_at) FROM contest_entries WHERE user_id=$1 AND status NOT IN ('eliminated')
         UNION ALL SELECT 'voucher_request', max(created_at) FROM voucher_requests WHERE user_id=$1 AND status='submitted'
         UNION ALL SELECT 'exam_appointment', max(created_at) FROM exam_appointments WHERE user_id=$1 AND status='booked'
       ) live ON live.et = te.entity_type
       WHERE te.user_id=$1 GROUP BY entity_type, status`, [uid]),
    q(`SELECT id, exam_date, city, venue, (SELECT name FROM certifications WHERE id=exam_appointments.cert_id) AS cert_name
       FROM exam_appointments WHERE user_id=$1 AND status='booked' ORDER BY exam_date LIMIT 1`, [uid]),
  ]);
  res.json({ todos: todos.rows, doing: doing.rows, nextExam: deadlines.rows[0] || null });
});

// ============ 学习：我的课程 + 报名 + 学习器 ============
r.get('/courses', async (req, res) => {
  const { rows } = await q(
    `SELECT e.id AS enrollment_id, e.status, e.progress, e.started_at, e.completed_at,
            c.id, c.code, c.title, c.track, c.category, c.level, c.hours, c.cover_hue,
            (SELECT count(*) FROM lessons l WHERE l.course_id=c.id)::int AS lesson_count
     FROM course_enrollments e JOIN courses c ON c.id=e.course_id
     WHERE e.user_id=$1 ORDER BY e.started_at DESC`, [req.user.id]
  );
  res.json({ items: rows });
});

r.post('/courses/:id/enroll', async (req, res) => {
  const course = await q(`SELECT id, title FROM courses WHERE id=$1`, [req.params.id]);
  if (!course.rowCount) return res.status(404).json({ error: '课程不存在' });
  const exists = await q(`SELECT 1 FROM course_enrollments WHERE user_id=$1 AND course_id=$2`, [req.user.id, req.params.id]);
  if (exists.rowCount) return res.json({ ok: true, already: true });
  await q(`INSERT INTO course_enrollments (user_id, course_id) VALUES ($1,$2)`, [req.user.id, req.params.id]);
  await trackEvent('enrollment', +req.params.id, req.user.id, null, 'learning', `报名课程《${course.rows[0].title}》`, 0);
  res.json({ ok: true });
});

r.post('/lessons/:id/complete', async (req, res) => {
  const lesson = await q(
    `SELECT l.id, l.course_id, l.idx, c.title,
            (SELECT count(*) FROM lessons l2 WHERE l2.course_id=l.course_id)::int AS total
     FROM lessons l JOIN courses c ON c.id=l.course_id WHERE l.id=$1`, [req.params.id]
  );
  if (!lesson.rowCount) return res.status(404).json({ error: '课时不存在' });
  const l = lesson.rows[0];
  const e = await q(`SELECT id, progress FROM course_enrollments WHERE user_id=$1 AND course_id=$2`, [req.user.id, l.course_id]);
  if (!e.rowCount) return res.status(400).json({ error: '请先报名课程' });
  const newProgress = Math.max(e.rows[0].progress, Math.round((l.idx / l.total) * 100));
  const done = newProgress >= 100;
  await q(`UPDATE course_enrollments SET progress=$2, status=$3, completed_at=$4 WHERE id=$1`,
    [e.rows[0].id, newProgress, done ? 'completed' : 'learning', done ? new Date() : null]);
  if (done) await trackEvent('enrollment', l.course_id, req.user.id, null, 'completed', `完成全部章节，结课《${l.title}》`, 0);
  res.json({ ok: true, progress: newProgress, completed: done });
});

// ============ 班级 ============
r.get('/classes', async (req, res) => {
  const { rows } = await q(
    `SELECT cl.id, cl.name, cl.term, cl.status, cl.invite_code, cl.start_date, cl.end_date,
            c.title AS course_title, c.code AS course_code, c.cover_hue,
            u.name AS teacher_name,
            cm.progress AS my_progress, cm.joined_via,
            (SELECT count(*) FROM class_members m2 WHERE m2.class_id=cl.id)::int AS member_count
     FROM class_members cm JOIN classes cl ON cl.id=cm.class_id
     JOIN courses c ON c.id=cl.course_id JOIN users u ON u.id=cl.teacher_id
     WHERE cm.user_id=$1 ORDER BY cl.start_date DESC`, [req.user.id]
  );
  res.json({ items: rows });
});

r.post('/classes/join', async (req, res) => {
  const { code } = req.body || {};
  if (!code?.trim()) return res.status(400).json({ error: '请输入邀请码' });
  const { rows } = await q(
    `SELECT cl.id, cl.name, cl.status FROM classes cl WHERE upper(cl.invite_code)=upper($1)`, [code.trim()]
  );
  if (!rows.length) return res.status(404).json({ error: '邀请码无效，请向老师确认（示例：HW2026NET）' });
  if (rows[0].status === 'ended') return res.status(400).json({ error: '该班级已结课' });
  const dup = await q(`SELECT 1 FROM class_members WHERE class_id=$1 AND user_id=$2`, [rows[0].id, req.user.id]);
  if (dup.rowCount) return res.status(409).json({ error: '你已在该班级中' });
  await q(`INSERT INTO class_members (class_id, user_id, joined_via) VALUES ($1,$2,'invite_code')`, [rows[0].id, req.user.id]);
  res.json({ ok: true, className: rows[0].name });
});

// ============ 考券 ============
r.get('/vouchers', async (req, res) => {
  const { rows } = await q(
    `SELECT v.id, v.code, v.kind, v.status, v.source, v.expires_at, v.note,
            cert.name AS cert_name, cert.level AS cert_level
     FROM vouchers v JOIN certifications cert ON cert.id=v.cert_id
     WHERE v.owner_id=$1 ORDER BY v.status='claimed' DESC, v.expires_at`, [req.user.id]
  );
  res.json({ items: rows });
});

r.post('/voucher-requests', async (req, res) => {
  const { certId, reason } = req.body || {};
  if (!certId || !reason?.trim()) return res.status(400).json({ error: '请选择认证方向并填写申请理由' });
  const cert = await q(`SELECT name FROM certifications WHERE id=$1`, [certId]);
  if (!cert.rowCount) return res.status(404).json({ error: '认证不存在' });
  const dup = await q(`SELECT 1 FROM voucher_requests WHERE user_id=$1 AND cert_id=$2 AND status='submitted'`, [req.user.id, certId]);
  if (dup.rowCount) return res.status(409).json({ error: '该认证已有待审核的申请，请在进度中心查看' });
  const { rows } = await q(
    `INSERT INTO voucher_requests (user_id, cert_id, reason) VALUES ($1,$2,$3) RETURNING id`,
    [req.user.id, certId, reason.trim()]
  );
  await trackEvent('voucher_request', rows[0].id, req.user.id, null, 'submitted', `提交 ${cert.rows[0].name} 考券申请，等待学院审核`, 0);
  // 通知学院管理员
  const admins = await q(`SELECT user_id FROM user_roles WHERE role='school_admin'`);
  for (const a of admins.rows) {
    if (a.user_id !== req.user.id) {
      await notify(a.user_id, 'todo', '1 笔考券申请待审核',
        `${req.user.real_name || req.user.name} 申请 ${cert.rows[0].name} 考券：${reason.trim().slice(0, 40)}…`, '/school/quota');
    }
  }
  res.json({ ok: true, id: rows[0].id });
});

// ============ 考试与证书 ============
r.get('/exams', async (req, res) => {
  const { rows } = await q(
    `SELECT x.id, x.exam_date, x.city, x.venue, x.status, x.score, cert.name AS cert_name, cert.level AS cert_level
     FROM exam_appointments x JOIN certifications cert ON cert.id=x.cert_id
     WHERE x.user_id=$1 ORDER BY x.exam_date DESC`, [req.user.id]
  );
  const vouchers = await q(
    `SELECT v.id, v.code, cert.name AS cert_name FROM vouchers v JOIN certifications cert ON cert.id=v.cert_id
     WHERE v.owner_id=$1 AND v.status='claimed'`, [req.user.id]
  );
  res.json({ items: rows, usableVouchers: vouchers.rows });
});

r.post('/exams', async (req, res) => {
  const { certId, voucherId, date, city, venue } = req.body || {};
  if (!certId || !date || !city?.trim() || !venue?.trim()) return res.status(400).json({ error: '认证、日期、城市与考场均为必填' });
  const cert = await q(`SELECT name, level FROM certifications WHERE id=$1`, [certId]);
  if (!cert.rowCount) return res.status(404).json({ error: '认证不存在' });
  const when = new Date(date);
  const days = Math.ceil((when - Date.now()) / 86400000);
  if (days < 7) return res.status(400).json({ error: cert.rows[0].level === 'HCIE' ? 'HCIE 需至少提前 7 天预约' : '至少提前 1 天预约' });
  if (voucherId) {
    const v = await q(`SELECT status FROM vouchers WHERE id=$1 AND owner_id=$2`, [voucherId, req.user.id]);
    if (!v.rowCount || v.rows[0].status !== 'claimed') return res.status(400).json({ error: '考券不可用，请先在券包中绑定' });
    await q(`UPDATE vouchers SET status='locked' WHERE id=$1`, [voucherId]);
  }
  const { rows } = await q(
    `INSERT INTO exam_appointments (user_id, cert_id, voucher_id, exam_date, city, venue) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [req.user.id, certId, voucherId || null, date, city.trim(), venue.trim()]
  );
  await trackEvent('exam_appointment', rows[0].id, req.user.id, null, 'booked',
    `预约 ${cert.rows[0].name} 笔试：${date} ${city.trim()}·${venue.trim()}`, 0);
  await notify(req.user.id, 'todo', `${cert.rows[0].name} 考试已预约`, `${date} ${venue.trim()}，考前请完成实名信息核对。`, '/my/exams');
  res.json({ ok: true, id: rows[0].id });
});

r.post('/exams/:id/cancel', async (req, res) => {
  const { rows } = await q(
    `UPDATE exam_appointments SET status='cancelled' WHERE id=$1 AND user_id=$2 AND status='booked' RETURNING cert_id`,
    [req.params.id, req.user.id]
  );
  if (!rows.length) return res.status(400).json({ error: '预约不存在或已参加' });
  await q(`UPDATE vouchers SET status='claimed' WHERE id IN (SELECT voucher_id FROM exam_appointments WHERE id=$1)`, [req.params.id]);
  res.json({ ok: true });
});

r.get('/certificates', async (req, res) => {
  const { rows } = await q(
    `SELECT uc.id, uc.serial, uc.score, uc.earned_at, cert.name, cert.level, cert.direction
     FROM user_certificates uc JOIN certifications cert ON cert.id=uc.cert_id
     WHERE uc.user_id=$1 ORDER BY uc.earned_at DESC`, [req.user.id]
  );
  const completed = await q(
    `SELECT c.title, c.code, e.completed_at, e.progress FROM course_enrollments e JOIN courses c ON c.id=e.course_id
     WHERE e.user_id=$1 AND e.status='completed'`, [req.user.id]
  );
  res.json({ items: rows, courseCerts: completed.rows });
});

// ============ 大赛 ============
r.get('/contests', async (req, res) => {
  const { rows } = await q(
    `SELECT e.id, e.status, e.stage_idx, e.team_name, e.created_at,
            t.name AS track_name, t.entry_mode, t.stages,
            (SELECT count(*) FROM team_members tm WHERE tm.entry_id=e.id)::int AS team_size
     FROM contest_entries e JOIN contest_tracks t ON t.id=e.track_id
     WHERE e.user_id=$1 ORDER BY e.created_at DESC`, [req.user.id]
  );
  res.json({ items: rows });
});

r.post('/contest-entries', async (req, res) => {
  const { trackId, teamName } = req.body || {};
  const track = await q(`SELECT name, entry_mode, team_size FROM contest_tracks WHERE id=$1`, [trackId]);
  if (!track.rowCount) return res.status(404).json({ error: '赛道不存在' });
  const t = track.rows[0];
  if (t.entry_mode === '团队' && !teamName?.trim()) return res.status(400).json({ error: `${t.name}为团队赛，请填写队名（成员可在报名后邀请）` });
  const dup = await q(`SELECT 1 FROM contest_entries WHERE user_id=$1 AND track_id=$2`, [req.user.id, trackId]);
  if (dup.rowCount) return res.status(409).json({ error: '你已报名该赛道' });
  const { rows } = await q(
    `INSERT INTO contest_entries (track_id, user_id, school_id, team_name, status) VALUES ($1,$2,$3,$4,'submitted') RETURNING id`,
    [trackId, req.user.id, req.user.school_id, teamName?.trim() || null]
  );
  await q(`INSERT INTO team_members (entry_id, user_id, role) VALUES ($1,$2,$3)`,
    [rows[0].id, req.user.id, t.entry_mode === '团队' ? '队长' : '队员']);
  await trackEvent('contest_entry', rows[0].id, req.user.id, null, 'submitted', `报名第十一届 ICT 大赛·${t.name}`, 0);
  res.json({ ok: true, id: rows[0].id });
});

// ============ 双选会 ============
r.get('/fairs', async (req, res) => {
  const { rows } = await q(
    `SELECT f.id, f.name, f.city, f.venue, f.fair_date, f.status, fr.status AS my_status, fr.session, fr.created_at AS registered_at
     FROM fair_registrations fr JOIN job_fairs f ON f.id=fr.fair_id
     WHERE fr.user_id=$1 ORDER BY f.fair_date DESC`, [req.user.id]
  );
  res.json({ items: rows });
});

r.post('/fairs/:id/register', async (req, res) => {
  const { session } = req.body || {};
  const fair = await q(`SELECT id, name FROM job_fairs WHERE id=$1 AND status='registering'`, [req.params.id]);
  if (!fair.rowCount) return res.status(400).json({ error: '该双选会不在报名期' });
  const dup = await q(`SELECT 1 FROM fair_registrations WHERE fair_id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
  if (dup.rowCount) return res.status(409).json({ error: '你已报名，可在我的双选会查看入场码' });
  const { rows } = await q(
    `INSERT INTO fair_registrations (fair_id, user_id, session) VALUES ($1,$2,$3) RETURNING id`,
    [req.params.id, req.user.id, session || '上午场']
  );
  await trackEvent('fair_registration', rows[0].id, req.user.id, null, 'registered', `报名 ${fair.rows[0].name}（${session || '上午场'}）`, 0);
  res.json({ ok: true });
});

// ============ 投递 ============
r.post('/jobs/:id/apply', async (req, res) => {
  const job = await q(
    `SELECT j.id, j.title, j.kind, cm.name AS company_name FROM jobs j JOIN companies cm ON cm.id=j.company_id WHERE j.id=$1 AND j.status='open'`,
    [req.params.id]
  );
  if (!job.rowCount) return res.status(404).json({ error: '岗位已关闭' });
  if (!req.user.roles.includes('student')) {
    return res.status(403).json({ error: '请先在个人中心关联学生身份后投递' });
  }
  const dup = await q(`SELECT 1 FROM job_applications WHERE job_id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
  if (dup.rowCount) return res.status(409).json({ error: '已投递该岗位，可在进度中心查看' });
  const resume = await q(`SELECT id FROM resumes WHERE user_id=$1`, [req.user.id]);
  if (!resume.rowCount) {
    await q(`INSERT INTO resumes (user_id) VALUES ($1)`, [req.user.id]);
  }
  const rid = resume.rowCount ? resume.rows[0].id : (await q(`SELECT id FROM resumes WHERE user_id=$1`, [req.user.id])).rows[0].id;
  const { rows } = await q(
    `INSERT INTO job_applications (job_id, user_id, resume_id) VALUES ($1,$2,$3) RETURNING id`,
    [req.params.id, req.user.id, rid]
  );
  await trackEvent('job_application', rows[0].id, req.user.id, req.user.id, 'submitted', `投递 ${job.rows[0].company_name}·${job.rows[0].title}`, 0);
  await notify(req.user.id, 'message', `已投递：${job.rows[0].title}`, '简历已送达企业，进度更新将在此通知。', '/my/applications');
  res.json({ ok: true, id: rows[0].id });
});

// ============ 统一进度中心（跨域聚合：一切状态皆可追踪） ============
r.get('/trackers', async (req, res) => {
  const uid = req.user.id;
  // 各域“当前进行中/最近”实体
  const [jobs, vouchers, contests, fairs, schools, exams, enrolls] = await Promise.all([
    q(`SELECT ja.id, ja.status, ja.updated_at AS at, j.title AS title, cm.name AS sub
       FROM job_applications ja JOIN jobs j ON j.id=ja.job_id JOIN companies cm ON cm.id=j.company_id
       WHERE ja.user_id=$1 ORDER BY ja.updated_at DESC`, [uid]),
    q(`SELECT vr.id, vr.status, vr.created_at AS at, cert.name || ' 考券' AS title, '学院配额审核' AS sub
       FROM voucher_requests vr JOIN certifications cert ON cert.id=vr.cert_id WHERE vr.user_id=$1 ORDER BY vr.created_at DESC`, [uid]),
    q(`SELECT e.id, e.status, e.created_at AS at, 'ICT 大赛·' || t.name AS title, (t.stages)[e.stage_idx + 1] AS sub
       FROM contest_entries e JOIN contest_tracks t ON t.id=e.track_id WHERE e.user_id=$1 ORDER BY e.created_at DESC`, [uid]),
    q(`SELECT fr.id, fr.status, fr.created_at AS at, f.name AS title, f.city AS sub
       FROM fair_registrations fr JOIN job_fairs f ON f.id=fr.fair_id WHERE fr.user_id=$1 ORDER BY fr.created_at DESC`, [uid]),
    q(`SELECT sa.id, sa.status, sa.updated_at AS at, '学院入驻·' || sa.school_name AS title, sa.province AS sub
       FROM school_applications sa WHERE sa.applicant_id=$1 ORDER BY sa.updated_at DESC`, [uid]),
    q(`SELECT x.id, x.status, x.created_at AS at, cert.name || ' 笔试' AS title, x.city AS sub
       FROM exam_appointments x JOIN certifications cert ON cert.id=x.cert_id WHERE x.user_id=$1 ORDER BY x.created_at DESC`, [uid]),
    q(`SELECT c.id, e.status, e.started_at AS at, '《' || c.title || '》' AS title, c.track AS sub
       FROM course_enrollments e JOIN courses c ON c.id=e.course_id WHERE e.user_id=$1 AND e.status='learning'`, [uid]),
  ]);
  const groups = {
    job_application: jobs.rows,
    voucher_request: vouchers.rows,
    contest_entry: contests.rows,
    fair_registration: fairs.rows,
    school_application: schools.rows,
    exam_appointment: exams.rows,
    enrollment: enrolls.rows,
  };
  const items = [];
  const seen = new Set();
  for (const [type, rows] of Object.entries(groups)) {
    for (const row of rows) {
      const key = `${type}:${row.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const meta = trackerMeta(type, row.status);
      items.push({ id: row.id, type, title: row.title, sub: row.sub, at: row.at, ...meta });
    }
  }
  items.sort((a, b) => new Date(b.at) - new Date(a.at));
  // 各域时间线（最近 30 条）
  const events = await q(
    `SELECT entity_type, entity_id, status, note, created_at FROM tracker_events WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30`, [uid]
  );
  res.json({ items, events: events.rows });
});

// ============ 消息中心 ============
r.get('/notifications', async (req, res) => {
  const kind = req.query.kind;
  const clause = kind ? `AND kind=$2` : '';
  const params = kind ? [req.user.id, kind] : [req.user.id];
  const { rows } = await q(
    `SELECT * FROM notifications WHERE user_id=$1 ${clause} ORDER BY created_at DESC LIMIT 50`, params
  );
  const unread = await q(
    `SELECT kind, count(*)::int AS c FROM notifications WHERE user_id=$1 AND NOT read GROUP BY kind`, [req.user.id]
  );
  res.json({ items: rows, unread: Object.fromEntries(unread.rows.map((x) => [x.kind, x.c])) });
});
r.post('/notifications/:id/read', async (req, res) => {
  await q(`UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
  res.json({ ok: true });
});
r.post('/notifications/read-all', async (req, res) => {
  await q(`UPDATE notifications SET read=true WHERE user_id=$1`, [req.user.id]);
  res.json({ ok: true });
});

// ============ 个人资料 / 实名 / 角色关联 / 简历 ============
r.get('/profile', async (req, res) => {
  const roles = await q(`SELECT role, status, applied_at FROM user_roles WHERE user_id=$1`, [req.user.id]);
  const resume = await q(`SELECT * FROM resumes WHERE user_id=$1`, [req.user.id]);
  res.json({ ...req.user, roleList: roles.rows, resume: resume.rows[0] || null });
});

r.put('/profile', async (req, res) => {
  const { name, phone, major, grade, student_no, bio } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: '姓名不能为空' });
  await q(`UPDATE users SET name=$2, phone=$3, major=$4, grade=$5, student_no=$6, bio=$7 WHERE id=$1`,
    [req.user.id, name.trim(), phone, major, grade, student_no, bio]);
  res.json({ ok: true });
});

r.post('/profile/realname', async (req, res) => {
  const { real_name, id_no } = req.body || {};
  if (!real_name?.trim() || !id_no?.trim()) return res.status(400).json({ error: '姓名与证件号均为必填' });
  if (!/^\d{17}[\dXx]$/.test(id_no.trim())) return res.status(400).json({ error: '身份证号格式不正确（18 位）' });
  await q(`UPDATE users SET realname_verified=true, real_name=$2 WHERE id=$1`, [req.user.id, real_name.trim()]);
  await notify(req.user.id, 'message', '实名认证已完成', '现在可以预约华为认证考试。', '/my/exams');
  res.json({ ok: true });
});

r.post('/profile/roles', async (req, res) => {
  const { role, school_id, major, student_no } = req.body || {};
  const allowed = ['student', 'teacher'];
  if (!allowed.includes(role)) return res.status(400).json({ error: '该角色需平台运营审批，请走学院入驻通道' });
  const dup = await q(`SELECT 1 FROM user_roles WHERE user_id=$1 AND role=$2`, [req.user.id, role]);
  if (dup.rowCount) return res.status(409).json({ error: '已提交过该角色申请或已拥有' });
  await q(`INSERT INTO user_roles (user_id, role, status) VALUES ($1,$2,'pending')`, [req.user.id, role]);
  if (school_id) {
    await q(`UPDATE users SET school_id=$2, major=coalesce($3, major), student_no=coalesce($4, student_no) WHERE id=$1`,
      [req.user.id, school_id, major, student_no]);
  }
  if (school_id) {
    const admins = await q(`SELECT user_id FROM user_roles WHERE role='school_admin'`);
    for (const a of admins.rows) {
      await notify(a.user_id, 'todo', '1 笔角色关联待确认',
        `${req.user.name} 申请关联${role === 'teacher' ? '教师' : '学生'}身份。`, '/school/members');
    }
  }
  res.json({ ok: true, message: '已提交，学院管理员确认后即时生效（通常 1 个工作日内）' });
});

r.put('/resume', async (req, res) => {
  const { intention, skills, awards } = req.body || {};
  const exists = await q(`SELECT id FROM resumes WHERE user_id=$1`, [req.user.id]);
  if (exists.rowCount) {
    await q(`UPDATE resumes SET intention=$2, skills=$3, awards=$4, updated_at=now() WHERE user_id=$1`,
      [req.user.id, intention, skills || [], awards || []]);
  } else {
    await q(`INSERT INTO resumes (user_id, intention, skills, awards) VALUES ($1,$2,$3,$4)`,
      [req.user.id, intention, skills || [], awards || []]);
  }
  res.json({ ok: true });
});

export default r;
