
export function pxToRem(number, baseNumber = 16) {
  return `${number / baseNumber}rem`;
}

export function hexToRgb(color) {
  
  let hex = color.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

export function rgba(color, opacity) {
  return `rgba(${hexToRgb(color)}, ${opacity})`;
}

export function linearGradient(color, colorState, angle = 310) {
  return `linear-gradient(${angle}deg, ${color}, ${colorState})`;
}

export function boxShadowFn(offset = [], radius = [], color, opacity, inset = '') {
  const [x, y] = offset;
  const [blur, spread] = radius;
  return `${inset} ${pxToRem(x)} ${pxToRem(y)} ${pxToRem(blur)} ${pxToRem(spread)} ${rgba(color, opacity)}`;
}