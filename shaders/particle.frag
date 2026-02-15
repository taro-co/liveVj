precision highp float;

varying float vGlowIntensity;
varying float vColorIndex;
varying float vBrightness;
varying float vTwinkle;

uniform vec3 uStarColors[5];
uniform vec3 uCycleColor;
uniform float uStarInfluence;
uniform float uCycleInfluence;
uniform float uGlowStrength;

void main() {
  // 円形の粒子
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  if (dist > 0.5) discard;

  // 発光効果（中心ほど明るい）
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  glow = pow(glow, 2.0) * uGlowStrength;

  // 星の色を取得
  int index = int(vColorIndex);
  vec3 starColor = uStarColors[index];

  // 星座色とサイクル色をブレンド
  vec3 finalColor = starColor * uStarInfluence + uCycleColor * uCycleInfluence;

  // 個別輝度と点滅を適用
  finalColor *= vBrightness * vTwinkle;

  // 距離による減衰
  float fade = vGlowIntensity;

  vec3 outputColor = finalColor * glow;
  float alpha = glow * fade;

  gl_FragColor = vec4(outputColor, alpha);
}

