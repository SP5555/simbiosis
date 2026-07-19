'use strict'

import * as THREE from 'three';
import { hexToColor, interpolateColorStops, lerpColorHex } from '../../utils/color-utils.js';
import {
    BIOME_COLOR_MAP,
    ELEVATION_COLOR_STOPS,
    FERTILITY_COLOR_STOPS,
    HUMIDITY_COLOR_STOPS,
    SEA_DEPTH_COLOR_STOPS,
    TEMPERATURE_COLOR_STOPS,
} from './tile-color-data.js';

// filters where the wave color wobble (applied in-shader) should be disabled
const WATER_EXPLICIT_FILTERS = ["Elevation", "Temperature", "Humidity"];

export function usesWaterWobble(filterName) {
    return !WATER_EXPLICIT_FILTERS.includes(filterName);
}

export function waterTileColor(tile) {
    let f = tile.currentFilter;
    if (f == "Elevation")
        return hexToColor(elevationToColorHex(tile.simCell.elevation));
    if (f == "Temperature")
        return hexToColor(temperatureToColorHex(tile.simCell.temperature));
    if (f == "Humidity")
        return hexToColor(humidityToColorHex(tile.simCell.humidity));
    // wave wobble multiply is applied in-shader (see tile-shader-effects.js);
    // diagnostic filters above show the raw gradient unmodified, but the
    // default view blends toward ice as the tile's iceFactor (see
    // computeIceFactor) approaches 1
    return hexToColor(iceOverlayHex(tile.colors.baseHex, tile.iceFactor));
}

export function landTileColor(tile) {
    let f = tile.currentFilter;
    if (f == "Biome")
        return hexToColor(tempDecorHex(tile.colors.baseHex, tile.simCell.temperature));
    if (f == "Elevation")
        return hexToColor(elevationToColorHex(tile.simCell.elevation));
    if (f == "Elevation Gradient")
        return gradientToColor(tile.simCell.gradient);
    if (f == "Temperature")
        return hexToColor(temperatureToColorHex(tile.simCell.temperature));
    if (f == "Fertility")
        return hexToColor(fertilityToColorHex(tile.simCell.fertility));
    if (f == "Humidity")
        return hexToColor(humidityToColorHex(tile.simCell.humidity));
    return hexToColor(0xff0000);
}

export function biomeFertilityToColorHex(biome, fertility) {
    const biomeHex = BIOME_COLOR_MAP[biome] ?? BIOME_COLOR_MAP["undefined"];
    const fertilityFactor = Math.min(1, Math.max(0, fertility));
    return lerpColorHex(biomeHex, 0x000000, fertilityFactor * 0.4);
}

export function seaDepthToColorHex(elev) {
    return interpolateColorStops(elev, SEA_DEPTH_COLOR_STOPS);
}

function elevationToColorHex(elev) {
    return interpolateColorStops(elev, ELEVATION_COLOR_STOPS);
}

function temperatureToColorHex(temp) {
    return interpolateColorStops(temp, TEMPERATURE_COLOR_STOPS);
}

function fertilityToColorHex(fertility) {
    return interpolateColorStops(fertility, FERTILITY_COLOR_STOPS);
}

function humidityToColorHex(humidity) {
    return interpolateColorStops(humidity, HUMIDITY_COLOR_STOPS);
}

// 0 (liquid) -> 1 (fully frozen) over a small band around freezing, not a
// hard snap - also drives the in-shader wave dampening (see WaterTile and
// tile-shader-effects.js's applyWaveEffect)
const ICE_START_TEMP = 0;
const ICE_FULL_TEMP = -3;

export function computeIceFactor(temperature) {
    if (temperature >= ICE_START_TEMP) return 0;
    const t = (ICE_START_TEMP - temperature) / (ICE_START_TEMP - ICE_FULL_TEMP);
    return Math.min(1, t);
}

function iceOverlayHex(baseHex, iceFactor) {
    const iceColor = 0xd7ecf5;
    return lerpColorHex(baseHex, iceColor, iceFactor);
}

function tempDecorHex(bcHex, temperature) {
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

function gradientToColor(gradient) {
    const normalizedMag = Math.min(gradient.length() / 1000, 1);
    const angle = Math.atan2(gradient.y, gradient.x); // [-pi, +pi]
    let hue = angle / (2 * Math.PI); // [-0.5, +0.5]
    return new THREE.Color().setHSL(hue, 1.0, 0.6 * normalizedMag);
}