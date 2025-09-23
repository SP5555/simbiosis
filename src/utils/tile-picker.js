import * as THREE from 'three';
import { eventBus } from './event-emitters.js';
import { EVENTS } from './events.js';
import { isMouseOverGUI } from './gui-utils.js';

export default class TilePicker {
    constructor(camera, input, managers) {
        this.camera = camera;
        this.input = input;
        this.managers = managers;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredTile = null;

        this.input.onClick(() => this.handleClick());
    }

    update() {
        if (isMouseOverGUI()) {
            if (this.hoveredTile !== null) {
                this.hoveredTile = null;
                eventBus.emit(EVENTS.TILE_HOVERED, null);
            }
            return;
        }

        this.mouse.x = this.input.mouseX;
        this.mouse.y = -this.input.mouseY;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        let closestDist = Infinity;
        let closestHit = null;
        let closestTile = null;

        for (const manager of Object.values(this.managers)) {
            const { dist, hit, tile } = this.getCollidingInstance(manager);
            if (tile && dist < closestDist) {
                closestDist = dist;
                closestHit = hit;
                closestTile = tile;
            }
        }

        const newHoveredTile = closestTile || null;
        if (this.hoveredTile !== newHoveredTile) {
            this.hoveredTile = newHoveredTile;
            eventBus.emit(EVENTS.TILE_HOVERED, this.hoveredTile);
        }
    }

    getCollidingInstance(manager) {
        const mesh = manager.getDrawable();
        if (!mesh) return { dist: Infinity, hit: null, tile: null };

        const intersects = this.raycaster.intersectObject(mesh);
        let closestDist = Infinity;
        let closestHit = null;
        let closestTile = null;

        for (const inst of intersects) {
            if (inst.distance < closestDist && inst.instanceId !== undefined) {
                const tile = manager.instances[inst.instanceId];
                if (tile) {
                    closestDist = inst.distance;
                    closestHit = inst;
                    closestTile = tile;
                }
            }
        }

        return { dist: closestDist, hit: closestHit, tile: closestTile };
    }

    handleClick() {
        if (isMouseOverGUI()) return;

        if (this.hoveredTile !== null) {
            this.selectedTile = this.hoveredTile;
        } else {
            this.selectedTile = null;
        }
        eventBus.emit(EVENTS.TILE_SELECTED, this.selectedTile);
    }
}