import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const BODY_COLOR = new THREE.Color(0x2266ff);
const HAIR_COLOR = new THREE.Color(0x88ccff);
const NUCLEUS_COLOR = new THREE.Color(0x00ffff);

export class Rappamushi {
  constructor() {
    this.group = new THREE.Group();
    this.group.visible = true;
    this.group.name = 'Rappamushi';
    this.time = 0;
    this.maxCount = 30;
    this.totalSpawned = 0;
    this.instancePool = [];
    this._buildMaterials();
    this._initializePool();
  }

  _buildMaterials() {
    this.bodyMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: BODY_COLOR },
        uOpacity: { value: 0.22 },
        uFresnelStrength: { value: 0.18 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uFresnelStrength;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.0);
          float alpha = uOpacity + fresnel * uFresnelStrength;
          gl_FragColor = vec4(uColor + fresnel * 0.3, alpha);
        }
      `,
    });

    this.hairMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      wireframe: false,
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: HAIR_COLOR },
        uOpacity: { value: 0.48 },
      },
      vertexShader: `
        attribute float aIsTip;
        varying float vIsTip;
        uniform float uTime;
        void main() {
          vIsTip = aIsTip;
          vec3 pos = position;
          // 先端のみを揺らぐようにシェーダーで処理
          if (aIsTip > 0.5) {
            float offset = sin(uTime * 3.0 + position.x * 10.0 + position.y * 10.0) * 0.012;
            vec3 dir = normalize(position);
            pos += dir * offset;
          }
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vIsTip;
        void main() {
          gl_FragColor = vec4(uColor, uOpacity);
        }
      `,
    });

    this.nucleusMaterial = new THREE.MeshBasicMaterial({
      color: NUCLEUS_COLOR,
      transparent: true,
      opacity: 0.7,
      blending: THREE.NormalBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const profile = [
      new THREE.Vector2(0.0, -0.3),
      new THREE.Vector2(0.02, -0.22),
      new THREE.Vector2(0.04, -0.12),
      new THREE.Vector2(0.06, -0.02),
      new THREE.Vector2(0.1, 0.08),
      new THREE.Vector2(0.18, 0.2),
      new THREE.Vector2(0.28, 0.32),
    ];
    this.bellGeo = new THREE.LatheGeometry(profile, 64);
  }

  _initializePool() {
    // 30個のプール済みインスタンスを事前生成
    for (let i = 0; i < this.maxCount; i++) {
      const model = new THREE.Group();
      const bell = new THREE.Mesh(this.bellGeo, this.bodyMaterial);
      bell.rotation.z = Math.PI * 0.5;
      bell.position.set(0, 0.15, 0);
      bell.scale.setScalar(0.85 + (i % 2) * 0.12);
      model.add(bell);

      const rimCount = 48;
      const rimPositions = new Float32Array(rimCount * 2 * 3);
      const rimIsTip = new Float32Array(rimCount * 2);
      const rimRadius = 0.28 * bell.scale.x;
      
      for (let j = 0; j < rimCount; j++) {
        const theta = (j / rimCount) * Math.PI * 2;
        const x = Math.cos(theta) * rimRadius;
        const y = 0.32;
        const z = Math.sin(theta) * rimRadius;
        rimPositions[j * 6 + 0] = x;
        rimPositions[j * 6 + 1] = y;
        rimPositions[j * 6 + 2] = z;
        rimPositions[j * 6 + 3] = x * 1.08;
        rimPositions[j * 6 + 4] = y + 0.05;
        rimPositions[j * 6 + 5] = z * 1.08;
        rimIsTip[j * 2 + 0] = 0.0; // 根元
        rimIsTip[j * 2 + 1] = 1.0; // 先端
      }
      
      const rimGeo = new THREE.BufferGeometry();
      rimGeo.setAttribute('position', new THREE.BufferAttribute(rimPositions, 3));
      rimGeo.setAttribute('aIsTip', new THREE.BufferAttribute(rimIsTip, 1));
      const rimLines = new THREE.LineSegments(rimGeo, this.hairMaterial);
      model.add(rimLines);

      const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), this.nucleusMaterial);
      nucleus.position.set(0, 0.0, 0.05);
      model.add(nucleus);

      // 初期状態では見えないようにする
      model.visible = false;
      this.group.add(model);
      this.instancePool.push({ model, rimGeo, rimLines, rimPositions });
    }
  }

  clear() {
    for (let i = 0; i < this.instancePool.length; i++) {
      this.instancePool[i].model.visible = false;
    }
    this.totalSpawned = 0;
  }

  addInstances(num = 2) {
    for (let k = 0; k < num; k++) {
      const poolIndex = this.totalSpawned % this.maxCount;
      const instance = this.instancePool[poolIndex];
      
      const angle = (this.totalSpawned * Math.PI * 2) / 10 + Math.random() * 0.5;
      const radius = 3.5 + (Math.random() - 0.5) * 0.5;
      
      const xPos = Math.cos(angle) * radius;
      const yPos = Math.sin(angle) * radius;
      const zPos = -8.0 + this.totalSpawned * 0.6;
      
      instance.model.position.set(xPos, yPos, zPos);
      instance.model.visible = true;
      
      this.totalSpawned++;
    }
  }

  toggle() {
    this.group.visible = !this.group.visible;
  }

  setVisible(bool) {
    this.group.visible = bool;
  }

  update(deltaTime) {
    this.time += deltaTime;
    this.group.rotation.z += deltaTime * 0.015;
    // ShaderMaterialの uTime を更新するだけ
    if (this.hairMaterial && this.hairMaterial.uniforms) {
      this.hairMaterial.uniforms.uTime.value = this.time;
    }
  }

  dispose() {
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
