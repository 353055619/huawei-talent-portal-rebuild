// 统一进度追踪注册表 —— “一切状态皆可追踪”的架构核心。
// 经典问题：N 种申请/报名/投递各有状态机 → 通用解法：状态-步骤注册表 + 事件表 + 聚合查询。
// 每个域只需要：定义 steps 与 statusIndex 映射；进度 UI 由同一组件渲染。
export const TRACKERS = {
  job_application: {
    label: '岗位投递',
    steps: ['已投递', '简历筛选', '笔试', '面试', '录用'],
    statusIndex: { submitted: 0, screening: 1, written_test: 2, interview: 3, offer: 4, hired: 4 },
    failed: ['rejected'],
    icon: 'briefcase',
  },
  voucher_request: {
    label: '考券申请',
    steps: ['提交申请', '学院审核', '发放考券'],
    statusIndex: { submitted: 0, approved: 1, issued: 2 },
    failed: ['rejected'],
    icon: 'ticket',
  },
  contest_entry: {
    label: '大赛报名',
    steps: ['提交报名', '资格审核', '校赛', '省赛', '全国总决赛'],
    statusIndex: { submitted: 0, qualified: 1, provincial: 2, national: 3, awarded: 4 },
    failed: ['eliminated'],
    icon: 'trophy',
  },
  fair_registration: {
    label: '双选会报名',
    steps: ['报名成功', '现场签到', '参会完成'],
    statusIndex: { registered: 0, checked_in: 1, attended: 2 },
    failed: [],
    icon: 'users',
  },
  school_application: {
    label: '学院入驻',
    steps: ['提交资料', '材料评审', '签署协议', '分级评审', '正式挂牌'],
    statusIndex: { submitted: 0, material_review: 1, contract_signing: 2, tier_evaluation: 3, active: 4 },
    failed: ['rejected'],
    icon: 'building',
  },
  exam_appointment: {
    label: '考试预约',
    steps: ['预约成功', '参加考试', '获取成绩'],
    statusIndex: { booked: 0, finished: 1 },
    failed: ['cancelled'],
    icon: 'calendar-check',
  },
  enrollment: {
    label: '课程学习',
    steps: ['已报名', '学习中', '已结课'],
    statusIndex: { learning: 1, completed: 2 },
    failed: [],
    icon: 'book-open',
  },
};

export function trackerMeta(type, status) {
  const t = TRACKERS[type];
  if (!t) return null;
  const idx = t.statusIndex[status] ?? 0;
  return {
    type,
    label: t.label,
    icon: t.icon,
    steps: t.steps,
    current: idx,
    total: t.steps.length,
    failed: t.failed.includes(status),
    status,
  };
}
