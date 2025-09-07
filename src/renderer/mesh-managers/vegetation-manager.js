'use strict'

import * as THREE from 'three';

export default class VegetationManager {
    constructor() {}

    loadTiles(tiles, tileWidth, tileHeight) {
        this.tiles = tiles.filter(tile => !tile.cell.isWater);
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.count = this.tiles.length;
    }

    buildInstancedMeshes() {
        const geometry = new THREE.PlaneGeometry(0.75 * this.tileWidth, 0.75 * this.tileHeight);
        const material = new THREE.MeshStandardMaterial();
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);
        const colorArr = new Float32Array(this.count * 3);
        this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colorArr, 3);

        this.instancedMesh.receiveShadow = true;
    }

    updateInstancedMeshes() {
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