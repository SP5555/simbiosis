attribute float aWaveOffset;
varying float vWaveOffset;
uniform float simTime;
uniform float waveSpeed;
uniform float wavePosAmplitude;

// ---MAIN---
vWaveOffset = aWaveOffset;
transformed.y += sin(simTime * waveSpeed + aWaveOffset) * wavePosAmplitude;
