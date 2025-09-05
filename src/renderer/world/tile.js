'use strict'

import * as THREE from 'three';
import Vegetation from '../entities/vegetation.js';
import { hexToColor } from '../utils/color-utils.js';
import {
    biomeToColor,
    elevationToColor,
    gradientToColor,
    landTileColor,
    seaDepthToColor,
    waterTileColor,
} from './colors/tile-color-core.js';

class Tile {
    constructor(cell, position) {
        this.cell = cell;
        this.position = position;

        this.TSRMatrix = new THREE.Matrix4();
        this.TSRMatrix.makeTranslation(this.position.x, this.position.y, this.position.z);

        this.currentFilter = null;
        this.colors = {
            baseHex:    0x000000,
            base:       new THREE.Color(0, 0, 0),
            elevation:  new THREE.Color(0, 0, 0),
            gradient:   new THREE.Color(0, 0, 0),
        };
        this.renderColor = new THREE.Color(0, 0, 0);

        this.animation = {
            phase:      0,
            speed:      0,
            amplitude:  0,
            elapsed:    0,
        };
    }

    updateAnimationState(dt) {
        throw new Error("updateAnimationState() must be implemented in subclass");
    }

    filterChange(filterName) {
        this.currentFilter = filterName;
    }

    updateColor(dt) {
        // this function MUST set this.renderColor or it will appear black
        throw new Error("updateColor() must be implemented in subclass");
    }
}

export class WaterTile extends Tile {
    constructor(cell, position) {
        super(cell, position);

        this.colors.baseHex = seaDepthToColor(this.cell.elevation);
        this.colors.base = hexToColor(this.colors.baseHex);
        this.colors.elevation = hexToColor(elevationToColor(this.cell.elevation));
        this.colors.gradient = gradientToColor(this.cell.gradient);

        this.animation.phase = (cell.elevation / 250) + Math.random() * 2;
        this.animation.speed = -1;
        this.animation.amplitude = 0.2;
    }

    updateAnimationState(dt) {
        this.updateColor(dt);
    }

    updateColor(dt) {
        this.renderColor = waterTileColor(this, dt);
    }
}

export class LandTile extends Tile {
    constructor(cell, position) {
        super(cell, position);

        this.vegetation = new Vegetation(cell, this.position);

        this.colors.baseHex = biomeToColor(this.cell.biome);
        this.colors.base = hexToColor(this.colors.baseHex);
        this.colors.elevation = hexToColor(elevationToColor(this.cell.elevation));
        this.colors.gradient = gradientToColor(this.cell.gradient);
    }

    updateAnimationState(dt) {
        this.updateColor(dt);
        this.vegetation.updateAnimationState(dt);
    }

    updateColor(dt) {
        this.renderColor = landTileColor(this);
    }
}