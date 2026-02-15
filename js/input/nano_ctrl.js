export function setupNanoControl(uniforms) {
    if (!navigator.requestMIDIAccess) {
        console.warn('WebMIDI not supported');
        return;
    }

    navigator.requestMIDIAccess().then(
        (midi) => {
            for (const input of midi.inputs.values()) {
                input.onMIDImessage = (e) => onMIDImessage(e, uniforms);
            }
            console.log('nanoKONtroL connected');
        },
        () => console.warn('MIDI access denied')
    );
}

function onMIDImessage(event, uniforms) {
    const [status, cc, value] = event.data;
    if (status !== 176) return; //cc only

    const v = value / 127;

    switch (cc) {
        case 16: //Knob1
            uniforms.uHue.value = v;
            break;

        case 17: //Knob2
            uniforms.uSpin.value = v * 2.0;
            break;
        
        case 18: //Knob3
            uniforms.uHueSpeed.value = v * 0.2;
            break;

        case 32: //Btn
            uniforms.uMode.value = (uniforms.uMode.value + 1.0) % 3.0;
            break;
    }
}