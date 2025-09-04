'use strict'

import * as THREE from 'three';

export default class VegetationManager {
    constructor(tiles, tileWidth, tileHeight, count) {
        this.tiles = tiles;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.count = count;
    }

    buildInstancedMeshes() {
        const geometry = new THREE.PlaneGeometry(0.75 * this.tileWidth, 0.75 * this.tileHeight);
        const material = new THREE.MeshStandardMaterial();
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);
        const colorArr = new Float32Array(this.count * 3);
        this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colorArr, 3);

        let i = 0;
        this.tiles.forEach(tile => {
            // pos
            this.instancedMesh.setMatrixAt(i, tile.vegetation.TSRMatrix);

            i++;
        });
    }

    updateInstancedMeshes() {
        this.updateColors();
        this.updatePos();
    }

    updateColors() {
        let i = 0;
        this.tiles.forEach(tile => {
            if (!tile.cell.isWater) {
                let color = tile.vegetation.currentColor;
                this.instancedMesh.instanceColor.setXYZ(i, color.r, color.g, color.b);
            }
            i++;
        });
        this.instancedMesh.instanceColor.needsUpdate = true;
    }

    updatePos() {
        let i = 0;
        this.tiles.forEach(tile => {
            if (!tile.cell.isWater) {
                this.instancedMesh.setMatrixAt(i, tile.vegetation.TSRMatrix);
            }
            i++;
        });
        this.instancedMesh.instanceMatrix.needsUpdate = true;
    }

    dispose() {
        if (this.instancedMesh) {
            this.instancedMesh.geometry.dispose();
            this.instancedMesh.material.dispose();
            this.instancedMesh = null;
        }
    }

    getDrawable() {
        return this.instancedMesh;
    }
}