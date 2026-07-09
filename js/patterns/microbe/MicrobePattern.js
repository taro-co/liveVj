import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { Mikazukimo } from './Mikazukimo.js';
import { Temarimushi } from './Temarimushi.js';
import { Rappamushi } from './Rappamushi.js';
import { Tsuriganemushi } from './Tsuriganemushi.js';
import { Cyanobacteria } from './Cyanobacteria.js';

export class MicrobePattern {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.renderOrder = 5;
    scene.add(this.group);

    this.enabled = false;
    this.group.visible = this.enabled;
    this.speciesOrder = ['cyanobacteria', 'temarimushi', 'mikazukimo', 'rappamushi', 'tsuriganemushi'];
    this.species = {
      cyanobacteria: new Cyanobacteria(),
      mikazukimo: new Mikazukimo(),
      rappamushi: new Rappamushi(),
      temarimushi: new Temarimushi(),
      tsuriganemushi: new Tsuriganemushi(),
    };

    Object.values(this.species).forEach((item) => {
      this.group.add(item.group);
    });

    this.sequenceTime = 0;
    this.lastSpawnTime = -999;
  }

  toggle() {
    this.enabled = !this.enabled;
    this.group.visible = this.enabled;
    if (this.enabled) {
      this.sequenceTime = 0;
      this.lastSpawnTime = -999;
      this.clearAll();
    }
  }

  setVisible(bool) {
    this.enabled = bool;
    this.group.visible = bool;
    if (this.enabled) {
      this.sequenceTime = 0;
      this.lastSpawnTime = -999;
      this.clearAll();
    }
  }

  clearAll() {
    Object.values(this.species).forEach((item) => {
      if (typeof item.clear === 'function') item.clear();
    });
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

    this.sequenceTime += deltaTime;
    
    const phaseIndex = Math.floor(this.sequenceTime / 10);
    const speciesName = this.speciesOrder[phaseIndex % this.speciesOrder.length];
    
    const timeInPhase = this.sequenceTime % 10;
    const currentSpawnStep = Math.floor(timeInPhase / 2);
    const totalSpawnStep = phaseIndex * 5 + currentSpawnStep;
    
    if (totalSpawnStep > this.lastSpawnTime) {
      if (typeof this.species[speciesName].addInstances === 'function') {
        this.species[speciesName].addInstances(2);
      }
      this.lastSpawnTime = totalSpawnStep;
    }

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
