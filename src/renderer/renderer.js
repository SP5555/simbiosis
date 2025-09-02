'use strict'

import * as THREE from 'three';
import { LandTile, WaterTile } from './tile.js';

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
    }

    buildTiles() {
        const map = this.simulation.map;
        const maxMapWidth = 80, maxMapHeight = 60;
        const scale = Math.min(maxMapWidth / map.width, maxMapHeight / map.height);
        const mapWidth = Math.floor(map.width * scale);
        const mapHeight = Math.floor(map.height * scale);
        const tileWidth = mapWidth / map.width;
        const tileHeight = mapHeight / map.height;

        this.tiles = [];

        for (let x = 0; x < map.width; x++) {
            for (let y = 0; y < map.height; y++) {
                const cell = map.getCell(x, y);
                const tile = this.createTile(cell, tileWidth, tileHeight, mapWidth, mapHeight);

                this.scene.add(...tile.getDrawable());
                this.tiles.push(tile);
            }
        }
    }
    
    createTile(cell, tileWidth, tileHeight, mapWidth, mapHeight) {
        if (cell.isWater) return new WaterTile(cell, tileWidth, tileHeight, mapWidth, mapHeight);
        else return new LandTile(cell, tileWidth, tileHeight, mapWidth, mapHeight);
    }
    
    render(input, dt) {
        this.updateScene(input, dt);

        this.renderer.render(this.scene, this.camera);
    }

    updateScene(input, dt) {
        this.updateCamera(input);
        this.updateTiles(dt);
    }

    updateCamera(input) {
        const shiftX = new THREE.Vector3(1, 0, 0).multiplyScalar(input.mouseX * 0.2);
        const shiftY = new THREE.Vector3(0, -1, 1).multiplyScalar(input.mouseY * 0.2);
        const parallaxAppliedPosition = this.cameraPosition.clone().add(shiftX).add(shiftY);
        this.camera.position.copy(parallaxAppliedPosition);
        this.camera.lookAt(0, 0, 4);
    }

    updateTiles(dt) {
        for (let tile of this.tiles) {
            tile.updateAnimationState(dt);
        }
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}