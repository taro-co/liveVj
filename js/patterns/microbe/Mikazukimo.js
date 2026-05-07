import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const OUTER_COLOR = new THREE.Color(0x2266ff);
const INNER_COLOR = new THREE.Color(0x00ffcc);

export class Mikazukimo {
  constructor() {
    this.group = new THREE.Group();
    this.group.visible = true;
    this.group.name = 'Mikazukimo';
    this.time = 0;
    this._build();
  }

  _build() {
    const curve = this._createCrescentCurve();
    const outerGeometry = new THREE.TubeGeometry(curve, 64, 0.035, 8, false);
    const innerGeometry = new THREE.TubeGeometry(curve, 64, 0.012, 6, false);

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
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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

    const count = 16;
    this.outerMesh = new THREE.InstancedMesh(outerGeometry, outerMaterial, count);
    this.innerMesh = new THREE.InstancedMesh(innerGeometry, innerMaterial, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const scale = 0.75 + Math.sin(i * 0.4) * 0.18;
      dummy.position.set(Math.cos(i * 0.35) * 1.3, Math.sin(i * 0.35) * 1.0, -1.6 - Math.sin(i * 0.6) * 0.25);
      dummy.rotation.set(0, i * 0.25, Math.PI * 0.12);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      this.outerMesh.setMatrixAt(i, dummy.matrix);
      const innerScale = scale * 0.65;
      dummy.scale.setScalar(innerScale);
      dummy.updateMatrix();
      this.innerMesh.setMatrixAt(i, dummy.matrix);
    }

    this.outerMesh.instanceMatrix.needsUpdate = true;
    this.innerMesh.instanceMatrix.needsUpdate = true;

    this.group.add(this.outerMesh, this.innerMesh);
  }

  _createCrescentCurve() {
    const points = [];
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const angle = t * Math.PI * 0.9 - Math.PI * 0.45;
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
    this.group.rotation.y += deltaTime * 0.03;
    this.innerMesh.material.uniforms.uTime.value = this.time;
  }

  dispose() {
    this.outerMesh.geometry.dispose();
    this.outerMesh.material.dispose();
    this.innerMesh.geometry.dispose();
    this.innerMesh.material.dispose();
  }
}
