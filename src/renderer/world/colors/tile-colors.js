'use strict'

import { lerpColor } from '../../utils/utils.js';

export function cellColor(cell, filterName) {
    if (filterName == "Height") return elevationToColor(cell.elevation);
    if (filterName == "Temperature") return temperatureToColor(cell.temperature);
    if (filterName == "Moisture") return moistureToColor(cell.moisture);
    if (filterName == "Biome") return biomeToColor(cell);
    return 0xff0000;
}

export function seaColor(elevation) {
    let stops = [
        [0.0, 0x3446cc],
        [0.4, 0x3479cc],
    ];
    if (elevation <= stops[0][0]) return stops[0][1];
    if (elevation >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
    for (let i = 0; i < stops.length - 1; i++) {
        const [h1, c1] = stops[i];
        const [h2, c2] = stops[i + 1];
        if (elevation >= h1 && elevation <= h2) {
            const t = (elevation - h1) / (h2 - h1);
            return lerpColor(c1, c2, t);
        }
    }
    return stops[stops.length - 1][1];
}

export function elevationToColor(elevation) {
    let stops = [
        [0.4, 0x303030],
        [1.0, 0xcfcf00],
        [2.0, 0xff00ff],
    ];
    if (elevation <= stops[0][0]) return stops[0][1];
    if (elevation >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
    for (let i = 0; i < stops.length - 1; i++) {
        const [h1, c1] = stops[i];
        const [h2, c2] = stops[i + 1];
        if (elevation >= h1 && elevation <= h2) {
            const t = (elevation - h1) / (h2 - h1);
            return lerpColor(c1, c2, t);
        }
    }
}

function moistureToColor(moisture) {
    return lerpColor(0x000000, 0x066ff, moisture);
}

export function temperatureToColor(temp) {
    let stops = [
        [-20, 0x3434ff],
        [0, 0x111111],
        [26,0x00cc00],
        [32,0xcccc00],
        [50, 0xff3434],
    ];
    if (temp <= stops[0][0]) return stops[0][1];
    if (temp >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
    for (let i = 0; i < stops.length - 1; i++) {
        const [h1, c1] = stops[i];
        const [h2, c2] = stops[i + 1];
        if (temp >= h1 && temp <= h2) {
            const t = (temp - h1) / (h2 - h1);
            return lerpColor(c1, c2, t);
        }
    }
}

export function biomeToColor(cell) {
    const biome = cell.biome;
    const colors = {
        "Tundra":       0xa3914d,
        "Steppe":       0xa89034,
        "Desert":       0xad8f1f,

        "Taiga":        0x9e8451,
        "Temperate":    0x94773d,
        "Savanna":      0x8f6f2f,

        "Boreal":       0x96744d,
        "Forest":       0x8f6a3f, 
        "Rainforest":   0x855d2e,

        "undefined":    0xff0000,
    };

    let baseColor = colors[biome] ?? colors["undefined"];

    // moisture mask
    const moistureFactor = Math.min(1, Math.max(0, cell.moisture));
    baseColor = lerpColor(baseColor, 0x000000, moistureFactor * 0.4);

    // snow mask
    const snowColor = 0xdfdfdf;
    const snowStarts = 2;
    const snowMax = -4;
    let t = 0;
    if (cell.temperature <= snowStarts) {
        t = (snowStarts - cell.temperature) / (snowStarts - snowMax);
        t = Math.min(1, Math.max(0, t));
    }

    return lerpColor(baseColor, snowColor, t);
}
