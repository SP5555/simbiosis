'use strict'

import * as THREE from 'three';
import { hexToColor, interpolateColorStops, lerpColorHex } from '../../utils/color-utils.js';
import { BIOME_COLOR_MAP, ELEVATION_COLOR_STOPS, SEA_DEPTH_COLOR_STOPS, TEMPERATURE_COLOR_STOPS } from './tile-color-data.js';

export function waterTileColor(tile) {
    let f = tile.currentFilter;
    if (f == "Elevation")
        return hexToColor(elevationToColorHex(tile.cell.elevation));
    if (f == "Temperature")
        return hexToColor(temperatureToColorHex(tile.cell.temperature));
    if (f == "Humidity")
        return hexToColor(0x449999);
    return waterWobbleColor(tile);
}

export function landTileColor(tile) {
    let f = tile.currentFilter;
    if (f == "Biome")
        return hexToColor(tempDecorHex(tile.colors.baseHex, tile.cell.temperature));
    if (f == "Elevation")
        return hexToColor(elevationToColorHex(tile.cell.elevation));
    if (f == "Elevation Gradient")
        return gradientToColor(tile.cell.gradient);
    if (f == "Temperature")
        return hexToColor(temperatureToColorHex(tile.cell.temperature));
    if (f == "Fertility")
        return hexToColor(fertilityToColorHex(tile.cell.fertility));
    if (f == "Humidity")
        return hexToColor(humidityToColorHex(tile.cell.humidity.value));
    return hexToColor(0xff0000);
}

function waterWobbleColor(tile) {
    return tile.colors.base.clone().multiplyScalar(1 + tile.animation.value());
}

export function biomeFertilityToColor(biome, fertility) {
    const biomeHex = BIOME_COLOR_MAP[biome] ?? BIOME_COLOR_MAP["undefined"];
    const fertilityFactor = Math.min(1, Math.max(0, fertility));
    return lerpColorHex(biomeHex, 0x000000, fertilityFactor * 0.4);
}

export function seaDepthToColorHex(elev) {
    return interpolateColorStops(elev, SEA_DEPTH_COLOR_STOPS);
}

export function elevationToColorHex(elev) {
    return interpolateColorStops(elev, ELEVATION_COLOR_STOPS);
}

export function temperatureToColorHex(temp) {
    return interpolateColorStops(temp, TEMPERATURE_COLOR_STOPS);
}

function fertilityToColorHex(fertility) {
    return lerpColorHex(0x000000, 0x0cc66, fertility);
}

function humidityToColorHex(humidity) {
    return lerpColorHex(0x000000, 0x2446cc, humidity);
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

export function gradientToColor(gradient) {
    const normalizedMag = Math.min(gradient.length() / 1000, 1);
    const angle = Math.atan2(gradient.y, gradient.x); // [-pi, +pi]
    let hue = angle / (2 * Math.PI) + 1; // [0, +1]
    return new THREE.Color().setHSL(hue, 1.0, 0.6 * normalizedMag);
}