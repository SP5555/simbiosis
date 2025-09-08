import * as THREE from 'three';
import { interpolateColorStops } from '../utils/color-utils.js';
import { SUN_COLOR_STOPS } from './colors/sun-color-data.js';

// just a directional light
export default class Sun {
    constructor(intensity = 4, color = 0xffffff, position = new THREE.Vector3(0, 40, 0)) {
        this.light = new THREE.DirectionalLight(color, intensity);
        this.light.position.copy(position);

        this.light.castShadow = true;
        this.light.shadow.camera.left = -40;
        this.light.shadow.camera.right = 40;
        this.light.shadow.camera.top = 30;
        this.light.shadow.camera.bottom = -30;
        this.light.shadow.camera.near = 1;
        this.light.shadow.camera.far = 200;
        this.light.shadow.mapSize.width = 3072;
        this.light.shadow.mapSize.height = 3072;

        this.yearProgress = 0;
    }

    getDrawable() {
        return this.light;
    }

    update(yearProgress) {
        this.updatePosition(yearProgress);
        this.updateColor(yearProgress);
    }

    updatePosition(yearProgress) {
        const angle = yearProgress * Math.PI * 2;

        const radius = 30;
        const x = 15 + Math.cos(angle) * radius;
        const y = 40;
        const z = -15 + Math.sin(angle) * radius;

        this.light.position.copy(new THREE.Vector3(x, y, z));
    }

    updateColor(yearProgress) {
        const hexColor = interpolateColorStops(yearProgress, SUN_COLOR_STOPS);
        this.light.color.setHex(hexColor);
    }
}
