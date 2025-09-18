'use strict'

export default class Vegetation {
    static DEFAULTS = {
        changeRate: 0.005,  // sensitivity to logistic growth equation 
        max: 50,            // max vegetation allowed (variable)

        extThreshold: 1,    // under this threshold, extinction timer starts
        extInterval: 200,   // after this amount of ticks, extinction becomes possible
        extProb: 0.003,     // per-tick probability of vegetation dying

        sprThreshold: 30,   // above this threshold, spread timer starts
        sprInterval: 150,   // after this amount of ticks, spread becomes possible
        sprProb: 0.003,     // per-tick probability of spreading to random neighbor
        sprAmt: 1,          // spread this amount of vegetation
    };

    constructor(floraSystem, cell, value=0, options = {}) {
        this.floraSystem = floraSystem;
        this.cell = cell;
        this.value = value;
        this.deathTicks = 0;
        this.spreadTicks = 0;

        this.biome = cell.biome;
        Object.assign(this, Vegetation.DEFAULTS,
            // this.getBiomeVegetationDefaults(),
            this.calcParams(cell.temperature, cell.fertility),
            options);
    }

    step() {
        if (this.cell.isWater) return;
        if (this.value <= 0) return;
        if (this.cell.tempChanged) {
            Object.assign(this, this.calcParams(this.cell.temperature, this.cell.fertility));
        }

        this.stepGrowth();
        this.stepExtinction();
        this.stepSpread();

        this.value = Math.max(0, this.value);
    }

    stepGrowth() {
        let P = this.value;
        P += this.changeRate * P * (1 - P / (this.max + 1e-2));
        this.value = Math.max(P, 1e-2);
    }

    stepExtinction() {
        if (this.value !== 0 && this.value < this.extThreshold) {
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

    stepSpread() {
        if (this.value >= this.sprThreshold) {
            if (this.spreadTicks >= this.sprInterval && Math.random() < this.sprProb) {
                let dx = Math.floor(Math.random() * 5) - 2;
                let dy = Math.floor(Math.random() * 5) - 2;
                if (dx !== 0 || dy !== 0) {
                    let neighbor = this.floraSystem.getSpecies("veg", this.cell.x + dx, this.cell.y + dy);
                    if (neighbor && !neighbor.isWater) {
                        let accepted = neighbor.add(this.sprAmt);
                        this.value -= accepted;
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
        if (this.value >= 200) return 0;
        let accepted = Math.min(spr, 200 - this.value);
        this.value += accepted;
        return accepted;
    }

    calcParams(t, f) {
        let G = this.gauss;
        let max = (100 + Math.min(0, 6 * (t - 15)) - Math.max(0, 5 * (t - 32))) * G(f, 1, 0.5);
        return { max: Math.max(0, max) }
    }

    gauss(x, opt, sigma) {
        return Math.exp( -0.5 * ((x - opt)/sigma) ** 2 );
    }

    getBiomeVegetationDefaults() {
        switch (this.biome) {
            case "Desert":      return { max: 20 };
            case "Steppe":      return { max: 15 }
            case "Tundra":      return { max: 10 };
            case "Savanna":     return { max: 40 };
            case "Grassland":   return { max: 30 };
            case "Taiga":       return { max: 20 };
            case "Jungle":      return { max: 90 };
            case "Forest":      return { max: 75 };
            case "Boreal":      return { max: 60 };
            default:            return { max:  0 };
        }
    }
}
