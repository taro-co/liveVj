precision highp float;

uniform float uParticleUI;
uniform float uParticleSize;
uniform float uParticleBrightness;

/** 
*  粒子サンプリング
*/

float particles(vec2 uv) {

    // 粒子密度を UI で制御
    float density = mix(20.0, 300.0, uParticleUI);

    vec2 gv = fract(uv * density) - 0.5;
    vec2 id = floor(uv * density);

    float rnd = hash(id);

    // 粒子サイズ（UI）
    float size = mix(0.12, 0.35, uParticleSize);

    float d = length(gv);

    // ランダムに間引く
    float mask = step(0.3, rnd);

    float core = smoothstep(size, size - 0.06, d);
    return mask * core * uParticleBrightness;
}