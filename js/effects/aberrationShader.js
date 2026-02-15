/**
 * Phase 3: 色収差シェーダー
 * - 中心から放射方向に RGB をずらす（ピクセル単位 uStrength）
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    uStrength: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(1920, 1080) },
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
    uniform vec2 uResolution;
    varying vec2 vUv;

    void main() {
      vec2 direction = vUv - vec2(0.5);
      float dist = length(direction);
      vec2 ndir = dist > 0.0001 ? normalize(direction) : vec2(0.0);
      vec2 uvOffset = ndir * uStrength / uResolution;
      float r = texture2D(tDiffuse, vUv + uvOffset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - uvOffset).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};
