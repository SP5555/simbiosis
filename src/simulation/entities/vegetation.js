'use strict'

export default class Vegetation {
    static DEFAULTS = {
        repRate: 0.012,         // reproduction rate
        deathRate: 0.02,        // death rate

        extThreshold: 0.10,     // under this threshold, extinction timer starts
        extInterval: 400,       // after this amount of ticks, extinction becomes possible
        extProb: 0.01,          // per-tick probability of vegetation dying

        sprThreshold: 0.3,      // above this threshold, spread timer starts
        sprInterval: 400,       // after this amount of ticks, spread becomes possible
        sprProb: 0.01,          // per-tick probability of spreading to random neighbor
        sprAmt: 0.02,           // spread this fraction of vegetation

        max: 0.5,               // max vegetation allowed 
    };

    constructor(biome="default", options = {}) {
        this.value = 0;
        this.deathTicks = 0;
        this.spreadTicks = 0;

        this.biome = biome;
        Object.assign(this, Vegetation.DEFAULTS, this.getBiomeVegetationDefaults(), options);
    }


    step(cell, map) {
        if (this.value <= 0) return;
        this.handleExtinction();
        this.handleGrowth();
        this.handleSpread(cell, map);

        this.value = Math.max(0, this.value);
    }

    handleGrowth() {
        let deltaR = this.repRate * this.value;
        let deltaD = this.deathRate * this.value * (this.value / (this.max + 1e-3));
        this.value += deltaR - deltaD;
    }

    handleExtinction() {
        if (this.value < this.extThreshold) {
            if (this.deathTicks >= this.extInterval && Math.random() < this.extProb) {
                this.value = 0;
                this.deathTicks = 0;
            } else {
                this.deathTicks++;
            }
        } else {
            this.deathTicks = 0;
        }
    }

    handleSpread(cell, map) {
        if (this.value >= this.sprThreshold) {
            if (this.spreadTicks >= this.sprInterval && Math.random() < this.sprProb) {
                let dx = Math.floor(Math.random() * 5) - 2;
                let dy = Math.floor(Math.random() * 5) - 2;
                if (dx !== 0 || dy !== 0) {
                    let neighbor = map.getCell(cell.x + dx, cell.y + dy);
                    if (neighbor && !neighbor.isWater) {
                        let s = this.value * this.sprAmt;
                        neighbor.vegetation.value += s;
                        this.value -= s;
                        this.spreadTicks = 0;
                    }
                }
            } else {
                this.spreadTicks++;
            }
        } else {
            this.spreadTicks = 0;
        }
    }

    getBiomeVegetationDefaults() {
        switch (this.biome) {
            case "Tundra":
                return { repRate: 0.003, deathRate: 0.024, max: 0.10 };
            case "Steppe":
                return { repRate: 0.004, deathRate: 0.024, max: 0.15 }
            case "Desert":
                return { repRate: 0.005, deathRate: 0.024, max: 0.20 };
            case "Taiga":
                return { repRate: 0.014, deathRate: 0.020, max: 0.20 };
            case "Temperate":
                return { repRate: 0.016, deathRate: 0.020, max: 0.30 };
            case "Savanna":
                return { repRate: 0.018, deathRate: 0.020, max: 0.40 };
            case "Boreal":
                return { repRate: 0.016, deathRate: 0.020, max: 0.60 };
            case "Forest": 
                return { repRate: 0.018, deathRate: 0.020, max: 0.75 };
            case "Rainforest":
                return { repRate: 0.020, deathRate: 0.020, max: 0.90 };
            default:
                return { repRate: 0.000, deathRate: 0.000, max: 0.00 };
        }
    }
}
