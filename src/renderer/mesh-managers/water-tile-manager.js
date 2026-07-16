'use strict'

import * as THREE from 'three';
import { WaterTile } from '../world/tile.js';
import InstancedMeshManager from './instanced-mesh-manager.js';
import { applySelectionEffect, applyWaveEffect } from '../shaders/tile-shader-effects.js';
import { usesWaterWobble } from '../world/colors/tile-color-core.js';

export default class WaterTileManager extends InstancedMeshManager {
    buildFromMap(map) {
        this.instances = [];

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const cell = map.getCell(x, y);
                if (!cell.isWater) continue;
                const position = new THREE.Vector3(
                    cell.x + 0.5 - map.width / 2,
                    Math.max(cell.elevation, 0) / 600,
                    cell.y + 0.5 - map.height / 2,
                );
                this.instances.push(new WaterTile(cell, position));
            }
        }

        this.count = this.instances.length;
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

        this.updatePos();
    }

    // wave bob is handled in-shader now; the base position set above never
    // changes, so only colors need to be refreshed on subsequent frames,
    // and only where dirty
    updateInstancedMeshes() {
        this.updateDirtyColors();
    }

    mapFilterChange(filterName) {
        super.mapFilterChange(filterName);
        this.waveColorEnabled.value = usesWaterWobble(filterName);
    }
}
