'use strict'

import MapGenerator from './world/map_generator.js';

export default class Simulation {
    constructor() {
        this.time = 0;
        this.generateMap(5, 5, 4, "night");
    }

    generateMap(width, height, expand, seed=null) {
        this.map = MapGenerator.generate(width, height, expand, seed);
    }

    step() {
        this.time++;
        this.map.step();
    }
}
