import { COLOR_CYCLE } from '../config/params.js';

/**
 * 60秒で1周する自動色サイクル。
 * - 計算は軽量（フレーム毎に少数の算術のみ）
 * - 返り値は [r,g,b]（0..1）で、Three.js の uniform(vec3) にそのまま渡せる
 */
export class ColorCycle {
  constructor(config = COLOR_CYCLE) {
    this.config = config;
  }

  getCurrentColorRGB(time) {
    return this.update(time);
  }

  /**
   * @param {number} elapsedTimeSeconds
   * @returns {[number, number, number]} rgb (0..1)
   */
  update(elapsedTimeSeconds) {
    const { duration, keyframes } = this.config;
    const t = ((elapsedTimeSeconds % duration) / duration + 1.0) % 1.0;

    // 2点補間（keyframes は昇順、最後は time=1.0 を想定）
    let k0 = keyframes[0];
    let k1 = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      const a = keyframes[i];
      const b = keyframes[i + 1];
      if (t >= a.time && t <= b.time) {
        k0 = a;
        k1 = b;
        break;
      }
    }

    const span = Math.max(1e-6, k1.time - k0.time);
    const lt = (t - k0.time) / span;

    const hsl0 = k0.hsl;
    const hsl1 = k1.hsl;

    // Hue は循環するが、Phase1は指定キーフレームが近いので単純補間で十分
    const h = lerp(hsl0[0], hsl1[0], lt);
    const s = lerp(hsl0[1], hsl1[1], lt);
    const l = lerp(hsl0[2], hsl1[2], lt);

    return hslToRgb01(h, s, l);
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * HSL(度/%) -> RGB(0..1)
 * @param {number} hDeg 0..360
 * @param {number} sPct 0..100
 * @param {number} lPct 0..100
 * @returns {[number, number, number]}
 */
function hslToRgb01(hDeg, sPct, lPct) {
  let h = ((hDeg % 360) + 360) % 360;
  h /= 360;
  const s = clamp01(sPct / 100);
  const l = clamp01(lPct / 100);

  if (s === 0) return [l, l, l];

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);
  return [r, g, b];
}

function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

