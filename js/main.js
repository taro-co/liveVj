import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

//Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
    -1, 1, 1, -1, 0, 1
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//uniform
const uniforms = {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() },

    uParticleUI: { value: 0.5 },
    uParticleSize: { value: 0.5 },
    uParticleBrightness: { value: 1.0 },
    uParticleBandHeight: { value: 0.5 },
    uParticleFlowSpeed: { value: 0.5 },
    uMasterBrightness: { value: 1.0 },

/*
    uShowCube: { value: 1.0 },
    uShowParticles: { value: 1.0 },
    uShowSparks: { value: 1.0 },
    uSplit: { value: 0.0 },
    uShowLines: { value: 1.0 },

    uParticleDensity: { value: 200.0 },
    uParticleSpread: { value: 1.0 },
    uSparkAmount: { value: 1.0 },
    uRotateSpeed: { value: 0.5 }
*/
};

//Shader Reading
//const common = await fetch('./shaders/common.glsl').then(r => r.text());
const vertexShader = await fetch('./shaders/vertex.glsl').then(r => r.text());
const fragment = await fetch('./shaders/fragment.glsl').then(r => r.text());
const fragmentShader = fragment;

//平面
const geometry = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial({
    uniforms, vertexShader, fragmentShader
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

//Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
});

//Loop
const clock = new THREE.Clock();
function animate() {
    uniforms.time.value = clock.getElapsedTime();
    uniforms.uParticleUI.value = 0.5; //stab
    uniforms.uParticleSize.value = 0.5; //stab
    uniforms.uParticleBrightness.value = 0.5; //stab
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

//MIDI
navigator.requestMIDIAccess().then(midi => {
    for (const input of midi.inputs.values()) {
        input.onmidimessage = onMIDIMessage => {

            const [, cc, value] = e.data;
            const v = value / 127;

            switch (cc) {
        case 0: // SLIDER 1
            uniforms.uParticleUI.value = v;
            break;

        case 1: // SLIDER 2
            uniforms.uParticleBandHeight.value = v;
            break;

        case 2: // SLIDER 3
            uniforms.uMasterBrightness.value = v;
            break;

        case 16: // KNOB 1
            uniforms.uParticleSize.value = v;
            break;

        case 17: // KNOB 2
            uniforms.uParticleBrightness.value = v * 1.5;
            break;

        case 18: // KNOB 3
            uniforms.uParticleFlowSpeed.value = v;
            break;
        }

        };
    }
});