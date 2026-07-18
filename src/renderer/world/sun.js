'use strict'

import * as THREE from 'three';
import { interpolateColorStops, lerpColorHex } from '../utils/color-utils.js';
import { SUN_TEMP_COLOR_STOPS, SUN_WARMING_TINT, SUN_COOLING_TINT } from './colors/sun-color-data.js';
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

        this.positionPhase = 0;
        this.targetColor = new THREE.Color();

        eventBus.on(EVENTS.CAMERA_UPDATED, ({ lookAt, zoomFactor }) => {
            this.updateShadowCamera(lookAt, zoomFactor);
        });
    }

    getDrawable() {
        return this.light;
    }

    update(climate, dt) {
        const alpha = Math.min(dt * 2, 1);
        const { yearProgress, baseTemp, hemisphereName, tempCurve } = climate;
        const { peakOffset, amplitude } = tempCurve;

        // position is a purely decorative circular sweep (no "correct
        // sequence" to preserve), phase-shifted so it stays synced to the
        // hemisphere's actual seasons, and mirrored in direction for
        // Southern as a stylized nod to real hemisphere-mirrored solar
        // motion. Reduces to an identity transform for Northern.
        const direction = hemisphereName === "Southern" ? -1 : 1;
        const targetPositionPhase = (((yearProgress - peakOffset) * direction + 0.25) % 1 + 1) % 1;
        this.positionPhase = lerpWrap(this.positionPhase, targetPositionPhase, alpha, 0, 1);
        this.updatePosition();

        this.updateColor(yearProgress, peakOffset, amplitude, baseTemp, alpha);
    }

    updatePosition() {
        const angle = this.positionPhase * Math.PI * 2;
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

    updateColor(yearProgress, peakOffset, amplitude, baseTemp, alpha) {
        const baseColorHex = interpolateColorStops(baseTemp, SUN_TEMP_COLOR_STOPS);

        // spring and fall sit at the exact same temperature on our
        // symmetric seasonal curve (differ only in whether it's rising or
        // falling), so temperature alone can't tell them apart - a small
        // secondary tint keyed to the direction of change recovers that
        // distinction. Tint strength also scales with the zone's
        // amplitude, so a low-swing zone (Equatorial) barely tints at all
        // while a high-swing zone (Polar) tints more noticeably.
        const rate = -Math.sin(2 * Math.PI * (yearProgress - peakOffset)); // -1 (cooling) .. +1 (warming)
        const tintStrength = Math.abs(rate) * Math.min(1, amplitude / 20) * 0.2;
        const tintHex = rate > 0 ? SUN_WARMING_TINT : SUN_COOLING_TINT;
        const targetHex = lerpColorHex(baseColorHex, tintHex, tintStrength);

        this.targetColor.setHex(targetHex);
        this.light.color.lerp(this.targetColor, alpha);
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
