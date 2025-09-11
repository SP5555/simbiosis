'use strict'

import GUI from 'lil-GUI';
import { eventBus } from '../utils/event-emitters.js';
import { EVENTS } from '../utils/events.js';

export default class GuiManager {
    constructor() {
        this.gui = new GUI();

        this.buildGUI();
    }

    buildGUI() {
        // --- world settings ---
        this.worldSettingsFolder = this.gui.addFolder("World Settings");
        this.terrainFilters = ["Biome", "Elevation", "Elevation Gradient", "Temperature", "Fertility"];
        this.terrainParams = { filter: "Biome" };
        this.worldSettingsFolder.add(this.terrainParams, 'filter', this.terrainFilters)
            .name("Select Filter").onChange((value) => {
                eventBus.emit(EVENTS.APPLY_TERRAIN_FILTER, value);
            });
        this.showVegetationParams = { showVegetation: true };
        this.worldSettingsFolder.add(this.showVegetationParams, 'showVegetation')
            .name("Show Vegetation")
            .onChange((value) => {
                eventBus.emit(EVENTS.TOGGLE_VEGETATION, value);
            });
        this.worldSettingsFolder.open();

        // --- map generation ---
        this.mapFolder = this.gui.addFolder("Map Generation");
        this.mapParams = {
            width: 4, height: 4, expand: 5,
            seed: "write something",
            startSeason: "Spring",
            generate: () => {
                eventBus.emit(EVENTS.GENERATE_MAP, {
                    width: this.mapParams.width,
                    height: this.mapParams.height,
                    expand: this.mapParams.expand,
                    seed: this.mapParams.seed,
                    startSeason: this.mapParams.startSeason
                });
                eventBus.emit(EVENTS.APPLY_TERRAIN_FILTER, this.terrainParams.filter);
                eventBus.emit(EVENTS.TOGGLE_VEGETATION, this.showVegetationParams.showVegetation);
            }
        };
        this.mapFolder.add(this.mapParams, 'width', 1, 8, 1).name("Base Map Width");
        this.mapFolder.add(this.mapParams, 'height', 1, 8, 1).name("Base Map Height");
        this.mapFolder.add(this.mapParams, 'expand', 0, 8, 1).name("Expand Times");
        this.mapFolder.add(this.mapParams, 'seed').name("Seed");
        this.mapFolder.add(this.mapParams, 'startSeason', ["Spring", "Summer", "Fall", "Winter"]).name("Start Season");
        this.mapFolder.add(this.mapParams, 'generate').name("Generate Map");
        this.mapFolder.open();
    }

    emitInitialEvents() {
        eventBus.emit(EVENTS.GENERATE_MAP, {
            width: this.mapParams.width,
            height: this.mapParams.height,
            expand: this.mapParams.expand,
            seed: this.mapParams.seed,
            startSeason: this.mapParams.startSeason
        });
        eventBus.emit(EVENTS.APPLY_TERRAIN_FILTER, this.terrainParams.filter);
        eventBus.emit(EVENTS.TOGGLE_VEGETATION, this.showVegetationParams.showVegetation);
    }
}
