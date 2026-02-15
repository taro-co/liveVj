/**
 * Phase 1 パフォーマンス監視
 * - FPS: 3秒移動平均で表示（瞬間値のブレを抑える）
 * - Memory: Chrome の performance.memory がある場合のみログ
 * - Quality: 粒子数を drawRange で調整（Buffer再生成なし）
 */

export class FPSMonitor {
  constructor() {
    this.frames = [];
    this.displayElement = null;
  }

  update() {
    const now = performance.now();
    this.frames.push(now);

    // 3秒間のフレーム履歴だけ保持（配列が肥大化しない）
    const cutoff = now - 3000;
    while (this.frames.length && this.frames[0] < cutoff) this.frames.shift();

    const avgFPS = Math.round(this.frames.length / 3);
    return avgFPS;
  }

  render(fps) {
    if (!this.displayElement) this._mount();
    this.displayElement.textContent = `FPS: ${fps}`;
  }

  _mount() {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = '12px';
    el.style.top = '12px';
    el.style.zIndex = '10';
    el.style.padding = '6px 10px';
    el.style.background = 'rgba(0,0,0,0.35)';
    el.style.color = '#fff';
    el.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    el.style.fontSize = '14px';
    el.style.userSelect = 'none';
    el.style.pointerEvents = 'none';
    el.textContent = 'FPS: ...';
    document.body.appendChild(el);
    this.displayElement = el;
  }
}

export class MemoryMonitor {
  constructor() {
    this.lastLog = 0;
    this.logInterval = 1000;
  }

  update() {
    const now = performance.now();
    if (now - this.lastLog < this.logInterval) return;

    if (performance.memory) {
      const usedMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
      const limitMB = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
      console.log(`Memory: ${usedMB}MB / ${limitMB}MB (limit: 3072MB)`);
      if (usedMB > 3072) console.warn('⚠️ Memory usage exceeds 3GB limit!');
    } else {
      console.log('Memory API not available (use Chrome)');
    }

    this.lastLog = now;
  }
}

export class QualityManager {
  /**
   * @param {import('../scenes/particleSphere.js').ParticleSphere} particleSystem
   * @param {{ setA: boolean, setB: boolean, qualityDisableTrailWarp?: boolean }} [effectState]
   * @param {import('../effects/effectSystem.js').EffectSystem} [effectSystem]
   */
  constructor(particleSystem, effectState = null, effectSystem = null) {
    this.particleSystem = particleSystem;
    this.effectState = effectState;
    this.effectSystem = effectSystem;
    this.qualityLevel = 3; // 0..3
    this.lastAdjustTime = 0;
  }

  update(avgFPS) {
    const now = performance.now();
    if (now - this.lastAdjustTime < 5000) return;

    const base = this.particleSystem.baseCount;

    if (avgFPS < 30 && this.qualityLevel > 0) {
      this.qualityLevel = 0;
      this._applyScale(0.4, base);
      this.disableAllEffects();
      console.warn('⚠️ Quality: MINIMUM (40% particles, effects OFF)');
      this.lastAdjustTime = now;
    } else if (avgFPS < 40 && this.qualityLevel > 1) {
      this.qualityLevel = 1;
      this._applyScale(0.6, base);
      this.disableSomeEffects();
      console.warn('⚠️ Quality: LOW (60% particles, some effects OFF)');
      this.lastAdjustTime = now;
    } else if (avgFPS < 50 && this.qualityLevel > 2) {
      this.qualityLevel = 2;
      this._applyScale(0.8, base);
      console.warn('⚠️ Quality: MEDIUM (80% particles)');
      this.lastAdjustTime = now;
    } else if (avgFPS > 55 && this.qualityLevel < 3) {
      this.qualityLevel++;
      const scales = [0.4, 0.6, 0.8, 1.0];
      this._applyScale(scales[this.qualityLevel], base);
      if (this.qualityLevel === 3 && this.effectState && this.effectState.qualityDisableTrailWarp !== undefined) {
        this.effectState.qualityDisableTrailWarp = false;
      }
      console.log(`✓ Quality recovered to level ${this.qualityLevel}`);
      this.lastAdjustTime = now;
    }
  }

  disableAllEffects() {
    if (this.effectState) {
      this.effectState.setA = false;
      this.effectState.setB = false;
      if (this.effectState.qualityDisableTrailWarp !== undefined) this.effectState.qualityDisableTrailWarp = false;
    }
    console.warn('All effects disabled due to low FPS');
  }

  disableSomeEffects() {
    if (this.effectState) this.effectState.qualityDisableTrailWarp = true;
    if (this.effectSystem) {
      this.effectSystem.trailPass.enabled = false;
      this.effectSystem.warpPass.enabled = false;
    }
    console.warn('Some effects (trail/warp) disabled due to low FPS');
  }

  _applyScale(scale, base) {
    // Phase2: MIDIで粒子数を触るため、QualityManagerは「品質倍率」で制御する
    if (typeof this.particleSystem.setQualityScale === 'function') {
      this.particleSystem.setQualityScale(scale);
      return;
    }
    // 互換：旧API（粒子数を直接指定）
    this.particleSystem.setParticleCount(base * scale);
  }
}

