'use strict'

import MapGenerator from './world/map_generator.js';

export default class Simulation {
    constructor() {
        this.time = 0;
        this.map = MapGenerator.generate(4, 4, 4, "goated");
    }

    step() {
        this.time++;
        this.map.step();
    }
}
