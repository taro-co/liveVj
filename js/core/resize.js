/**
 * リサイズ処理
 * - 毎フレームではなくイベント駆動にして負荷を抑える
 * - PixelRatio も再設定して高DPIでの過負荷を避ける（最大2倍）
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Camera} camera
 * @param {{ resize: (w: number, h: number) => void }} [effectSystem] - Phase3: Composer のリサイズ
 */
export function setupResize(renderer, camera, effectSystem = null) {
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);

    if (camera) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    if (effectSystem && typeof effectSystem.resize === 'function') {
      effectSystem.resize(w, h);
    }
  }

  window.addEventListener('resize', onResize);
  onResize();
}
