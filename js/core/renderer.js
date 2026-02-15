import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function createRenderer() {
  const scene = new THREE.Scene();

  // 粒子球体を想定したPerspectiveカメラ
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  // パフォーマンス優先のRenderer設定
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
    stencil: false,
    depth: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1.0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.debug.checkShaderErrors = true;

  // 可能な限り詳細にシェーダーエラーを拾う（Three.js内部でcompile済み）
  renderer.debug.onShaderError = (gl, program, vertexShader, fragmentShader) => {
    console.error('❌ Shader compile/link failed');
    console.error('Vertex shader:', gl.getShaderInfoLog(vertexShader));
    console.error('Fragment shader:', gl.getShaderInfoLog(fragmentShader));
    console.error('Program:', gl.getProgramInfoLog(program));
  };

  document.body.appendChild(renderer.domElement);

  return { scene, camera, renderer };
}