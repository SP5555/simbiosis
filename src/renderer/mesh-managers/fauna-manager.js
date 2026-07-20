'use strict'

import * as THREE from 'three';
import Herd from '../entities/herd.js';
import { eventBus } from '../../utils/event-emitters.js';
import { EVENTS } from '../../utils/events.js';
import InstancedMeshManager from './instanced-mesh-manager.js';
import { applySelectionEffect } from '../shaders/tile-shader-effects.js';

export default class FaunaManager extends InstancedMeshManager {
    constructor() {
        super();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        eventBus.on(EVENTS.TOGGLE_FAUNA, (visible) =>
            this.toggleVisibility(visible)
        );
    }

    // unlike VegetationManager (one static instance per cell via a
    // width*height grid scan), fauna herds are a sparse Set - iterate it
    // directly, no grid scan needed
    buildFromFaunaSystem(faunaSystem) {
        this.instances = [];

        for (const herd of faunaSystem.getHerds("herbivore")) {
            this.instances.push(new Herd(herd, faunaSystem.width, faunaSystem.height));
        }
        this.count = this.instances.length;
    }

    buildInstancedMeshes() {
        const geometry = new THREE.ConeGeometry(0.4, 0.8, 4); // 4 radial segments = square-base pyramid
        const material = new THREE.MeshStandardMaterial();
        this.createInstancedMesh(geometry, material);
        applySelectionEffect(material);

        const stateAttr = this.createInstancedAttribute('aState', 1);
        this.instances.forEach((herd, i) => herd.bindStateAttribute(stateAttr, i));
    }

    updateInstancedMeshes() {
        if (!this.instancedMesh.visible) { return; }
        this.updateDirtyInstances();
    }

    toggleVisibility(visible) {
        if (this.instancedMesh) this.instancedMesh.visible = visible;
    }
}
