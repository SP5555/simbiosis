'use strict'

import * as THREE from 'three';

export default class Vegetation {
    constructor(cell, position) {
        this.cell = cell;
        this.value = cell.vegetation.value;
        this.biome = cell.vegetation.biome;
        this.position = position;

        this.baseColor = new THREE.Color().setHex(0x00cc00);

        this.rotationMatrix = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
        this.TSRMatrix = new THREE.Matrix4();
        const translateMatrix = new THREE.Matrix4().makeTranslation(
            this.position.x,
            this.position.y,
            this.position.z,
        );
        this.TSRMatrix.multiply(translateMatrix).multiply(this.rotationMatrix);
    }

    update(dt) {
        this.value = this.cell.vegetation.value;
        const veg = Math.min(this.value, 1);
        const s = 0.2 + 0.8 * veg;
        const TRSMatrix = new THREE.Matrix4();
        const scaleMatrix = new THREE.Matrix4().makeScale(s, s, 1);
        const translateMatrix = new THREE.Matrix4();
        if (veg > 0) {
            translateMatrix.makeTranslation(
                this.position.x,
                this.position.y + 0.55,
                this.position.z,
            );
        } else {
            translateMatrix.makeTranslation(
                this.position.x,
                this.position.y,
                this.position.z,
            );
        }
        TRSMatrix.multiply(translateMatrix).multiply(this.rotationMatrix).multiply(scaleMatrix);
        this.TSRMatrix = TRSMatrix;

        let cf = (1 - 0.8 * veg);
        this.currentColor = this.baseColor.clone().multiplyScalar(cf);
    }
}
