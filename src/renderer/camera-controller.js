'use strict'

import * as THREE from 'three';
import { eventBus } from '../utils/event-emitters.js';
import { EVENTS } from '../utils/events.js';
import { isMouseOverGUI } from '../utils/gui-utils.js';

export default class CameraController {
    constructor(input) {
        this.input = input;

        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // sensitivity settings
        this.panSen = 0.08;
        this.zoomSen = 1.6;
        this.parallaxSen = 0.2;
        // damping effect strength
        this.smoothFactor = 16.0;
        
        // pan (internals)
        this.panOffset = new THREE.Vector3(0, 0, 0);
        this.bounds = { width: 0, height: 0 };
        
        // zoom (internals)
        this.zoomFactor = 1.0;
        this.minZoom = 0.4;
        this.maxZoom = 1.4;
        this.zoomStep = 0.1;

        this.position = new THREE.Vector3(0, 60, 30);
        this.lookAtTarget = new THREE.Vector3(0, 0, 0);

        this.currentPosition = this.position.clone();
        this.currentLookAt = this.lookAtTarget.clone();

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        eventBus.on(EVENTS.NEW_SCALE_CALCULATED, ({ width, height }) => {
            this.bounds = { width: width / 2 + 1, height: height / 2 + 1 };
            this.maxZoom = Math.max(width, height) / 60;
            this.zoomFactor = THREE.MathUtils.clamp(this.zoomFactor, this.minZoom, this.maxZoom);
        });
    }

    update(dt) {
        let { dx, dy } = this.input.consumeDelta();
        let scroll = -this.input.consumeScroll();
        const { mouseX, mouseY } = this.input.getMousePos();

        if (isMouseOverGUI()) {
            dx = 0;
            dy = 0;
            scroll = 0;
        }

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
        const shiftX = new THREE.Vector3(1, 0, 0).multiplyScalar(mouseX * this.zoomFactor * this.parallaxSen);
        const shiftY = new THREE.Vector3(0, -1, 1).multiplyScalar(mouseY * this.zoomFactor * this.parallaxSen);
        
        // apply pan
        const pannedPos = this.position.clone().add(this.panOffset);
        const pannedLookAt = this.lookAtTarget.clone().add(this.panOffset);

        // apply zoom
        const zoomedPos = pannedPos.clone().lerp(pannedLookAt, 1 - this.zoomFactor);

        // apply parallax
        const finalPosition = zoomedPos.add(shiftX).add(shiftY);
        const finalLookAt = pannedLookAt;

        const sF = 1 - Math.exp(-dt * this.smoothFactor);
        this.currentPosition.lerp(finalPosition, sF);
        this.currentLookAt.lerp(finalLookAt, sF);

        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);

        eventBus.emit(EVENTS.CAMERA_UPDATED, {
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
