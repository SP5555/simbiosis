varying float vWaveOffset;
uniform float simTime;
uniform float waveSpeed;
uniform float waveColorAmplitude;
uniform bool waveColorEnabled;

// ---MAIN---
if (waveColorEnabled) {
    diffuseColor.rgb *= 1.0 + sin(simTime * waveSpeed + vWaveOffset) * waveColorAmplitude;
}
