/**
 * Phase 3: レイヤー（表示 ON/OFF ＋ 不透明度）
 * - 1 レイヤー = 1 パーティクルシステム（将来は複数可）
 * - フェードは requestAnimationFrame で easeInOutCubic
 */

export class Layer {
  constructor(id, scene) {
    this.id = id;
    this.scene = scene;
    this.enabled = id === 1;
    this.opacity = 1.0;
    this.particleSystem = null;
  }

  setParticleSystem(system) {
    this.particleSystem = system;
    // 既に main で scene に追加済みのため、ここでは参照のみ保持
  }

  setOpacity(value) {
    this.opacity = Math.max(0, Math.min(1, value));
    if (this.particleSystem && this.particleSystem.material) {
      this.particleSystem.material.opacity = this.opacity;
      if (this.particleSystem.points) this.particleSystem.points.visible = this.opacity > 0.001;
    }
  }

  fadeIn(duration = 0.5) {
    if (this.particleSystem && this.particleSystem.points) this.particleSystem.points.visible = true;
    return this.fade(0, 1, duration);
  }

  fadeOut(duration = 0.5) {
    return this.fade(1, 0, duration);
  }

  fade(from, to, duration) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const animate = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1.0);
        const t = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        this.setOpacity(from + (to - from) * t);
        if (progress < 1.0) requestAnimationFrame(animate);
        else {
          this.enabled = to > 0;
          if (this.particleSystem && this.particleSystem.points) {
            this.particleSystem.points.visible = to > 0;
          }
          resolve();
        }
      };
      animate();
    });
  }
}
