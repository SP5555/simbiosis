'use strict'

import * as THREE from 'three';
import { hexToColor } from '../utils/color-utils.js';
import {
    biomeFertilityToColorHex,
    landTileColor,
    seaDepthToColorHex,
    waterTileColor,
} from './colors/tile-color-core.js';
import { AbsSineAnimation, SineAnimation } from '../animation/animation-state.js';

class Tile {
    constructor(cell, position) {
        this.simCell = cell;
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
        this.selected = false;

        this.selectedAnim = new AbsSineAnimation({
            speed: 2,
            amplitude: 0.2,
        })
    }

    setHovered(hovered) {
        this.hovered = hovered;
    }

    setSelected(selected) {
        this.selected = selected;
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

    updateSelectedState() {
        if (this.selected) {
            const swing = this.selectedAnim.value();
            this.renderColor.r = Math.min(1, this.renderColor.r + swing);
            this.renderColor.g = Math.min(1, this.renderColor.g + swing);
            this.renderColor.b = Math.min(1, this.renderColor.b + swing);
        }
    }

    updateHoveredState() {
        if (!this.selected && this.hovered) {
            this.renderColor.r = Math.min(1, this.renderColor.r + 0.2);
            this.renderColor.g = Math.min(1, this.renderColor.g + 0.2);
            this.renderColor.b = Math.min(1, this.renderColor.b + 0.2);
        }
    }
}

export class WaterTile extends Tile {
    constructor(cell, position) {
        super(cell, position);

        this.colors.baseHex = seaDepthToColorHex(this.simCell.elevation);
        this.colors.base = hexToColor(this.colors.baseHex);

        this.waveAnim = new SineAnimation({
            speed: -1,
            amplitude: 0.25,
            offset: (cell.elevation / 250) + cell.animOffset + Math.random() * 2,
        })
    }

    updateAnimationState(coreDt, simDt) {
        this.selectedAnim.update(coreDt);
        this.waveAnim.update(simDt);
        this.updatePos();
        this.updateColor();
    }

    updateAnimationProperties(dt) {        
        const anim = this.waveAnim;
        anim.elapsed += anim.speed * dt;
        if (anim.elapsed > TWO_PI) anim.elapsed -= TWO_PI;
        if (anim.elapsed < 0) anim.elapsed += TWO_PI;
    }

    updatePos() {
        const wobble = this.waveAnim.value();
        this.TSRMatrix.makeTranslation(this.position.x, this.position.y + wobble, this.position.z);
    }

    updateColor() {
        this.renderColor = waterTileColor(this);
        this.updateSelectedState();
        this.updateHoveredState();
    }
}

export class LandTile extends Tile {
    constructor(cell, position) {
        super(cell, position);

        this.colors.baseHex = biomeFertilityToColorHex(this.simCell.biome, this.simCell.fertility);
        this.colors.base = hexToColor(this.colors.baseHex);
    }

    updateAnimationState(coreDt, simDt) {
        this.selectedAnim.update(coreDt);
        this.updateColor();
    }

    updateColor() {
        this.renderColor = landTileColor(this);
        this.updateSelectedState();
        this.updateHoveredState();
    }
}