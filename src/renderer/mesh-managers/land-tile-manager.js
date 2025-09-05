'use strict'

import * as THREE from 'three';

export default class LandTileManager {    
    constructor(tiles, tileWidth, tileHeight) {
        this.tiles = tiles.filter(tile => !tile.cell.isWater);
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.count = this.tiles.length;
    }

    buildInstancedMeshes() {
        const geometry = new THREE.BoxGeometry(this.tileWidth, 1, this.tileHeight, 1, 1, 1);
        const material = new THREE.MeshStandardMaterial();
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);
        const colorArr = new Float32Array(this.count * 3);
        this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colorArr, 3);

        this.updatePos();
    }

    updateInstancedMeshes() {
        this.updateColors();
    }

    updatePos() {
        let i = 0;
        this.tiles.forEach(tile => {
            this.instancedMesh.setMatrixAt(i, tile.TSRMatrix);
            i++;
        });
        this.instancedMesh.instanceMatrix.needsUpdate = true;
    }

    updateColors() {
        let i = 0;
        this.tiles.forEach(tile => {
            let color = tile.renderColor;
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
        return this.instancedMesh;
    }

}