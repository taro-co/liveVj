/**
 * Phase 3: プリセット読み込み・適用・LocalStorage 保存
 * - presets.json からプリセット一覧を取得し、ID で適用
 * - Cmd+1/2/3 で現在状態をスロット保存、Shift+1/2/3 で読み込み
 */

export class PresetLoader {
  /**
   * @param {import('../state/paramStore.js').ParamStore} paramStore
   * @param {{ setA: boolean, setB: boolean }} effectState
   * @param {import('../layers/layerManager.js').LayerManager} layerManager
   */
  constructor(paramStore, effectState, layerManager) {
    this.paramStore = paramStore;
    this.effectState = effectState;
    this.layerManager = layerManager;
    this.presets = null;
  }

  async init() {
    try {
      const response = await fetch('presets.json');
      const data = await response.json();
      this.presets = Array.isArray(data) ? { presets: data } : (data.presets != null ? data : { presets: [] });
      console.log(`✓ Loaded ${this.presets.presets.length} presets`);
    } catch (e) {
      console.error('Failed to load presets:', e);
      this.presets = { presets: [] };
    }
  }

  load(presetId) {
    if (!this.presets || !this.presets.presets) {
      console.error('Presets not loaded');
      return;
    }
    const preset = this.presets.presets.find((p) => p.id === presetId);
    if (!preset) {
      console.error(`Preset ${presetId} not found`);
      return;
    }
    console.log(`✓ Loading preset: ${preset.name}`);
    this._applyPreset(preset);
  }

  save(slotId) {
    const state = {
      id: slotId,
      name: `User Preset ${slotId}`,
      particles: {
        count: this.paramStore.particleCount.current,
        hue: this.paramStore.hue.current,
        saturation: this.paramStore.saturation.current,
        lightness: this.paramStore.lightness.current,
        rotationX: this.paramStore.rotationX.current,
        rotationY: this.paramStore.rotationY.current,
        noiseStrength: this.paramStore.noiseStrength.current,
        colorCycleSpeed: this.paramStore.colorCycleSpeed.current,
      },
      effects: {
        setA: this.effectState.setA,
        setB: this.effectState.setB,
        bloom: { strength: this.paramStore.bloomStrength.current },
        trail: { strength: this.paramStore.trailStrength.current },
        warp: { strength: this.paramStore.warpStrength.current },
        glitch: { strength: this.paramStore.glitchStrength.current },
        aberration: { strength: this.paramStore.aberrationStrength.current },
      },
      layers: {
        layer1: this.layerManager.layers[0].enabled,
        layer2: this.layerManager.layers[1].enabled,
        layer3: this.layerManager.layers[2].enabled,
      },
    };
    try {
      localStorage.setItem(`vj_preset_${slotId}`, JSON.stringify(state));
      console.log(`✓ Saved to slot ${slotId}`);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  loadFromStorage(slotId) {
    try {
      const data = localStorage.getItem(`vj_preset_${slotId}`);
      if (!data) {
        console.warn(`No saved preset in slot ${slotId}`);
        return;
      }
      const preset = JSON.parse(data);
      console.log(`✓ Loading saved preset: ${preset.name}`);
      this._applyPreset(preset);
    } catch (e) {
      console.warn('Load from storage failed:', e);
    }
  }

  _applyPreset(preset) {
    this.paramStore.particleCount.setTarget(preset.particles?.count ?? 100000);
    this.paramStore.hue.setTarget(preset.particles?.hue ?? 0);
    this.paramStore.saturation.setTarget(preset.particles?.saturation ?? 0);
    this.paramStore.lightness.setTarget(preset.particles?.lightness ?? 0.9);
    this.paramStore.rotationX.setTarget(preset.particles?.rotationX ?? 0.001);
    this.paramStore.rotationY.setTarget(preset.particles?.rotationY ?? 0.002);
    this.paramStore.noiseStrength.setTarget(preset.particles?.noiseStrength ?? 0.2);
    this.paramStore.colorCycleSpeed.setTarget(preset.particles?.colorCycleSpeed ?? 1);

    this.effectState.setA = !!preset.effects?.setA;
    this.effectState.setB = !!preset.effects?.setB;

    this.paramStore.bloomStrength.setValue(preset.effects?.bloom?.strength ?? 0.8);
    this.paramStore.trailStrength.setValue(preset.effects?.trail?.strength ?? 0);
    this.paramStore.warpStrength.setValue(preset.effects?.warp?.strength ?? 0);
    this.paramStore.glitchStrength.setValue(preset.effects?.glitch?.strength ?? 0);
    this.paramStore.aberrationStrength.setValue(preset.effects?.aberration?.strength ?? 0);

    const layers = preset.layers || {};
    this.layerManager.layers.forEach((layer, i) => {
      const key = `layer${i + 1}`;
      layer.enabled = layers[key] !== false;
      if (layer.particleSystem && layer.particleSystem.points) {
        layer.particleSystem.points.visible = layer.enabled;
        if (layer.particleSystem.material) layer.particleSystem.material.opacity = layer.enabled ? 1 : 0;
      }
    });
  }
}
