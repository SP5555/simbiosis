'use strict'

import * as THREE from 'three';
import Vegetation from '../entities/vegetation.js';
import { eventBus } from '../../utils/event-emitters.js';
import { EVENTS } from '../../utils/events.js';
import InstancedMeshManager from './instanced-mesh-manager.js';

export default class VegetationManager extends InstancedMeshManager {
    constructor() {
        super();
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
        this.createInstancedMesh(geometry, material);
    }

    updateInstancedMeshes() {
        if (!this.instancedMesh.visible) { return; }
        this.updateDirtyInstances();
    }

    toggleVisibility(visible) {
        if (this.instancedMesh) this.instancedMesh.visible = visible;
    }
}
