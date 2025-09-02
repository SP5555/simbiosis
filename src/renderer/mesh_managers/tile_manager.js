'use strict'

import * as THREE from 'three';

export default class TileManager {    
    constructor(tiles, tileWidth, tileHeight, count) {
        this.tiles = tiles;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.count = count;
    }

    buildInstancedMeshes() {
        const geometry = new THREE.BoxGeometry(this.tileWidth, 1, this.tileHeight, 1, 1, 1);
        const material = new THREE.MeshStandardMaterial();
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);
        const colorArr = new Float32Array(this.count * 3);
        this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colorArr, 3);

        let i = 0;
        this.tiles.forEach(tile => {
            // pos
            this.instancedMesh.setMatrixAt(i, tile.translateMatrix);

            // color
            const color = new THREE.Color().setHex(tile.baseColor);
            this.instancedMesh.instanceColor.setXYZ(i, color.r, color.g, color.b);

            i++;
        });
    }

    updateInstancedMeshes() {
        let i = 0;
        this.tiles.forEach(tile => {
            if (tile.cell.isWater) {
                // color
                let color = tile.currentColor;
                this.instancedMesh.instanceColor.setXYZ(i, color.r, color.g, color.b);
            }
            i++;
        });

        this.instancedMesh.instanceColor.needsUpdate = true;
    }

    getDrawable() {
        return this.instancedMesh;
    }

}