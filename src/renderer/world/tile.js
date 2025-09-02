'use strict'

import * as THREE from 'three';
import Vegetation from '../entities/vegetation.js';

class Tile {
    constructor(cell, tileWidth, tileHeight, mapWidth, mapHeight) {
        this.cell = cell;
        
        this.position = new THREE.Vector3(
            this.cell.x * tileWidth + tileWidth / 2 - mapWidth / 2,
            Math.max(cell.height, 0.4) * 4,
            this.cell.y * tileHeight + tileHeight / 2 - mapHeight / 2,
        )
        
        this.translateMatrix = new THREE.Matrix4();
        this.translateMatrix.makeTranslation(this.position.x, this.position.y, this.position.z);
    }

    updateAnimationState(dt) { }
}

export class WaterTile extends Tile {
    constructor(cell, tileWidth, tileHeight, mapWidth, mapHeight) {
        super(cell, tileWidth, tileHeight, mapWidth, mapHeight);
        this.baseColor = cellColor(this.cell);
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
    constructor(cell, tileWidth, tileHeight, mapWidth, mapHeight) {
        super(cell, tileWidth, tileHeight, mapWidth, mapHeight);
        this.baseColor = cellColor(this.cell);
        this.vegetation = new Vegetation(cell, this.position);
    }

    updateAnimationState(dt) {
        this.vegetation.update(dt);
    }
}

function cellColor(cell) {
    let h = Math.min(Math.max(cell.height, 0), 1);
    let baseColor = heightToColor(h);

    // let m = Math.min(Math.max(cell.moisture, 0), 1) * 0.8;
    // let baseColor = 0x000000;
    // const overlay = 0x000ff;
    // return lerpColor(baseColor, overlay, m);

    return baseColor;
}

function heightToColor(height) {
    let stops = [
        [0.0, 0x3456cc],
        [0.4, 0x3479cc],
        [0.4, 0xcfa947],
        [0.6, 0xb49043],
        [0.7, 0xa17339],
        [0.9, 0x8b8177],
        [1.0, 0xaca49d],
    ];
    for (let i = 0; i < stops.length - 1; i++) {
        const [h1, c1] = stops[i];
        const [h2, c2] = stops[i + 1];
        if (height >= h1 && height <= h2) {
            const t = (height - h1) / (h2 - h1);
            return lerpColor(c1, c2, t);
        }
    }
    return stops[stops.length - 1][1];
}

function lerpColor(c1, c2, t) {
    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 & 0xff;
    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 & 0xff;
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return (r << 16) | (g << 8) | b;
}