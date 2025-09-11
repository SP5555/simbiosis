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
        this.lightPosOffset = new THREE.Vector3(0, 0, 0);
        this.light = new THREE.DirectionalLight(0xffffff, 4);

        this.light.castShadow = true;
        this.light.shadow.camera.near = 100;
        this.light.shadow.camera.far = 700;
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
        const radius = 60;

        const basePos = new THREE.Vector3(
            150 + Math.cos(angle) * radius,
            400,
            -150 + Math.sin(angle) * radius
        );
        this.light.position.copy(basePos.add(this.lightPosOffset));
        this.light.target.position.copy(this.lightPosOffset);
        this.light.target.updateMatrixWorld();
    }

    updateColor() {
        const targetHex = interpolateColorStops(this.yearProgress, SUN_COLOR_STOPS);
        this.light.color.setHex(targetHex);
    }

    // Update shadow camera to follow the main camera
    updateShadowCamera(cameraLookAt, zoomFactor) {
        const shadowCam = this.light.shadow.camera;

        shadowCam.left      = -100 * zoomFactor;
        shadowCam.right     =  100 * zoomFactor;
        shadowCam.top       =  80 * zoomFactor;
        shadowCam.bottom    = -80 * zoomFactor;
        shadowCam.updateProjectionMatrix();

        this.lightPosOffset = cameraLookAt.clone();
    }
}
