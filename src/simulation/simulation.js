'use strict'

import MapGenerator from './world/map_generator.js';

export default class Simulation {
    constructor() {
        this.time = 0;
        this.map = MapGenerator.generate(10, 8, 4, "local host");
    }

    step() {
        this.time++;
        this.map.step();
    }
}
