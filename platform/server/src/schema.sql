-- 华为高校人才一体化平台 demo · schema
-- 设计原则（源自调研总报告 5.1）：
--   一个账号多角色 / 一切状态皆可追踪（tracker_events 事件溯源）/
--   学院-班级-学生自动关联 / 考券生命周期 / 就业闭环
BEGIN;

-- ============ 身份与组织 ============
CREATE TABLE IF NOT EXISTS schools (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  province TEXT NOT NULL,
  city TEXT,
  tier TEXT CHECK (tier IN ('认证级','优选级','领先级')) DEFAULT '认证级',
  tier_updated_at DATE,
  status TEXT CHECK (status IN ('active','applying','pending')) DEFAULT 'active',
  website TEXT,
  students_count INT DEFAULT 0,
  teachers_count INT DEFAULT 0,
  joined_at DATE,
  logo_hue INT DEFAULT 8,          -- 头像色相，用于生成的品牌方块
  partner_since INT
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  realname_verified BOOLEAN NOT NULL DEFAULT FALSE,
  real_name TEXT,
  school_id INT REFERENCES schools(id),
  major TEXT,
  grade TEXT,                        -- 如 2023级
  student_no TEXT,
  employer_id INT,                   -- 雇主侧用户所属企业（见 companies）
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student','teacher','school_admin','iasc','employer','platform_admin')),
  status TEXT NOT NULL DEFAULT 'active',   -- active / pending（待审批）
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

-- ============ 学习域 ============
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  track TEXT NOT NULL,               -- 技术方向：昇腾/鲲鹏/数通/云/安全/AI/仓颉/开源欧拉...
  category TEXT NOT NULL CHECK (category IN ('核心课','实践课','通识课')),
  level TEXT NOT NULL CHECK (level IN ('入门','进阶','高阶')),
  hours NUMERIC(5,1) NOT NULL,
  learners INT NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 4.7,
  summary TEXT NOT NULL,
  outcomes TEXT[],
  tags TEXT[],
  for_majors TEXT[],                 -- 适配专业
  cover_hue INT NOT NULL DEFAULT 16
);

CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  idx INT NOT NULL,
  chapter TEXT NOT NULL,
  title TEXT NOT NULL,
  minutes INT NOT NULL DEFAULT 30,
  kind TEXT NOT NULL DEFAULT 'video' CHECK (kind IN ('video','lab','quiz','doc'))
);

CREATE TABLE IF NOT EXISTS course_enrollments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'learning' CHECK (status IN ('learning','completed')),
  progress INT NOT NULL DEFAULT 0,   -- 0-100
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id),
  teacher_id INT NOT NULL REFERENCES users(id),
  school_id INT REFERENCES schools(id),
  name TEXT NOT NULL,
  term TEXT NOT NULL,                -- 2026秋 等
  invite_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('upcoming','ongoing','ended')),
  start_date DATE,
  end_date DATE,
  capacity INT DEFAULT 60
);

CREATE TABLE IF NOT EXISTS class_members (
  id SERIAL PRIMARY KEY,
  class_id INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_via TEXT NOT NULL DEFAULT 'school' CHECK (joined_via IN ('school','invite_code')),
  progress INT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, user_id)
);

-- ============ 认证与考试域 ============
CREATE TABLE IF NOT EXISTS certifications (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,         -- HCIA-Datacom 等
  level TEXT NOT NULL CHECK (level IN ('HCIA','HCIP','HCIE')),
  direction TEXT NOT NULL,           -- 数通/云/计算与存储/安全/无线/AI...
  price INT NOT NULL,                -- 考试费（元）
  summary TEXT NOT NULL,
  prerequisites TEXT[],
  exam_form TEXT NOT NULL DEFAULT '笔试',   -- 笔试 / 笔试+实验
  learner_hours INT NOT NULL DEFAULT 80
);

CREATE TABLE IF NOT EXISTS vouchers (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('数字考券','暗码考券','学生优惠券')),
  cert_id INT NOT NULL REFERENCES certifications(id),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','claimed','locked','used','expired')),
  owner_id INT REFERENCES users(id),
  source TEXT NOT NULL DEFAULT '学院配额',   -- 学院配额 / IASC发放 / 活动奖励
  expires_at DATE,
  note TEXT
);

CREATE TABLE IF NOT EXISTS voucher_requests (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cert_id INT NOT NULL REFERENCES certifications(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','approved','rejected','issued')),
  reviewer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS exam_appointments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cert_id INT NOT NULL REFERENCES certifications(id),
  voucher_id INT REFERENCES vouchers(id),
  exam_date DATE NOT NULL,
  city TEXT NOT NULL,
  venue TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','finished','cancelled')),
  score INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_certificates (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cert_id INT NOT NULL REFERENCES certifications(id),
  serial TEXT NOT NULL,
  score INT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ 竞赛域 ============
CREATE TABLE IF NOT EXISTS contests (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  season TEXT NOT NULL,              -- 第十一届
  status TEXT NOT NULL CHECK (status IN ('upcoming','registering','ongoing','finished')),
  reg_start DATE,
  reg_end DATE,
  intro TEXT,
  entry_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contest_tracks (
  id SERIAL PRIMARY KEY,
  contest_id INT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                -- 实践赛-网络 / 创新赛 / 教学赛...
  entry_mode TEXT NOT NULL CHECK (entry_mode IN ('个人','团队')),
  team_size INT DEFAULT 1,
  description TEXT,
  stages TEXT[]                      -- 校赛/省赛/全国总决赛/全球总决赛
);

CREATE TABLE IF NOT EXISTS contest_entries (
  id SERIAL PRIMARY KEY,
  track_id INT NOT NULL REFERENCES contest_tracks(id),
  user_id INT NOT NULL REFERENCES users(id),      -- 发起人
  school_id INT REFERENCES schools(id),
  team_name TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft','submitted','qualified','provincial','national','global','awarded','eliminated')),
  stage_idx INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  entry_id INT NOT NULL REFERENCES contest_entries(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT '队员' CHECK (role IN ('队长','队员','指导教师')),
  UNIQUE (entry_id, user_id)
);

-- ============ 就业域（现网最大空白） ============
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL,
  city TEXT NOT NULL,
  logo_hue INT NOT NULL DEFAULT 210,
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  verified_at TIMESTAMPTZ DEFAULT now(),
  intro TEXT,
  scale TEXT                        -- 1000-5000人 等
);

CREATE TABLE IF NOT EXISTS job_fairs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  venue TEXT NOT NULL,
  fair_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL CHECK (status IN ('upcoming','registering','closed','finished')),
  booths INT NOT NULL DEFAULT 0,
  companies_count INT NOT NULL DEFAULT 0,
  jobs_count INT NOT NULL DEFAULT 0,
  intro TEXT NOT NULL,
  highlights TEXT[],
  cover_hue INT DEFAULT 220
);

CREATE TABLE IF NOT EXISTS fair_registrations (
  id SERIAL PRIMARY KEY,
  fair_id INT NOT NULL REFERENCES job_fairs(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session TEXT,                      -- 上午场/下午场
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','checked_in','attended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fair_id, user_id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  company_id INT NOT NULL REFERENCES companies(id),
  title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('校招','实习','社招')),
  city TEXT NOT NULL,
  salary TEXT NOT NULL,
  openings INT NOT NULL DEFAULT 1,
  requirement TEXT NOT NULL,         -- 任职要求
  duty TEXT NOT NULL,                -- 岗位职责
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resumes (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '我的成长档案简历',
  intention TEXT,                    -- 求职意向
  skills TEXT[],
  awards TEXT[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS job_applications (
  id SERIAL PRIMARY KEY,
  job_id INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id INT REFERENCES resumes(id),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','screening','written_test','interview','offer','hired','rejected')),
  stage_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, user_id)
);

-- ============ 院校入驻域（旅程A线上化） ============
CREATE TABLE IF NOT EXISTS school_applications (
  id SERIAL PRIMARY KEY,
  applicant_id INT NOT NULL REFERENCES users(id),
  school_name TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT,
  contact_name TEXT NOT NULL,
  contact_title TEXT NOT NULL,       -- 二级学院负责人
  contact_email TEXT,
  intent_tier TEXT NOT NULL DEFAULT '认证级',
  authorization_signed BOOLEAN NOT NULL DEFAULT FALSE,   -- 电子授权函
  agreement_signed BOOLEAN NOT NULL DEFAULT FALSE,       -- 校企合作协议
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','material_review','contract_signing','tier_evaluation','active','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ 统一追踪事件（一切状态皆可追踪） ============
CREATE TABLE IF NOT EXISTS tracker_events (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,   -- job_application / voucher_request / contest_entry / fair_registration / school_application / exam_appointment / enrollment / onboarding_role
  entity_id INT NOT NULL,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 关心该事件的人（申请者）
  actor_id INT REFERENCES users(id),                            -- 触发者（如雇主推进）
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ 消息与待办 ============
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('todo','message','announcement')),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '平台公告',
  body TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 成功案例（结构化替代现网纯图文列表）
CREATE TABLE IF NOT EXISTS stories (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  student_name TEXT NOT NULL,
  school_name TEXT NOT NULL,
  track TEXT NOT NULL,               -- 大赛赛道或成长路径
  award TEXT,                        -- 奖项 / 去向
  outcome TEXT,                      -- 现在在哪
  quote TEXT NOT NULL,               -- 一句话证言
  story TEXT NOT NULL,               -- 完整故事
  milestone TEXT[],                  -- 成长节点
  year INT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, kind, read);
CREATE INDEX IF NOT EXISTS idx_tracker_user ON tracker_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enroll_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_open ON jobs(status, kind);

COMMIT;
