'use strict'

import * as THREE from 'three';
import Vegetation from '../entities/vegetation.js';
import { eventBus } from '../../utils/event-emitters.js';
import { EVENTS } from '../../utils/events.js';
import InstancedMeshManager from './instanced-mesh-manager.js';
import { cellToWorldPosition } from '../utils/render-utils.js';

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
                const pos = cellToWorldPosition(cell, floraSystem.width, floraSystem.height);
                this.instances.push(new Vegetation(inst, pos));
            }
        }
        this.count = floraSystem.getCountOf("veg");
    }

    buildInstancedMeshes() {
        const geometry = new THREE.PlaneGeometry(0.75, 0.75);
        const material = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide });
        // a paper-thin double-sided plane is the classic shadow-acne worst
        // case: both faces write near-identical depth into the shadow map,
        // causing self-interference independent of any bias tuning. Forcing
        // the shadow PASS to only ever use one consistent side (regardless
        // of the DoubleSide visible-render setting above) removes that
        // ambiguity; see Sun's normalBias for the other half of the fix.
        material.shadowSide = THREE.FrontSide;
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
