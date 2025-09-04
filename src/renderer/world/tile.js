'use strict'

import * as THREE from 'three';
import Vegetation from '../entities/vegetation.js';
import { hexToColor } from '../utils/utils.js';
import { seaDepthToColor, cellColor, waterColor } from './colors/tile-colors.js';

class Tile {
    constructor(cell, tileWidth, tileHeight, mapWidth, mapHeight, scale) {
        this.cell = cell;
        this.currentFilter = null;
        
        this.position = new THREE.Vector3(
            this.cell.x * tileWidth + tileWidth / 2 - mapWidth / 2,
            Math.max(cell.elevation, 0) * scale / 1000,
            this.cell.y * tileHeight + tileHeight / 2 - mapHeight / 2,
        )
        
        this.TSRMatrix = new THREE.Matrix4();
        this.TSRMatrix.makeTranslation(this.position.x, this.position.y, this.position.z);
    }

    updateAnimationState(dt) {
        throw new Error("updateAnimationState() must be implemented in subclass");
    }

    filterChange(filterName) {
        throw new Error("filterChange() must be implemented in subclass");
    }

    updateColor(dt) {
        throw new Error("updateColor() must be implemented in subclass");
    }
}

export class WaterTile extends Tile {
    constructor(cell, tileWidth, tileHeight, mapWidth, mapHeight, scale) {
        super(cell, tileWidth, tileHeight, mapWidth, mapHeight, scale);
        this.baseColor = hexToColor(seaDepthToColor(this.cell.elevation));

        this.vegetation = new Vegetation(cell, this.position);
        
        // animation
        this.currentColor = this.baseColor;
        this.phase = Math.random() * Math.PI * 2;
        this.speed = 2;
        this.elapsed = 0;
    }

    updateAnimationState(dt) {
        this.updateColor(dt);
    }

    filterChange(filterName) {
        this.currentFilter = filterName;
        this.updateColor(0);
    }
    
    updateColor(dt) {
        this.currentColor = waterColor(this, dt);
    }
}

export class LandTile extends Tile {
    constructor(cell, tileWidth, tileHeight, mapWidth, mapHeight, scale) {
        super(cell, tileWidth, tileHeight, mapWidth, mapHeight, scale);
        this.baseColor = cellColor(this.cell);
        
        this.vegetation = new Vegetation(cell, this.position);
        
        // animation
        this.currentColor = this.baseColor;
    }

    updateAnimationState(dt) {
        this.updateColor(dt);
        this.vegetation.update(dt);
    }

    filterChange(filterName) {
        this.currentFilter = filterName;
        this.updateColor(0);
    }

    updateColor(dt) {
        this.currentColor = cellColor(this);
    }
}