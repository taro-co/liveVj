/**
 * Phase 3: レイヤーマネージャー
 * - レイヤー1のみパーティクルシステムを保持（2/3 は将来用）
 * - 同一シーンに描画するため、表示制御は visibility / opacity で実施
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { Layer } from './layer.js';

export class LayerManager {
  /**
   * @param {THREE.Scene} mainScene - メインシーン（レイヤー1の描画先）
   * @param {import('../scenes/particleSphere.js').ParticleSphere} particleSystem - レイヤー1の粒子
   */
  constructor(mainScene, particleSystem) {
    this.layers = [
      new Layer(1, mainScene),
      new Layer(2, new THREE.Scene()),
      new Layer(3, new THREE.Scene()),
    ];
    this.layers[0].setParticleSystem(particleSystem);
    this.layers[1].enabled = false;
    this.layers[2].enabled = false;
  }

  toggleLayer(index) {
    const layer = this.layers[index];
    if (!layer) return;
    if (layer.enabled) {
      layer.fadeOut(0.5);
    } else {
      layer.fadeIn(0.5);
    }
  }
}
