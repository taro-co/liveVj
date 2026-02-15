/**
 * Phase 3: EffectComposer ＋ ブルーム / トレイル / ワープ / グリッチ / 色収差
 * - トレイルは前フレーム用 RT を保持し、1 フレーム遅れでブレンド
 * - resize 時に Composer と各 Pass の setSize を呼ぶ
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/ShaderPass.js';
import { FullScreenQuad } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/Pass.js';
import { TrailShader } from './trailShader.js';
import { WarpShader } from './warpShader.js';
import { GlitchShader } from './glitchShader.js';
import { ChromaticAberrationShader } from './aberrationShader.js';

/** 前フレームを保持するトレイル用の ShaderPass 拡張 */
class TrailPass extends ShaderPass {
  constructor(width, height) {
    super(TrailShader);
    this.previousTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });
    this._copyQuad = new FullScreenQuad(new THREE.MeshBasicMaterial());
  }

  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    this.uniforms.tPrevious.value = this.previousTarget.texture;
    this.uniforms.tDiffuse.value = readBuffer.texture;
    super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    this._blit(renderer, writeBuffer, this.previousTarget);
  }

  _blit(renderer, source, target) {
    this._copyQuad.material.map = source.texture;
    this._copyQuad.material.needsUpdate = true;
    renderer.setRenderTarget(target);
    this._copyQuad.render(renderer);
    renderer.setRenderTarget(null);
  }

  setSize(width, height) {
    this.previousTarget.setSize(width, height);
  }

  dispose() {
    this.previousTarget.dispose();
    this._copyQuad.dispose();
  }
}

export class EffectSystem {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const resolution = new THREE.Vector2(w, h);

    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    this.bloomPass = new UnrealBloomPass(resolution.clone(), 0.8, 0.4, 0.85);
    this.bloomPass.enabled = false;
    this.composer.addPass(this.bloomPass);

    this.trailPass = new TrailPass(w, h);
    this.trailPass.enabled = false;
    this.composer.addPass(this.trailPass);

    this.warpPass = new ShaderPass(WarpShader);
    this.warpPass.enabled = false;
    this.composer.addPass(this.warpPass);

    this.glitchPass = new ShaderPass(GlitchShader);
    this.glitchPass.enabled = false;
    this.composer.addPass(this.glitchPass);

    this.aberrationPass = new ShaderPass(ChromaticAberrationShader);
    // Ensure the uniform value is a Vector2 instance — assign directly to avoid
    // cases where the existing value doesn't expose `.set()`.
    this.aberrationPass.uniforms.uResolution.value = new THREE.Vector2(w, h);
    this.aberrationPass.enabled = false;
    this.composer.addPass(this.aberrationPass);
  }

  update(params, effectState, time) {
    const qualityOverride = effectState.qualityDisableTrailWarp === true;
    this.bloomPass.enabled = effectState.setA;
    this.trailPass.enabled = effectState.setA && !qualityOverride;
    this.warpPass.enabled = effectState.setA && !qualityOverride;
    this.glitchPass.enabled = effectState.setB;
    this.aberrationPass.enabled = effectState.setB;

    this.bloomPass.strength = params.bloomStrength ?? 0.8;
    this.trailPass.uniforms.uStrength.value = params.trailStrength ?? 0;
    this.warpPass.uniforms.uStrength.value = params.warpStrength ?? 0;
    this.glitchPass.uniforms.uStrength.value = params.glitchStrength ?? 0;
    this.glitchPass.uniforms.uTime.value = time;
    this.aberrationPass.uniforms.uStrength.value = params.aberrationStrength ?? 0;
  }

  render() {
    this.composer.render();
  }

  resize(width, height) {
    this.composer.setSize(width, height);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.bloomPass.resolution.set(width, height);
    this.bloomPass.setSize(width, height);
    this.trailPass.setSize(width, height);
    this.aberrationPass.uniforms.uResolution.value = new THREE.Vector2(width, height);
  }
}
