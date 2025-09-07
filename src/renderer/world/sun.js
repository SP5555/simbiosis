import * as THREE from 'three';

// just a directional light
export default class Sun {
    constructor(intensity = 4, color = 0xffffff, position = new THREE.Vector3(40, 40, 20)) {
        this.light = new THREE.DirectionalLight(color, intensity);
        this.light.position.copy(position);

        this.light.castShadow = true;
        this.light.shadow.camera.left = -40;
        this.light.shadow.camera.right = 40;
        this.light.shadow.camera.top = 40;
        this.light.shadow.camera.bottom = -40;
        this.light.shadow.camera.near = 1;
        this.light.shadow.camera.far = 200;
        this.light.shadow.mapSize.width = 2048;
        this.light.shadow.mapSize.height = 2048;
    }

    getDrawable() {
        return this.light;
    }

    setPosition(x, y, z) {
        this.light.position.set(x, y, z);
    }

    // optional: animate intensity, color, etc.
    setIntensity(val) { this.light.intensity = val; }
    setColor(color) { this.light.color.set(color); }
}
