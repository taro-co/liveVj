/**
 * Phase 3: ワープ（球面歪み）シェーダー
 * - 中心から外に向かって UV を歪める（分岐は step で最小化）
 */

export const WarpShader = {
  uniforms: {
    tDiffuse: { value: null },
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
    uniform float uStrength;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      vec2 offset = vUv - center;
      float dist = length(offset);
      vec2 warp = offset * (1.0 + dist * uStrength);
      vec2 warpedUV = center + warp;

      float inRange = step(0.0, warpedUV.x) * step(warpedUV.x, 1.0) * step(0.0, warpedUV.y) * step(warpedUV.y, 1.0);
      gl_FragColor = texture2D(tDiffuse, warpedUV) * inRange;
    }
  `,
};
