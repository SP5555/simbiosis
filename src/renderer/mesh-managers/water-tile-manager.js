'use strict'

import * as THREE from 'three';
import { WaterTile } from '../world/tile.js';
import InstancedMeshManager from './instanced-mesh-manager.js';
import { applySelectionEffect, applyWaveEffect } from '../shaders/tile-shader-effects.js';
import { usesWaterWobble } from '../world/colors/tile-color-core.js';

export default class WaterTileManager extends InstancedMeshManager {
    buildFromMap(map) {
        this.buildFromMapCells(map, cell => cell.isWater, WaterTile);
    }

    buildInstancedMeshes() {
        const geometry = new THREE.BoxGeometry(1, 2, 1, 1, 1, 1);
        const material = new THREE.MeshStandardMaterial();
        this.createInstancedMesh(geometry, material);
        applySelectionEffect(material);
        this.waveColorEnabled = applyWaveEffect(material);

        const stateAttr = this.createInstancedAttribute('aState', 1);
        this.instances.forEach((tile, i) => tile.bindStateAttribute(stateAttr, i));

        const waveOffsetAttr = this.createInstancedAttribute('aWaveOffset', 1);
        this.instances.forEach((tile, i) => waveOffsetAttr.setX(i, tile.waveOffset));
        waveOffsetAttr.needsUpdate = true;

        this.freezeAttr = this.createInstancedAttribute('aFreeze', 1);
        this.instances.forEach((tile, i) => this.freezeAttr.setX(i, tile.iceFactor));
        this.freezeAttr.needsUpdate = true;

        this.updatePos();
    }

    // wave bob is handled in-shader now; the base position set above never
    // changes, so only colors need to be refreshed on subsequent frames,
    // and only where dirty
    updateInstancedMeshes() {
        this.updateDirtyColors();
        this.updateDirtyFreeze();
    }

    // piggybacks on the same colorDirty flag as updateDirtyColors - iceFactor
    // is recomputed at the exact same time as color (see WaterTile.computeColor),
    // so it's really the same underlying trigger (temperature change), not a
    // separate thing worth its own dirty-tracking
    updateDirtyFreeze() {
        let anyDirty = false;
        this.instances.forEach((tile, i) => {
            if (!tile.colorDirty) return;
            this.freezeAttr.setX(i, tile.iceFactor);
            this.freezeAttr.addUpdateRange(i, 1);
            anyDirty = true;
        });
        if (anyDirty) this.freezeAttr.needsUpdate = true;
    }

    mapFilterChange(filterName) {
        super.mapFilterChange(filterName);
        this.waveColorEnabled.value = usesWaterWobble(filterName);
    }
}
