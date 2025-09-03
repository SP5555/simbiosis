'use strict'

import * as THREE from 'three';
import Vegetation from '../entities/vegetation.js';
import { seaColor, cellColor } from './colors/tile_colors.js';

class Tile {
    constructor(cell, tileWidth, tileHeight, mapWidth, mapHeight, scale) {
        this.cell = cell;
        
        this.position = new THREE.Vector3(
            this.cell.x * tileWidth + tileWidth / 2 - mapWidth / 2,
            Math.max(cell.elevation - 0.4, 0) * scale * 2,
            this.cell.y * tileHeight + tileHeight / 2 - mapHeight / 2,
        )
        
        this.TSRMatrix = new THREE.Matrix4();
        this.TSRMatrix.makeTranslation(this.position.x, this.position.y, this.position.z);
    }

    updateAnimationState(dt) { }

    filterChange(filterName) { }
}

export class WaterTile extends Tile {
    constructor(cell, tileWidth, tileHeight, mapWidth, mapHeight, scale) {
        super(cell, tileWidth, tileHeight, mapWidth, mapHeight, scale);
        this.baseColor = new THREE.Color().setHex(seaColor(this.cell.elevation));
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
        this.currentColor = this.baseColor.clone().multiplyScalar(1 + wobble);
    }

    filterChange(filterName) { }
}

export class LandTile extends Tile {
    constructor(cell, tileWidth, tileHeight, mapWidth, mapHeight, scale) {
        super(cell, tileWidth, tileHeight, mapWidth, mapHeight, scale);
        this.baseColor = new THREE.Color().setHex(cellColor(this.cell, "Biome"));
        this.vegetation = new Vegetation(cell, this.position);
    }

    updateAnimationState(dt) {
        this.vegetation.update(dt);
    }

    filterChange(filterName) {
        this.baseColor = new THREE.Color().setHex(cellColor(this.cell, filterName));
    }
}