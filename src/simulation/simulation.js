'use strict'

import MapGenerator from './world/map_generator.js';

export default class Simulation {
    constructor() {
        this.time = 0;
        this.map = MapGenerator.generate(5, 4, 4, "buffer");
    }

    step() {
        this.time++;
        this.map.step();
    }
}
