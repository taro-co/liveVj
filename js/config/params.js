/**
 * Phase 1 パラメータ定義
 * - パフォーマンスのため、実行中にオブジェクト形状を変えない（参照を固定）
 * - setParticleCount は drawRange で制御し、Buffer を再生成しない
 */

export const PARTICLE_CONFIG = {
  initialCount: 100000,
  minCount: 10000,
  maxCount: 500000,
  sphereRadius: 2.5,
  minSize: 0.5,
  maxSize: 9.0,
  baseSize: 1.0,
  initialRotation: {
    // rad/frame を想定（update側で deltaTime から 60fps換算して適用）
    x: 0.001,
    y: 0.002,
  },
};

export const COLOR_CYCLE = {
  duration: 60, // seconds
  keyframes: [
    { time: 0.0, hsl: [0, 0, 100] },
    { time: 0.33, hsl: [200, 50, 80] },
    { time: 0.66, hsl: [220, 80, 40] },
    { time: 1.0, hsl: [0, 0, 100] },
  ],
};

export const NOISE_CONFIG = {
  strength: 0.2,
  frequency: 1.0,
  octaves: 3, // GLSL 側の固定ループ回数（Phase1は3固定）
  timeScale: 0.0005,
};

export const STAR_COLORS = [
  { name: 'Blue Giant',    temp: 30000, rgb: [0.61, 0.70, 1.00] },
  { name: 'White',         temp: 10000, rgb: [0.78, 0.85, 1.00] },
  { name: 'Sun-like',      temp: 7500,  rgb: [1.00, 0.98, 0.93] },
  { name: 'Yellow-White',  temp: 6000,  rgb: [1.00, 0.93, 0.76] },
  { name: 'Orange',        temp: 4000,  rgb: [1.00, 0.70, 0.47] }
];

export const CONSTELLATION_CONFIG = {
  colorDistribution: [0.15, 0.25, 0.35, 0.15, 0.10],
  brightness: {
    min: 0.3,
    max: 1.0,
    powerCurve: 2.5
  },
  twinkle: {
    enabled: true,
    speed: 2.0,
    intensity: 0.3,
    randomPhase: true
  },
  cycleBlend: {
    mode: 'overlay',
    starInfluence: 0.7,
    cycleInfluence: 0.3
  }
};

// 既存コード互換（必要なら使用）
export const params = {
  masterBrightness: 1.0,
};