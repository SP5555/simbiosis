'use strict'

import * as THREE from 'three';

export default class Vegetation {
    constructor(cell, position) {
        this.cell = cell;
        this.position = position;
        this.value = cell.vegetation.value;
        this.biome = cell.vegetation.biome;

        this.colors = {
            base: new THREE.Color().setHex(0x00cc00)
        };

        this.rotationMatrix = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
        this.TSRMatrix = new THREE.Matrix4();
        const translateMatrix = new THREE.Matrix4().makeTranslation(
            this.position.x,
            this.position.y,
            this.position.z,
        );
        this.TSRMatrix.multiply(translateMatrix).multiply(this.rotationMatrix);
    }

    updateAnimationState(dt) {
        this.updateValue();
        this.updatePos();
        this.updateColor();
    }

    updateValue() {
        this.value = this.cell.vegetation.value;
    }

    updatePos() {
        const veg = Math.min(this.value, 1);
        const s = 0.2 + 0.8 * veg;
        const scaleMatrix = new THREE.Matrix4().makeScale(s, s, 1);
        const translateMatrix = new THREE.Matrix4().makeTranslation(
            this.position.x,
            this.position.y + (veg > 0 ? 0.55 : 0),
            this.position.z
        );
        this.TSRMatrix = new THREE.Matrix4()
            .multiply(translateMatrix)
            .multiply(this.rotationMatrix)
            .multiply(scaleMatrix);
    }

    updateColor() {
        const veg = Math.min(this.value, 1);
        const cf = 1 - 0.8 * veg;
        this.renderColor = this.colors.base.clone().multiplyScalar(cf);
    }
}
