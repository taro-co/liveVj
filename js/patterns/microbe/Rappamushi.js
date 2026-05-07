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
    this._build();
  }

  _build() {
    this.instances = [];
    const bodyMaterial = new THREE.ShaderMaterial({
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

    const hairMaterial = new THREE.LineBasicMaterial({
      color: HAIR_COLOR,
      transparent: true,
      opacity: 0.48,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const nucleusMaterial = new THREE.MeshBasicMaterial({
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
    const bellGeo = new THREE.LatheGeometry(profile, 64);

    for (let i = 0; i < 5; i++) {
      const model = new THREE.Group();
      const bell = new THREE.Mesh(bellGeo, bodyMaterial);
      bell.rotation.z = Math.PI * 0.5;
      bell.position.set(0, 0.15, 0);
      bell.scale.setScalar(0.85 + (i % 2) * 0.12);
      model.add(bell);

      const rimCount = 48;
      const rimPositions = new Float32Array(rimCount * 2 * 3);
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
      }
      const rimGeo = new THREE.BufferGeometry();
      rimGeo.setAttribute('position', new THREE.BufferAttribute(rimPositions, 3));
      const rimLines = new THREE.LineSegments(rimGeo, hairMaterial);
      model.add(rimLines);

      const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), nucleusMaterial);
      nucleus.position.set(0, 0.0, 0.05);
      model.add(nucleus);

      model.position.set(-1.4 + i * 0.7, 0.8 + (i % 2) * -0.18, -1.1);
      this.group.add(model);
      this.instances.push({ model, rimGeo, rimLines, rimPositions });
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
    this.group.rotation.y += deltaTime * 0.015;
    this.instances.forEach((instance, idx) => {
      const positions = instance.rimPositions;
      const count = positions.length / 6;
      for (let j = 0; j < count; j++) {
        const baseX = positions[j * 6 + 0];
        const baseY = positions[j * 6 + 1];
        const baseZ = positions[j * 6 + 2];
        const offset = Math.sin(this.time * 3.0 + j * 0.35 + idx) * 0.012;
        const dir = new THREE.Vector3(baseX, baseY, baseZ).normalize();
        const tip = new THREE.Vector3(baseX, baseY, baseZ).addScaledVector(dir, 0.08 + offset);
        positions[j * 6 + 3] = tip.x;
        positions[j * 6 + 4] = tip.y;
        positions[j * 6 + 5] = tip.z;
      }
      instance.rimGeo.attributes.position.needsUpdate = true;
    });
  }

  dispose() {
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
