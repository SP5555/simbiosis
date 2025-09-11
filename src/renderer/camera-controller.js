'use strict'

import * as THREE from 'three';
import { eventBus } from '../utils/event-emitters.js';
import { EVENTS } from '../utils/events.js';

export default class CameraController {
    constructor(input) {
        this.input = input;

        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.position = new THREE.Vector3(0, 60, 40);
        this.lookAtTarget = new THREE.Vector3(0, 0, 4);

        // sensitivity settings
        this.panSen = 0.08;
        this.zoomSen = 1.6;
        this.parallaxSen = 0.2;

        // pan settings
        this.panOffset = new THREE.Vector3(0, 0, 0);
        this.bounds = { width: 80 / 2, height: 60 / 2 };
        
        // zoom settings
        this.zoomFactor = 1.0;
        this.minZoom = 0.2;
        this.maxZoom = 1.0;
        this.zoomStep = 0.1;

        // damping effect strength
        this.smoothFactor = 0.15;

        this.currentPosition = this.position.clone();
        this.currentLookAt = this.lookAtTarget.clone();

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        eventBus.on(EVENTS.NEW_SCALE_CALCULATED, (scale) => {
            this.minZoom = Math.min(scale * 0.25, 0.8);
            this.zoomFactor = THREE.MathUtils.clamp(this.zoomFactor, this.minZoom, this.maxZoom);
        });
    }

    update() {
        const { dx, dy } = this.input.consumeDelta();
        const scroll = -this.input.consumeScroll();

        // pan
        this.panOffset.x -= dx * this.zoomFactor * this.panSen;
        this.panOffset.z -= dy * this.zoomFactor * this.panSen;
        this.panOffset.x = THREE.MathUtils.clamp(this.panOffset.x, -this.bounds.width, this.bounds.width);
        this.panOffset.z = THREE.MathUtils.clamp(this.panOffset.z, -this.bounds.height, this.bounds.height);

        // zoom
        if (scroll !== 0) {
            this.zoomFactor -= scroll * this.zoomStep * this.zoomFactor * this.zoomSen;
            this.zoomFactor = THREE.MathUtils.clamp(this.zoomFactor, this.minZoom, this.maxZoom);
        }

        // parallax
        const shiftX = new THREE.Vector3(1, 0, 0).multiplyScalar(this.input.mouseX * this.zoomFactor * this.parallaxSen);
        const shiftY = new THREE.Vector3(0, -1, 1).multiplyScalar(this.input.mouseY * this.zoomFactor * this.parallaxSen);
        
        // apply pan
        const pannedPos = this.position.clone().add(this.panOffset);
        const pannedLookAt = this.lookAtTarget.clone().add(this.panOffset);

        // apply zoom
        const zoomedPos = pannedPos.clone().lerp(pannedLookAt, 1 - this.zoomFactor);

        // apply parallax
        const finalPosition = zoomedPos.add(shiftX).add(shiftY);
        const finalLookAt = pannedLookAt;

        this.currentPosition.lerp(finalPosition, this.smoothFactor);
        this.currentLookAt.lerp(finalLookAt, this.smoothFactor);

        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);

        eventBus.emit(EVENTS.CAMERA_UPDATED, {
            position: this.currentPosition,
            lookAt: this.currentLookAt,
            zoomFactor: this.zoomFactor
        });
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    getCamera() {
        return this.camera;
    }
}
