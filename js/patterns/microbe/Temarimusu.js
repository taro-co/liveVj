import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const BODY_COLOR = new THREE.Color(0xaaddff);
const HAIR_COLOR = new THREE.Color(0xffffff);

export class Temarimusu {
  constructor() {
    this.group = new THREE.Group();
    this.group.visible = true;
    this.group.name = 'Temarimusu';
    this.time = 0;
    this._build();
  }

  _build() {
    this.colonies = [];
    const bodyMaterial = new THREE.MeshBasicMaterial({
      color: BODY_COLOR,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const hairMaterial = new THREE.LineBasicMaterial({
      color: HAIR_COLOR,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let c = 0; c < 4; c++) {
      const colonyGroup = new THREE.Group();
      const instanceCount = 64;
      const sphereGeo = new THREE.SphereGeometry(0.012, 8, 8);
      const instanced = new THREE.InstancedMesh(sphereGeo, bodyMaterial, instanceCount);
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
      }
      const hairGeo = new THREE.BufferGeometry();
      hairGeo.setAttribute('position', new THREE.BufferAttribute(hairPositions, 3));
      const hairLines = new THREE.LineSegments(hairGeo, hairMaterial);
      colonyGroup.add(hairLines);
      colonyGroup.userData.cellPositions = cellPositions;
      colonyGroup.userData.hairPositions = hairPositions;
      colonyGroup.userData.hairGeo = hairGeo;
      colonyGroup.userData.hairLines = hairLines;

      colonyGroup.position.set((c - 1.5) * 0.9, -0.2 + c * 0.1, -1.2);
      this.group.add(colonyGroup);
      this.colonies.push(colonyGroup);
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
    this.group.rotation.y += deltaTime * 0.02;
    this.colonies.forEach((colony, index) => {
      const positions = colony.userData.hairPositions;
      const cells = colony.userData.cellPositions;
      for (let i = 0; i < cells.length; i++) {
        const base = cells[i];
        const phase = i * 1.23 + index * 0.46;
        const offset = Math.sin(this.time * 2.1 + phase) * 0.02;
        const dir = base.clone().normalize();
        const tip = base.clone().add(dir.multiplyScalar(0.08 + offset));
        positions[i * 6 + 3] = tip.x;
        positions[i * 6 + 4] = tip.y;
        positions[i * 6 + 5] = tip.z;
      }
      colony.userData.hairGeo.attributes.position.needsUpdate = true;
    });
  }

  dispose() {
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
