'use strict'

import { eventBus } from '../utils/event-emitters.js';
import { EVENTS } from '../utils/events.js';
import FaunaSystem from './entities/fauna-system.js';
import FloraSystem from './entities/flora-system.js';
import Climate from './world/climate.js';
import MapGenerator from './world/map-generator.js';

export default class Simulation {
    constructor() {
        this.climate = new Climate();

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        eventBus.on(EVENTS.GENERATE_MAP, (params) => {
            // climate must be set first - setStartSeason positions the
            // calendar relative to the current climate's actual temperature
            // peak, so it needs peakOffset already resolved
            this.climate.setClimate(params.climateZone, params.hemisphere);
            this.climate.setStartSeason(params.startSeason);
            this.generateMap(params.width, params.height, params.expand, params.seed);
        });
    }

    generateMap(width, height, expand, seed = null) {
        this.climate.reset();
        this.floraSystem?.dispose();
        this.faunaSystem?.dispose();
        this.map = MapGenerator.generate(width, height, expand, seed, this.climate.baseTemp);
        this.floraSystem = new FloraSystem(this.map);
        this.faunaSystem = new FaunaSystem(this.map, this.floraSystem);

        this.map.buildRefs(this.floraSystem);

        eventBus.emit(EVENTS.MAP_GENERATED, this.map);
    }

    step() {
        this.climate.step();

        this.map.step(this.climate.baseTemp);
        this.floraSystem.step();
        this.faunaSystem.step();
    }
}
