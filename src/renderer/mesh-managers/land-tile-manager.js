'use strict'

import * as THREE from 'three';
import { LandTile } from '../world/tile.js';
import InstancedMeshManager from './instanced-mesh-manager.js';
import { applySelectionEffect } from '../shaders/tile-shader-effects.js';

export default class LandTileManager extends InstancedMeshManager {
    buildFromMap(map) {
        this.instances = [];

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const cell = map.getCell(x, y);
                if (cell.isWater) continue;
                const position = new THREE.Vector3(
                    cell.x + 0.5 - map.width / 2,
                    Math.max(cell.elevation, 0) / 600,
                    cell.y + 0.5 - map.height / 2,
                );
                this.instances.push(new LandTile(cell, position));
            }
        }

        this.count = this.instances.length;
    }

    buildInstancedMeshes() {
        const geometry = new THREE.BoxGeometry(1, 2, 1, 1, 1, 1);
        const material = new THREE.MeshStandardMaterial();
        this.createInstancedMesh(geometry, material);
        applySelectionEffect(material);

        const stateAttr = this.createInstancedAttribute('aState', 1);
        this.instances.forEach((tile, i) => tile.bindStateAttribute(stateAttr, i));

        this.updatePos();
    }

    // land tile positions never change after being built, so only colors
    // need to be refreshed on subsequent frames, and only where dirty
    updateInstancedMeshes() {
        this.updateDirtyColors();
    }
}
