// HueSquare：由色相生成的品牌方块（院校/企业 logo 占位，无 emoji、无外链图片）
export function hueColor(hue, s = 42, l = 46) {
  return `hsl(${hue} ${s}% ${l}%)`;
}
export function hueSoft(hue) {
  return `hsl(${hue} 45% 95%)`;
}
