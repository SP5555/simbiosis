'use strict'

import * as THREE from 'three';

export default class Vegetation {
    constructor(vegetation, position) {
        this.simVegetation = vegetation;
        this.position = position;
        this.value = this.simVegetation.value;
        this.biome = this.simVegetation.biome;

        this.colors = {
            base: new THREE.Color().setHex(0x00eb00)
        };

        this.rotationMatrix = new THREE.Matrix4().makeRotationX(- Math.PI / 2);
        this.TSRMatrix = new THREE.Matrix4();
        const translateMatrix = new THREE.Matrix4().makeTranslation(
            this.position.x,
            this.position.y,
            this.position.z,
        );
        this.TSRMatrix.multiply(translateMatrix).multiply(this.rotationMatrix);

        // growth only needs to be re-rendered when it actually moved
        // meaningfully; `dirty` is only ever cleared by whoever flushes it
        // to the GPU (see InstancedMeshManager.updateDirtyInstances), not
        // here, so a change that happens while vegetation is hidden stays
        // flagged until it's actually uploaded
        this.lastValue = undefined;
        this.dirty = false;
    }

    updateAnimationState(coreDt, simDt) {
        this.updateValue();
    }

    updateValue() {
        const newValue = this.simVegetation.value;
        if (this.lastValue !== undefined && Math.abs(newValue - this.lastValue) < 0.05) return;

        this.lastValue = newValue;
        this.value = newValue;
        this.updatePos();
        this.updateColor();
        this.dirty = true;
    }

    updatePos() {
        const veg = Math.min(this.value, 100);
        const s = 0.2 + 0.008 * veg;
        const scaleMatrix = new THREE.Matrix4().makeScale(s, s, 1);
        const translateMatrix = new THREE.Matrix4().makeTranslation(
            this.position.x,
            this.position.y + (veg > 0 ? 1.05 : 0),
            this.position.z
        );
        this.TSRMatrix = new THREE.Matrix4()
            .multiply(translateMatrix)
            .multiply(this.rotationMatrix)
            .multiply(scaleMatrix);
    }

    updateColor() {
        const veg = Math.min(this.value, 100);
        const cf = Math.max(0, 1 - 0.008 * veg);
        this.renderColor = this.colors.base.clone().multiplyScalar(cf);
    }
}
