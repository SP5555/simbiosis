'use strict'

import GUI from 'lil-gui';
import { eventBus } from '../utils/event-emitters.js';
import { EVENTS } from '../utils/events.js';
import { getSeasonNamesForHemisphere, DAYS_PER_YEAR } from '../simulation/world/data.js';

export default class GuiManager {
    constructor() {
        this.gui = new GUI();

        this.buildGUI();
    }

    buildGUI() {

        // --- simulation controls ---
        this.simCtrlFolder = this.gui.addFolder("Simulation Controls");
        this.simPauseParams = { paused: false };
        this.simCtrlFolder.add(this.simPauseParams, 'paused')
            .name("Pause Simulation")
            .onChange((value) => eventBus.emit(EVENTS.TOGGLE_SIMULATION, value));
        this.simSpeedParams = { speed: 1 };
        this.simCtrlFolder.add(this.simSpeedParams, 'speed', { "1x": 1, "2x": 2, "3x": 3, "5x": 5, "10x": 10 })
            .name("Simulation Speed")
            .onChange((value) => eventBus.emit(EVENTS.SET_SIM_SPEED, value));
        this.simCtrlFolder.open();

        // --- world settings ---
        this.worldSettingsFolder = this.gui.addFolder("World Settings");
        this.terrainFilters = ["Biome", "Elevation", "Elevation Gradient", "Temperature", "Fertility", "Humidity"];
        this.terrainParams = { filter: "Biome" };
        this.worldSettingsFolder.add(this.terrainParams, 'filter', this.terrainFilters)
            .name("Select Filter").onChange(() => this.applyTerrainFilter());
        this.showVegetationParams = { showVegetation: true };
        this.worldSettingsFolder.add(this.showVegetationParams, 'showVegetation')
            .name("Show Vegetation")
            .onChange(() => this.toggleVegetation());
        this.worldSettingsFolder.open();

        // --- map generation ---
        this.mapFolder = this.gui.addFolder("Map Generation");
        this.mapParams = {
            width: 4, height: 4, expand: 5,
            seed: "write something",
            startSeason: "Spring",
            climateZone: "Temperate",
            hemisphere: "Northern",
            generate: () => this.generateMap()
        };
        this.mapFolder.add(this.mapParams, 'width', 1, 8, 1).name("Base Map Width");
        this.mapFolder.add(this.mapParams, 'height', 1, 8, 1).name("Base Map Height");
        this.mapFolder.add(this.mapParams, 'expand', 0, 8, 1).name("Expand Times");
        this.mapFolder.add(this.mapParams, 'seed').name("Seed");
        this.mapFolder.add(this.mapParams, 'hemisphere', ["Northern", "Southern"])
            .name("Hemisphere")
            .onChange((value) => this.rebuildStartSeasonOptions(value));
        this.mapFolder.add(this.mapParams, 'climateZone', ["Equatorial", "Temperate", "Polar"]).name("Climate Zone");
        this.startSeasonCtrl = this.mapFolder.add(this.mapParams, 'startSeason', this.buildSeasonOptions(this.mapParams.hemisphere))
            .name("Start Season");
        this.mapFolder.add(this.mapParams, 'generate').name("Generate Map");
        this.mapFolder.open();
    }

    // "Day N - SeasonName" labels, where day numbers are the fixed quarter
    // boundaries and the season name shown at each depends on hemisphere
    // (Southern is 2 quarters/6 months out of phase) - the underlying
    // stored value stays a plain season name either way, since "Summer"
    // means "the warm quarter" regardless of which days it falls on
    buildSeasonOptions(hemisphereName) {
        const seasonLength = DAYS_PER_YEAR / 4;
        const names = getSeasonNamesForHemisphere(hemisphereName);
        const options = {};
        names.forEach((name, i) => {
            const day = Math.round(i * seasonLength) + 1;
            options[`Day ${day} - ${name}`] = name;
        });
        return options;
    }

    rebuildStartSeasonOptions(hemisphereName) {
        this.startSeasonCtrl.options(this.buildSeasonOptions(hemisphereName));
    }

    applyMapGeneration() {
        eventBus.emit(EVENTS.GENERATE_MAP, {
            width: this.mapParams.width,
            height: this.mapParams.height,
            expand: this.mapParams.expand,
            seed: this.mapParams.seed,
            startSeason: this.mapParams.startSeason,
            climateZone: this.mapParams.climateZone,
            hemisphere: this.mapParams.hemisphere
        });
    }

    emitInitialEvents() {
        this.generateMap();
    }

    applyTerrainFilter() {
        eventBus.emit(EVENTS.APPLY_TERRAIN_FILTER, this.terrainParams.filter);
    }

    toggleVegetation() {
        eventBus.emit(EVENTS.TOGGLE_VEGETATION, this.showVegetationParams.showVegetation);
    }

    generateMap() {
        this.applyMapGeneration();
        this.applyTerrainFilter();
        this.toggleVegetation();
    }
}
