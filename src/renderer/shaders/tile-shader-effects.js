'use strict'

import { simTimeUniform, uiTimeUniform } from './shader-clock.js';
import selectionVertSrc from './chunks/selection.vert.glsl?raw';
import selectionFragSrc from './chunks/selection.frag.glsl?raw';
import waveVertSrc from './chunks/wave.vert.glsl?raw';
import waveFragSrc from './chunks/wave.frag.glsl?raw';

const MAIN_MARKER = '// ---MAIN---';

// Splits a chunk file into its top-level declarations (attribute/varying/
// uniform) and the statements meant to be spliced into a specific shader
// include point (see applySelectionEffect/applyWaveEffect below).
function splitChunk(source) {
    const idx = source.indexOf(MAIN_MARKER);
    return {
        declarations: source.slice(0, idx).trim(),
        body: source.slice(idx + MAIN_MARKER.length).trim(),
    };
}

const selectionVert = splitChunk(selectionVertSrc);
const selectionFrag = splitChunk(selectionFragSrc);
const waveVert = splitChunk(waveVertSrc);
const waveFrag = splitChunk(waveFragSrc);

function chainCompile(existing, fn) {
    return (shader, renderer) => {
        if (existing) existing(shader, renderer);
        fn(shader, renderer);
    };
}

// Three.js caches compiled shader programs and, by default, can't tell two
// otherwise-identical materials with different onBeforeCompile injections
// apart — it will silently reuse whichever program compiled first for both,
// dropping the second material's injected code with no error. Tagging each
// effect here keeps materials with different effect combinations distinct.
function tagEffect(material, name) {
    material.userData._shaderEffects = material.userData._shaderEffects || [];
    material.userData._shaderEffects.push(name);
    const key = material.userData._shaderEffects;
    material.customProgramCacheKey = () => key.join(',');
}

// Adds a per-instance `aState` attribute (0 = none, 1 = hovered, 2 = selected)
// and brightens/pulses the tile's color in-shader, driven by uiTime (which
// keeps advancing even while the simulation is paused, matching the old
// Tile.updateHoveredState/updateSelectedState behavior).
export function applySelectionEffect(material) {
    tagEffect(material, 'selection');
    material.onBeforeCompile = chainCompile(material.onBeforeCompile, (shader) => {
        shader.uniforms.uiTime = uiTimeUniform;

        shader.vertexShader = `${selectionVert.declarations}\n${shader.vertexShader}`
            .replace('#include <begin_vertex>', `#include <begin_vertex>\n${selectionVert.body}`);

        shader.fragmentShader = `${selectionFrag.declarations}\n${shader.fragmentShader}`
            .replace('#include <color_fragment>', `#include <color_fragment>\n${selectionFrag.body}`);
    });
}

// Adds a per-instance `aWaveOffset` attribute and bobs the tile position +
// wobbles its color in-shader, driven by simTime (freezes with the sim,
// matching the old WaterTile wave animation). Position bob always applies;
// the color wobble is gated by the returned uniform's `.value` so it can be
// disabled while a terrain filter (Elevation/Temperature/Humidity) is active,
// matching waterTileColor()'s behavior.
export function applyWaveEffect(material, { speed = -1, posAmplitude = 0.25, colorAmplitude = 0.25 } = {}) {
    tagEffect(material, 'wave');
    const waveColorEnabled = { value: true };

    material.onBeforeCompile = chainCompile(material.onBeforeCompile, (shader) => {
        shader.uniforms.simTime = simTimeUniform;
        shader.uniforms.waveSpeed = { value: speed };
        shader.uniforms.wavePosAmplitude = { value: posAmplitude };
        shader.uniforms.waveColorAmplitude = { value: colorAmplitude };
        shader.uniforms.waveColorEnabled = waveColorEnabled;

        shader.vertexShader = `${waveVert.declarations}\n${shader.vertexShader}`
            .replace('#include <begin_vertex>', `#include <begin_vertex>\n${waveVert.body}`);

        shader.fragmentShader = `${waveFrag.declarations}\n${shader.fragmentShader}`
            .replace('#include <color_fragment>', `#include <color_fragment>\n${waveFrag.body}`);
    });

    return waveColorEnabled;
}
