import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { params } from '../config/params.js';

export const uniforms = {
  time: { value: 0 },
  resolution: { value: new THREE.Vector2() },

  uHue: { value: 0.0 },
  uHueSpeed: { value: 0.02 },
  uSpin: { value: 1.0 },
  uMode: { value: 0.0 },
  uParticleUI: { value: 0.6 }, 
  uParticleSize: { value: 0.4 },
  uParticleBrightness: { value: 1.0 },
};