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
    }

    updateAnimationState(coreDt, simDt) {
        this.updateValue();
        this.updatePos();
        this.updateColor();
    }

    updateValue() {
        this.value = this.simVegetation.value;
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
