/**
 * Phase 2: キーボードフォールバック
 * - MIDIが無い環境でも主要パラメータを操作できる
 * - 押しっぱなしの連続入力は target を更新するだけにして軽量化
 */

export class KeyboardFallback {
  /**
   * @param {import('../state/paramStore.js').ParamStore} paramStore
   * @param {{ setA: boolean, setB: boolean }} effectState
   * @param {() => void} resetToInitialState
   * @param {{ toggle: () => void }} debugUI
   * @param {import('../presets/presetLoader.js').PresetLoader} [presetLoader]
   */
  constructor(paramStore, effectState, resetToInitialState, debugUI, presetLoader = null) {
    this.paramStore = paramStore;
    this.effectState = effectState;
    this.resetToInitialState = resetToInitialState;
    this.debugUI = debugUI;
    this.presetLoader = presetLoader;

    this.keyState = Object.create(null);
    this._setupListeners();
  }

  _setupListeners() {
    document.addEventListener('keydown', (e) => {
      this.keyState[e.key.toLowerCase()] = true;
      this._handleSpecialKeys(e);
    });
    document.addEventListener('keyup', (e) => {
      this.keyState[e.key.toLowerCase()] = false;
    });
  }

  update() {
    const inc = 0.01;

    // 粒子数
    if (this.keyState['q']) {
      const next = Math.min(this.paramStore.particleCount.target + 5000, 500000);
      this.paramStore.particleCount.setTarget(next);
    }
    if (this.keyState['a']) {
      const next = Math.max(this.paramStore.particleCount.target - 5000, 10000);
      this.paramStore.particleCount.setTarget(next);
    }

    // 彩度
    if (this.keyState['w']) {
      const next = Math.min(this.paramStore.saturation.target + inc, 1.0);
      this.paramStore.saturation.setTarget(next);
    }
    if (this.keyState['s']) {
      const next = Math.max(this.paramStore.saturation.target - inc, 0.0);
      this.paramStore.saturation.setTarget(next);
    }

    // 明度
    if (this.keyState['e']) {
      const next = Math.min(this.paramStore.lightness.target + inc, 1.0);
      this.paramStore.lightness.setTarget(next);
    }
    if (this.keyState['d']) {
      const next = Math.max(this.paramStore.lightness.target - inc, 0.2);
      this.paramStore.lightness.setTarget(next);
    }

    // 色相
    if (this.keyState['r']) {
      let next = this.paramStore.hue.target + inc;
      if (next > 1.0) next -= 1.0;
      this.paramStore.hue.setTarget(next);
    }
    if (this.keyState['f']) {
      let next = this.paramStore.hue.target - inc;
      if (next < 0.0) next += 1.0;
      this.paramStore.hue.setTarget(next);
    }
  }

  _handleSpecialKeys(e) {
    const mod = e.metaKey || e.ctrlKey || e.shiftKey;
    // エフェクト切替（修飾キーなしの 1/2/3 のみ）
    if (!mod && e.key === '1') {
      this.effectState.setA = !this.effectState.setA;
      console.log(`Effect Set A: ${this.effectState.setA ? 'ON' : 'OFF'}`);
    }
    if (!mod && e.key === '2') {
      this.effectState.setB = !this.effectState.setB;
      console.log(`Effect Set B: ${this.effectState.setB ? 'ON' : 'OFF'}`);
    }
    if (!mod && e.key === '3') {
      this.effectState.setA = false;
      this.effectState.setB = false;
      console.log('All effects OFF');
    }

    // リセット（Cmd+R / Ctrl+R を奪って内部リセット）
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      this.resetToInitialState();
      console.log('✓ Reset to initial state');
    }

    // デバッグUI表示切替（H）
    if (e.key.toLowerCase() === 'h') {
      this.debugUI.toggle();
    }

    // Cmd+1/2/3 でスロット保存
    if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '3') {
      e.preventDefault();
      if (this.presetLoader) {
        const slotId = parseInt(e.key, 10);
        this.presetLoader.save(slotId);
      }
    }
    // Shift+1/2/3 でスロット読み込み
    if (e.shiftKey && e.key >= '1' && e.key <= '3') {
      e.preventDefault();
      if (this.presetLoader) {
        const slotId = parseInt(e.key, 10);
        this.presetLoader.loadFromStorage(slotId);
      }
    }
  }
}

