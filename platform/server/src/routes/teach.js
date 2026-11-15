import { Router } from 'express';
import crypto from 'node:crypto';
import { q } from '../db.js';
import { requireAuth, requireRole, trackEvent, notify } from '../lib/auth.js';

const r = Router();
r.use(requireAuth, requireRole('teacher', 'school_admin', 'platform_admin'));

// 教师工作台总览
r.get('/overview', async (req, res) => {
  const { rows } = await q(
    `SELECT cl.id, cl.name, cl.term, cl.status, cl.invite_code, cl.start_date, cl.end_date,
            c.title AS course_title, c.cover_hue,
            (SELECT count(*) FROM class_members m WHERE m.class_id=cl.id)::int AS member_count,
            (SELECT round(avg(m.progress)) FROM class_members m WHERE m.class_id=cl.id)::int AS avg_progress,
            (SELECT count(*) FROM class_members m WHERE m.class_id=cl.id AND m.progress >= 100)::int AS finished
     FROM classes cl JOIN courses c ON c.id=cl.course_id
     WHERE cl.teacher_id=$1 ORDER BY cl.start_date DESC`, [req.user.id]
  );
  const students = await q(
    `SELECT count(DISTINCT m.user_id)::int AS c FROM class_members m JOIN classes cl ON cl.id=m.class_id WHERE cl.teacher_id=$1`,
    [req.user.id]
  );
  res.json({ classes: rows, totalStudents: students.rows[0].c });
});

// 班级详情（学员与进度名单 —— 替代现网“邀请码发完就没了”）
r.get('/classes/:id', async (req, res) => {
  const { rows } = await q(
    `SELECT cl.*, c.title AS course_title, c.id AS course_id, c.cover_hue,
            (SELECT count(*) FROM lessons l WHERE l.course_id=c.id)::int AS lesson_count
     FROM classes cl JOIN courses c ON c.id=cl.course_id WHERE cl.id=$1 AND cl.teacher_id=$2`,
    [req.params.id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: '班级不存在' });
  const members = await q(
    `SELECT u.id, u.name, u.major, u.grade, u.student_no, m.progress, m.joined_via, m.joined_at,
            u.realname_verified
     FROM class_members m JOIN users u ON u.id=m.user_id WHERE m.class_id=$1
     ORDER BY m.progress DESC, m.joined_at`, [req.params.id]
  );
  res.json({ ...rows[0], members: members.rows });
});

// 开班（课程详情页入口之外，工作台直达）
r.post('/classes', async (req, res) => {
  const { courseId, name, term, schoolId } = req.body || {};
  const course = await q(`SELECT title FROM courses WHERE id=$1`, [courseId]);
  if (!course.rowCount) return res.status(404).json({ error: '课程不存在' });
  if (!name?.trim() || !term?.trim()) return res.status(400).json({ error: '班级名称与学期为必填' });
  const code = 'HW' + crypto.randomBytes(3).toString('hex').toUpperCase();
  const { rows } = await q(
    `INSERT INTO classes (course_id, teacher_id, school_id, name, term, invite_code, status)
     VALUES ($1,$2,$3,$4,$5,$6,'upcoming') RETURNING id, invite_code`,
    [courseId, req.user.id, schoolId || req.user.school_id, name.trim(), term.trim(), code]
  );
  res.json({ ok: true, id: rows[0].id, inviteCode: rows[0].invite_code });
});

// 修改班级状态
r.post('/classes/:id/status', async (req, res) => {
  const { status } = req.body || {};
  if (!['upcoming', 'ongoing', 'ended'].includes(status)) return res.status(400).json({ error: '非法状态' });
  const { rows } = await q(
    `UPDATE classes SET status=$2 WHERE id=$1 AND teacher_id=$3 RETURNING id`, [req.params.id, status, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: '班级不存在' });
  res.json({ ok: true });
});

export default r;
