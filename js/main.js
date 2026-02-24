import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { createRenderer } from './core/renderer.js';
import { setupResize } from './core/resize.js';
import { ParticleSphere } from './scenes/particleSphere.js';
import { FPSMonitor, MemoryMonitor, QualityManager } from './utils/perfMonitor.js';
import { PARTICLE_CONFIG, STAR_COLORS, CONSTELLATION_CONFIG } from './config/params.js';
import { ColorCycle } from './utils/colorCycle.js';
import { paramStore, INITIAL_STATE } from './state/paramStore.js';
import { KeyboardHandler } from './input/keyboardHandler.js';
import { DebugUI } from './ui/debugUI.js';
import { EffectSystem } from './effects/effectSystem.js';
import { LayerManager } from './layers/layerManager.js';
import { PresetLoader } from './presets/presetLoader.js';

async function main() {
  if (!checkWebGLSupport()) return;

  const { scene, camera, renderer } = createRenderer();
  const particleSphere = new ParticleSphere(scene, PARTICLE_CONFIG.initialCount);
  await particleSphere.ready;

  const effectState = {
    setA: false,
    setB: false,
    qualityDisableTrailWarp: false,
  };

  function resetToInitialState() {
    for (const key in INITIAL_STATE) {
      if (paramStore[key]) paramStore[key].setValue(INITIAL_STATE[key]);
    }
    effectState.setA = false;
    effectState.setB = false;
    effectState.qualityDisableTrailWarp = false;
  }

  const effectSystem = new EffectSystem(renderer, scene, camera);
  const layerManager = new LayerManager(scene, particleSphere);
  const presetLoader = new PresetLoader(paramStore, effectState, layerManager);
  await presetLoader.init();

  setupResize(renderer, camera, effectSystem);

  const debugUI = new DebugUI();
  window.debugUI = debugUI; // グローバルに登録（キーボード制御から参照可能に）
  const keyboardHandler = new KeyboardHandler(
    paramStore,
    effectState,
    layerManager,
    presetLoader
  );

  const fpsMonitor = new FPSMonitor();
  const memoryMonitor = new MemoryMonitor();
  const qualityManager = new QualityManager(particleSphere, effectState, effectSystem);

  const clock = new THREE.Clock();
  const colorCycle = new ColorCycle();

  function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    keyboardHandler.update();
    paramStore.updateAll(deltaTime);
    const values = paramStore.getValues();

    particleSphere.setParticleCount(Math.round(values.particleCount));
    particleSphere.setRotation(values.rotationX, values.rotationY);
    particleSphere.setNoiseStrength(values.noiseStrength);
    particleSphere.setHSL(values.hue, values.saturation, values.lightness);
    particleSphere.setColorCycleSpeed(values.colorCycleSpeed);

    effectSystem.update(values, effectState, elapsedTime);

    const avgFPS = fpsMonitor.update();
    fpsMonitor.render(avgFPS);
    memoryMonitor.update();
    qualityManager.update(avgFPS);

    debugUI.update(paramStore, {
      ...effectState,
    });

    particleSphere.update(elapsedTime, deltaTime);

    // Update particle uniforms for constellation colors and cycle blending
    if (particleSphere.material && particleSphere.material.uniforms) {
      const matU = particleSphere.material.uniforms;
      matU.uStarColors.value = STAR_COLORS.map(c => new THREE.Vector3(c.rgb[0], c.rgb[1], c.rgb[2]));
      const cycleRGB = colorCycle.getCurrentColorRGB(elapsedTime);
      if (matU.uCycleColor && matU.uCycleColor.value && typeof matU.uCycleColor.value.set === 'function') {
        matU.uCycleColor.value.set(cycleRGB[0], cycleRGB[1], cycleRGB[2]);
      } else if (matU.uCycleColor) {
        matU.uCycleColor.value = new THREE.Vector3(cycleRGB[0], cycleRGB[1], cycleRGB[2]);
      }
      if (matU.uStarInfluence) matU.uStarInfluence.value = CONSTELLATION_CONFIG.cycleBlend.starInfluence;
      if (matU.uCycleInfluence) matU.uCycleInfluence.value = CONSTELLATION_CONFIG.cycleBlend.cycleInfluence;
      if (matU.uTwinkleSpeed) matU.uTwinkleSpeed.value = CONSTELLATION_CONFIG.twinkle.speed;
      if (matU.uTwinkleIntensity) matU.uTwinkleIntensity.value = CONSTELLATION_CONFIG.twinkle.intensity;
    }

    effectSystem.render();
  }
  animate();
}

main();

function checkWebGLSupport() {
  const canvas = document.createElement('canvas');
  const gl2 = canvas.getContext('webgl2');
  if (!gl2) {
    document.body.innerHTML = `
      <div style="
        display:flex;
        justify-content:center;
        align-items:center;
        height:100vh;
        background:#000;
        color:#fff;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        font-size:18px;
        padding:24px;
        box-sizing:border-box;
        text-align:center;
      ">
        <div>
          <h1 style="margin:0 0 12px 0; font-size:24px;">⚠️ WebGL2未対応ブラウザです</h1>
          <p style="margin:0; opacity:0.85;">Chrome最新版でアクセスしてください</p>
        </div>
      </div>
    `;
    console.error('❌ WebGL2 not supported');
    return false;
  }
  console.log('✓ WebGL 2.0 supported');
  return true;
}
