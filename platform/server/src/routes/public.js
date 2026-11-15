import { Router } from 'express';
import { q } from '../db.js';

const r = Router();
const num = (v, d) => (v === undefined || v === '' || Number.isNaN(+v) ? d : +v);

// ============ 门户首页 ============
r.get('/home', async (_req, res) => {
  const [stats, hotCourses, upcomingFair, contest, anns] = await Promise.all([
    q(`SELECT
         (SELECT count(*) FROM schools WHERE status='active')::int AS academies,
         (SELECT count(*) FROM courses)::int AS courses,
         (SELECT count(*) FROM users WHERE EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id=users.id AND ur.role='student'))::int AS learners,
         (SELECT count(*) FROM certifications)::int AS certs,
         (SELECT coalesce(sum(jobs_count),0) FROM job_fairs WHERE status IN ('registering','upcoming'))::int AS fair_jobs`),
    q(`SELECT id, code, title, track, category, level, hours, learners, rating, summary, cover_hue
       FROM courses ORDER BY learners DESC LIMIT 8`),
    q(`SELECT * FROM job_fairs WHERE status IN ('registering','upcoming') ORDER BY fair_date LIMIT 1`),
    q(`SELECT id, name, season, status, reg_end, entry_count FROM contests WHERE status!='finished' ORDER BY id DESC LIMIT 1`),
    q(`SELECT title, category, published_at FROM announcements ORDER BY published_at DESC LIMIT 4`),
  ]);
  res.json({
    stats: stats.rows[0],
    hotCourses: hotCourses.rows,
    fair: upcomingFair.rows[0] || null,
    contest: contest.rows[0] || null,
    announcements: anns.rows,
  });
});

// ============ 课程目录 ============
r.get('/courses', async (req, res) => {
  const { track, category, level, q: kw, sort = 'learners', kind } = req.query;
  const page = Math.max(1, num(req.query.page, 1));
  const size = 12;
  const where = [];
  const params = [];
  if (track) { params.push(track); where.push(`track=$${params.length}`); }
  if (category) { params.push(category); where.push(`category=$${params.length}`); }
  if (level) { params.push(level); where.push(`level=$${params.length}`); }
  if (kw) { params.push(`%${kw}%`); where.push(`(title ILIKE $${params.length} OR summary ILIKE $${params.length})`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderBy = sort === 'new' ? 'id DESC' : sort === 'hours' ? 'hours ASC' : 'learners DESC';
  const { rows } = await q(
    `SELECT c.*, (SELECT count(*) FROM lessons l WHERE l.course_id=c.id)::int AS lesson_count
     FROM courses c ${clause} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, size, (page - 1) * size]
  );
  const total = await q(`SELECT count(*)::int AS c FROM courses c ${clause}`, params);
  const facets = await q(`SELECT DISTINCT track FROM courses ORDER BY track`);
  res.json({ items: rows, total: total.rows[0].c, page, size, tracks: facets.rows.map((x) => x.track) });
});

r.get('/courses/:id', async (req, res) => {
  const { rows } = await q(`SELECT c.*, (SELECT count(*) FROM lessons l WHERE l.course_id=c.id)::int AS lesson_count FROM courses c WHERE c.id=$1`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: '课程不存在' });
  const lessons = await q(`SELECT id, idx, chapter, title, minutes, kind FROM lessons WHERE course_id=$1 ORDER BY idx`, [req.params.id]);
  const related = await q(`SELECT id, title, track, level, hours, learners, cover_hue FROM courses WHERE track=$1 AND id!=$2 LIMIT 3`, [rows[0].track, rows[0].id]);
  const certs = await q(`SELECT id, name, level, direction FROM certifications WHERE direction ILIKE $1 OR $1 ILIKE '%'||direction||'%' LIMIT 3`,
    [`%${rows[0].track}%`]);
  let enrolled = false, progress = 0;
  if (req.user) {
    const e = await q(`SELECT status, progress FROM course_enrollments WHERE user_id=$1 AND course_id=$2`, [req.user.id, rows[0].id]);
    enrolled = e.rowCount > 0;
    if (enrolled) progress = e.rows[0].progress;
  }
  res.json({ ...rows[0], lessons: lessons.rows, related: related.rows, linkedCerts: certs.rows, enrolled, progress });
});

// ============ 认证 ============
r.get('/certifications', async (_req, res) => {
  const { rows } = await q(`SELECT * FROM certifications ORDER BY CASE level WHEN 'HCIA' THEN 1 WHEN 'HCIP' THEN 2 ELSE 3 END, direction, name`);
  res.json({ items: rows });
});
r.get('/certifications/:id', async (req, res) => {
  const { rows } = await q(`SELECT * FROM certifications WHERE id=$1`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: '认证不存在' });
  const courses = await q(
    `SELECT id, title, hours, level, cover_hue FROM courses WHERE tags && $1::text[] OR track ILIKE $2 LIMIT 4`,
    [[rows[0].name, rows[0].direction], `%${rows[0].direction}%`]
  );
  res.json({ ...rows[0], courses: courses.rows });
});

// ============ 大赛 ============
r.get('/contests', async (_req, res) => {
  const { rows } = await q(`SELECT * FROM contests ORDER BY id DESC`);
  const tracks = await q(`SELECT * FROM contest_tracks WHERE contest_id=$1 ORDER BY id`, [rows[0]?.id]);
  res.json({ items: rows, tracks: tracks.rows });
});

// ============ 双选会 ============
r.get('/fairs', async (_req, res) => {
  const { rows } = await q(`SELECT * FROM job_fairs ORDER BY fair_date DESC`);
  res.json({ items: rows });
});
r.get('/fairs/:id', async (req, res) => {
  const { rows } = await q(`SELECT * FROM job_fairs WHERE id=$1`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: '双选会不存在' });
  const jobs = await q(
    `SELECT j.id, j.title, j.kind, j.city, j.salary, j.tags, cm.name AS company_name, cm.logo_hue
     FROM jobs j JOIN companies cm ON cm.id=j.company_id WHERE j.city ILIKE $1 AND j.status='open' LIMIT 8`,
    [`%${rows[0].city}%`]
  );
  let registered = false;
  if (req.user) {
    const e = await q(`SELECT 1 FROM fair_registrations WHERE fair_id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    registered = e.rowCount > 0;
  }
  res.json({ ...rows[0], cityJobs: jobs.rows, registered });
});

// ============ 岗位 ============
r.get('/jobs', async (req, res) => {
  const { kind, city, company_id, q: kw, tag } = req.query;
  const page = Math.max(1, num(req.query.page, 1));
  const size = 10;
  const where = [`j.status='open'`];
  const params = [];
  if (kind) { params.push(kind); where.push(`j.kind=$${params.length}`); }
  if (city) { params.push(city); where.push(`j.city=$${params.length}`); }
  if (company_id) { params.push(company_id); where.push(`j.company_id=$${params.length}`); }
  if (kw) { params.push(`%${kw}%`); where.push(`(j.title ILIKE $${params.length} OR j.duty ILIKE $${params.length})`); }
  if (tag) { params.push(tag); where.push(`$${params.length}=ANY(j.tags)`); }
  const clause = `WHERE ${where.join(' AND ')}`;
  const { rows } = await q(
    `SELECT j.*, cm.name AS company_name, cm.logo_hue AS company_hue, cm.verified AS company_verified, cm.industry AS company_industry, cm.scale AS company_scale
     FROM jobs j JOIN companies cm ON cm.id=j.company_id ${clause}
     ORDER BY j.posted_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, size, (page - 1) * size]
  );
  const total = await q(`SELECT count(*)::int AS c FROM jobs j ${clause}`, params);
  const cities = await q(`SELECT DISTINCT city FROM jobs WHERE status='open' ORDER BY city`);
  res.json({ items: rows, total: total.rows[0].c, page, size, cities: cities.rows.map((x) => x.city) });
});
r.get('/jobs/:id', async (req, res) => {
  const { rows } = await q(
    `SELECT j.*, cm.name AS company_name, cm.logo_hue AS company_hue, cm.verified AS company_verified, cm.intro AS company_intro, cm.industry AS company_industry, cm.scale AS company_scale
     FROM jobs j JOIN companies cm ON cm.id=j.company_id WHERE j.id=$1`, [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: '岗位不存在' });
  let applied = false;
  if (req.user) {
    const e = await q(`SELECT 1 FROM job_applications WHERE job_id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    applied = e.rowCount > 0;
  }
  const similar = await q(
    `SELECT j.id, j.title, j.city, j.kind, cm.name AS company_name FROM jobs j JOIN companies cm ON cm.id=j.company_id
     WHERE j.kind=$1 AND j.id!=$2 AND j.status='open' LIMIT 3`, [rows[0].kind, rows[0].id]
  );
  res.json({ ...rows[0], applied, similar: similar.rows });
});

// ============ ICT 学院目录（修复现网“强制输入查询条件、无地区浏览”缺陷） ============
r.get('/academies', async (req, res) => {
  const { province, tier, q: kw } = req.query;
  const where = [];
  const params = [];
  if (province) { params.push(province); where.push(`province=$${params.length}`); }
  if (tier) { params.push(tier); where.push(`tier=$${params.length}`); }
  if (kw) { params.push(`%${kw}%`); where.push(`name ILIKE $${params.length}`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { rows } = await q(
    `SELECT id, name, short_name, province, city, tier, students_count, teachers_count, joined_at, logo_hue
     FROM schools ${clause} ORDER BY students_count DESC`, params
  );
  const byProvince = await q(
    `SELECT province, count(*)::int AS c, coalesce(sum(students_count),0)::int AS students
     FROM schools WHERE status='active' GROUP BY province ORDER BY students DESC`
  );
  res.json({ items: rows, byProvince: byProvince.rows });
});

// ============ 平台公告 ============
r.get('/announcements', async (_req, res) => {
  const { rows } = await q(`SELECT * FROM announcements ORDER BY published_at DESC`);
  res.json({ items: rows });
});

// ============ 成功案例 ============
r.get('/stories', async (_req, res) => {
  const { rows } = await q(`SELECT * FROM stories ORDER BY year DESC, published_at DESC`);
  res.json({ items: rows });
});

// ============ 全站搜索（顶部搜索框） ============
r.get('/search', async (req, res) => {
  const kw = `%${(req.query.q || '').trim()}%`;
  if (!req.query.q?.trim()) return res.json({ courses: [], jobs: [], certs: [], fairs: [] });
  const [courses, jobs, certs, fairs] = await Promise.all([
    q(`SELECT id, title, track FROM courses WHERE title ILIKE $1 OR summary ILIKE $1 LIMIT 5`, [kw]),
    q(`SELECT j.id, j.title, j.city, cm.name AS company_name FROM jobs j JOIN companies cm ON cm.id=j.company_id WHERE (j.title ILIKE $1 OR j.duty ILIKE $1 OR j.requirement ILIKE $1) AND j.status='open' LIMIT 5`, [kw]),
    q(`SELECT id, name, level, direction FROM certifications WHERE name ILIKE $1 OR direction ILIKE $1 LIMIT 5`, [kw]),
    q(`SELECT id, name, city, fair_date FROM job_fairs WHERE name ILIKE $1 OR city ILIKE $1 LIMIT 3`, [kw]),
  ]);
  res.json({ courses: courses.rows, jobs: jobs.rows, certs: certs.rows, fairs: fairs.rows });
});

export default r;
