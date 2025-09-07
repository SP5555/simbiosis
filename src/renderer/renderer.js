'use strict'

import * as THREE from 'three';
import { LandTile, WaterTile } from './world/tile.js';
import VegetationManager from './mesh-managers/vegetation-manager.js';
import LandTileManager from './mesh-managers/land-tile-manager.js';
import WaterTileManager from './mesh-managers/water-tile-manager.js';
import TilePicker from '../utils/tile-picker.js';
import { eventBus } from '../utils/event-emitters.js';
import { EVENTS } from '../utils/events.js';

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

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.cameraPosition = new THREE.Vector3(0, 60, 40);
        this.cameraLookAt = new THREE.Vector3(0, 0, 4);
        this.camera.position.set(this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z);
        this.camera.lookAt(0, 0, 4);

        const canvas = document.getElementById('canvas00');
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const light = new THREE.DirectionalLight(0xffffff, 4);
        light.position.set(0, 80, 20);
        this.scene.add(light);

        // mesh managers
        this.landTileManager = new LandTileManager();
        this.waterTileManager = new WaterTileManager();
        this.vegeManager = new VegetationManager();

        this.tilePicker = new TilePicker(
            this.camera, this.input,
            { // only hoverable tiles
                land: this.landTileManager,
                water: this.waterTileManager,
            }
        )
        this.hoveredTile = null;

        // event subscriptions
        this.initializeEventListeners();

        // ===== simulation setup =====
        if (this.simulation.map) {
            this.buildScene();
        }
    }

    buildTiles() {
        const map = this.simulation.map;
        const maxMapWidth = 80, maxMapHeight = 60;
        const scale = Math.min(maxMapWidth / map.width, maxMapHeight / map.height);
        const mapWidth = Math.floor(map.width * scale);
        const mapHeight = Math.floor(map.height * scale);
        this.tileWidth = mapWidth / map.width;
        this.tileHeight = mapHeight / map.height;

        this.tiles = [];

        for (let x = 0; x < map.width; x++) {
            for (let y = 0; y < map.height; y++) {
                const cell = map.getCell(x, y);

                let position = new THREE.Vector3(
                    cell.x * this.tileWidth + this.tileWidth / 2 - mapWidth / 2,
                    Math.max(cell.elevation, 0) * scale / 1000,
                    cell.y * this.tileHeight + this.tileHeight / 2 - mapHeight / 2,
                )

                const tile = cell.isWater
                    ? new WaterTile(cell, position, scale) 
                    : new LandTile(cell, position, scale);
                this.tiles.push(tile);
            }
        }
    }

    initializeEventListeners() {
        window.addEventListener('resize', () => this.onResize(), false);

        eventBus.on(EVENTS.MAP_GENERATED, (map) =>
            this.rebuildScene()
        );
        eventBus.on(EVENTS.APPLY_TERRAIN_FILTER, (filterName) =>
            this.mapFilterChange(filterName)
        );
        eventBus.on(EVENTS.TILE_HOVERED, (tile) =>
            this.updateHoveredTile(tile)
        );
    }

    buildInstancedMeshes() {
        this.landTileManager.loadTiles(this.tiles, this.tileWidth, this.tileHeight);
        this.waterTileManager.loadTiles(this.tiles, this.tileWidth, this.tileHeight);
        this.vegeManager.loadTiles(this.tiles, this.tileWidth, this.tileHeight);

        this.landTileManager.buildInstancedMeshes();
        this.waterTileManager.buildInstancedMeshes();
        this.vegeManager.buildInstancedMeshes();

        this.scene.add(this.landTileManager.getDrawable());
        this.scene.add(this.waterTileManager.getDrawable());
        this.scene.add(this.vegeManager.getDrawable());
    }

    buildScene() {
        this.buildTiles();
        this.buildInstancedMeshes();
    }
    
    rebuildScene() {
        this.clearScene();
        this.buildScene();
    }

    clearScene() {
        this.scene.remove(this.landTileManager.getDrawable());
        this.scene.remove(this.waterTileManager.getDrawable());
        this.scene.remove(this.vegeManager.getDrawable());
        // release GPU memory
        this.landTileManager.dispose();
        this.waterTileManager.dispose();
        this.vegeManager.dispose();
    }

    render(dt) {
        this.updateScene(dt);
        this.tilePicker.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    updateScene(dt) {
        this.updateCamera();
        this.updateTiles(dt);
        this.updateInstancedMeshes();
    }

    updateTiles(dt) {
        for (let tile of this.tiles) {
            tile.updateAnimationState(dt);
        }
    }

    updateInstancedMeshes() {
        this.landTileManager.updateInstancedMeshes();
        this.waterTileManager.updateInstancedMeshes();
        this.vegeManager.updateInstancedMeshes();
    }

    updateHoveredTile(tile) {
        if (this.hoveredTile && this.hoveredTile !== tile) {
            this.hoveredTile.setHovered(false);
        }
        if (tile) tile.setHovered(true);
        this.hoveredTile = tile;
    }

    updateCamera() {
        // const { dx, dy } = this.input.consumeDelta();
        
        // pan
        // this.cameraPosition.x -= dx * 0.1;
        // this.cameraPosition.z -= dy * 0.1;
        // this.cameraLookAt.x -= dx * 0.1;
        // this.cameraLookAt.z -= dy * 0.1;

        // parallax
        const shiftX = new THREE.Vector3(1, 0, 0).multiplyScalar(this.input.mouseX * 0.2);
        const shiftY = new THREE.Vector3(0, -1, 1).multiplyScalar(this.input.mouseY * 0.2);
        const parallaxAppliedPosition = this.cameraPosition.clone().add(shiftX).add(shiftY);

        this.camera.position.copy(parallaxAppliedPosition);
        this.camera.lookAt(this.cameraLookAt);
    }

    mapFilterChange(filterName) {
        for (let tile of this.tiles) {
            tile.filterChange(filterName);
        }
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}