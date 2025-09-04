'use strict'

export default class Vegetation {
    static DEFAULTS = {
        growthRate: 0.012,      // change rate (also handles death)

        extThreshold: 0.10,     // under this threshold, extinction timer starts
        extInterval: 400,       // after this amount of ticks, extinction becomes possible
        extProb: 0.01,          // per-tick probability of vegetation dying

        sprThreshold: 0.5,      // above this threshold, spread timer starts
        sprInterval: 300,       // after this amount of ticks, spread becomes possible
        sprProb: 0.01,          // per-tick probability of spreading to random neighbor
        sprAmt: 0.01,           // spread this amount of vegetation

        max: 0.5,               // max vegetation allowed 
    };

    constructor(temperature, moisture, biome="default", options = {}) {
        this.value = 0;
        this.deathTicks = 0;
        this.spreadTicks = 0;

        this.biome = biome;
        Object.assign(this, Vegetation.DEFAULTS,
            // this.getBiomeVegetationDefaults(),
            this.calcParams(temperature, moisture),
            options);
    }

    step(cell, map) {
        if (this.value <= 0) return;
        if (cell.tempChanged) {
            this.calcParams(cell.temperature, cell.moisture);
        }

        this.handleExtinction();
        this.handleGrowth();
        this.handleSpread(cell, map);

        this.value = Math.max(0, this.value);
    }

    handleGrowth() {
        let P = this.value;
        let growthFactor = Math.max(0, this.growthRate);
        let mortalityFactor = 0;
        // threshold for poor conditions
        if (this.growthRate < 0.0001) mortalityFactor = 0.02;

        P += growthFactor * P * (1 - P / (this.max + 1e-5));
        P -= mortalityFactor * P;

        this.value = P;
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
                        let exceed = neighbor.vegetation.add(this.sprAmt);
                        this.value += (-this.sprAmt + exceed);
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

    // receives spread from neighbor
    add(spr) {
        if (this.value >= 1.0) return spr;
        let accepted = Math.min(spr, 1.0 - this.value);
        let exceed = spr - accepted;
        this.value += accepted;
        return exceed;
    }

    calcParams(t, m) {
        let G = this.gauss;
        let max        = (1.00 + Math.min(0, 0.0350 * (t - 26)) - Math.max(0, 0.0500 * (t - 32))) * G(m, 1, 0.5);
        let growthRate = (0.01 + Math.min(0, 0.0005 * (t - 20)) - Math.max(0, 0.0006 * (t - 35))) * G(m, 1, 0.4);

        return { growthRate: Math.max(0, growthRate), max: max }
    }

    gauss(x, opt, sigma) {
        return Math.exp( -0.5 * ((x - opt)/sigma) ** 2 );
    }

    getBiomeVegetationDefaults() {
        switch (this.biome) {
            case "Tundra":
                return { growthRate: 0.003, max: 0.10 };
            case "Steppe":
                return { growthRate: 0.004, max: 0.15 }
            case "Desert":
                return { growthRate: 0.005, max: 0.20 };
            case "Taiga":
                return { growthRate: 0.014, max: 0.20 };
            case "Temperate":
                return { growthRate: 0.016, max: 0.30 };
            case "Savanna":
                return { growthRate: 0.018, max: 0.40 };
            case "Boreal":
                return { growthRate: 0.016, max: 0.60 };
            case "Forest": 
                return { growthRate: 0.018, max: 0.75 };
            case "Rainforest":
                return { growthRate: 0.020, max: 0.90 };
            default:
                return { growthRate: 0.000, max: 0.00 };
        }
    }
}
