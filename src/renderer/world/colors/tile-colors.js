'use strict'

import { lerpColor, addNoiseToColor } from '../../utils/utils.js';

export function cellColor(cell, filterName) {
    if (filterName == "Height") return elevationToColor(cell.elevation);
    if (filterName == "Temperature") return temperatureToColor(cell.temperature);
    if (filterName == "Moisture") return moistureToColor(cell.moisture);
    if (filterName == "Biome") return addNoiseToColor(biomeToColor(cell.biome), 0.01);
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
        [20,0x00cc00],
        [40,0xcccc00],
        [100, 0xff3434],
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

export function biomeToColor(biome) {
    const colors = {
        "Tundra":       0xdfdfd8,
        "Steppe":       0xc4b082,
        "Desert":       0xc4aa4d,

        "Taiga":        0xa88c63,
        "Temperate":    0x8c724c,
        "Savanna":      0x6e5735,

        "Boreal":       0x997642,
        "Forest":       0x8e6d3d, 
        "Rainforest":   0x775c33,

        "undefined":    0xff0000,
    };

    return colors[biome] ?? colors["undefined"];
}
