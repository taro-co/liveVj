import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { Mikazukimo } from './Mikazukimo.js';
import { Temarimusu } from './Temarimusu.js';
import { Rappamushi } from './Rappamushi.js';
import { Tsuriganemusu } from './Tsuriganemusu.js';
import { Cyanobacteria } from './Cyanobacteria.js';

export class MicrobePattern {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.renderOrder = 5;
    scene.add(this.group);

    this.enabled = true;
    this.species = {
      mikazukimo: new Mikazukimo(),
      temarimusu: new Temarimusu(),
      rappamushi: new Rappamushi(),
      tsuriganemusu: new Tsuriganemusu(),
      cyanobacteria: new Cyanobacteria(),
    };

    Object.values(this.species).forEach((item) => {
      this.group.add(item.group);
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    this.group.visible = this.enabled;
  }

  setVisible(bool) {
    this.enabled = bool;
    this.group.visible = bool;
  }

  toggleSpecies(name) {
    const pattern = this.species[name];
    if (!pattern) return;
    if (typeof pattern.setVisible === 'function') {
      pattern.setVisible(!pattern.group.visible);
    } else if (typeof pattern.toggle === 'function') {
      pattern.toggle();
    }
  }

  update(deltaTime) {
    if (!this.enabled) return;
    Object.values(this.species).forEach((item) => {
      if (typeof item.update === 'function') {
        item.update(deltaTime);
      }
    });
  }

  dispose() {
    Object.values(this.species).forEach((item) => {
      if (typeof item.dispose === 'function') item.dispose();
    });
    this.scene.remove(this.group);
  }
}
