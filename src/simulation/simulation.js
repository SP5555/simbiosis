'use strict'

import MapGenerator from './world/map-generator.js';

export default class Simulation {
    constructor() {
        this.time = 0;
        this.generateMap(0, 0, 0);
    }

    generateMap(width, height, expand, seed=null) {
        this.map = MapGenerator.generate(width, height, expand, seed);
    }

    step() {
        this.time++;
        this.map.step();
    }
}
