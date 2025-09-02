'use strict'

export default class Vegetation {
    static DEFAULTS = {
        repRate: 0.02,          // reproduction rate
        deathRate: 0.02,        // death rate

        extThreshold: 0.01,     // under this threshold, extinction timer starts
        extInterval: 400,       // after this amount of ticks, extinction becomes possible
        extProb: 0.01,          // probability of vegetation dying out in this cell

        sprThreshold: 0.3,      // above this threshold, spread timer starts
        sprInterval: 400,       // after this amount of ticks, spread becomes possible
        sprProb: 0.01,          // probability of spreading to random neighbor cell
        sprAmt: 0.02,           // spread this fraction of vegetation
    };

    constructor(height, moisture, options = {}) {
        this.value = 0;
        this.max = this.computeMaxVegetation(height, moisture);
        this.deathTicks = 0;
        this.spreadTicks = 0;
        Object.assign(this, Vegetation.DEFAULTS, options);
    }
    
    computeMaxVegetation(height, moisture) {
        if (this.isWater) return 0;

        let heightSuitability = 1 - Math.abs(height - 0.5) / 0.3;
        heightSuitability = Math.max(0, heightSuitability);

        let moistureSuitability = moisture;
        return heightSuitability * moistureSuitability;
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
}
