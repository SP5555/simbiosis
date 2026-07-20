'use strict'

import * as THREE from 'three';
import LandTileManager from './mesh-managers/land-tile-manager.js';
import WaterTileManager from './mesh-managers/water-tile-manager.js';
import VegetationManager from './mesh-managers/vegetation-manager.js';
import FaunaManager from './mesh-managers/fauna-manager.js';
import TilePicker from './tile-picker.js';
import Sun from './world/sun.js';
import { eventBus } from '../utils/event-emitters.js';
import { EVENTS } from '../utils/events.js';
import CameraController from './camera-controller.js';
import { advance as advanceShaderClock } from './shaders/shader-clock.js';

export default class Renderer {
    constructor(simulation, input) {
        this.input = input;
        this.simulation = simulation;
        this.initializeScene();
    }

    initializeScene() {
        // ===== scene setup =====
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x101010);

        this.cameraController = new CameraController(this.input);

        const canvas = document.getElementById('canvas00');
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.auxLight1 = new THREE.DirectionalLight(0x000099, 1);
        this.auxLight1.position.copy(new THREE.Vector3(-10, 10, 10));
        this.scene.add(this.auxLight1);

        this.auxLight2 = new THREE.DirectionalLight(0x990000, 1);
        this.auxLight2.position.copy(new THREE.Vector3(10, 10, 10));
        this.scene.add(this.auxLight2);

        this.sun = new Sun(this.cameraController.getCamera());
        this.scene.add(this.sun.getDrawable());

        // mesh managers
        this.landTileManager = new LandTileManager();
        this.waterTileManager = new WaterTileManager();
        this.vegeManager = new VegetationManager();
        this.faunaManager = new FaunaManager();
        // all managers that place one instance per map cell (drives the
        // build/dispose/animate/upload fan-out below); a subset also
        // responds to terrain filter changes (vegetation/fauna don't - see
        // mapFilterChange)
        this.managers = [this.landTileManager, this.waterTileManager, this.vegeManager, this.faunaManager];
        this.filterableManagers = [this.landTileManager, this.waterTileManager];

        this.tilePicker = new TilePicker(
            this.cameraController.getCamera(), this.input,
            { // pickable entities - closest hit wins regardless of type
                land: this.landTileManager,
                water: this.waterTileManager,
                fauna: this.faunaManager,
            }
        )
        this.hoveredTile = null;
        this.selectedTile = null;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        window.addEventListener('resize', () => this.onResize(), false);
        
        eventBus.on(EVENTS.APPLY_TERRAIN_FILTER, (filterName) =>
            this.mapFilterChange(filterName)
        );
        eventBus.on(EVENTS.MAP_GENERATED, (map) =>
            this.rebuildScene()
        );
        eventBus.on(EVENTS.TILE_HOVERED, (tile) =>
            this.updateHoveredTile(tile)
        );
        eventBus.on(EVENTS.TILE_SELECTED, (tile) =>
            this.updateSelectedTile(tile)
        );
    }

    buildScene() {
        this.landTileManager.buildFromMap(this.simulation.map);
        this.waterTileManager.buildFromMap(this.simulation.map);
        this.vegeManager.buildFromFloraSystem(this.simulation.floraSystem);
        this.faunaManager.buildFromFaunaSystem(this.simulation.faunaSystem);

        for (const manager of this.managers) {
            manager.buildInstancedMeshes();
            this.scene.add(manager.getDrawable());
        }

        eventBus.emit(EVENTS.NEW_SCALE_CALCULATED, {
            width: this.simulation.map.width,
            height: this.simulation.map.height
        });
    }

    clearScene() {
        for (const manager of this.managers) {
            this.scene.remove(manager.getDrawable());
            manager.dispose(); // release GPU memory
        }
    }

    rebuildScene() {
        this.clearScene();
        this.buildScene();
    }

    render(coreDt, simDt) {
        this.cameraController.update(coreDt);
        this.updateScene(coreDt, simDt);
        this.tilePicker.update();
        this.renderer.render(this.scene, this.cameraController.getCamera());
    }

    updateScene(coreDt, simDt) {
        advanceShaderClock(simDt, coreDt);
        this.sun.update(this.simulation.climate, simDt);
        this.updateAnimationState(coreDt, simDt);
        this.updateInstancedMeshes();
    }

    updateAnimationState(coreDt, simDt) {
        for (const manager of this.managers) manager.updateAnimationState(coreDt, simDt);
    }

    updateInstancedMeshes() {
        for (const manager of this.managers) manager.updateInstancedMeshes();
    }

    updateHoveredTile(tile) {
        if (this.hoveredTile && this.hoveredTile !== tile) {
            this.hoveredTile.setHovered(false);
        }
        if (tile) tile.setHovered(true);
        this.hoveredTile = tile;
    }

    updateSelectedTile(tile) {
        if (this.selectedTile && this.selectedTile !== tile) {
            this.selectedTile.setSelected(false);
        }
        if (tile) tile.setSelected(true);
        this.selectedTile = tile;
    }

    mapFilterChange(filterName) {
        for (const manager of this.filterableManagers) manager.mapFilterChange(filterName);
    }

    onResize() {
        this.cameraController.resize();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}