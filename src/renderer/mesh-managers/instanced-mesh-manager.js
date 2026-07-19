'use strict'

import * as THREE from 'three';
import { cellToWorldPosition } from '../utils/render-utils.js';

export default class InstancedMeshManager {
    constructor() {
        this.instances = null;
        this.count = null;
        this.filter = null;
        this.instancedMesh = null;
    }

    // shared by managers that place one instance per cell matching some
    // predicate (LandTileManager/WaterTileManager: land vs water) - the loop
    // and positioning are identical, only which cells qualify and which
    // instance class wraps them differs
    buildFromMapCells(map, predicate, InstanceClass) {
        this.instances = [];

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const cell = map.getCell(x, y);
                if (!predicate(cell)) continue;
                const position = cellToWorldPosition(cell, map.width, map.height);
                this.instances.push(new InstanceClass(cell, position));
            }
        }

        this.count = this.instances.length;
    }

    createInstancedMesh(geometry, material) {
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);
        const colorArr = new Float32Array(this.count * 3);
        this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colorArr, 3);

        this.instancedMesh.castShadow = true;
        this.instancedMesh.receiveShadow = true;
    }

    createInstancedAttribute(name, itemSize = 1) {
        const arr = new Float32Array(this.count * itemSize);
        const attr = new THREE.InstancedBufferAttribute(arr, itemSize);
        this.instancedMesh.geometry.setAttribute(name, attr);
        return attr;
    }

    mapFilterChange(filterName) {
        this.filter = filterName;
        for (let inst of this.instances) {
            inst.filterChange(filterName);
        }
    }

    updateAnimationState(coreDt, simDt) {
        for (let inst of this.instances) {
            inst.updateAnimationState(coreDt, simDt);
        }
    }

    updateInstancedMeshes() {
        this.updatePos();
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

    // variant for managers whose instances track their own `colorDirty` flag
    // (skips both the CPU copy and the GPU upload for anything unchanged).
    // Uses addUpdateRange so only the changed entries are re-uploaded to the
    // GPU instead of the whole buffer — with thousands of instances and only
    // a fraction dirty on a given frame, a full-buffer upload every frame is
    // the actual bottleneck, not the (cheap) per-instance CPU math.
    updateDirtyColors() {
        let anyDirty = false;
        this.instances.forEach((inst, i) => {
            if (!inst.colorDirty) return;
            const color = inst.renderColor;
            this.instancedMesh.instanceColor.setXYZ(i, color.r, color.g, color.b);
            this.instancedMesh.instanceColor.addUpdateRange(i * 3, 3);
            anyDirty = true;
        });
        if (anyDirty) this.instancedMesh.instanceColor.needsUpdate = true;
    }

    // variant for managers whose instances track their own `dirty` flag and
    // need both position and color refreshed together (skips both the CPU
    // copy and the GPU upload for anything unchanged); clears the flag after
    // flushing, since it's the consumer's job to do so (see Vegetation).
    // Same partial-upload-range approach as updateDirtyColors above.
    updateDirtyInstances() {
        let anyDirty = false;
        this.instances.forEach((inst, i) => {
            if (!inst.dirty) return;
            this.instancedMesh.setMatrixAt(i, inst.TSRMatrix);
            this.instancedMesh.instanceMatrix.addUpdateRange(i * 16, 16);
            const color = inst.renderColor;
            this.instancedMesh.instanceColor.setXYZ(i, color.r, color.g, color.b);
            this.instancedMesh.instanceColor.addUpdateRange(i * 3, 3);
            inst.dirty = false;
            anyDirty = true;
        });
        if (anyDirty) {
            this.instancedMesh.instanceMatrix.needsUpdate = true;
            this.instancedMesh.instanceColor.needsUpdate = true;
        }
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
