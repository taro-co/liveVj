/**
 * Phase 3: トレイル（残像）シェーダー
 * - 前フレームと現在フレームをブレンド（GPU 1枚のサンプルで軽量）
 */

export const TrailShader = {
  uniforms: {
    tDiffuse: { value: null },
    tPrevious: { value: null },
    uStrength: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tPrevious;
    uniform float uStrength;
    varying vec2 vUv;

    void main() {
      vec4 current = texture2D(tDiffuse, vUv);
      vec4 previous = texture2D(tPrevious, vUv);
      vec4 trail = mix(current, previous, uStrength * 0.9);
      gl_FragColor = trail;
    }
  `,
};
