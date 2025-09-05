'use strict'

import * as THREE from 'three';
import { hexToColor, interpolateColorStops, lerpColorHex } from '../../utils/color-utils.js';
import { BIOME_COLOR_MAP, ELEVATION_COLOR_STOPS, SEA_DEPTH_COLOR_STOPS, TEMPERATURE_COLOR_STOPS } from './tile-color-data.js';

export function waterTileColor(tile) {
    let f = tile.currentFilter;
    if (f == "Elevation")
        return tile.colors.elevation;
    return waterWobbleColor(tile);
}

export function landTileColor(tile) {
    let f = tile.currentFilter;
    if (f == "Biome")
        return hexToColor(moisAndTempDecorHex(tile.colors.baseHex, tile.cell.moisture, tile.cell.temperature));
    if (f == "Elevation")
        return tile.colors.elevation;
    if (f == "Elevation Gradient")
        return tile.colors.gradient;
    if (f == "Temperature")
        return hexToColor(temperatureToColorHex(tile.cell.temperature));
    if (f == "Moisture")
        return hexToColor(moistureToColorHex(tile.cell.moisture));
    return hexToColor(0xff0000);
}

function waterWobbleColor(tile) {
    const anim = tile.animation;
    const wobble = Math.sin(anim.elapsed + anim.phase) * anim.amplitude;
    return tile.colors.base.clone().multiplyScalar(1 + wobble);
}

export function biomeToColor(biome) {
    return BIOME_COLOR_MAP[biome] ?? BIOME_COLOR_MAP["undefined"];
}

export function seaDepthToColor(elev) {
    return interpolateColorStops(elev, SEA_DEPTH_COLOR_STOPS);
}

export function elevationToColor(elev) {
    return interpolateColorStops(elev, ELEVATION_COLOR_STOPS);
}

export function temperatureToColorHex(temp) {
    return interpolateColorStops(temp, TEMPERATURE_COLOR_STOPS);
}

function moistureToColorHex(moisture) {
    return lerpColorHex(0x000000, 0x066ff, moisture);
}

function moisAndTempDecorHex(bcHex, moisture, temperature) {
    // moisture mask
    const moistureFactor = Math.min(1, Math.max(0, moisture));
    bcHex = lerpColorHex(bcHex, 0x000000, moistureFactor * 0.4);

    // snow mask
    const snowColor = 0xdfdfdf;
    const snowStartTemp = 2;
    const snowMaxTemp = -4;
    let t = 0;
    if (temperature <= snowStartTemp) {
        t = (snowStartTemp - temperature) / (snowStartTemp - snowMaxTemp);
        t = Math.min(1, Math.max(0, t));
    }
    return lerpColorHex(bcHex, snowColor, t);
}

export function gradientToColor(gradient) {
    const normalizedMag = Math.min(gradient.length() / 1000, 1);
    const angle = Math.atan2(gradient.y, gradient.x); // [-pi, +pi]
    let hue = angle / (2 * Math.PI) + 1; // [0, +1]
    return new THREE.Color().setHSL(hue, 1.0, 0.6 * normalizedMag);
}