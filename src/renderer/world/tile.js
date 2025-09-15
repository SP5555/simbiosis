'use strict'

import * as THREE from 'three';
import { hexToColor } from '../utils/color-utils.js';
import {
    biomeFertilityToColor,
    landTileColor,
    seaDepthToColorHex,
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
        };
        this.renderColor = new THREE.Color(0, 0, 0);

        this.hovered = false;
    }

    setHovered(hovered) {
        this.hovered = hovered;
    }

    updateAnimationState(dt) {
        throw new Error("updateAnimationState() must be implemented in subclass");
    }

    filterChange(filterName) {
        this.currentFilter = filterName;
    }

    updatePos() {
        throw new Error("updatePos() must be implemented in subclass");
    }

    updateColor() {
        // this function MUST set this.renderColor or it will appear black
        throw new Error("updateColor() must be implemented in subclass");
    }

    updateHoverState() {
        if (this.hovered) {
            this.renderColor.r = Math.min(1, this.renderColor.r + 0.3);
            this.renderColor.g = Math.min(1, this.renderColor.g + 0.3);
            this.renderColor.b = Math.min(1, this.renderColor.b + 0.3);
        }
    }
}

export class WaterTile extends Tile {
    constructor(cell, position) {
        super(cell, position);

        this.colors.baseHex = seaDepthToColorHex(this.cell.elevation);
        this.colors.base = hexToColor(this.colors.baseHex);

        this.animation = new SineAnimation({
            speed: -1,
            amplitude: 0.25,
            offset: (cell.elevation / 250) + cell.animOffset + Math.random() * 2,
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
        const wobble = this.animation.value();
        this.TSRMatrix.makeTranslation(this.position.x, this.position.y + wobble, this.position.z);
    }

    updateColor() {
        this.renderColor = waterTileColor(this);
        this.updateHoverState();
    }
}

export class LandTile extends Tile {
    constructor(cell, position) {
        super(cell, position);

        this.colors.baseHex = biomeFertilityToColor(this.cell.biome, this.cell.fertility);
        this.colors.base = hexToColor(this.colors.baseHex);
    }

    updateAnimationState(dt) {
        this.updateColor();
    }

    updateColor() {
        this.renderColor = landTileColor(this);
        this.updateHoverState();
    }
}