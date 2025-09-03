'use strict'

import GUI from 'lil-GUI';

export default class GuiManager {
    constructor(renderer, simulation) {
        this.gui = new GUI();
        this.renderer = renderer;
        this.simulation = simulation;
        this.buildGUI();
    }

    buildGUI() {
        // --- Map generation folder ---
        const mapFolder = this.gui.addFolder("Map Generation");

        const mapParams = {
            width: 5, height: 5, expand: 4,
            seed: "night",
            generate: () => {
                this.simulation.generateMap(mapParams.width, mapParams.height, mapParams.expand, mapParams.seed);
                this.renderer.rebuildScene();
            }
        };

        mapFolder.add(mapParams, 'width', 1, 8, 1).name("Base Map Width");
        mapFolder.add(mapParams, 'height', 1, 8, 1).name("Base Map Height");
        mapFolder.add(mapParams, 'expand', 0, 8, 1).name("Expand Times");
        mapFolder.add(mapParams, 'seed').name("Seed");
        mapFolder.add(mapParams, 'generate').name("Generate Map");

        mapFolder.open();

        const terrainFolder = this.gui.addFolder("Terrain Filter");
        const makeCallback = (filterName) => {
            return () => this.renderer.mapFilterChange(filterName)
        };
        const filters = ["Biome", "Height", "Temperature", "Moisture"];
        filters.forEach(name => {
            terrainFolder.add({ run: makeCallback(name) }, 'run').name(name);
        });
        terrainFolder.open();
    }
}
