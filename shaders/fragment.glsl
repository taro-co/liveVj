precision highp float;

uniform float uHue; // 色相制御用
uniform float uMode;        // 表示モード切替（0,1,2...）
uniform float uSpin;        // 回転量スケール
uniform float uHueSpeed;    // 色相回転スピード

//HSV変換関数
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    // 正規化座標
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    // アスペクト補正
    uv -= 0.5;
    uv.x *= resolution.x / resolution.y;
    uv += 0.5;

    // 円の中心（画面中央）
    vec2 center = vec2(0.5);

    //光の方向性
    vec3 lightDir = normalize(vec3(0.3, 0.6, 1.0));

    /**field回転角
     * 今は固定の時間で回し、後でnanoctrlで制御できるようにする
     */
    float spin = time * uSpin;
    //傾き(0.3~0.8の間で調整)
    float tilt = 0.55;

    // フィールド用UV（ここで空間ごと回す）
    vec2 fieldUV = pseudo3DRotate(uv, center, spin, tilt);

    //円球化
    vec3 sphere = sphereProject(fieldUV);
    sphere = rotateX(sphere, time * uSpin);//X軸回転
    vec2 dUV = sphere.xy * 0.5 + 0.5;

    //中心からのベクトル
    vec2 dir = dUV - center;
    // 半径による色変化（意味付け）
    float r = length(dir);

    //半径方向の正規化ベクトル
    vec2 radialDir = normalize(dir);
    //接線方向 90°回転
    vec2 tangentialDir = vec2(-radialDir.y, radialDir.x);

    //流れの強さ
    float flowStrength = mix(0.04, 0.14, noise(dUV * 4.0 + time * 0.3));
    //流れベクトルの合成
    vec2 flow = tangentialDir;

    //回転寄り / 放射寄りの比率
    //float swirl = 1.0; //1.0=回転
    //float burst = 0.0; //1.0=放射

    // --- 乱流ノイズ ---
    float n = noise(dUV * 6.0 + time * 0.4);
    // ノイズで角度を少し回す
    float noiseAngle = (n - 0.5) * 0.25;
    flow = rotate2D(noiseAngle) * flow;

    // 中心からの角度（-PI ~ PI）
    float angle = atan(dUV.y - center.y, dUV.x - center.x);
    angle += spin; //主回転

    /**
     * 粒子
     */
    // 現在・少し過去・さらに過去
    float t0 = time;
    float t1 = time - 0.15;
    float t2 = time - 0.3;
    // 流れに沿った履歴UV
    vec2 fieldUV0 = dUV + flow * flowStrength * t0;
    vec2 fieldUV1 = dUV + flow * flowStrength * t1;
    vec2 fieldUV2 = dUV + flow * flowStrength * t2;
    // 粒子を時間差で取得
    float p0 = particles(fieldUV0);
    float p1 = particles(fieldUV1);
    float p2 = particles(fieldUV2);
    // 時間差を強調して「軌跡」にする
    float particleBase = p0 * 0.4 + p1 * 0.4 + p2 * 0.2;

    /**
     * 円球スライス合成
     * -- (前提)-- 球 = 円(zSlice)の組み合わせが直径を変えて球になる --
     * z=0(枚数) -> 球の断面,
     * z=-1.0~+1.0(枚数) -> サンプリング-> 球
     */
    //初期値
    const int SLICE_COUNT = 9;
    float sphereField = 0.0;
    float angularAccum = 0.0;
    float baseRadius = 0.25;
    float thickness = 0.02;

    for (int i = 0; i < SLICE_COUNT; i++) {
        // -1.0 ~ +1.0
        float z = mix(-1.0, 1.0, float(i) / float(SLICE_COUNT - 1));

        //手前を明るくする
        float depth = 1.0 - abs(z);
        depth = pow(depth, 1.5); //コントラスト

        //球 断面の半径
        float sliceRadius = baseRadius * sqrt(max(0.0, 1.0 - z * z));
        //疑似法線 z=法線
        float normalZ = sqrt(max(0.0, 1.0 - z * z));

        //Z毎に奥行きを出す
        vec2 sliceUV = dUV;
        sliceUV.y *= mix(1.0, 0.6, abs(z));

        //z毎に回転位相をずらす
        float rotFactor = mix(0.2, 1.0, depth);
        float sliceAngularWave = 
            0.5 + 0.5 * sin(angle * 289.0 - time * 1.2 * rotFactor);

        // リングfield
        float ring = circleRingField(
            sliceUV,
            center,
            sliceRadius,
            thickness
        );

        //光の当たり方
        float lambert = clamp(normalZ * lightDir.z, 0.0, 1.0);

        //z毎の位相ずらし　合成
        sphereField += ring * depth * lambert;
        angularAccum += ring * sliceAngularWave;
    }

    //angle * X の X を変えると波の密度が変わる
    float angularWave = angularAccum / float(SLICE_COUNT);

    /**
     * marker, energy
     */
    //円周のマーカーを回転かくに追従させる
    float markerAngle = spin;
    float angleDiff = abs(angle - markerAngle);
    //角度さをwrap(-PI~PI)
    angleDiff = min(angleDiff,6.2831853 - angleDiff);

    //マーカー幅(細め)
    float marker = smoothstep(0.15, 0.0, angleDiff);
    //リング上のみに制限
    marker *= sphereField;

    //半径で粒子を間引く(星座感)
    float particle = particleBase * sphereField;
    particle *= step(0.2, fract(r * 12.0 + n));

    //field effected
    float fieldInfluence = sphereField * angularWave;
    //particle field
    float particleField = particle * fieldInfluence;
    particleField *= smoothstep(0.0, 0.25, sphereField);

    // 半径方向の密度
    float radial = smoothstep(0.15, 0.35, r);

    // 回転が見えるように乗算
    float energy = particle;
    energy *= angularWave;
    energy += marker * 1.5;
    energy *= smoothstep(0.0, 0.25, sphereField);


    //色加算用
    float finalIntensity = pow(particleField, 0.5);

    //発光用 intensity分離
    float glowCore = pow(finalIntensity, 1.8);//芯
    float glowSoft = pow(finalIntensity, 0.7);//滲み
    float glow = glowCore * 1.4 + glowSoft * 0.6;

    //α用フェード(半径ベース) 内側:1.0, 外側:0.0に自然消滅
    float alphaRadial = smoothstep(0.45, 0.15, r);
    float alphaParticle = smoothstep(0.0, 0.6, finalIntensity);

    


    vec3 baseColor = vec3(0.6, 0.7, 1.0); // 薄い青

    vec3 colored = baseColor * finalIntensity;

    // 内側：白 / 外側：青
    vec3 innerColor = vec3(1.0);
    vec3 outerColor = vec3(0.4, 0.6, 1.0);

    vec3 radiusColor = mix(innerColor, outerColor, smoothstep(0.15, 0.35, r));

    colored = radiusColor * finalIntensity;
    //角度による色相変化
    float angleNorm = (angle + 3.1415926) / (2.0 * 3.1415926);

    // angle : -PI〜PI → 0〜1
    float angleHue = (angle + 3.1415926) / (2.0 * 3.1415926);

    // noise : 0〜1
    float noiseHue = noise(dUV * 4.0 + time * 0.2);

    // flow : 強さだけ使う（方向は無視）
    float flowHue = length(flow) * 2.0;

    // 色相オフセット（全部足すが弱く）
    float hueOffset =
          angleHue * 0.15
        + noiseHue * 0.10
        + flowHue  * 0.10;

    // 最終色相（wrap）
    float finalHue = fract(uHue + hueOffset + time * uHueSpeed);

    // HSV → RGB
    vec3 hueColor = hsv2rgb(vec3(finalHue, 0.6, finalIntensity));

    // 既存色に「色相だけ」上書き
    colored = mix(colored, hueColor, 0.6);
        //色相を uniform で制御
        float hue = fract(uHue);        // 0.0〜1.0
        float sat = 0.6;
        float val = finalIntensity;

    vec3 hsvColor = hsv2rgb(vec3(hue, sat, val));

    // 既存色と軽くブレンド
    colored = mix(colored, hsvColor, 0.5);

    // --- 表示モード切替 ---
    if (uMode < 0.5) { // Mode 0 : 通常（今見えている完成形）
        /* 何もしない */
    } else if (uMode < 1.5) { // Mode 1 : モノクロ（輝度だけ）
        colored = vec3(finalIntensity);
    }
    else { // Mode 2 : 外周強調（VJ用）
        colored *= pow(sphereField, 0.4) * 1.5;
    }

    float front = smoothstep(0.0, 0.15, sphere.z);
    float alpha = alphaRadial * alphaParticle;
    alpha *= front;
    vec3 finalOut = colored * glow + marker * vec3(1.0);
    colored += sphereField * particle;

    gl_FragColor = vec4(finalOut, alpha);

}