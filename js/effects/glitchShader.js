/**
 * Phase 3: グリッチシェーダー
 * - 水平ブロックノイズ＋RGB ずらし（step で分岐を避ける）
 */

export const GlitchShader = {
  uniforms: {
    tDiffuse: { value: null },
    uStrength: { value: 0.0 },
    uTime: { value: 0.0 },
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
    uniform float uStrength;
    uniform float uTime;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      float blockY = floor(uv.y * 20.0 + uTime * 5.0);
      float n = random(vec2(blockY, floor(uTime * 10.0)));
      float doGlitch = step(n, uStrength);

      float rx = (n - 0.5) * 0.1 * uStrength;
      vec2 uvR = uv + vec2(0.01 * uStrength, 0.0);
      vec2 uvB = uv - vec2(0.01 * uStrength, 0.0);

      vec4 colNormal = texture2D(tDiffuse, uv);
      float r = texture2D(tDiffuse, uv + vec2(rx, 0.0)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - vec2(rx, 0.0)).b;
      vec4 colGlitch = vec4(r, g, b, 1.0);

      gl_FragColor = mix(colNormal, colGlitch, doGlitch);
    }
  `,
};
