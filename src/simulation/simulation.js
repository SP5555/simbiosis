'use strict'

import MapGenerator from './world/map-generator.js';

export default class Simulation {
    constructor() {
        this.time = 0;
        this.ticksPerDay = 900;  // IRL 15s  = sim 1d
        this.daysPerYear = 20;   // IRL  5m  = sim 1y

        this.baseTemps = [0, 25, 20, -6]; // SP, SU, FA, WI
        this.temps = [...this.baseTemps];

        this.baseTemp = 0;
        this.updateBaseTemp();

        this.generateMap(0, 0, 0);
    }

    generateMap(width, height, expand, seed=null) {
        this.map = MapGenerator.generate(width, height, expand, seed, this.baseTemp);
    }

    setStartSeason(seasonName) {
        const lookup = { "Spring": 0, "Summer": 1, "Fall": 2, "Winter": 3 };
        this.startSeasonIndex = lookup[seasonName] ?? 0;
        this.temps = this.baseTemps
            .slice(this.startSeasonIndex)
            .concat(this.baseTemps.slice(0, this.startSeasonIndex));
    }

    updateBaseTemp() {
        const totalDays = this.time / this.ticksPerDay;
        const dayOfYear = totalDays % this.daysPerYear;
        const seasonLength = this.daysPerYear / 4;

        const seasonIndex = Math.floor(dayOfYear / seasonLength);
        const nextSeasonIndex = (seasonIndex + 1) % 4;
        const progress = (dayOfYear % seasonLength) / seasonLength;
        const t1 = this.temps[seasonIndex];
        const t2 = this.temps[nextSeasonIndex];
        this.baseTemp =  t1 + (t2 - t1) * progress;
    }

    step() {
        this.time++;
        this.updateBaseTemp();
        this.map.step(this.baseTemp);
    }
}
