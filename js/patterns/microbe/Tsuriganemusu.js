import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const BODY_COLOR = new THREE.Color(0x3377ff);
const STEM_COLOR = new THREE.Color(0x00ccff);
const HAIR_COLOR = new THREE.Color(0xffffff);

export class Tsuriganemusu {
  constructor() {
    this.group = new THREE.Group();
    this.group.visible = true;
    this.group.name = 'Tsuriganemusu';
    this.time = 0;
    this._build();
  }

  _build() {
    this.instances = [];

    const bodyMaterial = new THREE.ShaderMaterial({
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

    const stemMaterial = new THREE.MeshBasicMaterial({
      color: STEM_COLOR,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const hairMaterial = new THREE.LineBasicMaterial({
      color: HAIR_COLOR,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let i = 0; i < 6; i++) {
      const group = new THREE.Group();
      const profile = [
        new THREE.Vector2(0.0, 0.12),
        new THREE.Vector2(0.06, 0.08),
        new THREE.Vector2(0.07, 0.0),
        new THREE.Vector2(0.05, -0.06),
        new THREE.Vector2(0.02, -0.1),
      ];
      const bellGeo = new THREE.LatheGeometry(profile, 48);
      const bell = new THREE.Mesh(bellGeo, bodyMaterial);
      bell.rotation.x = Math.PI * 0.5;
      bell.position.y = 0.1;
      group.add(bell);

      const stemCurve = this._createHelixCurve(0.004, 4.0, 0.25);
      const stemGeo = new THREE.TubeGeometry(stemCurve, 48, 0.008, 6, false);
      const stem = new THREE.Mesh(stemGeo, stemMaterial);
      stem.position.y = -0.12;
      group.add(stem);

      const hairCount = 32;
      const hairPositions = new Float32Array(hairCount * 2 * 3);
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
      }
      const hairGeo = new THREE.BufferGeometry();
      hairGeo.setAttribute('position', new THREE.BufferAttribute(hairPositions, 3));
      const hairLines = new THREE.LineSegments(hairGeo, hairMaterial);
      group.add(hairLines);

      group.position.set(-1.2 + i * 0.55, -0.9 + (i % 2) * 0.14, -1.4 - (i % 2) * 0.07);
      group.scale.setScalar(0.9 + (i % 2) * 0.08);
      this.group.add(group);
      this.instances.push({ group, hairGeo, hairPositions });
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
    this.instances.forEach((item, idx) => {
      const positions = item.hairPositions;
      const count = positions.length / 6;
      for (let j = 0; j < count; j++) {
        const baseX = positions[j * 6 + 0];
        const baseY = positions[j * 6 + 1];
        const baseZ = positions[j * 6 + 2];
        const angle = Math.atan2(baseZ, baseX);
        const offset = Math.sin(this.time * 3.2 + angle * 1.4 + idx) * 0.012;
        const dir = new THREE.Vector3(baseX, baseY, baseZ).normalize();
        const tip = new THREE.Vector3(baseX, baseY, baseZ).addScaledVector(dir, 0.08 + offset);
        positions[j * 6 + 3] = tip.x;
        positions[j * 6 + 4] = tip.y;
        positions[j * 6 + 5] = tip.z;
      }
      item.hairGeo.attributes.position.needsUpdate = true;
    });
  }

  dispose() {
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
