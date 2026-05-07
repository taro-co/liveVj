import { ConstellationPattern } from './constellation/ConstellationPattern.js';
import { MicrobePattern } from './microbe/MicrobePattern.js';
import { WaterSurfacePattern } from './waterSurface/WaterSurfacePattern.js';
import { PhotoFogPattern } from './photoFog/PhotoFogPattern.js';

export class PatternManager {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.patterns = {};
    this._initPatterns();
    this._registerKeys();
  }

  _initPatterns() {
    this.patterns.constellation = new ConstellationPattern(this.scene);
    this.patterns.photoFog = new PhotoFogPattern(this.scene);
    this.patterns.microbe = new MicrobePattern(this.scene);
    this.patterns.water = new WaterSurfacePattern(this.scene);
  }

  _registerKeys() {
    window.addEventListener('keydown', (event) => {
      const key = event.key;
      const code = event.code;
      const shift = event.shiftKey;

      if (key === '=') this.patterns.microbe.toggle();
      if (key === '\\') this.patterns.water.toggle();

      if (code === 'F1' && !shift) this.patterns.microbe.toggleSpecies('mikazukimo');
      if (code === 'F2' && !shift) this.patterns.microbe.toggleSpecies('temarimusu');
      if (code === 'F3' && !shift) this.patterns.microbe.toggleSpecies('rappamushi');
      if (code === 'F4' && !shift) this.patterns.microbe.toggleSpecies('tsuriganemusu');
      if (code === 'F5' && !shift) this.patterns.microbe.toggleSpecies('cyanobacteria');

      // PhotoFog pattern controls (only when active)
      if (this.patterns.photoFog.visible) {
        if (key === 'o') {
          const decrement = shift ? 0.05 : 0.01;
          const newInterval = this.patterns.photoFog.SWITCH_INTERVAL - decrement;
          this.patterns.photoFog.setSwitchInterval(newInterval);
        }
        if (key === 'l') {
          const increment = shift ? 0.05 : 0.01;
          const newInterval = this.patterns.photoFog.SWITCH_INTERVAL + increment;
          this.patterns.photoFog.setSwitchInterval(newInterval);
        }
      }
    });
  }

  toggle(name) {
    const pattern = this.patterns[name];
    if (pattern) pattern.toggle();
  }

  update(deltaTime) {
    Object.values(this.patterns).forEach((pattern) => {
      if (pattern && typeof pattern.update === 'function') {
        pattern.update(deltaTime);
      }
    });
  }
}
