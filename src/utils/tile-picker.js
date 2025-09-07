import * as THREE from 'three';
import { eventBus } from './event-emitters.js';
import { EVENTS } from './events.js';

export default class TilePicker {
    constructor(camera, input, managers) {
        this.camera = camera;
        this.input = input;
        this.managers = managers;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredTile = null;
    }

    update() {
        this.mouse.x = this.input.mouseX;
        this.mouse.y = -this.input.mouseY;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        let closestHit = null;
        let closestDist = Infinity;
        let closestTile = null;

        for (const manager of Object.values(this.managers)) {
            const mesh = manager.getDrawable();
            if (!mesh) continue;

            const intersects = this.raycaster.intersectObject(mesh);
            if (intersects.length > 0) {
                for (const inst of intersects) {
                    if (inst.distance < closestDist && inst.instanceId !== undefined) {
                        const tile = manager.tiles[inst.instanceId];
                        if (tile) {
                            closestDist = inst.distance;
                            closestHit = inst;
                            closestTile = tile;
                        }
                    }
                }
            }
        }

        this.hoveredTile = closestTile || null;
        eventBus.emit(EVENTS.TILE_HOVERED, this.hoveredTile);
    }
}
