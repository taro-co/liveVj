precision highp float;

/**
 *  TODO: フィールドの上に乗った粒子などを動かすための「フィールド」
 * 空間の性質を定義する関数(円、距離、分布など)
 */

/**
 * 縦線Fields
 */
/*float verticalLine(vec2 uv) {
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
}*/

/**
 * 円形フィールド
 * uv      : 正規化座標 (0–1)
 * center  : 円の中心
 * radius  : 半径（0–0.5 程度）
 * softness: ぼかし量（大きいほど柔らかい）
 */
float circleField(vec2 uv, vec2 center, float radius, float softness) {
    float d = length(uv - center);

    // 半径を中心にしたガウス的減衰
    float field = exp(-pow(d / radius, softness));

    return field;
}

/**
 * 円の外周（リング）を作るフィールド
 * @param thickness : 外周の太さ
 */
float circleRingField(
    vec2 uv,
    vec2 center,
    float radius,
    float thickness
) {
    float d = length(uv - center);
    float ring = smoothstep(radius + thickness, radius, d)
               - smoothstep(radius, radius - thickness, d);
    return ring;
}

// 半径方向のエネルギー分布
float radialEnergy(vec2 uv, vec2 center, float radius) {
    float d = length(uv - center);

    // 外周にエネルギーを集約
    float ring = smoothstep(radius * 0.5, radius * 0.9, d);

    // 外側は減衰
    float fadeOut = 1.0 - smoothstep(radius, radius * 1.4, d);

    // コントラストを立てる
    float energy = ring * fadeOut;
    energy = pow(energy, 2.5);

    return energy;
}

// 2D回転 座標
vec2 rotate2DVec(vec2 p, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec2(
        c * p.x - s * p.y,
        s * p.x + c * p.y
    );
}

float ringField(vec2 uv, vec2 center, float radius, float thickness) {
    float d = length(uv - center);

    // 外周でピークを持つリング
    float ring = 1.0 - abs(d - radius) / thickness;
    ring = clamp(ring, 0.0, 1.0);

    // エネルギー感を強調
    ring = pow(ring, 3.0);

    return ring;
}