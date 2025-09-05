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
import { SineAnimation } from '../animation/animation-state.js';

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

        this.animation = new SineAnimation({
            speed: -1,
            amplitude: 0.2,
            phase: (cell.elevation / 250) + Math.random() * 2,
        })
    }

    updateAnimationState(dt) {
        this.animation.update(dt);
        this.updatePos();
        this.updateColor();
    }

    updateAnimationProperties(dt) {        
        const anim = this.animation;
        anim.elapsed += anim.speed * dt;
        if (anim.elapsed > TWO_PI) anim.elapsed -= TWO_PI;
        if (anim.elapsed < 0) anim.elapsed += TWO_PI;
    }

    updatePos() {
        const wobble = this.animation.value() * 0.5;
        this.TSRMatrix.makeTranslation(this.position.x, this.position.y + wobble, this.position.z);
    }

    updateColor() {
        this.renderColor = waterTileColor(this);
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

    updateColor() {
        this.renderColor = landTileColor(this);
    }
}