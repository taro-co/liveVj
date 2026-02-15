/**
 * Phase 2: デバッグUI
 * - DOM更新は innerHTML 1回にまとめてレイアウト負荷を抑える
 * - 画面右上、Hキーで表示切替
 */

export class DebugUI {
  constructor() {
    this.visible = true;
    this.element = this._createPanel();
    document.body.appendChild(this.element);
  }

  _createPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      background: rgba(0, 0, 0, 0.70);
      color: #fff;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 6px;
      min-width: 220px;
      z-index: 1000;
      user-select: none;
      pointer-events: none;
    `;
    return panel;
  }

  /**
   * @param {import('../state/paramStore.js').ParamStore} paramStore
   * @param {{ setA: boolean, setB: boolean, midiConnected?: boolean }} state
   */
  update(paramStore, state) {
    if (!this.visible) return;
    const v = paramStore.getValues();

    this.element.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold;">
        MIDI Status: ${state.midiConnected ? '✓ Connected' : '⚠ Keyboard'}
      </div>
      <div>Particles: ${Math.round(v.particleCount).toLocaleString()}</div>
      <div>Hue: ${v.hue.toFixed(2)}</div>
      <div>Sat: ${v.saturation.toFixed(2)}</div>
      <div>Light: ${v.lightness.toFixed(2)}</div>
      <div>Rotation: ${v.rotationX.toFixed(4)}, ${v.rotationY.toFixed(4)}</div>
      <div>Noise: ${v.noiseStrength.toFixed(2)}</div>
      <div>CycleSpeed: ${v.colorCycleSpeed.toFixed(2)}</div>
      <div style="margin-top: 8px;">
        Effects:
        A(${state.setA ? 'ON' : 'OFF'})
        B(${state.setB ? 'ON' : 'OFF'})
      </div>
      <div style="margin-top: 8px; font-size: 10px; color: #888;">
        Press 'H' to hide
      </div>
    `;
  }

  toggle() {
    this.visible = !this.visible;
    this.element.style.display = this.visible ? 'block' : 'none';
  }
}

