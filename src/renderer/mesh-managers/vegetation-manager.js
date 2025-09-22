'use strict'

import * as THREE from 'three';
import Vegetation from '../entities/vegetation.js';
import { eventBus } from '../../utils/event-emitters.js';
import { EVENTS } from '../../utils/events.js';

export default class VegetationManager {
    constructor() {
        this.instances = null;
        this.count = null;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        eventBus.on(EVENTS.TOGGLE_VEGETATION, (visible) =>
            this.toggleVisibility(visible)
        );
    }

    buildFromFloraSystem(floraSystem) {
        this.instances = [];

        for (let y = 0; y < floraSystem.height; y++) {
            for (let x = 0; x < floraSystem.width; x++) {
                const inst = floraSystem.getSpeciesAt("veg", x, y);
                if (!inst) continue;
                const cell = inst.cell;
                const pos = new THREE.Vector3(
                    cell.x + 0.5 - floraSystem.width/2,
                    Math.max(cell.elevation, 0) / 600,
                    cell.y + 0.5 - floraSystem.height/2
                );
                this.instances.push(new Vegetation(inst, pos));
            }
        }
        this.count = floraSystem.getCountOf("veg");
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
    
    updateAnimationState(dt) {
        for (let inst of this.instances) {
            inst.updateAnimationState(dt);
        }
    }

    updateInstancedMeshes() {
        if (!this.instancedMesh.visible) { return; }
        this.updatePos();
        this.updateColors();
    }

    updatePos() {
        let i = 0;
        this.instances.forEach(inst => {
            this.instancedMesh.setMatrixAt(i, inst.TSRMatrix);
            i++;
        });
        this.instancedMesh.instanceMatrix.needsUpdate = true;
    }

    updateColors() {
        let i = 0;
        this.instances.forEach(inst => {
            let color = inst.renderColor;
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