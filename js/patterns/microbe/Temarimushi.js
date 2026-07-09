import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const BODY_COLOR = new THREE.Color(0xaaddff);
const HAIR_COLOR = new THREE.Color(0xffffff);

export class Temarimushi {
  constructor() {
    this.group = new THREE.Group();
    this.group.visible = true;
    this.group.name = 'Temarimushi';
    this.time = 0;
    this.maxCount = 30;
    this.totalSpawned = 0;
    this.colonyPool = [];
    this._buildMaterials();
    this._initializePool();
  }

  _buildMaterials() {
    this.bodyMaterial = new THREE.MeshBasicMaterial({
      color: BODY_COLOR,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.hairMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: HAIR_COLOR },
        uOpacity: { value: 0.3 },
      },
      vertexShader: `
        attribute float aIsTip;
        attribute vec3 aBasePos;
        attribute float aPhaseOffset;
        varying float vIsTip;
        uniform float uTime;
        void main() {
          vIsTip = aIsTip;
          vec3 pos = position;
          // 先端のみを揺らぐようにシェーダーで処理
          if (aIsTip > 0.5) {
            vec3 dir = normalize(aBasePos);
            float offset = sin(uTime * 2.1 + aPhaseOffset) * 0.02;
            pos = aBasePos + dir * (0.08 + offset);
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
  }

  _initializePool() {
    // 30個のプール済みインスタンスを事前生成
    for (let c = 0; c < this.maxCount; c++) {
      const colonyGroup = new THREE.Group();
      const instanceCount = 64;
      const sphereGeo = new THREE.SphereGeometry(0.012, 8, 8);
      const instanced = new THREE.InstancedMesh(sphereGeo, this.bodyMaterial, instanceCount);
      const cellPositions = [];
      const dummy = new THREE.Object3D();
      const radius = 0.6 + c * 0.15;
      const offset = c % 2 === 0 ? 0.2 : -0.2;

      for (let i = 0; i < instanceCount; i++) {
        const u = i / instanceCount;
        const phi = Math.acos(THREE.MathUtils.lerp(0.6, -0.6, u));
        const theta = Math.PI * 2 * i / 12 + c * 0.34;
        const x = Math.cos(theta) * Math.sin(phi) * radius + offset;
        const y = Math.sin(theta) * Math.sin(phi) * radius + 0.3 * Math.sin(i * 0.65);
        const z = Math.cos(phi) * radius * 0.4 - 1.6;
        dummy.position.set(x, y, z);
        dummy.scale.set(1, 1.6, 1);
        dummy.updateMatrix();
        instanced.setMatrixAt(i, dummy.matrix);
        cellPositions.push(new THREE.Vector3(x, y, z));
      }
      instanced.instanceMatrix.needsUpdate = true;
      colonyGroup.add(instanced);

      const hairCount = cellPositions.length;
      const hairPositions = new Float32Array(hairCount * 2 * 3);
      const hairIsTip = new Float32Array(hairCount * 2);
      const hairBasePosAttr = new Float32Array(hairCount * 2 * 3);
      const hairPhaseOffset = new Float32Array(hairCount * 2);
      
      for (let i = 0; i < hairCount; i++) {
        const cell = cellPositions[i];
        const dir = new THREE.Vector3(cell.x, cell.y, cell.z).normalize();
        const tip = cell.clone().add(dir.multiplyScalar(0.08));
        hairPositions[i * 6 + 0] = cell.x;
        hairPositions[i * 6 + 1] = cell.y;
        hairPositions[i * 6 + 2] = cell.z;
        hairPositions[i * 6 + 3] = tip.x;
        hairPositions[i * 6 + 4] = tip.y;
        hairPositions[i * 6 + 5] = tip.z;
        
        hairIsTip[i * 2 + 0] = 0.0; // 根元
        hairIsTip[i * 2 + 1] = 1.0; // 先端
        
        hairBasePosAttr[i * 2 * 3 + 0] = cell.x;
        hairBasePosAttr[i * 2 * 3 + 1] = cell.y;
        hairBasePosAttr[i * 2 * 3 + 2] = cell.z;
        hairBasePosAttr[i * 2 * 3 + 3] = cell.x;
        hairBasePosAttr[i * 2 * 3 + 4] = cell.y;
        hairBasePosAttr[i * 2 * 3 + 5] = cell.z;
        
        const phase = i * 1.23 + c * 0.46;
        hairPhaseOffset[i * 2 + 0] = phase;
        hairPhaseOffset[i * 2 + 1] = phase;
      }
      
      const hairGeo = new THREE.BufferGeometry();
      hairGeo.setAttribute('position', new THREE.BufferAttribute(hairPositions, 3));
      hairGeo.setAttribute('aIsTip', new THREE.BufferAttribute(hairIsTip, 1));
      hairGeo.setAttribute('aBasePos', new THREE.BufferAttribute(hairBasePosAttr, 3));
      hairGeo.setAttribute('aPhaseOffset', new THREE.BufferAttribute(hairPhaseOffset, 1));
      const hairLines = new THREE.LineSegments(hairGeo, this.hairMaterial);
      colonyGroup.add(hairLines);
      colonyGroup.userData.cellPositions = cellPositions;
      colonyGroup.userData.hairPositions = hairPositions;
      colonyGroup.userData.hairGeo = hairGeo;
      colonyGroup.userData.hairLines = hairLines;

      // 初期状態では見えないようにする
      colonyGroup.visible = false;
      this.group.add(colonyGroup);
      this.colonyPool.push(colonyGroup);
    }
  }

  clear() {
    for (let i = 0; i < this.colonyPool.length; i++) {
      this.colonyPool[i].visible = false;
    }
    this.totalSpawned = 0;
  }

  addInstances(num = 2) {
    for (let k = 0; k < num; k++) {
      const poolIndex = this.totalSpawned % this.maxCount;
      const colonyGroup = this.colonyPool[poolIndex];
      
      const randX = (Math.random() - 0.5) * 3.0;
      const randY = (Math.random() - 0.5) * 2.0;
      const zPos = -6.0 + this.totalSpawned * 0.5;
      colonyGroup.position.set(randX, randY, zPos);
      colonyGroup.visible = true;
      
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
