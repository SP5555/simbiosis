'use strict'

export default class Vegetation {
    static DEFAULTS = {
        changeRate: 0.014,      // sensitivity to logistic growth equation 
        max: 0.5,               // max vegetation allowed (variable)

        extThreshold: 0.10,     // under this threshold, extinction timer starts
        extInterval: 400,       // after this amount of ticks, extinction becomes possible
        extProb: 0.01,          // per-tick probability of vegetation dying

        sprThreshold: 0.3,      // above this threshold, spread timer starts
        sprInterval: 300,       // after this amount of ticks, spread becomes possible
        sprProb: 0.01,          // per-tick probability of spreading to random neighbor
        sprAmt: 0.01,           // spread this amount of vegetation
    };

    constructor(temperature, fertility, biome="default", value=0, options = {}) {
        this.value = value;
        this.deathTicks = 0;
        this.spreadTicks = 0;

        this.biome = biome;
        Object.assign(this, Vegetation.DEFAULTS,
            // this.getBiomeVegetationDefaults(),
            this.calcParams(temperature, fertility),
            options);
    }

    step(cell, map) {
        if (this.value <= 0) return;
        if (cell.tempChanged) {
            Object.assign(this, this.calcParams(cell.temperature, cell.fertility));
        }

        this.handleExtinction();
        this.handleGrowth();
        this.handleSpread(cell, map);

        this.value = Math.max(0, this.value);
    }

    handleGrowth() {
        let P = this.value;
        P += this.changeRate * P * (1 - P / (this.max + 1e-5));
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
                        let accepted = neighbor.vegetation.add(this.sprAmt);
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
        if (this.value >= 2.0) return 0;
        let accepted = Math.min(spr, 2.0 - this.value);
        this.value += accepted;
        return accepted;
    }

    calcParams(t, f) {
        let G = this.gauss;
        let max = (1 + Math.min(0, 0.06 * (t - 15)) - Math.max(0, 0.0500 * (t - 32))) * G(f, 1, 0.5);
        return { max: Math.max(0, max) }
    }

    gauss(x, opt, sigma) {
        return Math.exp( -0.5 * ((x - opt)/sigma) ** 2 );
    }

    getBiomeVegetationDefaults() {
        switch (this.biome) {
            case "Tundra":      return { max: 0.10 };
            case "Steppe":      return { max: 0.15 }
            case "Desert":      return { max: 0.20 };
            case "Taiga":       return { max: 0.20 };
            case "Temperate":   return { max: 0.30 };
            case "Savanna":     return { max: 0.40 };
            case "Boreal":      return { max: 0.60 };
            case "Forest":      return { max: 0.75 };
            case "Rainforest":  return { max: 0.90 };
            default:            return { max: 0.00 };
        }
    }
}
