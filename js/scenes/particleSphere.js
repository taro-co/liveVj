import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { PARTICLE_CONFIG, NOISE_CONFIG, STAR_COLORS, CONSTELLATION_CONFIG } from '../config/params.js';

/**
 * 10万〜50万粒子の球体（GPUシェーダーで発光＋ノイズ崩し）
 *
 * パフォーマンス方針:
 * - BufferGeometry/TypedArray は初期化時に一度だけ作成（updateで再生成しない）
 * - 粒子数変更は geometry.setDrawRange で制御（GPUバッファ維持）
 * - updateは uniform 更新と回転のみ（毎フレームのGCを避ける）
 */
export class ParticleSphere {
  constructor(scene, baseCount = PARTICLE_CONFIG.initialCount, config = PARTICLE_CONFIG) {
    this.scene = scene;
    this.config = config;
    this.noiseConfig = NOISE_CONFIG;

    this.baseCount = baseCount;
    this.minCount = config.minCount;
    this.maxCount = config.maxCount;
    this.desiredCount = clampInt(baseCount, this.minCount, this.maxCount);
    this.count = this.desiredCount;
    this.qualityScale = 1.0;

    this.geometry = null;
    this.material = null;
    this.points = null;
    this._indexArray = null;
    this._indexAttr = null;

    // Phase2: 回転/色/ノイズのリアルタイム制御
    this.rotationX = this.config.initialRotation.x; // rad/frame
    this.rotationY = this.config.initialRotation.y;
    this.noiseStrength = this.noiseConfig.strength;

    // HSL (0..1) を保持し、updateで time に応じて hue を回す
    this.hue = 0.0;
    this.saturation = 0.0;
    this.lightness = 0.9;
    this.colorCycleSpeed = 1.0; // 0.5..2.0

    // async 初期化（シェーダーファイルfetchのため）
    this.ready = this._init();
  }

  async _init() {
    const [vertexShader, fragmentShader] = await Promise.all([
      fetch('/shaders/particle.vert').then(r => r.text()),
      fetch('/shaders/particle.frag').then(r => r.text()),
    ]);

    // 最大数でBufferを確保しておく（後で増やしても再確保しない）
    const max = this.maxCount;
    const positions = new Float32Array(max * 3);

    // 新規追加: 星座用の属性バッファ
    this.colorIndices = new Uint8Array(max);
    this.brightnesses = new Float32Array(max);
    this.twinklePhases = new Float32Array(max);

    // フィボナッチ螺旋で球面に均等配置
    // https://stackoverflow.com/a/26127012 を元にした一般的な実装
    const radius = this.config.sphereRadius;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.399963

    for (let i = 0; i < max; i++) {
      const y = 1 - (i / (max - 1)) * 2; // 1..-1
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      const o = i * 3;
      positions[o + 0] = x * radius;
      positions[o + 1] = y * radius;
      positions[o + 2] = z * radius;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    // 色属性をBufferGeometryに追加
    this.geometry.setAttribute('colorIndex', new THREE.BufferAttribute(this.colorIndices, 1));
    this.geometry.setAttribute('brightness', new THREE.BufferAttribute(this.brightnesses, 1));
    this.geometry.setAttribute('twinklePhase', new THREE.BufferAttribute(this.twinklePhases, 1));

    // drawRange を「先頭N個」だけにすると、球の一部しか描かれない。
    // そこで index buffer で「maxCount から均等サンプリング」して、常に球全体を維持する。
    // WebGL2必須（Uint32 index を安全に扱える）
    this._indexArray = new Uint32Array(max);
    this._indexAttr = new THREE.BufferAttribute(this._indexArray, 1);
    this.geometry.setIndex(this._indexAttr);
    this._applyCount();

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Vector3(1, 1, 1) },
        uGlowStrength: { value: 1.0 },

        uNoiseStrength: { value: this.noiseStrength },
        uNoiseFrequency: { value: this.noiseConfig.frequency },
        uTimeScale: { value: this.noiseConfig.timeScale },

        uMinSize: { value: this.config.minSize },
        uMaxSize: { value: this.config.maxSize },
        uBaseSize: { value: this.config.baseSize },
        // 星座色関連
        uStarColors: { value: [] },
        uCycleColor: { value: new THREE.Vector3(1, 1, 1) },
        uStarInfluence: { value: CONSTELLATION_CONFIG.cycleBlend.starInfluence },
        uCycleInfluence: { value: CONSTELLATION_CONFIG.cycleBlend.cycleInfluence },
        uTwinkleSpeed: { value: CONSTELLATION_CONFIG.twinkle.speed },
        uTwinkleIntensity: { value: CONSTELLATION_CONFIG.twinkle.intensity },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // 初期化: 色属性をランダムに割り当て
    this.initializeStarColors();

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false; // バウンディング計算を避ける（粒子は常に描画対象にしたい）
    this.scene.add(this.points);
  }

  /**
   * @param {number} count
   */
  setParticleCount(count) {
    const c = clampInt(Math.round(count), this.minCount, this.maxCount);
    this.desiredCount = c;
    this._applyCount();
  }

  /**
   * QualityManager 用（0.4/0.6/0.8/1.0）
   * @param {number} scale
   */
  setQualityScale(scale) {
    const s = Math.min(1.0, Math.max(0.1, scale));
    if (s === this.qualityScale) return;
    this.qualityScale = s;
    this._applyCount();
  }

  /**
   * @param {[number, number, number]} rgb01
   */
  setColor(rgb01) {
    if (!this.material) return;
    const u = this.material.uniforms.uColor.value;
    u.set(rgb01[0], rgb01[1], rgb01[2]);
  }

  /**
   * Phase2: HSL直接制御（0..1）
   * - 色相は update() 内で「60秒で1周 × speed」で自動回転させる
   */
  setHSL(hue01, saturation01, lightness01) {
    this.hue = wrap01(hue01);
    this.saturation = clamp01(saturation01);
    this.lightness = clamp01(lightness01);
  }

  setColorCycleSpeed(speed) {
    this.colorCycleSpeed = Math.min(2.0, Math.max(0.0, speed));
  }

  setRotation(rotX, rotY) {
    this.rotationX = rotX;
    this.rotationY = rotY;
  }

  setNoiseStrength(strength01) {
    this.noiseStrength = clamp01(strength01);
    if (this.material) this.material.uniforms.uNoiseStrength.value = this.noiseStrength;
  }

  /**
   * @param {number} elapsedTimeSeconds
   * @param {number} deltaTimeSeconds
   */
  update(elapsedTimeSeconds, deltaTimeSeconds) {
    if (!this.material || !this.points) return;
    this.material.uniforms.uTime.value = elapsedTimeSeconds;

    // HSL -> RGB (CPU) は軽量。色相は60秒で1周（speedで倍率）
    const hueAuto = (elapsedTimeSeconds / 60.0) * this.colorCycleSpeed;
    const hue = wrap01(this.hue + hueAuto);
    const rgb = hsl01ToRgb01(hue, this.saturation, this.lightness);
    this.setColor(rgb);

    // rad/frame 指定を 60fps 換算で適用（フレームレートが変わっても速度が暴れにくい）
    const rotScale = deltaTimeSeconds * 60;
    this.points.rotation.x += this.rotationX * rotScale;
    this.points.rotation.y += this.rotationY * rotScale;
  }

  dispose() {
    if (this.points) this.scene.remove(this.points);
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    this.points = null;
    this.geometry = null;
    this.material = null;
    this._indexArray = null;
    this._indexAttr = null;
  }

  _updateIndexSampling(drawCount) {
    if (!this._indexArray || !this._indexAttr) return;
    const max = this.maxCount;
    const n = Math.max(1, Math.min(max, drawCount | 0));

    // i を 0..n-1 として、max から均等に拾う
    // （順序に意味はないので、単純な線形サンプリングで十分）
    for (let i = 0; i < n; i++) {
      this._indexArray[i] = Math.floor((i * max) / n);
    }

    this._indexAttr.needsUpdate = true;
  }

  _applyCount() {
    const scaled = clampInt(Math.round(this.desiredCount * this.qualityScale), this.minCount, this.maxCount);
    if (scaled === this.count && this.geometry) return;
    this.count = scaled;
    if (!this.geometry) return;
    this._updateIndexSampling(this.count);
    this.geometry.setDrawRange(0, this.count);
  }

  initializeStarColors() {
    const max = this.maxCount;
    const dist = CONSTELLATION_CONFIG.colorDistribution;
    const { min, max: bmax, powerCurve } = CONSTELLATION_CONFIG.brightness;

    for (let i = 0; i < max; i++) {
      const r = Math.random();
      let cumulative = 0;
      for (let j = 0; j < dist.length; j++) {
        cumulative += dist[j];
        if (r < cumulative) {
          this.colorIndices[i] = j;
          break;
        }
      }

      const brightRand = Math.random();
      this.brightnesses[i] = min + (bmax - min) * Math.pow(brightRand, powerCurve);

      this.twinklePhases[i] = CONSTELLATION_CONFIG.twinkle.randomPhase ? Math.random() : 0.0;
    }

    // mark attributes as needing update
    if (this.geometry) {
      this.geometry.getAttribute('colorIndex').needsUpdate = true;
      this.geometry.getAttribute('brightness').needsUpdate = true;
      this.geometry.getAttribute('twinklePhase').needsUpdate = true;
    }
  }
}

function clampInt(v, min, max) {
  return Math.max(min, Math.min(max, v | 0));
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

function wrap01(v) {
  v = v % 1.0;
  if (v < 0) v += 1.0;
  return v;
}

function hsl01ToRgb01(h, s, l) {
  // h,s,l: 0..1
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

