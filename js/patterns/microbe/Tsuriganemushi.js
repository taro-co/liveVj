import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const BODY_COLOR = new THREE.Color(0x3377ff);
const STEM_COLOR = new THREE.Color(0x00ccff);
const HAIR_COLOR = new THREE.Color(0xffffff);

export class Tsuriganemushi {
  constructor() {
    this.group = new THREE.Group();
    this.group.visible = true;
    this.group.name = 'Tsuriganemushi';
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
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: BODY_COLOR },
        uOpacity: { value: 0.22 },
        uFresnel: { value: 0.45 },
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
        uniform float uFresnel;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float fres = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.0);
          float alpha = uOpacity + fres * uFresnel;
          gl_FragColor = vec4(uColor + fres * 0.25, alpha);
        }
      `,
    });

    this.stemMaterial = new THREE.MeshBasicMaterial({
      color: STEM_COLOR,
      transparent: true,
      opacity: 0.38,
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
        uOpacity: { value: 0.5 },
      },
      vertexShader: `
        attribute float aIsTip;
        attribute vec3 aBasePos;
        attribute float aAngle;
        varying float vIsTip;
        uniform float uTime;
        void main() {
          vIsTip = aIsTip;
          vec3 pos = position;
          // 先端のみを揺らぐようにシェーダーで処理
          if (aIsTip > 0.5) {
            vec3 dir = normalize(aBasePos);
            float offset = sin(uTime * 3.2 + aAngle * 1.4) * 0.012;
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
    for (let i = 0; i < this.maxCount; i++) {
      const group = new THREE.Group();
      const profile = [
        new THREE.Vector2(0.0, 0.12),
        new THREE.Vector2(0.06, 0.08),
        new THREE.Vector2(0.07, 0.0),
        new THREE.Vector2(0.05, -0.06),
        new THREE.Vector2(0.02, -0.1),
      ];
      const bellGeo = new THREE.LatheGeometry(profile, 48);
      const bell = new THREE.Mesh(bellGeo, this.bodyMaterial);
      bell.rotation.x = Math.PI * 0.5;
      bell.position.y = 0.1;
      group.add(bell);

      const stemCurve = this._createHelixCurve(0.004, 4.0, 0.25);
      const stemGeo = new THREE.TubeGeometry(stemCurve, 48, 0.008, 6, false);
      const stem = new THREE.Mesh(stemGeo, this.stemMaterial);
      stem.position.y = -0.12;
      group.add(stem);

      const hairCount = 32;
      const hairPositions = new Float32Array(hairCount * 2 * 3);
      const hairIsTip = new Float32Array(hairCount * 2);
      const hairBasePosAttr = new Float32Array(hairCount * 2 * 3);
      const hairAngle = new Float32Array(hairCount * 2);
      const rimRadius = 0.28;
      
      for (let j = 0; j < hairCount; j++) {
        const theta = (j / hairCount) * Math.PI * 2;
        const x = Math.cos(theta) * rimRadius;
        const y = 0.18;
        const z = Math.sin(theta) * rimRadius;
        hairPositions[j * 6 + 0] = x;
        hairPositions[j * 6 + 1] = y;
        hairPositions[j * 6 + 2] = z;
        hairPositions[j * 6 + 3] = x * 1.08;
        hairPositions[j * 6 + 4] = y + 0.04;
        hairPositions[j * 6 + 5] = z * 1.08;
        
        hairIsTip[j * 2 + 0] = 0.0; // 根元
        hairIsTip[j * 2 + 1] = 1.0; // 先端
        
        hairBasePosAttr[j * 2 * 3 + 0] = x;
        hairBasePosAttr[j * 2 * 3 + 1] = y;
        hairBasePosAttr[j * 2 * 3 + 2] = z;
        hairBasePosAttr[j * 2 * 3 + 3] = x;
        hairBasePosAttr[j * 2 * 3 + 4] = y;
        hairBasePosAttr[j * 2 * 3 + 5] = z;
        
        const angle = Math.atan2(z, x);
        hairAngle[j * 2 + 0] = angle;
        hairAngle[j * 2 + 1] = angle;
      }
      
      const hairGeo = new THREE.BufferGeometry();
      hairGeo.setAttribute('position', new THREE.BufferAttribute(hairPositions, 3));
      hairGeo.setAttribute('aIsTip', new THREE.BufferAttribute(hairIsTip, 1));
      hairGeo.setAttribute('aBasePos', new THREE.BufferAttribute(hairBasePosAttr, 3));
      hairGeo.setAttribute('aAngle', new THREE.BufferAttribute(hairAngle, 1));
      const hairLines = new THREE.LineSegments(hairGeo, this.hairMaterial);
      group.add(hairLines);

      // 初期状態では見えないようにする
      group.visible = false;
      this.group.add(group);
      this.instancePool.push({ group, hairGeo, hairPositions });
    }
  }

  clear() {
    for (let i = 0; i < this.instancePool.length; i++) {
      this.instancePool[i].group.visible = false;
    }
    this.totalSpawned = 0;
  }

  addInstances(num = 2) {
    for (let k = 0; k < num; k++) {
      const poolIndex = this.totalSpawned % this.maxCount;
      const instance = this.instancePool[poolIndex];
      
      const isTop = this.totalSpawned % 2 === 0;
      const randX = (Math.random() - 0.5) * 4.0;
      const randY = isTop ? (2.0 + Math.random() * 1.0) : (-2.0 - Math.random() * 1.0);
      const randZ = -1.5 + (Math.random() - 0.5) * 2.0;
      instance.group.position.set(randX, randY, randZ);
      
      instance.group.scale.setScalar(0.9 + (this.totalSpawned % 2) * 0.08);
      instance.group.visible = true;
      
      this.totalSpawned++;
    }
  }

  _createHelixCurve(radius, turns, length) {
    const points = [];
    const segments = 40;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = Math.PI * 2 * turns * t;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, -t * length, Math.sin(angle) * radius));
    }
    return new THREE.CatmullRomCurve3(points);
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
