export async function loadShaders() {
  const base = '/shaders/';

  const [common, fields, particles, fragment, vertex] =
    await Promise.all([
      fetch(base + 'common.glsl').then(r => r.text()),
      fetch(base + 'fields.glsl').then(r => r.text()),
      fetch(base + 'particles.glsl').then(r => r.text()),
      fetch(base + 'fragment.glsl').then(r => r.text()),
      fetch(base + 'vertex.glsl').then(r => r.text()),
    ]);

    return {
      vertexShader: vertex,
      fragmentShader: `
      ${common} // 共通関数(uniforms, utils)
      ${fields} // フィールド関数
      ${particles} // パーティクル関数(粒子)
      ${fragment} //main()
      `
    };
}