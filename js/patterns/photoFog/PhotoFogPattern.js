import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const BG_IMAGES = [
  'assets/images/bg01.png',
  'assets/images/bg02.png',
  'assets/images/bg03.png',
  'assets/images/bg04.png',
  'assets/images/bg05.png',
  'assets/images/bg06.png',
];

export class PhotoFogPattern {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;

    this._textures = [];
    this._currentIndex = 0;
    this._elapsed = 0;
    this.SWITCH_INTERVAL = 0.5; //seconds ハードカット切り替え(秒)

    this._group = new THREE.Group();
    this._group.visible = false;
    scene.add(this._group);

    this._buildBackground();
    this._buildFog();
    this._loadTextures();
  }

  _buildBackground() {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uAspectTex: { value: 1.0 },
        uAspectScr: { value: window.innerWidth / window.innerHeight },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.999, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uAspectTex;
        uniform float uAspectScr;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          float scaleX = 1.0;
          float scaleY = 1.0;

          if (uAspectTex > uAspectScr) {
            scaleY = uAspectScr / uAspectTex;
          } else {
            scaleX = uAspectTex / uAspectScr;
          }

          uv = (uv - 0.5) / vec2(scaleX, scaleY) + 0.5;

          if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
          }

          gl_FragColor = texture2D(uTexture, uv);
        }
      `,
      transparent: false,
      depthWrite: false,
      depthTest: false,
    });

    this._bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    this._bgMesh.renderOrder = -8;
    this._group.add(this._bgMesh);
  }

  _buildFog() {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec2 pos = position.xy;
          pos.y = pos.y * 0.5 - 0.5;
          gl_Position = vec4(pos, 0.998, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;

        float hash(vec2 p) {
          p = fract(p * vec2(127.1, 311.7));
          p += dot(p, p + 17.5);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1, 0)), u.x),
            mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x),
            u.y
          );
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          vec2 shift = vec2(100.0);
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = p * 2.0 + shift;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 uv = vUv;

          float edgeNoise = fbm(vec2(uv.x * 3.0, uTime * 0.15));
          float edgeY = 0.55 + edgeNoise * 0.30;
          float baseAlpha = 1.0 - smoothstep(0.0, edgeY, uv.y);

          float fog1 = fbm(vec2(uv.x * 2.5 + uTime * 0.08, uv.y * 2.0 + uTime * 0.05));
          float fog2 = fbm(vec2(uv.x * 5.0 - uTime * 0.06, uv.y * 4.0 + uTime * 0.03));
          float fog3 = fbm(vec2(uv.x * 1.2 + uTime * 0.04, uv.y * 1.5 - uTime * 0.07));

          float fogDensity = fog1 * 0.5 + fog2 * 0.3 + fog3 * 0.2;
          fogDensity = smoothstep(0.3, 0.85, fogDensity);

          float alpha = baseAlpha * fogDensity * 0.82;
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
    });

    this._fogMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), mat);
    this._fogMesh.renderOrder = 15;
    this._group.add(this._fogMesh);
  }

  _loadTextures() {
    const loader = new THREE.TextureLoader();
    BG_IMAGES.forEach((path, i) => {
      loader.load(path, (tex) => {
        this._textures[i] = tex;
        if (i === 0 && this.visible) {
          this._applyTexture(0);
        }
      });
    });
  }

  _applyTexture(index) {
    const tex = this._textures[index];
    if (!tex) return;
    const u = this._bgMesh.material.uniforms;
    u.uTexture.value = tex;
    u.uAspectTex.value = tex.image.width / tex.image.height;
    u.uAspectScr.value = window.innerWidth / window.innerHeight;
  }

  toggle() {
    this.visible = !this.visible;
    this._group.visible = this.visible;
    if (this.visible) {
      this._applyTexture(this._currentIndex);
    }
  }

  update(dt) {
    if (!this.visible) return;

    this._elapsed += dt;
    if (this._elapsed >= this.SWITCH_INTERVAL) {
      this._elapsed = 0;
      this._currentIndex = (this._currentIndex + 1) % BG_IMAGES.length;
      this._applyTexture(this._currentIndex);
    }

    this._fogMesh.material.uniforms.uTime.value += dt;
  }

  setSwitchInterval(interval) {
    this.SWITCH_INTERVAL = Math.max(0.01, Math.min(2.0, interval));
  }

  dispose() {
    this._textures.forEach((t) => {
      if (t) t.dispose();
    });
    this._group.children.forEach((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    this.scene.remove(this._group);
  }
}
