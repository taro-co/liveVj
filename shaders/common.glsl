precision highp float;

uniform float time;
uniform vec2 resolution;

//擬似乱数
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

/**
 * rotation 2D & angle util
 */
mat2 rotate2D(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}
//center基準の角度 (-PI to PI)
float angleFromCenter(vec2 uv, vec2 center) {
    vec2 p = uv - center;
    return atan(p.y, p.x);
}

/**
 * 疑似3D rotation(直径軸回転)
 * Z軸回転 + Y圧縮
 * @param uv 元の座標
 * @param center 回転の中心
 * @param rot 回転量
 * @param tilt 傾き 0.0:平面, 1.0:強い傾き
 */
vec2 pseudo3DRotate(vec2 uv, vec2 center, float rot, float tilt) {
    vec2 p = uv - center;

    //回転
    float c = cos(rot);
    float s = sin(rot);
    mat2 r = mat2(c, -s, s, c);
    p = r * p;

    //Y方向を潰して疑似的に奥行きを作る
    p.y *= mix(1.0, 0.35, tilt);

    return p + center;
}

/**
 * 平面→円球表現
 * @param uv 0-1
 * return 球表面の3D座標 (-1~1)
 */
vec3 sphereProject(vec2 uv) {
    vec2 p = uv * 2.0 - 1.0;

    float r2 = dot(p, p);
    if (r2 > 1.0) discard;

    float z = sqrt(1.0 - r2);
    return vec3(p, z);
}
vec3 rotateX(vec3 p, float a) {
    float s = sin(a);
    float c = cos(a);
    return vec3(
        p.x,
        c * p.y - s * p.z,
        s * p.y + c * p.z
    );
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

/**
 * UVの歪み
 * (縁を壊す)
 */
vec2 distortedUV(vec2 uv, float strength, float speed) {
    float n = noise(uv * 3.0 + time * speed);
    float a = n * 6.2831853; // 0〜2PI

    vec2 offset = vec2(cos(a), sin(a)) * strength;
    return uv + offset;
}