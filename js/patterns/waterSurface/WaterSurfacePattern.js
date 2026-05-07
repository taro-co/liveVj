import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class WaterSurfacePattern {
  constructor(scene) {
    this.scene = scene;
    this.uniforms = {
      uTime:    { value: 0.0 },
      uOpacity: { value: 1.0 },
    };

    // 全画面を覆う平面（NDC空間で全画面）
    const geometry = new THREE.PlaneGeometry(2, 2);

    const material = new THREE.ShaderMaterial({
      uniforms:       this.uniforms,
      vertexShader:   `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.999, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uTime;
        uniform float uOpacity;
        varying vec2  vUv;

        // ---- ハッシュ ----
        vec2 hash2(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)),
                   dot(p, vec2(269.5, 183.3)));
          return fract(sin(p) * 43758.5453);
        }

        // ---- ボロノイエッジ距離 ----
        float voronoiEdge(vec2 p) {
          vec2  ip = floor(p);
          vec2  fp = fract(p);
          float d1 = 1e9;
          float d2 = 1e9;

          for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
              vec2 nb   = vec2(float(x), float(y));
              vec2 rnd  = hash2(ip + nb);
              // セル内点を時間でゆっくり動かす（セル自体が流動）
              rnd += 0.3 * sin(uTime * 0.4 + rnd * 6.28);
              vec2 diff = nb + rnd - fp;
              float d   = dot(diff, diff);
              if (d < d1) { d2 = d1; d1 = d; }
              else if (d < d2) { d2 = d; }
            }
          }
          return sqrt(d2) - sqrt(d1);
        }

        // ---- UV 歪み ----
        vec2 warpUV(vec2 uv, float t) {
          float s = 0.08;
          float wx = sin(uv.y * 4.0 + t * 0.7) * s
                   + sin(uv.y * 1.5 + t * 0.3) * s * 0.5;
          float wy = sin(uv.x * 3.5 + t * 0.5 + 1.2) * s
                   + sin(uv.x * 2.0 + t * 0.4 + 2.5) * s * 0.5;
          return uv + vec2(wx, wy);
        }

        // ---- コースティクス ----
        float caustics(vec2 uv, float t) {
          float c = 0.0;

          // Layer 1: 大きなセル（低周波）
          vec2 p1 = warpUV(uv, t) * 3.0 + t * vec2(0.10, 0.07);
          c += smoothstep(0.28, 0.0, voronoiEdge(p1)) * 1.0;

          // Layer 2: 中程度のセル
          vec2 p2 = warpUV(uv + 0.3, t * 1.1) * 5.5 + t * vec2(-0.07, 0.12);
          c += smoothstep(0.22, 0.0, voronoiEdge(p2)) * 0.7;

          // Layer 3: 細かいセル（高周波）
          vec2 p3 = warpUV(uv + 0.7, t * 0.8) * 9.0 + t * vec2(0.05, -0.09);
          c += smoothstep(0.18, 0.0, voronoiEdge(p3)) * 0.4;

          return clamp(c, 0.0, 1.0);
        }

        void main() {
          float c   = caustics(vUv, uTime);

          vec3 shadow = vec3(0.48, 0.72, 0.69); // ターコイズ
          vec3 mid    = vec3(0.72, 0.87, 0.85); // ミントシアン
          vec3 light  = vec3(0.95, 0.98, 0.97); // クリーム白

          vec3 col    = mix(shadow, mid,   smoothstep(0.0, 0.4, c));
          col         = mix(col,    light, smoothstep(0.4, 1.0, c));

          float alpha = (0.35 + c * 0.45) * uOpacity;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent:    true,
      depthWrite:     false,
      depthTest:      false,
      blending:       THREE.NormalBlending,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.renderOrder = -5;

    // カメラに追従させるグループ（常に画面全体を覆う）
    this.group = new THREE.Group();
    this.group.add(this.mesh);
    scene.add(this.group);

    this.visible = true;
  }

  // カメラに追従させる場合（オプション）
  attachToCamera(camera) {
    camera.add(this.mesh);
    this.mesh.position.set(0, 0, -1);
    this.group.remove(this.mesh);
  }

  toggle() {
    this.visible = !this.visible;
    this.group.visible = this.visible;
  }

  update(dt) {
    this.uniforms.uTime.value += dt * 0.6;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
