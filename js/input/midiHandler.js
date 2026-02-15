/**
 * Phase 2: nanoKONTROL2 MIDI制御
 * - Web MIDI API で nanoKONTROL2 を検出し CC をマッピング
 * - 値は ParamStore に setTarget するだけ（描画スレッドを軽く保つ）
 */

export class MIDIHandler {
  /**
   * @param {import('../state/paramStore.js').ParamStore} paramStore
   * @param {{ setA: boolean, setB: boolean }} effectState
   * @param {() => void} resetToInitialState
   * @param {import('../presets/presetLoader.js').PresetLoader} [presetLoader]
   * @param {import('../layers/layerManager.js').LayerManager} [layerManager]
   */
  constructor(paramStore, effectState, resetToInitialState, presetLoader = null, layerManager = null) {
    this.paramStore = paramStore;
    this.effectState = effectState;
    this.resetToInitialState = resetToInitialState;
    this.presetLoader = presetLoader;
    this.layerManager = layerManager;

    this.midiAccess = null;
    this.nanoKontrol = null;
    this.connected = false;
  }

  async init() {
    try {
      if (!navigator.requestMIDIAccess) throw new Error('WebMIDI not supported');

      this.midiAccess = await navigator.requestMIDIAccess();
      console.log('✓ MIDI API available');

      // nanoKONTROL2 を検索
      for (const input of this.midiAccess.inputs.values()) {
        if (input.name && input.name.includes('nanoKONTROL2')) {
          this.nanoKontrol = input;
          this.nanoKontrol.onmidimessage = this.onMIDIMessage.bind(this);
          this.connected = true;
          console.log(`✓ MIDI connected: ${input.name}`);
          return true;
        }
      }

      console.warn('⚠️ nanoKONTROL2 not found');
      this.connected = false;
      return false;
    } catch (error) {
      console.warn('⚠️ MIDI not available, using keyboard fallback');
      console.error(error);
      this.connected = false;
      return false;
    }
  }

  onMIDIMessage(message) {
    const [status, cc, value] = message.data;
    if (status === 176) this.handleCC(cc, value);
  }

  handleCC(cc, value) {
    const normalized = value / 127.0;

    if (cc >= 0 && cc <= 7) {
      this.handleFader(cc, normalized);
    } else if (cc >= 16 && cc <= 23) {
      this.handleKnob(cc - 16, normalized);
    } else if (cc >= 32 && cc <= 39) {
      this.handleButton(cc - 32, value > 0);
    }
  }

  handleFader(index, normalizedValue) {
    switch (index) {
      case 0: { // 粒子数（対数スケール）
        const count = particleCountFromMIDI(normalizedValue);
        this.paramStore.particleCount.setTarget(count);
        console.log(`Particles: ${count.toLocaleString()}`);
        break;
      }
      case 1: { // 彩度 0..1
        this.paramStore.saturation.setTarget(clamp01(normalizedValue));
        break;
      }
      case 2: { // 明度 0.2..1.0
        const lightness = 0.2 + clamp01(normalizedValue) * 0.8;
        this.paramStore.lightness.setTarget(lightness);
        break;
      }
      case 3: { // 色相 0..1
        this.paramStore.hue.setTarget(clamp01(normalizedValue));
        break;
      }
      case 4: { // 回転速度X -0.01..0.01 (rad/frame)
        const rotX = (normalizedValue - 0.5) * 0.02;
        this.paramStore.rotationX.setTarget(rotX);
        break;
      }
      case 5: { // 回転速度Y -0.01..0.01 (rad/frame)
        const rotY = (normalizedValue - 0.5) * 0.02;
        this.paramStore.rotationY.setTarget(rotY);
        break;
      }
      case 6: { // 色変化速度 0.5..2.0
        const cycleSpeed = 0.5 + clamp01(normalizedValue) * 1.5;
        this.paramStore.colorCycleSpeed.setTarget(cycleSpeed);
        break;
      }
      case 7: { // ノイズ強度 0..1
        this.paramStore.noiseStrength.setTarget(clamp01(normalizedValue));
        break;
      }
    }
  }

  handleKnob(index, normalizedValue) {
    switch (index) {
      case 0: { // bloom 0..2
        this.paramStore.bloomStrength.setTarget(clamp01(normalizedValue) * 2.0);
        break;
      }
      case 1: { // trail 0..1
        this.paramStore.trailStrength.setTarget(clamp01(normalizedValue));
        break;
      }
      case 2: { // warp 0..0.3
        this.paramStore.warpStrength.setTarget(clamp01(normalizedValue) * 0.3);
        break;
      }
      case 3: { // glitch 0..1
        this.paramStore.glitchStrength.setTarget(clamp01(normalizedValue));
        break;
      }
      case 4: { // aberration 0..5px
        this.paramStore.aberrationStrength.setTarget(clamp01(normalizedValue) * 5.0);
        break;
      }
      default:
        break;
    }
  }

  handleButton(index, pressed) {
    if (!pressed) return;

    switch (index) {
      case 0: { // Set A toggle
        this.effectState.setA = !this.effectState.setA;
        console.log(`Effect Set A: ${this.effectState.setA ? 'ON' : 'OFF'}`);
        break;
      }
      case 1: { // Set B toggle
        this.effectState.setB = !this.effectState.setB;
        console.log(`Effect Set B: ${this.effectState.setB ? 'ON' : 'OFF'}`);
        break;
      }
      case 2: { // レイヤー1 ON/OFF
        if (this.layerManager) this.layerManager.toggleLayer(0);
        console.log(`Layer 1: ${this.layerManager?.layers[0]?.enabled ? 'ON' : 'OFF'}`);
        break;
      }
      case 3: { // レイヤー2 ON/OFF
        if (this.layerManager) this.layerManager.toggleLayer(1);
        console.log(`Layer 2: ${this.layerManager?.layers[1]?.enabled ? 'ON' : 'OFF'}`);
        break;
      }
      case 4: { // レイヤー3 ON/OFF
        if (this.layerManager) this.layerManager.toggleLayer(2);
        console.log(`Layer 3: ${this.layerManager?.layers[2]?.enabled ? 'ON' : 'OFF'}`);
        break;
      }
      case 5: { // プリセット1
        if (this.presetLoader) this.presetLoader.load(1);
        console.log('✓ Loaded Preset 1');
        break;
      }
      case 6: { // プリセット2
        if (this.presetLoader) this.presetLoader.load(2);
        console.log('✓ Loaded Preset 2');
        break;
      }
      case 7: { // 全リセット
        this.resetToInitialState();
        console.log('✓ Reset to initial state');
        break;
      }
      default:
        break;
    }
  }
}

function particleCountFromMIDI(normalized) {
  const min = 10000;
  const max = 500000;
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const logValue = logMin + (logMax - logMin) * clamp01(normalized);
  return Math.floor(Math.exp(logValue));
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

