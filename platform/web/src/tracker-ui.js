// 统一追踪的前端注册表镜像：标签/步骤文案走 i18n 目录（tracker.*）。
// 数组消息（steps）用 tm() 取原始数组；组件内传入 useI18n() 的 t/tm 以保持语言切换的响应性。
export function trackerLabel(t, type) {
  return t(`tracker.${type}`);
}
export function trackerSteps(tm, type) {
  const v = tm(`tracker.steps.${type}`);
  return (Array.isArray(v) ? v : []).map((x) => String(x));
}
export const TRACKER_ROUTE = {
  job_application: '/my/applications',
  voucher_request: '/my/vouchers',
  contest_entry: '/my/contests',
  fair_registration: '/my/fairs',
  school_application: '/onboarding/mine',
  exam_appointment: '/my/exams',
  enrollment: null, // 动态：/my/courses/{id}/learn
};
