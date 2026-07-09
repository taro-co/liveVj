import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const OUTER_COLOR = new THREE.Color(0x2266ff);
const INNER_COLOR = new THREE.Color(0x00ffcc);

export class Mikazukimo {
  constructor() {
    this.group = new THREE.Group();
    this.group.visible = true;
    this.group.name = 'Mikazukimo';
    this.time = 0;
    this.maxCount = 30;
    this.totalSpawned = 0;
    this._buildMaterials();
  }

  _buildMaterials() {
    const outerCurve = this._createCrescentCurve(1.0);
    const innerCurve = this._createCrescentCurve(0.75); // 内側を少し短くする
    const outerGeometry = new THREE.TubeGeometry(outerCurve, 64, 0.035, 8, false);
    const innerGeometry = new THREE.TubeGeometry(innerCurve, 64, 0.015, 6, false); // 太さも微調整可能

    const outerMaterial = new THREE.MeshBasicMaterial({
      color: OUTER_COLOR,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const innerMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: INNER_COLOR },
        uOpacity: { value: 0.6 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          float pulse = 0.6 + 0.4 * sin(uTime * 1.57 + vUv.x * 6.0);
          float alpha = uOpacity * pulse * smoothstep(0.4, 0.0, abs(vUv.y - 0.5));
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });

    this.outerMesh = new THREE.InstancedMesh(outerGeometry, outerMaterial, this.maxCount);
    this.innerMesh = new THREE.InstancedMesh(innerGeometry, innerMaterial, this.maxCount);
    this.outerMesh.count = 0;
    this.innerMesh.count = 0;

    this.group.add(this.outerMesh, this.innerMesh);
  }

  clear() {
    this.totalSpawned = 0;
    this.outerMesh.count = 0;
    this.innerMesh.count = 0;
  }

  addInstances(num = 2) {
    const dummy = new THREE.Object3D();
    for (let k = 0; k < num; k++) {
      const poolIndex = this.totalSpawned % this.maxCount;
      const scale = 0.75 + Math.sin(this.totalSpawned * 0.4) * 0.18;
      
      const randX = 2.0 + Math.random() * 2.0;
      const randY = (Math.random() - 0.5) * 3.0;
      const randZ = -2.0 + (Math.random() - 0.5) * 2.0;
      dummy.position.set(randX, randY, randZ);
      
      dummy.rotation.set(0, this.totalSpawned * 0.25, Math.PI * 0.12 + Math.random() * 0.2);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      
      this.outerMesh.setMatrixAt(poolIndex, dummy.matrix);
      this.innerMesh.setMatrixAt(poolIndex, dummy.matrix);
      
      this.totalSpawned++;
    }

    this.outerMesh.count = Math.min(this.totalSpawned, this.maxCount);
    this.innerMesh.count = Math.min(this.totalSpawned, this.maxCount);
    this.outerMesh.instanceMatrix.needsUpdate = true;
    this.innerMesh.instanceMatrix.needsUpdate = true;
  }

  _createCrescentCurve(spanRatio = 1.0) {
    const points = [];
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      // spanRatioを掛けて、内側の時はカーブの角度を狭く（短く）する
      const maxAngle = Math.PI * 0.45 * spanRatio;
      const angle = (t * 2.0 - 1.0) * maxAngle;
      
      const radius = 0.55 + 0.12 * Math.sin(t * Math.PI);
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.6, 0));
    }
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }

  toggle() {
    this.group.visible = !this.group.visible;
  }

  setVisible(bool) {
    this.group.visible = bool;
  }

  update(deltaTime) {
    this.time += deltaTime;
    this.innerMesh.material.uniforms.uTime.value = this.time;
  }

  dispose() {
    this.outerMesh.geometry.dispose();
    this.outerMesh.material.dispose();
    this.innerMesh.geometry.dispose();
    this.innerMesh.material.dispose();
  }
}
