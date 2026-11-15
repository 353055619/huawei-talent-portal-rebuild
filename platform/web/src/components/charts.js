// 纯 SVG 迷你图表：柱状 + 环形 + 漏斗条。数据可视化组件内联实现（无外部图表库）。
// 每个图表都有文本替代（aria-label + 可见数值标注）。
export function barPath(values, { w = 240, h = 80, gap = 8 } = {}) {
  const max = Math.max(...values, 1);
  const bw = (w - gap * (values.length - 1)) / values.length;
  return values.map((v, i) => ({
    x: i * (bw + gap),
    y: h - Math.max(3, (v / max) * h),
    w: bw,
    h: Math.max(3, (v / max) * h),
    v,
  }));
}

export function donutSegments(pairs, r = 40) {
  const total = pairs.reduce((s, p) => s + p[1], 0) || 1;
  let acc = 0;
  const C = 2 * Math.PI * r;
  return pairs.map(([color, v]) => {
    const seg = { color, v, dash: `${(v / total) * C} ${C}`, offset: -acc / total * C };
    acc += v;
    return seg;
  });
}
