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
        this.renderColor = new THREE.Color();

        this.rotationMatrix = new THREE.Matrix4().makeRotationX(- Math.PI / 2);
        this.TSRMatrix = new THREE.Matrix4();
        // scratch matrices reused every updatePos() call below instead of
        // allocating fresh ones each time - with thousands of actively
        // growing vegetation instances, that allocation added up
        this._scaleMatrix = new THREE.Matrix4();
        this._translateMatrix = new THREE.Matrix4();

        this._translateMatrix.makeTranslation(
            this.position.x,
            this.position.y,
            this.position.z,
        );
        this.TSRMatrix.copy(this._translateMatrix).multiply(this.rotationMatrix);

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
        // the alive/dead boundary always counts as significant, even when
        // the numeric delta is tiny - otherwise a death that happens to
        // occur right after a small registered value (e.g. lastValue=0.03
        // collapsing to 0) falls under the magnitude threshold below and
        // gets silently swallowed, leaving a dead plant rendered forever
        const crossedZero = (this.lastValue > 0) !== (newValue > 0);
        if (this.lastValue !== undefined && !crossedZero && Math.abs(newValue - this.lastValue) < 0.05) return;

        this.lastValue = newValue;
        this.value = newValue;
        this.updatePos();
        this.updateColor();
        this.dirty = true;
    }

    updatePos() {
        const veg = Math.min(this.value, 100);
        const s = veg > 0 ? 0.2 + 0.008 * veg : 0;
        this._scaleMatrix.makeScale(s, s, 1);
        this._translateMatrix.makeTranslation(
            this.position.x,
            this.position.y + (veg > 0 ? 1.05 : 0),
            this.position.z
        );
        this.TSRMatrix
            .copy(this._translateMatrix)
            .multiply(this.rotationMatrix)
            .multiply(this._scaleMatrix);
    }

    updateColor() {
        const veg = Math.min(this.value, 100);
        const cf = Math.max(0, 1 - 0.008 * veg);
        this.renderColor.copy(this.colors.base).multiplyScalar(cf);
    }
}
