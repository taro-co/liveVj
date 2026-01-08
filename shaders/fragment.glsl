precision highp float;

uniform float time;
uniform vec2 resolution;

uniform float uParticleUI;
uniform float uParticleSize;
uniform float uParticleBrightness;
uniform float uParticleBandHeight;
uniform float uParticleVerticalBias;
uniform float uParticleFlicker; //0.0 = 無 / 1.0 = 強い
uniform float uParticleFlowSpeed;
uniform float uMasterBrightness;

/**粒子サンプリング
*/
//擬似乱数
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float particles(vec2 uv) {

    // 粒子密度を UI で制御
    float density = mix(20.0, 300.0, uParticleUI);

    vec2 gv = fract(uv * density) - 0.5;
    vec2 id = floor(uv * density);

    float rnd = hash(id);

    // 粒子サイズ（UI）
    float size = mix(0.05, 0.35, uParticleSize);

    float d = length(gv);

    // ランダムに間引く
    float mask = step(0.6, rnd);

    float core = smoothstep(size, size - 0.02, d);
    return mask * core * uParticleBrightness;
}

//縦線
float verticalLine(vec2 uv) {
    float sum = 0.0;

    float speed = 0.35;
    float t = fract(time * speed);
    float head = 1.0 - t;
    float fade = smoothstep(1.0, 0.0, t);

    float widthPx = 3.0;
    float width = widthPx / resolution.x;

    // 出現タイミングの seed
    float baseSeed = floor(time * 0.35);

    // 本数（3〜5）
    float countF = mix(3.0, 5.0, hash(vec2(baseSeed, 9.1)));
    int count = int(countF);

    // 最大5本まで描画
    for (int i = 0; i < 5; i++) {
        if (i >= count) break;

        float seed = baseSeed + float(i) * 13.7;

        // 線ごとの時間オフセット
        float offset = hash(vec2(seed, 7.7));
        float localTime = fract(time * speed + offset);

        float head = 1.0 - localTime;
        float fade = smoothstep(1.0, 0.0, localTime);

        // フェード後半を少し暗く
        float dim = mix(1.0, 0.65, smoothstep(0.6, 1.0, localTime));
        fade *= dim;

        // 線のX位置(0.0〜1.0)
        float lineX = hash(vec2(seed, 0.0));

        // 太さを 1〜4px ランダム
        float widthPx = mix(1.0, 3.0, hash(vec2(seed, 3.3)));
        float width = widthPx / resolution.x;
        float line = smoothstep(width, 0.0, abs(uv.x - lineX));

        float mask = step(uv.y, head);
        sum += line * mask;
    }

    return sum * fade;
}

//ノイズ
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    //座標
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    //aspect比補正
    uv -= 0.5;
    uv.x *= resolution.x / resolution.y;
    uv += 0.5;

    /** 粒子密度
    */
    //高解像度グリッド
    vec2 gridUV = uv * 300.0;

    float t = time * mix(0.0, 0.5, uParticleFlowSpeed);

    //密度場
    float field =
        noise(gridUV * 0.6 + vec2(0.0, time * 0.15)) * 0.6 +
        noise(gridUV * 1.2 - vec2(0.0, time * 0.1)) * 0.4;
    
    // 縦方向バイアス（-1.0:下 / 0.0:中央 / +1.0:上）
    float biasY = mix(0.5, 0.5 + uParticleVerticalBias * 0.4, 1.0);

    // エネルギー帯（UI制御）
    vec2 center = vec2(0.5);
    // ピクセル単位の距離
    float distPx = length((uv - center) * resolution);
    // 半径（px）: 150〜300px を UI で制御
    float radius = mix(300.0, 400.0, uParticleBandHeight);
    // エネルギー減衰（ガウス）
    float band = exp(-pow(distPx / radius, 8.0));
    field *= band;

    //粒子化(閾値処理)
    float particle = step(0.88, field);

    // 粒子ID（グリッド基準）
    vec2 pid = floor(gridUV);

    // 粒子ごとの位相
    float flickerPhase = hash(pid);

    // 時間変化（ランダムに点滅）
    float flicker =
        mix(
            1.0,
            smoothstep(
                0.2,
                1.0,
                sin(time * 6.0 + flickerPhase * 6.2831)
        ),
        uParticleFlicker
    );

    // 縦線
    float vLine = verticalLine(uv);

    //kemuri
    float smokeLayer = 0.0;
    if (uSmoke > 0.5) {
        smokeLayer = smoke(uv, time) * 0.25;
    }

    // 合成（粒子 + 縦線）
    float col = particle * 0.9 + vLine;
    //明度調整
    col *= uMasterBrightness;

    gl_FragColor = vec4(vec3(clamp(col, 0.0, 1.0)), 1.0);

}