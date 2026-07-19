'use strict'

import * as THREE from 'three';
import { hexToColor } from '../utils/color-utils.js';
import {
    biomeFertilityToColorHex,
    computeIceFactor,
    landTileColor,
    seaDepthToColorHex,
    waterTileColor,
} from './colors/tile-color-core.js';

// each tile gets its own randomized threshold in this range rather than one
// shared constant, so temperature-driven recolors (e.g. a snowline shifting
// with the season) land on different tiles at different moments instead of
// every tile snapping to the new color in perfect lockstep - a deliberate,
// tunable version of a staggered "patchy thaw/freeze" transition
const TEMP_DIRTY_THRESHOLD_MIN = 0.1;
const TEMP_DIRTY_THRESHOLD_RANGE = 1.9;

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
        // so it's recomputed (and re-uploaded to the GPU) only when either
        // changes meaningfully. Tracks its own last-seen temperature rather
        // than a shared "did it change" flag on the cell — at higher sim
        // speeds several simulation ticks can run per rendered frame, and a
        // shared flag only reflects the last of those ticks, silently
        // dropping updates whose change happened on an earlier tick in the
        // same batch.
        this.lastFilter = undefined;
        this.lastTemp = undefined;
        this.colorDirty = false;
        this.tempThreshold = TEMP_DIRTY_THRESHOLD_MIN + Math.random() * TEMP_DIRTY_THRESHOLD_RANGE;
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
        const tempDelta = this.lastTemp === undefined
            ? Infinity
            : Math.abs(this.simCell.temperature - this.lastTemp);

        if (this.currentFilter === this.lastFilter && tempDelta < this.tempThreshold) {
            this.colorDirty = false;
            return;
        }
        this.lastFilter = this.currentFilter;
        this.lastTemp = this.simCell.temperature;
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

        // 0 (liquid) -> 1 (frozen); recomputed alongside color (see
        // computeColor below) and fed into the aFreeze shader attribute by
        // WaterTileManager to dampen the wave animation as ice forms
        this.iceFactor = 0;
    }

    computeColor() {
        this.iceFactor = computeIceFactor(this.simCell.temperature);
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
