'use strict'

import * as THREE from 'three';
import { LandTile, WaterTile } from './world/tile.js';
import VegetationManager from './mesh-managers/vegetation-manager.js';
import LandTileManager from './mesh-managers/land-tile-manager.js';
import WaterTileManager from './mesh-managers/water-tile-manager.js';

export default class Renderer {
    constructor(simulation) {
        this.buildScene(simulation);
    }

    buildScene(simulation) {
        // ===== scene setup =====
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x101010);

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.cameraPosition = new THREE.Vector3(0, 60, 40);
        this.cameraLookAt = new THREE.Vector3(0, 0, 4);
        this.camera.position.set(this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z);
        this.camera.lookAt(0, 0, 4);

        // Renderer
        const canvas = document.getElementById('canvas00');
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Light
        const light = new THREE.DirectionalLight(0xffffff, 4);
        light.position.set(0, 80, 20);
        this.scene.add(light);

        window.addEventListener('resize', () => this.onResize(), false);

        // ===== simulation setup =====
        this.simulation = simulation;
        this.buildTiles();
        this.buildInstancedMeshes();
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
                    ? new WaterTile(cell, position) 
                    : new LandTile(cell, position);
                this.tiles.push(tile);
            }
        }
    }

    buildInstancedMeshes() {
        this.landTileManager = new LandTileManager(this.tiles, this.tileWidth, this.tileHeight);
        this.waterTileManager = new WaterTileManager(this.tiles, this.tileWidth, this.tileHeight);
        this.vegeManager = new VegetationManager(this.tiles, this.tileWidth, this.tileHeight);

        this.landTileManager.buildInstancedMeshes();
        this.waterTileManager.buildInstancedMeshes();
        this.vegeManager.buildInstancedMeshes();

        this.scene.add(this.landTileManager.getDrawable());
        this.scene.add(this.waterTileManager.getDrawable());
        this.scene.add(this.vegeManager.getDrawable());
    }
    
    rebuildScene() {
        this.clearScene();
        this.buildTiles();
        this.buildInstancedMeshes();
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

    render(input, dt) {
        this.updateScene(input, dt);
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateScene(input, dt) {
        this.updateCamera(input);
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

    updateCamera(input) {
        // const { dx, dy } = input.consumeDelta();
        
        // pan
        // this.cameraPosition.x -= dx * 0.1;
        // this.cameraPosition.z -= dy * 0.1;
        // this.cameraLookAt.x -= dx * 0.1;
        // this.cameraLookAt.z -= dy * 0.1;

        // parallax
        const shiftX = new THREE.Vector3(1, 0, 0).multiplyScalar(input.mouseX * 0.2);
        const shiftY = new THREE.Vector3(0, -1, 1).multiplyScalar(input.mouseY * 0.2);
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