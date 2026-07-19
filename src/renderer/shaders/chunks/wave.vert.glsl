attribute float aWaveOffset;
attribute float aFreeze;
varying float vWaveOffset;
varying float vFreeze;
uniform float simTime;
uniform float waveSpeed;
uniform float wavePosAmplitude;

// ---MAIN---
vWaveOffset = aWaveOffset;
vFreeze = aFreeze;
transformed.y += sin(simTime * waveSpeed + aWaveOffset) * wavePosAmplitude * (1.0 - aFreeze);
