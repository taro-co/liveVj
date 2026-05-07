import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Cyanobacteria {
  constructor() {
    this.group = new THREE.Group();
    this.group.visible = true;
    this.group.name = 'Cyanobacteria';
    this.time = 0;
    this._build();
  }

  _build() {
    this.filaments = [];
    const tubeMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0.0 },
        uCellSpacing: { value: 0.14 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uCellSpacing;
        varying vec2 vUv;
        void main() {
          float cellLine = abs(fract(vUv.x / uCellSpacing) - 0.5);
          float border = smoothstep(0.25, 0.05, cellLine);
          float tube = 1.0 - abs(vUv.y * 2.0 - 1.0);
          tube = pow(tube, 0.6);
          float alpha = border * tube * 0.7;
          vec3 col = mix(vec3(0.0, 0.6, 1.0), vec3(0.0, 1.0, 0.9), tube);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    const heterocystMaterial = new THREE.MeshBasicMaterial({
      color: 0x88eeff,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const count = 9;
    for (let i = 0; i < count; i++) {
      const path = this._createFilamentCurve(i);
      const tubeGeo = new THREE.TubeGeometry(path, 64, 0.004, 6, false);
      const tube = new THREE.Mesh(tubeGeo, tubeMaterial);
      tube.position.set(-1.9 + (i % 3) * 1.2, 0.9 - Math.floor(i / 3) * 0.9, -1.5);
      tube.rotation.y = (i % 2) * 0.15;
      const group = new THREE.Group();
      group.add(tube);

      const heterocysts = new THREE.Group();
      const heteroCount = 4;
      for (let j = 0; j < heteroCount; j++) {
        const t = j / (heteroCount - 1);
        const pos = path.getPoint(t);
        const cell = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8), heterocystMaterial);
        cell.position.copy(pos);
        heterocysts.add(cell);
      }
      group.add(heterocysts);
      this.group.add(group);
      this.filaments.push({ group, path, tube, tubeGeo });
    }
  }

  _createFilamentCurve(index) {
    const points = [];
    const amplitude = 0.18 + (index % 3) * 0.03;
    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      const x = Math.sin(t * Math.PI * 2 + index) * amplitude;
      const y = THREE.MathUtils.lerp(0.25, -0.25, t);
      const z = t * 0.6;
      points.push(new THREE.Vector3(x, y, z));
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
    this.filaments.forEach((item, idx) => {
      item.group.rotation.z = Math.sin(this.time * 0.18 + idx * 0.45) * 0.08;
      // no per-vertex update required for static tube geometry
    });
    this.group.children.forEach((child) => {
      if (child.material && child.material.uniforms) {
        child.material.uniforms.uTime.value = this.time;
      }
    });
  }

  dispose() {
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
