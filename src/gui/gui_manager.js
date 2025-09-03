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
            width: 4, height: 4, expand: 5,
            seed: "write something",
            generate: () => {
                this.simulation.generateMap(mapParams.width, mapParams.height, mapParams.expand, mapParams.seed);
                this.renderer.rebuildScene();

                terrainParams.apply();
            }
        };

        mapFolder.add(mapParams, 'width', 1, 8, 1).name("Base Map Width");
        mapFolder.add(mapParams, 'height', 1, 8, 1).name("Base Map Height");
        mapFolder.add(mapParams, 'expand', 0, 8, 1).name("Expand Times");
        mapFolder.add(mapParams, 'seed').name("Seed");
        mapFolder.add(mapParams, 'generate').name("Generate Map");

        mapFolder.open();

        const terrainFolder = this.gui.addFolder("Terrain Filter");
        const terrainFilters = ["Biome", "Height", "Temperature", "Moisture"];
        const terrainParams = {
            filter: "Biome",
            apply: () => this.renderer.mapFilterChange(terrainParams.filter)
        };
        terrainFolder.add(terrainParams, 'filter', terrainFilters)
            .name("Select Filter").onChange(() => terrainParams.apply());
        terrainFolder.open();

        // initialize
        mapParams.generate();
    }
}
