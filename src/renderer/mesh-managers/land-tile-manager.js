'use strict'

import * as THREE from 'three';
import { LandTile } from '../world/tile.js';

export default class LandTileManager {    
    constructor() {
        this.instances = null;
        this.count = null;
        this.filter = null;
    }

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
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);
        const colorArr = new Float32Array(this.count * 3);
        this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colorArr, 3);

        this.instancedMesh.castShadow = true;
        this.instancedMesh.receiveShadow = true;

        this.updatePos();
    }

    mapFilterChange(filterName) {
        this.filter = filterName;
        for (let inst of this.instances) {
            inst.filterChange(filterName);
        }
    }

    updateAnimationState(dt) {
        for (let inst of this.instances) {
            inst.updateAnimationState(dt);
        }
    }

    updateInstancedMeshes() {
        this.updateColors();
    }

    updatePos() {
        let i = 0;
        this.instances.forEach(inst => {
            this.instancedMesh.setMatrixAt(i, inst.TSRMatrix);
            i++;
        });
        this.instancedMesh.instanceMatrix.needsUpdate = true;
    }

    updateColors() {
        let i = 0;
        this.instances.forEach(inst => {
            let color = inst.renderColor;
            this.instancedMesh.instanceColor.setXYZ(i, color.r, color.g, color.b);
            i++;
        });
        this.instancedMesh.instanceColor.needsUpdate = true;
    }

    dispose() {
        if (this.instancedMesh) {
            this.instancedMesh.geometry.dispose();
            this.instancedMesh.material.dispose();
            this.instancedMesh = null;
        }
    }

    getDrawable() {
        if (this.instancedMesh) return this.instancedMesh;
    }
}