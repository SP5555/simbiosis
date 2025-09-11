'use strict'

import * as THREE from 'three';

export default class VegetationManager {
    constructor() {}

    loadTiles(tiles) {
        this.tiles = tiles.filter(tile => !tile.cell.isWater);
        this.count = this.tiles.length;
    }

    buildInstancedMeshes() {
        const geometry = new THREE.PlaneGeometry(0.75, 0.75);
        const material = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide });
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);
        const colorArr = new Float32Array(this.count * 3);
        this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colorArr, 3);

        this.instancedMesh.castShadow = true;
        this.instancedMesh.receiveShadow = true;
    }

    updateInstancedMeshes() {
        if (!this.instancedMesh.visible) { return; }
        this.updatePos();
        this.updateColors();
    }

    updatePos() {
        let i = 0;
        this.tiles.forEach(tile => {
            this.instancedMesh.setMatrixAt(i, tile.vegetation.TSRMatrix);
            i++;
        });
        this.instancedMesh.instanceMatrix.needsUpdate = true;
    }

    updateColors() {
        let i = 0;
        this.tiles.forEach(tile => {
            let color = tile.vegetation.renderColor;
            this.instancedMesh.instanceColor.setXYZ(i, color.r, color.g, color.b);
            i++;
        });
        this.instancedMesh.instanceColor.needsUpdate = true;
    }

    toggleVisibility(visible) {
        if (this.instancedMesh) this.instancedMesh.visible = visible;
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