'use strict'

import { eventBus } from '../utils/event-emitters.js';
import { EVENTS } from '../utils/events.js';
import FaunaSystem from './entities/fauna-system.js';
import FloraSystem from './entities/flora-system.js';
import MapGenerator from './world/map-generator.js';

export default class Simulation {
    constructor() {
        this.time = 0;
        this.ticksPerDay = 900;  // IRL 15s  = sim 1d
        this.daysPerYear = 20;   // IRL  5m  = sim 1y

        this.baseTemps = [6, 26, 20, 0];
        this.seasons = ["Spring", "Summer", "Fall", "Winter"];

        this.currentDate = -1;
        this.currentYear = -1;
        this.currentSeasonIdx = -1;
        this.nextSeasonIdx = -1;
        
        this.seasonOffset = 0; // in days
        this.seasonProgress = 0;
        this.yearProgress = 0;
        this.baseTemp = 0;
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        eventBus.on(EVENTS.GENERATE_MAP, (params) => {
            this.setStartSeason(params.startSeason);
            this.generateMap(params.width, params.height, params.expand, params.seed);
        });    
    }

    generateMap(width, height, expand, seed = null) {
        this.time = 0;
        this.map = MapGenerator.generate(width, height, expand, seed, this.baseTemp);
        this.floraSystem = new FloraSystem(this.map);
        this.faunaSystem = new FaunaSystem(this.map);
        
        this.map.buildRefs(this.floraSystem);

        eventBus.emit(EVENTS.MAP_GENERATED, this.map);
    }

    setStartSeason(seasonName) {
        const lookup = { "Spring": 0, "Summer": 1, "Fall": 2, "Winter": 3 };
        const startIndex = lookup[seasonName] ?? 0;

        const seasonLength = this.daysPerYear / 4;
        this.seasonOffset = startIndex * seasonLength;
    }

    updateTime() {
        const totalDays = (this.time / this.ticksPerDay) + this.seasonOffset;
        const dayOfYear = totalDays % this.daysPerYear;
        const seasonLength = this.daysPerYear / 4;

        const seasonIndex = Math.floor(dayOfYear / seasonLength);
        const nextSeasonIndex = (seasonIndex + 1) % 4;
        this.seasonProgress = (dayOfYear % seasonLength) / seasonLength;
        this.yearProgress = dayOfYear / this.daysPerYear;

        const day = Math.floor(dayOfYear) + 1;
        const year = Math.floor((totalDays) / this.daysPerYear) + 1;

        if (this.currentDate !== day) {
            this.currentDate = day; this.currentYear = year;
            eventBus.emit(EVENTS.DATE_CHANGED, {
                day: this.currentDate, year: this.currentYear
            });
        }
        if (this.currentSeasonIdx !== seasonIndex) {
            this.currentSeasonIdx = seasonIndex; this.nextSeasonIdx = nextSeasonIndex;
            eventBus.emit(EVENTS.SEASON_CHANGED, {
                name: this.seasons[seasonIndex]
            });
        }
    }

    updateBaseTemp() {
        const t1 = this.baseTemps[this.currentSeasonIdx];
        const t2 = this.baseTemps[this.nextSeasonIdx];
        this.baseTemp = t1 + (t2 - t1) * this.seasonProgress;
    }

    step() {
        this.time++;

        this.updateTime();
        this.updateBaseTemp();

        this.map.step(this.baseTemp);
        this.floraSystem.step();
        this.faunaSystem.step();
    }
}
