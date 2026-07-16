'use strict'

import * as THREE from 'three';
import { hexToColor } from '../utils/color-utils.js';
import {
    biomeFertilityToColorHex,
    landTileColor,
    seaDepthToColorHex,
    waterTileColor,
} from './colors/tile-color-core.js';

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

        // hover/select highlighting is rendered in-shader (see tile-shader-effects.js);
        // these just track state so it can be written into the aState attribute
        this.hovered = false;
        this.selected = false;
        this.stateAttribute = null;
        this.instanceIndex = -1;

        // color only depends on the active filter and the cell's temperature,
        // so it's recomputed (and re-uploaded to the GPU) only when either changes
        this.lastFilter = undefined;
        this.colorDirty = false;
    }

    // called once by the mesh manager after the InstancedMesh/geometry is built
    bindStateAttribute(attribute, index) {
        this.stateAttribute = attribute;
        this.instanceIndex = index;
    }

    setHovered(hovered) {
        this.hovered = hovered;
        this.syncState();
    }

    setSelected(selected) {
        this.selected = selected;
        this.syncState();
    }

    syncState() {
        if (!this.stateAttribute) return;
        const state = this.selected ? 2 : (this.hovered ? 1 : 0);
        this.stateAttribute.setX(this.instanceIndex, state);
        this.stateAttribute.needsUpdate = true;
    }

    updateAnimationState(coreDt, simDt) {
        this.updateColor();
    }

    filterChange(filterName) {
        this.currentFilter = filterName;
    }

    updateColor() {
        if (this.currentFilter === this.lastFilter && !this.simCell.tempChanged) {
            this.colorDirty = false;
            return;
        }
        this.lastFilter = this.currentFilter;
        this.renderColor = this.computeColor();
        this.colorDirty = true;
    }

    computeColor() {
        throw new Error("computeColor() must be implemented in subclass");
    }
}

export class WaterTile extends Tile {
    constructor(cell, position) {
        super(cell, position);

        this.colors.baseHex = seaDepthToColorHex(this.simCell.elevation);
        this.colors.base = hexToColor(this.colors.baseHex);

        // fed into the water shader's aWaveOffset attribute; drives both the
        // vertex-shader position bob and fragment-shader color wobble
        this.waveOffset = (cell.elevation / 250) + cell.animOffset + Math.random() * 2;
    }

    computeColor() {
        return waterTileColor(this);
    }
}

export class LandTile extends Tile {
    constructor(cell, position) {
        super(cell, position);

        this.colors.baseHex = biomeFertilityToColorHex(this.simCell.biome, this.simCell.fertility);
        this.colors.base = hexToColor(this.colors.baseHex);
    }

    computeColor() {
        return landTileColor(this);
    }
}
