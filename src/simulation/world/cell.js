'use strict'

import Vegetation from "../entities/vegetation.js";

export default class Cell {
    constructor(x, y, height, isWater, moisture) {
        this.x = x;
        this.y = y;
        this.height = height;
        this.isWater = isWater;
        this.moisture = moisture;

        this.vegetation = new Vegetation(this.height, this.moisture);

        if (!this.isWater) {
            this.vegetation.value = Math.random() < 0.05 ? 0.01 : 0;
        }
    }

    step(map) {
        if (this.isWater) return;
        this.vegetation.step(this, map);
    }
}
