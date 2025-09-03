'use strict'

import * as THREE from 'three';
import Vegetation from '../entities/vegetation.js';
import { lerpColor, addNoiseToColor } from '../utils/utils.js';

class Tile {
    constructor(cell, tileWidth, tileHeight, mapWidth, mapHeight, scale) {
        this.cell = cell;
        
        this.position = new THREE.Vector3(
            this.cell.x * tileWidth + tileWidth / 2 - mapWidth / 2,
            Math.max(cell.elevation, 0.4) * scale * 2,
            this.cell.y * tileHeight + tileHeight / 2 - mapHeight / 2,
        )
        
        this.TSRMatrix = new THREE.Matrix4();
        this.TSRMatrix.makeTranslation(this.position.x, this.position.y, this.position.z);
    }

    updateAnimationState(dt) { }
}

export class WaterTile extends Tile {
    constructor(cell, tileWidth, tileHeight, mapWidth, mapHeight, scale) {
        super(cell, tileWidth, tileHeight, mapWidth, mapHeight, scale);
        this.baseColor = seaColor(this.cell.elevation);
        this.vegetation = new Vegetation(cell, this.position);
        
        // animation
        this.currentColor = null;
        this.phase = Math.random() * Math.PI * 2;
        this.speed = 2;
        this.elapsed = 0;
    }

    updateAnimationState(dt) {
        this.elapsed += dt * this.speed;
        if (this.elapsed > Math.PI * 2) this.elapsed -= Math.PI * 2;

        const wobble = Math.sin(this.elapsed + this.phase) * 0.1;
        this.currentColor = new THREE.Color().setHex(this.baseColor).multiplyScalar(1 + wobble);
    }
}

export class LandTile extends Tile {
    constructor(cell, tileWidth, tileHeight, mapWidth, mapHeight, scale) {
        super(cell, tileWidth, tileHeight, mapWidth, mapHeight, scale);
        this.baseColor = cellColor(this.cell);
        this.vegetation = new Vegetation(cell, this.position);
    }

    updateAnimationState(dt) {
        this.vegetation.update(dt);
    }
}

function cellColor(cell) {
    // height
    // let baseColor = elevationToColor(cell.elevation);
    
    // moisture
    // return lerpColor(0x000000, 0x000ff, cell.moisture);

    // biome
    let baseColor = addNoiseToColor(biomeToColor(cell.biome), 0.01);

    return baseColor;
}

function seaColor(elevation) {
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

function elevationToColor(elevation) {
    let stops = [
        [0.4, 0x303030],
        [2.0, 0xc0c0c0],
        [4.0, 0xffffff],
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

function biomeToColor(biome) {
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
