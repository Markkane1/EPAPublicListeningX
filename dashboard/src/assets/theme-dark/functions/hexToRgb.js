import chroma from "chroma-js";

function hexToRgb(color) {
  try {
    const fn = typeof chroma === 'function' ? chroma : (chroma && chroma.default ? chroma.default : null);
    if (fn) {
      return fn(color).rgb().join(", ");
    }
  } catch (e) {
    
  }
  let hex = (color || '#000000').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16) || 0;
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

export default hexToRgb;