// 种子数据：结构来自现网调研（research/00、04）——课程绑定昇腾/鲲鹏/仓颉等技术栈、
// HCIA/IP/IE 三级认证、ICT 大赛 7 赛道、人才联盟双选会、华为生态企业。
// demo 学生「林晓澜」被构造为覆盖全部六条旅程的进行时状态。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, q } from './db.js';
import { hashPassword } from './lib/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 确定性伪随机，保证每次 seed 结果一致
let rngState = 20261115;
function rnd() {
  rngState = (rngState * 1664525 + 1013904223) % 4294967296;
  return rngState / 4294967296;
}
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
function int(min, max) { return Math.floor(rnd() * (max - min + 1)) + min; }

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await q(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
  await q(schema);
  console.log('schema 重建完成');

  const pwd = hashPassword('demo1234');

  // ============ 学校 ============
  const schools = [
    ['成都信息工程大学', '成信大', '四川省', '成都市', '领先级', 2019, 4200, 68],
    ['北京邮电大学', '北邮', '北京市', '北京市', '领先级', 2018, 5100, 92],
    ['电子科技大学', '电子科大', '四川省', '成都市', '领先级', 2018, 4800, 85],
    ['西安电子科技大学', '西电', '陕西省', '西安市', '领先级', 2019, 4600, 80],
    ['重庆邮电大学', '重邮', '重庆市', '重庆市', '优选级', 2020, 3100, 52],
    ['杭州电子科技大学', '杭电', '浙江省', '杭州市', '优选级', 2020, 2900, 49],
    ['武汉理工大学', '武汉理工', '湖北省', '武汉市', '优选级', 2021, 2600, 44],
    ['深圳大学', '深大', '广东省', '深圳市', '优选级', 2021, 2400, 41],
    ['昆明理工大学', '昆工', '云南省', '昆明市', '认证级', 2022, 1500, 26],
    ['桂林电子科技大学', '桂电', '广西壮族自治区', '桂林市', '认证级', 2022, 1400, 24],
    ['兰州交通大学', '兰交大', '甘肃省', '兰州市', '认证级', 2023, 900, 16],
    ['云南大学滇池学院', '滇池学院', '云南省', '昆明市', '认证级', 2026, 0, 2],
  ];
  const schoolIds = {};
  for (const [name, short, province, city, tier, since, students, teachers] of schools) {
    const status = name === '云南大学滇池学院' ? 'applying' : 'active';
    const { rows } = await q(
      `INSERT INTO schools (name, short_name, province, city, tier, tier_updated_at, status, website, students_count, teachers_count, joined_at, logo_hue, partner_since)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [name, short, province, city, tier, `${since + 1}-06-30`, status,
       `https://www.${pinyin(short)}.edu.cn`, students, teachers, `${since}-09-01`, int(0, 359), since]
    );
    schoolIds[name] = rows[0].id;
  }
  // pinyin 简化映射（官网 URL 仅作展示用）
  function pinyin(s) { return { '成信大': 'cuit', '北邮': 'bupt', '电子科大': 'uestc', '西电': 'xidian', '重邮': 'cqupt', '杭电': 'hdu', '武汉理工': 'whut', '深大': 'szu', '昆工': 'kmust', '桂电': 'guet', '兰交大': 'lzjtu', '滇池学院': 'dcxy' }[s] || 'edu'; }

  // ============ 认证体系 ============
  const certs = [
    ['HCIA-Datacom', 'HCIA', '数通', 200, '构建中小型网络的全流程能力，覆盖路由交换、网络协议与基础运维。', 1, '笔试', 80],
    ['HCIA-AI', 'HCIA', '人工智能', 200, '掌握深度学习基础、主流 AI 框架与昇腾 AI 处理器应用开发入门。', 1, '笔试', 90],
    ['HCIA-Cloud Service', 'HCIA', '云平台', 200, '华为云核心服务（计算、存储、网络、安全）的使用与运维基础。', 1, '笔试', 70],
    ['HCIA-Computing', 'HCIA', '计算', 200, '鲲鹏计算体系架构、泰山服务器与 openEuler 操作系统基础。', 1, '笔试', 70],
    ['HCIA-Security', 'HCIA', '安全', 200, '信息安全基础、防火墙/VPN/入侵防御等主流安全技术与部署。', 1, '笔试', 75],
    ['HCIA-Storage', 'HCIA', '存储', 200, '存储技术基础：RAID、SAN/NAS、华为 OceanStor 系列部署运维。', 1, '笔试', 65],
    ['HCIA-openEuler', 'HCIA', '开源', 200, 'openEuler 操作系统管理：命令行、服务配置、 shell 与系统运维。', 1, '笔试', 60],
    ['HCIP-Datacom', 'HCIP', '数通', 480, '大规模网络设计：IGP/BGP 路由协议、网络演进与自动化运维进阶。', 2, '笔试', 160],
    ['HCIP-AI', 'HCIP', '人工智能', 480, '深度学习进阶、模型优化与昇腾全场景 AI 解决方案。', 2, '笔试', 180],
    ['HCIP-Cloud', 'HCIP', '云平台', 480, '云网络、云安全与混合云架构设计与部署。', 2, '笔试', 150],
    ['HCIP-Computing', 'HCIP', '计算', 480, '鲲鹏应用移植、性能调优与集群化管理。', 2, '笔试', 150],
    ['HCIE-Datacom', 'HCIE', '数通', 1100, '专家级数通：大规模网络架构设计、复杂故障定位（笔试+实验）。', 3, '笔试+实验', 400],
    ['HCIE-AI', 'HCIE', '人工智能', 1100, '专家级 AI：大模型训练与推理优化、昇腾集群方案设计（笔试+实验）。', 3, '笔试+实验', 420],
    ['HCIE-Cloud', 'HCIE', '云平台', 1100, '专家级云：大规模云架构规划、迁移与治理（笔试+实验）。', 3, '笔试+实验', 380],
    ['HCIE-Computing', 'HCIE', '计算', 1100, '专家级计算：行业数字化基础设施架构设计（笔试+实验）。', 3, '笔试+实验', 360],
  ];
  const certIds = {};
  for (const [name, level, direction, price, summary, lv, form, hours] of certs) {
    const prereq = level === 'HCIP' ? [`HCIA-${direction === '云平台' ? 'Cloud Service' : direction}`] : level === 'HCIE' ? [`HCIP-${direction}`] : [];
    const { rows } = await q(
      `INSERT INTO certifications (name, level, direction, price, summary, prerequisites, exam_form, learner_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [name, level, direction, price, summary, prereq, form, hours]
    );
    certIds[name] = rows[0].id;
  }

  // ============ 课程 ============
  const courseData = [
    // code, title, track, category, level, hours, learners, hue, summary, tags
    ['NET101', '计算机网络（华为版）', '数通', '核心课', '入门', 48, 33964, 210, '以华为数通设备为载体讲透 TCP/IP 与路由交换，配套 eNSPro 实验环境，衔接 HCIA-Datacom。', ['eNSPro', 'HCIA-Datacom', '路由交换']],
    ['DS201', '数据结构与算法', '编程基础', '核心课', '入门', 64, 28610, 268, '线性表到图算法的系统训练，配合仓颉语言实现与在线判题，为后续高阶课打底。', ['仓颉', '在线判题']],
    ['ASC301', '昇腾算子开发', '昇腾', '核心课', '高阶', 40, 4210, 16, '基于 CANN 架构开发昇腾 AI 算子：算子分析、tiling 切分、精度调优全流程。', ['CANN', 'Ascend', 'AI Core']],
    ['ASC201', '并行计算', '昇腾', '核心课', '进阶', 32, 6820, 20, '并行体系结构与编程模型，覆盖 SIMD、多核调度与达芬奇架构实战。', ['达芬奇架构', '多核']],
    ['KP201', '鲲鹏应用移植与调优', '鲲鹏', '实践课', '进阶', 36, 5370, 140, 'x86 到鲲鹏的移植方法论：编译工具链、依赖排查、性能调优与容器化。', ['DevKit', '毕昇编译器']],
    ['OS202', '操作系统原理（openEuler 版）', '开源欧拉', '核心课', '进阶', 48, 11890, 130, '进程、内存、文件系统与 IO 的原理精讲，实验全部基于 openEuler 展开。', ['openEuler', '内核']],
    ['CMP202', '计算机组成原理（鲲鹏版）', '鲲鹏', '核心课', '进阶', 48, 9640, 145, '从冯诺依曼结构到鲲鹏泰山服务器，理解 ARM 架构与能效设计。', ['ARM', '泰山服务器']],
    ['AI101', 'AI 通识：从模型到智能体', '人工智能', '通识课', '入门', 24, 12760, 350, '面向全体专业的大模型通识：提示工程、检索增强、智能体搭建与 AI 伦理。', ['大模型', '智能体']],
    ['AI201', '深度学习', '人工智能', '核心课', '进阶', 48, 9726, 330, '从神经网络到 Transformer，实验跑在昇腾算力平台，衔接 HCIA-AI。', ['MindSpore', '昇腾算力']],
    ['AI301', '智能体与 AI 编程实战', '人工智能', '实践课', '高阶', 32, 3980, 340, '用仓颉与盘古能力构建端到端智能体应用：工具调用、多轮规划、评测。', ['仓颉', '盘古']],
    ['SEC201', '网络与信息安全', '安全', '核心课', '进阶', 40, 7530, 6, '密码学基础、协议安全与典型攻击防御，配套 HCIA-Security 认证路径。', ['HCIA-Security', '密码学']],
    ['CLD201', '云计算原理与实践', '云', '核心课', '进阶', 40, 8910, 200, '虚拟化、容器与华为云核心服务，完成一套云上应用部署。', ['华为云', 'K8s']],
    ['STG201', '存储技术基础', '存储', '核心课', '入门', 32, 4120, 260, 'RAID 到分布式存储，OceanStor 全闪存阵列实验。', ['OceanStor', 'RAID']],
    ['CJ101', '仓颉编程语言入门', '仓颉', '通识课', '入门', 32, 6620, 60, '华为自研仓颉语言：现代语法、并发模型与跨平台开发初体验。', ['仓颉', '新语言']],
    ['CJ201', '仓颉应用开发', '仓颉', '实践课', '进阶', 40, 2150, 65, '用仓颉开发完整应用：UI 框架、网络与数据持久化、鸿蒙生态适配。', ['仓颉', '鸿蒙']],
    ['CMP401', '专业综合实训（昇腾方向）', '昇腾', '实践课', '高阶', 64, 1860, 14, '8 周企业级项目实训：从需求到部署的昇腾 AI 全栈项目，企业导师联合评分。', ['项目实训', '企业导师']],
    ['CMP402', '专业综合实训（鲲鹏方向）', '鲲鹏', '实践课', '高阶', 64, 1520, 150, '鲲鹏原生应用开发实训：性能基准测试、调优报告与答辩。', ['项目实训', '性能调优']],
    ['DL101', '分布式系统通识', '云', '通识课', '入门', 24, 3480, 205, '共识、副本与一致性：分布式系统核心概念的可视化讲解。', ['共识算法']],
    ['NET301', '网络自动化与运维', '数通', '实践课', '进阶', 32, 2960, 215, 'NetConf/YANG、Python 自动化巡检，构建一个小型网络数字孪生。', ['NetConf', 'Python']],
    ['AI401', '大模型微调与应用开发', '昇腾', '实践课', '高阶', 40, 1740, 12, '在昇腾集群上完成 SFT/LoRA 微调并部署推理服务，衔接昇腾生态企业实习。', ['LoRA', '推理部署']],
  ];
  const courseIds = {};
  const chapterNames = {
    '核心课': ['导论与基础', '核心原理', '进阶专题', '综合实验'],
    '实践课': ['项目启动', '核心技术实现', '集成与测试', '成果答辩'],
    '通识课': ['概念与认知', '动手实践', '前沿议题'],
  };
  for (const [code, title, track, category, level, hours, learners, hue, summary, tags] of courseData) {
    const { rows } = await q(
      `INSERT INTO courses (code, title, track, category, level, hours, learners, rating, summary, outcomes, tags, for_majors, cover_hue)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [code, title, track, category, level, hours, learners, (4.3 + rnd() * 0.6).toFixed(1), summary,
       [`掌握${track}领域核心知识体系`, `具备解决实际工程问题的能力`, `可衔接对应方向华为认证考试`],
       tags, ['计算机科学与技术', '软件工程', '人工智能', '网络工程', '物联网工程'], hue]
    );
    courseIds[code] = rows[0].id;
    // 生成课时
    const chapters = chapterNames[category];
    let idx = 1;
    for (let c = 0; c < chapters.length; c++) {
      const count = int(2, 3);
      for (let i = 0; i < count; i++) {
        const kind = i === count - 1 && c === chapters.length - 1 ? 'quiz' : (rnd() > 0.7 ? 'lab' : 'video');
        await q(
          `INSERT INTO lessons (course_id, idx, chapter, title, minutes, kind) VALUES ($1,$2,$3,$4,$5,$6)`,
          [rows[0].id, idx, chapters[c], `${chapters[c].slice(0, 2)}·${['认识与准备', '关键机制', '典型场景', '动手实验', '案例分析', '阶段测验'][i % 6]}${idx}`, int(20, 55), kind]
        );
        idx++;
      }
    }
  }

  // ============ 用户 ============
  async function addUser(name, email, extra = {}) {
    const { rows } = await q(
      `INSERT INTO users (name, email, phone, password_hash, realname_verified, real_name, school_id, major, grade, student_no, employer_id, bio)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [name, email, extra.phone || '138' + String(int(10000000, 99999999)), pwd,
       extra.realname ?? true, extra.real_name || name, extra.school_id ?? null, extra.major ?? null,
       extra.grade ?? null, extra.student_no ?? null, extra.employer_id ?? null, extra.bio ?? null]
    );
    for (const r of extra.roles || []) {
      await q(`INSERT INTO user_roles (user_id, role, status) VALUES ($1,$2,$3)`, [rows[0].id, r, extra.role_status || 'active']);
    }
    return rows[0].id;
  }

  const cuit = schoolIds['成都信息工程大学'];
  const studentId = await addUser('林晓澜', 'student@hw.dev', {
    school_id: cuit, major: '计算机科学与技术', grade: '2023级', student_no: '2023081127',
    roles: ['student'], bio: '目标：2027 届校招拿到生态企业数通/AI 方向 offer。',
  });
  const teacherId = await addUser('陈明远', 'teacher@hw.dev', {
    school_id: cuit, roles: ['teacher', 'school_admin'], role_status: 'active',
    bio: '网络空间安全学院副教授，HCAI 认证讲师，主讲计算机网络与信息安全。',
  });
  // 王建国（院管）与陈明远分开，展示多角色账号也行——这里给独立账号更清晰
  const adminId = await addUser('王建国', 'schooladmin@hw.dev', {
    school_id: cuit, roles: ['school_admin'], bio: '成都信息工程大学 ICT 学院办公室主任。',
  });

  // 企业
  const companyData = [
    ['软通动力', '软件与信息技术服务', '北京', 210, '华为核心生态伙伴，数字化服务覆盖十余个行业。', '20000+人'],
    ['神州数码集团', 'ICT 分销与云服务', '北京', 150, '国内领先的数字化转型合作伙伴与华为企业业务重要伙伴。', '10000+人'],
    ['华为云计算技术有限公司', '云计算', '贵阳', 8, '华为云技术研发与运营主体，贵安、乌兰察布等多地研发中心。', '10000+人'],
    ['中软国际', '软件与信息技术服务', '北京', 268, '鸿蒙生态与云智能业务重要参与者。', '60000+人'],
    ['深信服科技', '网络安全与云计算', '深圳', 130, '网络安全与云计算双引擎，高校安全大赛常年合作方。', '9000+人'],
    ['奇安信科技', '网络安全', '北京', 12, '政企安全领域头部企业。', '8000+人'],
    ['拓维信息', '软件与信息技术服务', '长沙', 30, '开鸿智谷（鸿蒙）与兆瀚（鲲鹏服务器）业务主体。', '5000+人'],
    ['润和软件', '金融科技与嵌入式', '南京', 190, '开源鸿蒙、HiSpark 生态重要贡献者。', '10000+人'],
    ['佳都科技', '人工智能与轨道交通', '广州', 265, '智慧地铁与 AI 识别方案提供商。', '4000+人'],
    ['东方国信', '大数据', '北京', 285, '企业级大数据与云平台服务商。', '5000+人'],
    ['广电运通', '智能终端与金融科技', '广州', 145, '智能金融设备与城市智能终端头部厂商。', '8000+人'],
    ['科大讯飞', '人工智能', '合肥', 355, '智能语音与人工智能平台型企业。', '10000+人'],
  ];
  const companyIds = {};
  for (const [name, industry, city, hue, intro, scale] of companyData) {
    const { rows } = await q(
      `INSERT INTO companies (name, industry, city, logo_hue, intro, scale) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [name, industry, city, hue, intro, scale]
    );
    companyIds[name] = rows[0].id;
  }
  const employerId = await addUser('苏婉晴', 'employer@hw.dev', {
    employer_id: companyIds['软通动力'], roles: ['employer'], bio: '软通动力校园招聘负责人（西南区）。',
  });
  const iascId = await addUser('郑浩', 'iasc@hw.dev', {
    roles: ['iasc'], bio: '华为授权 IASC（西南支持中心）运营经理。',
  });

  // 背景学生（成信大为主，供班级/看板/投递数据）
  const surnames = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦许何吕施张孔曹严华金魏陶姜'.split('');
  const given = ['雨桐', '子墨', '浩然', '欣怡', '梓萱', '俊杰', '思远', '梦琪', '天佑', '语嫣', '嘉懿', '煜城', '凌薇', '绍辉', '明轩', '雪见', '子骞', '睿婕', '晨曦', '志泽', '鹤骞', '芳菲', '越彬', '瑾瑜', '昊强'];
  const bgStudents = [];
  for (let i = 0; i < 42; i++) {
    const nm = pick(surnames) + pick(given);
    const id = await addUser(nm, `stu${String(i + 1).padStart(3, '0')}@stu.edu.cn`, {
      school_id: i % 6 === 5 ? schoolIds['重庆邮电大学'] : cuit,
      major: pick(['计算机科学与技术', '软件工程', '网络工程', '人工智能', '物联网工程', '数据科学与大数据技术']),
      grade: pick(['2022级', '2023级', '2024级', '2025级']),
      student_no: `2023${String(int(100000, 999999))}`,
      roles: ['student'],
    });
    bgStudents.push(id);
  }

  // ============ 林晓澜的学习旅程 ============
  async function enroll(userId, code, progress, status = 'learning') {
    await q(
      `INSERT INTO course_enrollments (user_id, course_id, status, progress, started_at, completed_at)
       VALUES ($1,$2,$3,$4, now() - ($5 || ' days')::interval, $6)`,
      [userId, courseIds[code], status, progress, String(int(20, 90)), status === 'completed' ? new Date() : null]
    );
  }
  await enroll(studentId, 'NET101', 100, 'completed');
  await enroll(studentId, 'DS201', 45);
  await enroll(studentId, 'AI101', 80);
  await enroll(studentId, 'ASC201', 12);
  for (const id of bgStudents.slice(0, 24)) {
    await enroll(id, pick(['NET101', 'DS201', 'AI101', 'AI201', 'CLD201', 'OS202', 'SEC201']), int(5, 100), rnd() > 0.4 ? 'learning' : 'completed');
  }

  // ============ 班级（学院自动关联 + 邀请码并存） ============
  const { rows: classRows } = await q(
    `INSERT INTO classes (course_id, teacher_id, school_id, name, term, invite_code, status, start_date, end_date, capacity)
     VALUES ($1,$2,$3,$4,$5,$6,'ongoing','2026-09-14','2026-12-25',60) RETURNING id`,
    [courseIds['NET101'], teacherId, cuit, '2026秋·计算机网络（华为班·网络工程专业）', '2026秋', 'HW2026NET', ]
  );
  const classId = classRows[0].id;
  await q(`INSERT INTO class_members (class_id, user_id, joined_via, progress) VALUES ($1,$2,'school',58)`, [classId, studentId]);
  for (const id of bgStudents.slice(0, 18)) {
    await q(`INSERT INTO class_members (class_id, user_id, joined_via, progress) VALUES ($1,$2,$3,$4)`,
      [classId, id, rnd() > 0.3 ? 'school' : 'invite_code', int(10, 95)]);
  }
  const { rows: class2 } = await q(
    `INSERT INTO classes (course_id, teacher_id, school_id, name, term, invite_code, status, start_date, end_date, capacity)
     VALUES ($1,$2,$3,$4,$5,$6,'upcoming','2027-02-24','2027-06-20',45) RETURNING id`,
    [courseIds['SEC201'], teacherId, cuit, '2027春·网络与信息安全（华为班）', '2027春', 'HW2027SEC']
  );

  // ============ 考券与考试 ============
  async function addVoucher(code, kind, certName, status, ownerId, source, expires, note) {
    await q(`INSERT INTO vouchers (code, kind, cert_id, status, owner_id, source, expires_at, note)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [code, kind, certIds[certName], status, ownerId, source, expires, note]);
  }
  // 学院可用配额（供院管发放 / 学生申请）
  for (let i = 0; i < 8; i++) addVoucher(`HWV26-CUIT-${String(1000 + i)}`, '数字考券', pick(['HCIA-Datacom', 'HCIA-AI', 'HCIA-Cloud Service', 'HCIA-Security', 'HCIA-Computing']), 'available', null, '学院配额', '2027-06-30', '2026学年学院配额');
  await addVoucher('HWV26-LIN-7781', '数字考券', 'HCIA-Datacom', 'claimed', studentId, '学院配额', '2027-01-15', '已绑定，预约考试后自动核销');
  await addVoucher('HWV25-LIN-3306', '数字考券', 'HCIA-AI', 'used', studentId, '学院配额', '2026-08-30', '2026-06-14 已核销（HCIA-AI 考试）');
  // 进行中的考券申请（给统一追踪演示）
  await q(`INSERT INTO voucher_requests (user_id, cert_id, reason, status, created_at)
           VALUES ($1,$2,$3,'submitted', now() - interval '2 days')`,
    [studentId, certIds['HCIP-Datacom'], '已通过 HCIA-Datacom（成绩 782/1000），计划 2027 年 3 月考 HCIP，申请学院配额考券。']);
  // 已完成的历史申请
  await q(`INSERT INTO voucher_requests (user_id, cert_id, reason, status, created_at, reviewed_at, reviewer_note)
           VALUES ($1,$2,$3,'issued', now() - interval '150 days', now() - interval '146 days', '符合学院奖学金配额条件，已发放。')`,
    [studentId, certIds['HCIA-AI'], '课程 AI101/AI201 均分 92，申请首考考券。']);

  // 考试预约与证书
  const { rows: examRows } = await q(
    `INSERT INTO exam_appointments (user_id, cert_id, voucher_id, exam_date, city, venue, status, created_at)
     VALUES ($1,$2,NULL,'2026-12-05','成都','Pearson VUE 成都考试中心（高新区天府五街）','booked', now() - interval '3 days') RETURNING id`,
    [studentId, certIds['HCIA-Datacom']]
  );
  await q(`INSERT INTO user_certificates (user_id, cert_id, serial, score, earned_at) VALUES ($1,$2,$3,$4, now() - interval '150 days')`,
    [studentId, certIds['HCIA-AI'], 'HCIA-AI-2026-0614-88213', 782]);

  // ============ 大赛 ============
  const { rows: contestRows } = await q(
    `INSERT INTO contests (name, season, status, reg_start, reg_end, intro, entry_count)
     VALUES ('华为ICT大赛','第十一届','registering','2026-09-01','2026-12-20','面向全球高校的年度赛事，以赛促学、以赛选才。中国区纳入全国普通高校大学生竞赛榜单。',187560) RETURNING id`
  );
  const contestId = contestRows[0].id;
  const trackDefs = [
    ['实践赛-网络', '个人', 1, '数通方向全流程实战，省资格赛线上进行。', ['校赛', '省赛初赛', '省赛复赛', '全国总决赛', '全球总决赛']],
    ['实践赛-云', '个人', 1, '云服务与云原生方向实战。', ['校赛', '省赛初赛', '省赛复赛', '全国总决赛', '全球总决赛']],
    ['实践赛-基础软件', '个人', 1, 'openEuler/openGauss/仓颉方向实战。', ['校赛', '省赛初赛', '省赛复赛', '全国总决赛', '全球总决赛']],
    ['创新赛', '团队', 3, '围绕昇腾/鸿蒙/云的自主创新作品赛。', ['初赛', '中国总决赛', '全球总决赛']],
    ['教学赛', '团队', 2, '产教融合教学能力赛（教师组）。', ['初赛', '总决赛']],
    ['挑战赛', '团队', 3, '昇腾+鲲鹏性能调优挑战。', ['初赛', '总决赛']],
    ['编程赛', '个人', 1, '仓颉语言编程能力赛。', ['初赛', '复赛', '总决赛']],
  ];
  const trackIds = {};
  for (const [name, mode, size, desc, stages] of trackDefs) {
    const { rows } = await q(
      `INSERT INTO contest_tracks (contest_id, name, entry_mode, team_size, description, stages) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [contestId, name, mode, size, desc, stages]
    );
    trackIds[name] = rows[0].id;
  }
  // 林晓澜的参赛（实践赛-网络，已晋级省赛）
  const { rows: entryRows } = await q(
    `INSERT INTO contest_entries (track_id, user_id, school_id, status, stage_idx, created_at)
     VALUES ($1,$2,$3,'provincial',2, now() - interval '28 days') RETURNING id`,
    [trackIds['实践赛-网络'], studentId, cuit]
  );
  const entryId = entryRows[0].id;
  for (const id of bgStudents.slice(18, 30)) {
    await q(`INSERT INTO contest_entries (track_id, user_id, school_id, status, stage_idx, created_at)
             VALUES ($1,$2,$3,$4,$5, now() - interval '25 days')`,
      [pick(Object.values(trackIds)), id, cuit, pick(['submitted', 'qualified', 'provincial', 'eliminated']), int(0, 2)]);
  }

  // ============ 双选会与岗位 ============
  const { rows: fair1 } = await q(
    `INSERT INTO job_fairs (name, city, venue, fair_date, end_date, status, booths, companies_count, jobs_count, intro, highlights, cover_hue)
     VALUES ('2026 西南 ICT 人才联盟双选会·成都站','成都','世纪城新国际会展中心 6 号馆','2026-11-28','2026-11-29','registering',120,86,3240,
     '华为联合 86 家生态企业汇聚成都，覆盖数通、云计算、AI、安全、鲲鹏全技术栈岗位，现场设认证咨询台与简历门诊。',
     ARRAY['86 家华为生态企业现场招聘','3240 个岗位，其中校招岗 1800+','认证持证者专属快速通道','免费往返班车（成信大/电子科大/川大）'],8) RETURNING id`
  );
  const { rows: fair2 } = await q(
    `INSERT INTO job_fairs (name, city, venue, fair_date, end_date, status, booths, companies_count, jobs_count, intro, highlights, cover_hue)
     VALUES ('2026 华中 ICT 人才双选会·武汉站','武汉','武汉国际会展中心','2026-12-12',NULL,'upcoming',80,52,1900,
     '聚焦光通信、网络安全与云计算方向，武汉理工、华科等 9 所高校联合组织。',
     ARRAY['52 家生态企业','1900 个岗位','学长学姐分享会'],200) RETURNING id`
  );
  await q(
    `INSERT INTO job_fairs (name, city, venue, fair_date, end_date, status, booths, companies_count, jobs_count, intro, highlights, cover_hue)
     VALUES ('2026 秋华东 ICT 人才双选会·杭州站','杭州','杭州国际博览中心','2026-10-17','2026-10-18','finished',95,61,2400,
     '已举办。现场签约 412 人，简历投递 5800 份。', ARRAY['61 家企业','现场签约 412 人'],150)`
  );
  await q(`INSERT INTO fair_registrations (fair_id, user_id, session, status, created_at) VALUES ($1,$2,'上午场','registered', now() - interval '5 days')`,
    [fair1[0].id, studentId]);
  for (const id of bgStudents.slice(0, 20)) {
    await q(`INSERT INTO fair_registrations (fair_id, user_id, session, status, created_at) VALUES ($1,$2,$3,$4, now() - interval '6 days')
             ON CONFLICT DO NOTHING`, [fair1[0].id, id, pick(['上午场', '下午场']), rnd() > 0.5 ? 'registered' : 'checked_in']);
  }

  const jobDefs = [
    ['软通动力', '数通工程师（2027 届校招）', '校招', '成都', '15-25K·14薪', 30, '掌握 TCP/IP、OSPF/BGP；HCIA-Datacom 及以上优先；能承受客户现场驻场。', '负责华为数通产品线的网络方案设计与交付实施，参与金融/政企客户项目。', ['HCIA-Datacom', '2027届', '五险一金']],
    ['软通动力', 'AI 应用开发工程师（2027 届校招）', '校招', '成都', '18-30K·14薪', 20, '熟悉 PyTorch/MindSpore；了解昇腾 CANN 优先；有完整模型部署项目经验。', '基于昇腾算力开发行业 AI 应用，参与模型微调、推理优化与交付。', ['昇腾', 'MindSpore', '2027届']],
    ['深信服科技', '网络安全服务工程师（校招）', '校招', '成都', '14-22K·15薪', 15, '理解常见 Web 漏洞原理；HCIA-Security 优先；接受全国派驻。', '安全应急响应、渗透测试与安全加固服务交付。', ['HCIA-Security', '导师制']],
    ['华为云计算技术有限公司', '云原生开发实习生', '实习', '贵阳', '300-400元/天', 8, '熟悉 K8s 与容器原理；Go/Java 至少一门；可实习 6 个月以上。', '参与华为云容器服务核心模块开发与测试。', ['转正机会', '华为云']],
    ['神州数码集团', '云计算售前工程师（校招）', '校招', '北京', '12-20K·13薪', 12, '沟通表达出色；理解云计算基本概念；HCIA-Cloud 优先。', '面向政企客户的云方案讲解、投标支持与 POC 设计。', ['HCIA-Cloud', '售前方向']],
    ['拓维信息', '鲲鹏开发工程师（校招）', '校招', '长沙', '13-22K·14薪', 10, '了解 ARM 架构与 Linux 系统；有鲲鹏 DevKit 使用经验优先。', '鲲鹏原生应用开发与移植适配，参与行业解决方案落地。', ['鲲鹏', '兆瀚服务器']],
    ['润和软件', '鸿蒙应用开发实习生', '实习', '南京', '260-350元/天', 15, '掌握 ArkTS 或仓颉语言；有 HarmonyOS 应用开发课程项目。', '开源鸿蒙行业设备应用开发，导师一对一带教。', ['开源鸿蒙', '转正机会']],
    ['奇安信科技', '安全攻防工程师（校招）', '校招', '北京', '16-26K·14薪', 8, '熟悉渗透测试流程；CTF 竞赛获奖或 HCIA-Security 优先。', '红队攻防演练与漏洞研究。', ['攻防方向', 'CTF']],
    ['佳都科技', 'AI 算法工程师（2027 届校招）', '校招', '广州', '18-28K·14薪', 6, '熟悉目标检测/跟踪算法；有昇腾 Atlas 项目经验优先。', '轨道交通 AI 识别算法研发与落地优化。', ['CV方向', '昇腾Atlas']],
    ['中软国际', '仓颉语言开发工程师（校招）', '校招', '深圳', '15-25K·14薪', 9, '完成 CJ101/CJ201 课程或同等能力；热爱新语言生态。', '参与仓颉生态工具链与行业应用开发。', ['仓颉', '新生态']],
    ['东方国信', '大数据开发工程师（校招）', '校招', '北京', '14-24K·13薪', 7, '熟悉 Hadoop/Spark 生态；SQL 能力扎实。', '企业级大数据平台开发与数仓建设。', ['大数据']],
    ['广电运通', '嵌入式软件工程师（校招）', '校招', '广州', '13-21K·13薪', 6, '掌握 C/C++；了解 RTOS；有单片机课程项目。', '金融智能终端嵌入式软件开发。', ['嵌入式']],
  ];
  const jobIds = [];
  for (const [company, title, kind, city, salary, openings, req, duty, tags] of jobDefs) {
    const { rows } = await q(
      `INSERT INTO jobs (company_id, title, kind, city, salary, openings, requirement, duty, tags, status, posted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'open', now() - ($10 || ' days')::interval) RETURNING id`,
      [companyIds[company], title, kind, city, salary, openings, req, duty, tags, String(int(1, 20))]
    );
    jobIds.push(rows[0].id);
  }

  // 林晓澜的投递（两条进行中，演示统一进度）
  async function apply(jobId, userId, status, daysAgo, note) {
    const { rows } = await q(
      `INSERT INTO job_applications (job_id, user_id, status, stage_note, created_at, updated_at)
       VALUES ($1,$2,$3,$4, now() - ($5 || ' days')::interval, now() - ($6 || ' days')::interval)
       ON CONFLICT (job_id, user_id) DO UPDATE SET status = EXCLUDED.status
       RETURNING id`,
      [jobId, userId, status, note, String(daysAgo), String(Math.max(0, daysAgo - 2))]
    );
    return rows[0].id;
  }
  const appA = await apply(jobIds[0], studentId, 'written_test', 9, '已通过简历筛选，笔试时间：11月20日 19:00 线上');
  const appB = await apply(jobIds[1], studentId, 'screening', 4, '简历评估中');
  // 背景投递（供雇主 pipeline 与就业看板）
  const outcomeStats = ['submitted', 'screening', 'written_test', 'interview', 'offer', 'hired', 'rejected'];
  for (let i = 0; i < 46; i++) {
    await apply(pick(jobIds), pick(bgStudents), pick(outcomeStats), int(1, 30), null);
  }

  // ============ 院校入驻（旅程A） ============
  const applicantDc = await addUser('李文娟', 'apply@dcxy.edu.cn', {
    roles: ['school_admin'], role_status: 'pending',
  });
  const { rows: saRows } = await q(
    `INSERT INTO school_applications (applicant_id, school_name, province, city, contact_name, contact_title, contact_email, intent_tier, authorization_signed, status, created_at, updated_at)
     VALUES ($1,'云南大学滇池学院','云南省','昆明市','李文娟','信息学院教学副院长','liwj@dcxy.edu.cn','认证级',true,'material_review', now() - interval '9 days', now() - interval '6 days') RETURNING id`,
    [applicantDc]
  );
  await q(`UPDATE schools SET status='applying' WHERE id=$1`, [schoolIds['云南大学滇池学院']]);

  // ============ 追踪事件（统一进度时间线） ============
  async function te(entityType, entityId, userId, actorId, status, note, daysAgo) {
    await q(`INSERT INTO tracker_events (entity_type, entity_id, user_id, actor_id, status, note, created_at)
             VALUES ($1,$2,$3,$4,$5,$6, now() - ($7 || ' days')::interval)`,
      [entityType, entityId, userId, actorId, status, note, String(daysAgo)]);
  }
  await te('enrollment', courseIds['NET101'], studentId, null, 'learning', '报名课程《计算机网络（华为版）》', 62);
  await te('enrollment', courseIds['NET101'], studentId, null, 'completed', '完成全部章节与结课测验，成绩 93', 8);
  await te('enrollment', courseIds['AI101'], studentId, null, 'learning', '报名课程《AI 通识：从模型到智能体》', 40);
  await te('voucher_request', 2, studentId, null, 'issued', 'HCIA-AI 考券已发放至券包', 146);
  await te('voucher_request', 1, studentId, null, 'submitted', '提交 HCIP-Datacom 考券申请，等待学院审核', 2);
  await te('exam_appointment', examRows[0].id, studentId, null, 'booked', '预约 HCIA-Datacom 笔试：12月5日 成都·Pearson VUE 考试中心', 3);
  await te('contest_entry', entryId, studentId, null, 'submitted', '报名第十一届 ICT 大赛·实践赛-网络', 28);
  await te('contest_entry', entryId, studentId, null, 'qualified', '校赛成绩全校第 7，晋级省赛初赛', 12);
  await te('contest_entry', entryId, studentId, null, 'provincial', '省赛初赛已完成，等待出分', 1);
  await te('fair_registration', fair1[0].id, studentId, null, 'registered', '报名 2026 西南 ICT 人才联盟双选会·成都站（上午场）', 5);
  await te('job_application', appA, studentId, employerId, 'submitted', '投递软通动力·数通工程师', 9);
  await te('job_application', appA, studentId, employerId, 'screening', '简历通过初筛（HR 苏婉晴）', 7);
  await te('job_application', appA, studentId, employerId, 'written_test', '进入笔试环节：11月20日 19:00 线上考场', 3);
  await te('job_application', appB, studentId, employerId, 'submitted', '投递软通动力·AI 应用开发工程师', 4);
  await te('job_application', appB, studentId, employerId, 'screening', '简历评估中，预计 5 个工作日内反馈', 2);
  await te('school_application', saRows[0].id, applicantDc, null, 'submitted', '提交入驻资料与电子授权函', 9);
  await te('school_application', saRows[0].id, applicantDc, iascId, 'material_review', '材料评审中：IASC 已受理，核验授权函信息', 6);

  // ============ 通知与公告 ============
  const notifs = [
    [studentId, 'todo', 'HCIA-Datacom 考试还有 20 天', '12月5日 14:00·Pearson VUE 成都考试中心。请提前完成考前须知阅读与证件准备。', '/my/exams'],
    [studentId, 'todo', '完成《AI 通识》剩余 20% 章节', '完成后可解锁结课证书申请。', '/my/courses'],
    [studentId, 'message', '软通动力·数通工程师：进入笔试', '笔试时间 11月20日 19:00，线上考场链接将在考前 1 小时开放。', '/my/applications'],
    [studentId, 'message', 'ICT 大赛省赛初赛已完成出分等待', '预计 11月18日 公布晋级名单。', '/my/contests'],
    [studentId, 'message', '考券申请已提交', 'HCIP-Datacom 考券申请等待学院审核，可在进度中心查看。', '/my/applications'],
    [studentId, 'announcement', '西南双选会新增 12 家企业', '华为云、深信服等 12 家企业确认参展，岗位更新至 3240 个。', '/fairs'],
    [studentId, 'announcement', '11 月昇腾实训营报名开启', '企业导师带队，优秀学员获生态企业实习直通卡。', '/courses'],
    [adminId, 'todo', '1 笔考券申请待审核', '林晓澜申请 HCIP-Datacom 考券，理由：HCIA 已过（782 分）。', '/school/quota'],
    [adminId, 'message', '本月学院数据周报已生成', '学生学习时长环比 +12%，认证通过率 71%。', '/school'],
    [teacherId, 'todo', '《计算机网络（华为班）》3 份结课测验待批阅', '第 4 章·阶段测验有 3 份待批阅。', '/teach'],
    [employerId, 'todo', '9 份新简历待筛选', '数通工程师岗位新增 9 份简历，最早投递已 3 天。', '/employer/pipeline'],
    [iascId, 'todo', '滇池学院入驻材料待评审', '授权函电子签已核验通过，等待分级初评。', '/iasc'],
  ];
  for (const [uid, kind, title, body, link] of notifs) {
    await q(`INSERT INTO notifications (user_id, kind, title, body, link, read, created_at)
             VALUES ($1,$2,$3,$4,$5,$6, now() - ($7 || ' hours')::interval)`,
      [uid, kind, title, body, link, kind === 'message' && rnd() > 0.6, String(int(1, 72))]);
  }
  const anns = [
    ['平台公告', '2026 秋季学期华为认证考试安排发布', '本学期西南区新增成都、重庆 2 个 VUE 考点周末场次；HCIE 实验考位 12 月起开放预约。'],
    ['大赛', '第十一届 ICT 大赛省赛晋级规则', '省赛初赛按赛区成绩前 40% 晋级复赛；复赛为线上实验，成绩计入全国总决赛遴选。'],
    ['活动', '11 月昇腾实训营（企业导师制）报名开启', '8 周企业级项目实训，优秀学员获生态企业实习直通卡，结营答辩 12 月 26 日。'],
  ];
  for (const [category, title, body] of anns) {
    await q(`INSERT INTO announcements (title, category, body, published_at) VALUES ($1,$2,$3, now() - ($4 || ' days')::interval)`,
      [title, category, body, String(int(0, 10))]);
  }

  // ============ 成功案例（结构化成长节点 + 去向） ============
  const storyData = [
    ['从通识课到全球总决赛领奖台', '赵梓墨', '重庆邮电大学', '实践赛-网络', '第十届全球总决赛二等奖', '深信服科技 · 安全服务工程师（2026 届）',
      '大一从 AI 通识课入门，大三站上全球总决赛领奖台，认证和大赛的经历让我在秋招拿到了 4 个 offer。',
      '我是通信工程专业，大一偶然选了《AI 通识》，从此每周泡在课程实验里。大二加入学校华为班系统学习数通，学院考券让我第一次认证考试没花一分钱——HCIA-Datacom 862 分。大三组队参加 ICT 大赛，省赛复赛的排错题我们练了不下 30 遍，最终拿到全球总决赛二等奖。秋招时深信服的面试官直接翻我的成长档案：「全球二等奖 + HCIP，简历不用多说了」。',
      ['AI 通识课入门', '华为班系统学习', 'HCIA-Datacom 862 分', '省赛复赛备赛', '全球总决赛二等奖', '深信服 offer'], 2026],
    ['鲲鹏方向的第一届毕业生', '李思远', '成都信息工程大学', '实践赛-云', '省赛一等奖', '软通动力 · 鲲鹏开发工程师（2026 届）',
      '学校成为鲲鹏产业学院共建方后，我把方向从 Java 后端转到了鲲鹏生态，毕业时这个决定被证明是对的。',
      '2023 年学校挂牌鲲鹏产业学院，我报名了第一届《鲲鹏应用移植与调优》。x86 到 ARM 的移植课比想象中硬核，性能调优报告改了 7 稿。大三在昇腾实训营做了 8 周企业项目，拿到实习直通卡。毕设做的是鲲鹏集群的基准测试平台，答辩时企业导师直接给了转正意向。',
      ['首届鲲鹏方向学员', '实训营实习直通', '省赛一等奖', '毕设企业级课题', '转正意向'], 2026],
    ['双选会上的 15 分钟', '周梦琪', '武汉理工大学', '实践赛-基础软件', null, '中软国际 · 仓颉语言开发工程师（2026 届）',
      '在成都双选会上，我在中软国际展位排了 15 分钟队，面试官扫了我的成长档案当场加了面试。',
      '本来说好去武汉的场次，看到成都站岗位多就过来了。排到中软国际展位时特别紧张，面试官扫了我胸牌上的二维码——课程成绩、HCIA-openEuler、大赛省赛记录全在档案里，他只问了一个问题：「仓颉的课程项目是你自己写的吗」。两周后 offer 到了。',
      ['HCIA-openEuler', '成都双选会现场面试', '两周拿 offer'], 2026],
  ];
  for (const [title, name, school, track, award, outcome, quote, story, milestones, year] of storyData) {
    await q(
      `INSERT INTO stories (title, student_name, school_name, track, award, outcome, quote, story, milestone, year)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [title, name, school, track, award, outcome, quote, story, milestones, year]
    );
  }

  // 简历（成长档案）
  await q(`INSERT INTO resumes (user_id, intention, skills, awards) VALUES ($1,$2,$3,$4)`,
    [studentId, '数通/AI 方向·2027 届校招·意向城市成都/深圳',
     ['HCIA-AI（782 分）', 'HCIA-Datacom 备考中', 'ICT 大赛实践赛-网络 省赛进行中', '计算机网络（华为班）成绩 93'],
     ['2026 校二等奖学金', '校赛第 7 晋级省赛']]);

  // 汇总
  const counts = {};
  for (const t of ['schools', 'users', 'courses', 'lessons', 'certifications', 'vouchers', 'jobs', 'job_fairs', 'companies', 'contest_entries', 'job_applications', 'tracker_events', 'notifications']) {
    const { rows } = await q(`SELECT count(*)::int AS c FROM ${t}`);
    counts[t] = rows[0].c;
  }
  console.log('种子数据完成:', counts);
  await pool.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
