'use strict'

import * as THREE from 'three';

export default class InstancedMeshManager {
    constructor() {
        this.instances = null;
        this.count = null;
        this.filter = null;
        this.instancedMesh = null;
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
