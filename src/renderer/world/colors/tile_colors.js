'use strict'

import { lerpColor, addNoiseToColor } from '../../utils/utils.js';

export function cellColor(cell, filterName) {
    if (filterName == "Height") return elevationToColor(cell.elevation);
    if (filterName == "Temperature") return temperatureToColor(cell.temperature);
    if (filterName == "Moisture") return lerpColor(0x000000, 0x066ff, cell.moisture);
    if (filterName == "Biome") return addNoiseToColor(biomeToColor(cell.biome), 0.01);
    return 0xff0000;
}

export function seaColor(elevation) {
    let stops = [
        [-2.0, 0x3436cc],
        [0.0, 0x3446cc],
        [0.4, 0x3479cc],
    ];
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
        [4.0, 0xff00ff],
    ];
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

export function temperatureToColor(elevation) {
    let stops = [
        [-100, 0x3434ff],
        [0, 0x111111],
        [20,0x00cc00],
        [40,0xcccc00],
        [100, 0xff3434],
    ];
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

export function biomeToColor(biome) {
    const colors = {
        "Tundra":       0xbfbfb8,
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
