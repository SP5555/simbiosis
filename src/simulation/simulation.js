'use strict'

import MapGenerator from './world/map-generator.js';

export default class Simulation {
    constructor() {
        this.time = 0;
        this.ticksPerDay = 900;  // IRL 15s  = sim 1d
        this.daysPerYear = 20;   // IRL  5m  = sim 1y

        this.baseTemp = 0;
        this.updateBaseTemp();

        this.generateMap(0, 0, 0);
    }

    generateMap(width, height, expand, seed=null) {
        this.map = MapGenerator.generate(width, height, expand, seed, this.baseTemp);
    }

    updateBaseTemp() {
        const totalDays = this.time / this.ticksPerDay;
        const dayOfYear = totalDays % this.daysPerYear;
        const seasonLength = this.daysPerYear / 4;

        // spring, summer, fall, winter
        const temps = [ 5, 25, 20, 0 ];

        const seasonIndex = Math.floor(dayOfYear / seasonLength);
        const nextSeasonIndex = (seasonIndex + 1) % 4;
        const progress = (dayOfYear % seasonLength) / seasonLength;
        const t1 = temps[seasonIndex];
        const t2 = temps[nextSeasonIndex];
        this.baseTemp =  t1 + (t2 - t1) * progress;
    }

    step() {
        this.time++;
        this.updateBaseTemp();
        this.map.step(this.baseTemp);
    }
}
