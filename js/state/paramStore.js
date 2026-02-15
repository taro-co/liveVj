/**
 * Phase 2: パラメータストア（平滑化）
 * - MIDI/Keyboardの急峻な入力を指数減衰でならす
 * - 毎フレーム new を避け、GC負荷を増やさない
 */

export class SmoothedValue {
  constructor(initialValue, smoothness = 0.15) {
    this.current = initialValue;
    this.target = initialValue;
    this.smoothness = smoothness; // 0.1=遅い, 0.3=速い
  }

  setTarget(value) {
    this.target = value;
  }

  setValue(value) {
    this.current = value;
    this.target = value;
  }

  update(deltaTimeSeconds = 1.0) {
    // 60fps基準で指数減衰（deltaTime変動でも体感が安定しやすい）
    const factor = 1.0 - Math.pow(1.0 - this.smoothness, deltaTimeSeconds * 60);
    this.current += (this.target - this.current) * factor;
    return this.current;
  }
}

export class ParamStore {
  constructor() {
    // パーティクル関連
    this.particleCount = new SmoothedValue(100000, 0.1); // 粒子数はゆっくり
    this.hue = new SmoothedValue(0.0, 0.15); // 0..1
    this.saturation = new SmoothedValue(0.0, 0.15); // 0..1（0で白）
    this.lightness = new SmoothedValue(0.9, 0.15); // 0.2..1.0
    this.rotationX = new SmoothedValue(0.001, 0.2); // rad/frame
    this.rotationY = new SmoothedValue(0.002, 0.2);
    this.noiseStrength = new SmoothedValue(0.2, 0.1); // 0..1
    this.colorCycleSpeed = new SmoothedValue(1.0, 0.1); // 0.5..2.0

    // Phase 3 用（ここでは値だけ保持）
    this.bloomStrength = new SmoothedValue(0.8, 0.2);
    this.trailStrength = new SmoothedValue(0.0, 0.15);
    this.warpStrength = new SmoothedValue(0.0, 0.15);
    this.glitchStrength = new SmoothedValue(0.0, 0.15);
    this.aberrationStrength = new SmoothedValue(0.0, 0.15);
  }

  updateAll(deltaTimeSeconds) {
    for (const key in this) {
      const v = this[key];
      if (v instanceof SmoothedValue) v.update(deltaTimeSeconds);
    }
  }

  getValues() {
    // DebugUI用。毎フレームオブジェクト生成になるが小さいため許容。
    // Phase3で最適化が必要なら「固定オブジェクトに書き込み」に変更。
    const values = {};
    for (const key in this) {
      const v = this[key];
      if (v instanceof SmoothedValue) values[key] = v.current;
    }
    return values;
  }
}

export const INITIAL_STATE = {
  particleCount: 100000,
  hue: 0.0,
  saturation: 0.0,
  lightness: 0.9,
  rotationX: 0.001,
  rotationY: 0.002,
  noiseStrength: 0.2,
  colorCycleSpeed: 1.0,
  bloomStrength: 0.8,
  trailStrength: 0.0,
  warpStrength: 0.0,
  glitchStrength: 0.0,
  aberrationStrength: 0.0,
};

export const paramStore = new ParamStore();

