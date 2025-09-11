import * as THREE from 'three';
import { interpolateColorStops } from '../utils/color-utils.js';
import { SUN_COLOR_STOPS } from './colors/sun-color-data.js';
import { lerpWrap } from '../utils/utils.js';
import { eventBus } from '../../utils/event-emitters.js';
import { EVENTS } from '../../utils/events.js';

// just a directional light
export default class Sun {
    constructor(
    ) {
        this.light = new THREE.DirectionalLight(0xffffff, 4);
        this.light.position.copy(new THREE.Vector3(0, 40, 0));

        this.light.castShadow = true;
        this.light.shadow.camera.left = -60;
        this.light.shadow.camera.right = 60;
        this.light.shadow.camera.top = 60;
        this.light.shadow.camera.bottom = -60;
        this.light.shadow.camera.near = 1;
        this.light.shadow.camera.far = 200;
        this.light.shadow.mapSize.width = 3072;
        this.light.shadow.mapSize.height = 3072;

        this.light.target = new THREE.Object3D();

        this.yearProgress = 0;

        eventBus.on(EVENTS.CAMERA_UPDATED, ({ lookAt, zoomFactor }) => {
            this.updateShadowCamera(lookAt, zoomFactor);
        });
    }

    getDrawable() {
        return this.light;
    }

    update(yearProgress, dt) {
        const alpha = Math.min(dt * 2, 1);
        this.yearProgress = lerpWrap(this.yearProgress, yearProgress, alpha, 0, 1);

        this.updatePosition();
        this.updateColor();
    }

    updatePosition() {
        const angle = this.yearProgress * Math.PI * 2;

        const radius = 30;
        this.light.position.set(
            15 + Math.cos(angle) * radius,
            40,
            -15 + Math.sin(angle) * radius
        );
    }

    updateColor() {
        const targetHex = interpolateColorStops(this.yearProgress, SUN_COLOR_STOPS);
        this.light.color.setHex(targetHex);
    }

    // Update shadow camera to follow the main camera
    updateShadowCamera(cameraLookAt, zoomFactor) {
        const shadowCam = this.light.shadow.camera;

        shadowCam.left = -60 * zoomFactor;
        shadowCam.right = 60 * zoomFactor;
        shadowCam.top = 60 * zoomFactor;
        shadowCam.bottom = -60 * zoomFactor;

        const center = cameraLookAt.clone();
        shadowCam.position.set(center.x, center.y + 40, center.z);
        shadowCam.updateProjectionMatrix();

        this.light.target.position.copy(center);
        this.light.target.updateMatrixWorld();
    }
}
