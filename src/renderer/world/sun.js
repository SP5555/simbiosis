'use strict'

import * as THREE from 'three';
import { computeSunColorHex } from './colors/sun-color-core.js';
import { lerpWrap } from '../utils/render-utils.js';
import { eventBus } from '../../utils/event-emitters.js';
import { EVENTS } from '../../utils/events.js';

// terrain's world-space elevation range (see render-utils.js's
// cellToWorldPosition: elevation is clamped to >=0 then scaled by /600,
// and tile geometry extends +/-1 further from that), padded generously -
// used to bound the shadow frustum vertically without needing a map's
// exact elevation extremes
const MIN_WORLD_HEIGHT = -2;
const MAX_WORLD_HEIGHT = 10;

// extra padding added to the fitted frustum on every side so terrain right
// at the edge of the fit never clips out of the shadow map
const SHADOW_MARGIN = 2;

const NDC_CORNERS = [[-1, -1], [1, -1], [-1, 1], [1, 1]];

// just a directional light
export default class Sun {
    constructor(camera) {
        this.camera = camera;

        this.light = new THREE.DirectionalLight(0xffffff, 4);

        this.light.castShadow = true;
        this.light.shadow.mapSize.width = 3072;
        this.light.shadow.mapSize.height = 3072;
        // normalBias (offsets the compared depth along the surface normal)
        // targets acne on thin/steep-angle geometry specifically - unlike a
        // flat constant bias, it's the standard fix for foliage-style acne
        // rather than the mostly-perpendicular ground tiles
        this.light.shadow.normalBias = 0.05;

        this.light.target = new THREE.Object3D();

        this.positionPhase = 0;
        this.targetColor = new THREE.Color();

        // set once a map exists (see NEW_SCALE_CALCULATED) - the fitted
        // shadow frustum is clipped to this so it never spends resolution
        // on empty space past the map edge either
        this.mapBounds = null;

        // scratch objects reused every fitShadowCamera() call instead of
        // allocating fresh ones each time - this runs every rendered frame
        this._nearPoint = new THREE.Vector3();
        this._farPoint = new THREE.Vector3();
        this._ray = new THREE.Ray();
        this._hit = new THREE.Vector3();
        this._localPoint = new THREE.Vector3();
        this._groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -MIN_WORLD_HEIGHT);
        this._peakPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -MAX_WORLD_HEIGHT);

        eventBus.on(EVENTS.NEW_SCALE_CALCULATED, ({ width, height }) => {
            this.mapBounds = { x: width / 2, z: height / 2 };
        });
        eventBus.on(EVENTS.CAMERA_UPDATED, () => {
            this.fitShadowCamera();
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

        this.light.position.set(
            150 + Math.cos(angle) * radius,
            400,
            -150 + Math.sin(angle) * radius
        );
        this.light.target.position.set(0, 0, 0);
        this.light.target.updateMatrixWorld();
    }

    updateColor(yearProgress, peakOffset, amplitude, baseTemp, alpha) {
        const targetHex = computeSunColorHex(yearProgress, peakOffset, amplitude, baseTemp);
        this.targetColor.setHex(targetHex);
        this.light.color.lerp(this.targetColor, alpha);
    }

    // Tightly fits the shadow camera's orthographic frustum to exactly what
    // the main camera can currently see, instead of a fixed hand-tuned box:
    // cast a ray through each of the main camera's 4 screen corners,
    // intersect each with the terrain's min/max elevation planes (up to 8
    // points), clip to the map's actual extent, then transform into the
    // light's own view space and take the axis-aligned bounds - that bound
    // *is* the tightest possible shadow frustum, by construction, and it
    // works regardless of where the light itself happens to be positioned
    // (no need to drag the light around to "follow" the camera).
    fitShadowCamera() {
        if (!this.mapBounds) return;

        this.camera.updateMatrixWorld();

        const shadowCam = this.light.shadow.camera;
        shadowCam.position.copy(this.light.position);
        shadowCam.lookAt(this.light.target.position);
        shadowCam.updateMatrixWorld(true);

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        let hitCount = 0;

        for (const [ndcX, ndcY] of NDC_CORNERS) {
            this._nearPoint.set(ndcX, ndcY, -1).unproject(this.camera);
            this._farPoint.set(ndcX, ndcY, 1).unproject(this.camera);
            this._ray.origin.copy(this._nearPoint);
            this._ray.direction.copy(this._farPoint).sub(this._nearPoint).normalize();

            for (const plane of [this._groundPlane, this._peakPlane]) {
                if (!this._ray.intersectPlane(plane, this._hit)) continue;
                hitCount++;

                this._hit.x = THREE.MathUtils.clamp(this._hit.x, -this.mapBounds.x, this.mapBounds.x);
                this._hit.z = THREE.MathUtils.clamp(this._hit.z, -this.mapBounds.z, this.mapBounds.z);

                this._localPoint.copy(this._hit).applyMatrix4(shadowCam.matrixWorldInverse);
                minX = Math.min(minX, this._localPoint.x); maxX = Math.max(maxX, this._localPoint.x);
                minY = Math.min(minY, this._localPoint.y); maxY = Math.max(maxY, this._localPoint.y);
                minZ = Math.min(minZ, this._localPoint.z); maxZ = Math.max(maxZ, this._localPoint.z);
            }
        }

        // camera looking away from the terrain entirely (shouldn't happen
        // with this game's fixed top-down-ish controller) - leave the
        // frustum as it was rather than collapsing it to garbage bounds
        if (hitCount === 0) return;

        shadowCam.left = minX - SHADOW_MARGIN;
        shadowCam.right = maxX + SHADOW_MARGIN;
        shadowCam.bottom = minY - SHADOW_MARGIN;
        shadowCam.top = maxY + SHADOW_MARGIN;
        // view space looks down its own -Z, so the nearest point has the
        // largest (least negative) z and the farthest has the smallest
        shadowCam.near = Math.max(0.1, -maxZ - SHADOW_MARGIN);
        shadowCam.far = -minZ + SHADOW_MARGIN;
        shadowCam.updateProjectionMatrix();
    }
}
