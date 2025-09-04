'use strict'

import * as THREE from 'three'

export function lerpColor(c1, c2, t) {
    const tt = Math.max(0, Math.min(t, 1));
    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 & 0xff;
    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 & 0xff;
    const r = Math.round(r1 + (r2 - r1) * tt);
    const g = Math.round(g1 + (g2 - g1) * tt);
    const b = Math.round(b1 + (b2 - b1) * tt);
    return (r << 16) | (g << 8) | b;
}

export function addNoiseToColor(color, variation = 0.05) {
    let r = (color >> 16) & 0xff;
    let g = (color >> 8) & 0xff;
    let b = color & 0xff;

    // Apply small random variation
    r = Math.min(255, Math.max(0, r + Math.floor((Math.random() * 2 - 1) * 255 * variation)));
    g = Math.min(255, Math.max(0, g + Math.floor((Math.random() * 2 - 1) * 255 * variation)));
    b = Math.min(255, Math.max(0, b + Math.floor((Math.random() * 2 - 1) * 255 * variation)));

    return (r << 16) | (g << 8) | b;
}

export function hexToColor(hex) {
    return new THREE.Color().setHex(hex);
}