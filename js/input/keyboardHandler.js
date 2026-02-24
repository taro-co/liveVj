/**
 * キーボード制御システム（完全版）
 * - MIDI削除後の統一キーボード制御
 * - 連続入力とトグル操作に完全対応
 * - deltaTime補正で安定した変化速度を実現
 */

export class KeyboardHandler {
  /**
   * @param {import('../state/paramStore.js').ParamStore} paramStore
   * @param {{ setA: boolean, setB: boolean }} effectState
   * @param {import('../layers/layerManager.js').LayerManager} layerManager
   * @param {import('../presets/presetLoader.js').PresetLoader} presetLoader
   */
  constructor(paramStore, effectState, layerManager, presetLoader) {
    this.paramStore = paramStore;
    this.effectState = effectState;
    this.layerManager = layerManager;
    this.presetLoader = presetLoader;

    // キー状態管理
    this.keyState = Object.create(null);
    this.lastUpdateTime = performance.now();

    this.setupListeners();
    console.log('✓ Keyboard controls initialized');
  }

  setupListeners() {
    document.addEventListener('keydown', (e) => {
      this.keyState[e.key.toLowerCase()] = true;
      this.handleToggleKeys(e);
    });

    document.addEventListener('keyup', (e) => {
      this.keyState[e.key.toLowerCase()] = false;
    });
  }

  /**
   * アニメーションループから毎フレーム呼び出す
   */
  update() {
    const now = performance.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // 秒に変換
    this.lastUpdateTime = now;

    // 連続入力の処理
    this.updateContinuousKeys(deltaTime);
  }

  /**
   * 連続入力処理（keyを押し続けると値が変わり続ける）
   */
  updateContinuousKeys(deltaTime) {
    // ===== 粒子制御 =====
    if (this.keyState['q']) {
      const increment = this.keyState['shift'] ? 50000 : 5000;
      const newCount = Math.min(
        this.paramStore.particleCount.target + increment * deltaTime,
        500000
      );
      this.paramStore.particleCount.setTarget(newCount);
    }
    if (this.keyState['a']) {
      const decrement = this.keyState['shift'] ? 50000 : 5000;
      const newCount = Math.max(
        this.paramStore.particleCount.target - decrement * deltaTime,
        10000
      );
      this.paramStore.particleCount.setTarget(newCount);
    }

    // ===== 彩度制御 =====
    if (this.keyState['w']) {
      const newSat = Math.min(
        this.paramStore.saturation.target + 0.02 * deltaTime,
        1.0
      );
      this.paramStore.saturation.setTarget(newSat);
    }
    if (this.keyState['s']) {
      const newSat = Math.max(
        this.paramStore.saturation.target - 0.02 * deltaTime,
        0.0
      );
      this.paramStore.saturation.setTarget(newSat);
    }

    // ===== 明度制御 =====
    if (this.keyState['e']) {
      const newLight = Math.min(
        this.paramStore.lightness.target + 0.02 * deltaTime,
        1.0
      );
      this.paramStore.lightness.setTarget(newLight);
    }
    if (this.keyState['d']) {
      const newLight = Math.max(
        this.paramStore.lightness.target - 0.02 * deltaTime,
        0.2
      );
      this.paramStore.lightness.setTarget(newLight);
    }

    // ===== 色相制御（ラップ）=====
    if (this.keyState['r']) {
      let newHue = this.paramStore.hue.target + 0.02 * deltaTime;
      if (newHue > 1.0) newHue -= 1.0;
      this.paramStore.hue.setTarget(newHue);
    }
    if (this.keyState['f']) {
      let newHue = this.paramStore.hue.target - 0.02 * deltaTime;
      if (newHue < 0.0) newHue += 1.0;
      this.paramStore.hue.setTarget(newHue);
    }

    // ===== 回転速度X制御 =====
    if (this.keyState['t']) {
      const newRotX = Math.min(
        this.paramStore.rotationX.target + 0.0005 * deltaTime,
        0.01
      );
      this.paramStore.rotationX.setTarget(newRotX);
    }
    if (this.keyState['g']) {
      const newRotX = Math.max(
        this.paramStore.rotationX.target - 0.0005 * deltaTime,
        -0.01
      );
      this.paramStore.rotationX.setTarget(newRotX);
    }

    // ===== 回転速度Y制御 =====
    if (this.keyState['y']) {
      const newRotY = Math.min(
        this.paramStore.rotationY.target + 0.0005 * deltaTime,
        0.01
      );
      this.paramStore.rotationY.setTarget(newRotY);
    }
    if (this.keyState['h']) {
      const newRotY = Math.max(
        this.paramStore.rotationY.target - 0.0005 * deltaTime,
        -0.01
      );
      this.paramStore.rotationY.setTarget(newRotY);
    }

    // ===== 色変化速度制御 =====
    if (this.keyState['u']) {
      const newSpeed = Math.min(
        this.paramStore.colorCycleSpeed.target + 0.05 * deltaTime,
        2.0
      );
      this.paramStore.colorCycleSpeed.setTarget(newSpeed);
    }
    if (this.keyState['j']) {
      const newSpeed = Math.max(
        this.paramStore.colorCycleSpeed.target - 0.05 * deltaTime,
        0.5
      );
      this.paramStore.colorCycleSpeed.setTarget(newSpeed);
    }

    // ===== ノイズ強度制御 =====
    if (this.keyState['i']) {
      const newNoise = Math.min(
        this.paramStore.noiseStrength.target + 0.02 * deltaTime,
        1.0
      );
      this.paramStore.noiseStrength.setTarget(newNoise);
    }
    if (this.keyState['k']) {
      const newNoise = Math.max(
        this.paramStore.noiseStrength.target - 0.02 * deltaTime,
        0.0
      );
      this.paramStore.noiseStrength.setTarget(newNoise);
    }

    // ===== エフェクト強度: ブルーム =====
    if (this.keyState['z']) {
      const newBloom = Math.min(
        this.paramStore.bloomStrength.target + 0.05 * deltaTime,
        2.0
      );
      this.paramStore.bloomStrength.setTarget(newBloom);
    }
    if (this.keyState['x']) {
      const newBloom = Math.max(
        this.paramStore.bloomStrength.target - 0.05 * deltaTime,
        0.0
      );
      this.paramStore.bloomStrength.setTarget(newBloom);
    }

    // ===== エフェクト強度: トレイル =====
    if (this.keyState['c']) {
      const newTrail = Math.min(
        this.paramStore.trailStrength.target + 0.02 * deltaTime,
        1.0
      );
      this.paramStore.trailStrength.setTarget(newTrail);
    }
    if (this.keyState['v']) {
      const newTrail = Math.max(
        this.paramStore.trailStrength.target - 0.02 * deltaTime,
        0.0
      );
      this.paramStore.trailStrength.setTarget(newTrail);
    }

    // ===== エフェクト強度: ワープ =====
    if (this.keyState['b']) {
      const newWarp = Math.min(
        this.paramStore.warpStrength.target + 0.01 * deltaTime,
        0.3
      );
      this.paramStore.warpStrength.setTarget(newWarp);
    }
    if (this.keyState['n']) {
      const newWarp = Math.max(
        this.paramStore.warpStrength.target - 0.01 * deltaTime,
        0.0
      );
      this.paramStore.warpStrength.setTarget(newWarp);
    }

    // ===== エフェクト強度: グリッチ =====
    if (this.keyState['m']) {
      const newGlitch = Math.min(
        this.paramStore.glitchStrength.target + 0.02 * deltaTime,
        1.0
      );
      this.paramStore.glitchStrength.setTarget(newGlitch);
    }
    if (this.keyState[',']) {
      const newGlitch = Math.max(
        this.paramStore.glitchStrength.target - 0.02 * deltaTime,
        0.0
      );
      this.paramStore.glitchStrength.setTarget(newGlitch);
    }

    // ===== エフェクト強度: 色収差 =====
    if (this.keyState['.']) {
      const newAber = Math.min(
        this.paramStore.aberrationStrength.target + 0.1 * deltaTime,
        5.0
      );
      this.paramStore.aberrationStrength.setTarget(newAber);
    }
    if (this.keyState['/']) {
      const newAber = Math.max(
        this.paramStore.aberrationStrength.target - 0.1 * deltaTime,
        0.0
      );
      this.paramStore.aberrationStrength.setTarget(newAber);
    }
  }

  /**
   * トグル系キーの処理（keydown で1回のみ実行）
   */
  handleToggleKeys(e) {
    const key = e.key;

    // ===== エフェクトセット =====
    if (key === '1' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      this.effectState.setA = !this.effectState.setA;
      console.log(`Effect Set A: ${this.effectState.setA ? 'ON' : 'OFF'}`);
      return;
    }
    if (key === '2' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      this.effectState.setB = !this.effectState.setB;
      console.log(`Effect Set B: ${this.effectState.setB ? 'ON' : 'OFF'}`);
      return;
    }
    if (key === '3' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      this.effectState.setA = false;
      this.effectState.setB = false;
      console.log('All effects OFF');
      return;
    }

    // ===== レイヤー制御 =====
    if (key === '4' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      this.layerManager.toggleLayer(0);
      console.log(`Layer 1: ${this.layerManager.layers[0]?.enabled ? 'ON' : 'OFF'}`);
      return;
    }
    if (key === '5' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      this.layerManager.toggleLayer(1);
      console.log(`Layer 2: ${this.layerManager.layers[1]?.enabled ? 'ON' : 'OFF'}`);
      return;
    }
    if (key === '6' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      this.layerManager.toggleLayer(2);
      console.log(`Layer 3: ${this.layerManager.layers[2]?.enabled ? 'ON' : 'OFF'}`);
      return;
    }

    // ===== プリセット呼び出し =====
    if (key === '7' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      this.presetLoader.load(1);
      console.log('✓ Loaded Preset 1');
      return;
    }
    if (key === '8' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      this.presetLoader.load(2);
      console.log('✓ Loaded Preset 2');
      return;
    }

    // ===== リセット =====
    if (key === '0' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      this.resetToInitial();
      return;
    }
    // Cmd+R / Ctrl+R でもリセット（ブラウザリロード防止）
    if ((e.metaKey || e.ctrlKey) && key.toLowerCase() === 'r') {
      e.preventDefault();
      this.resetToInitial();
      return;
    }

    // ===== デバッグUI切替 =====
    if (key === 'p' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      if (window.debugUI && window.debugUI.toggle) {
        window.debugUI.toggle();
      }
      return;
    }

    // ===== プリセット保存（Cmd+1/2/3 / Ctrl+1/2/3）=====
    if ((e.metaKey || e.ctrlKey) && ['1', '2', '3'].includes(key)) {
      e.preventDefault();
      const slotId = parseInt(key);
      this.presetLoader.save(slotId);
      console.log(`✓ Saved preset to slot ${slotId}`);
      return;
    }

    // ===== プリセット読み込み（Shift+1/2/3）=====
    if (e.shiftKey && ['1', '2', '3'].includes(key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const slotId = parseInt(key);
      this.presetLoader.loadFromStorage(slotId);
      console.log(`✓ Loaded preset from slot ${slotId}`);
      return;
    }
  }

  /**
   * 全パラメータを初期状態にリセット
   */
  resetToInitial() {
    const INITIAL_STATE = {
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

    for (const key in INITIAL_STATE) {
      if (this.paramStore[key]) {
        this.paramStore[key].setValue(INITIAL_STATE[key]);
      }
    }

    this.effectState.setA = false;
    this.effectState.setB = false;

    console.log('✓ Reset to initial state');
  }
}
