export default class Humidity {
    static DEFAULTS = {
        sprThreshold: 0.0,      // above this threshold, spread timer starts
        sprInterval: 10,        // after this amount of ticks, spread becomes possible
        sprProb: 0.4,           // per-tick probability of spreading to random neighbor
        sprPercent: 0.06,            // spread this amount

        replenishRate: 0.01,
        drainRate: 0.0005,
    }

    constructor(isSource, value = 0.5, options = {}) {
        this.isSource = isSource;
        this.value = isSource ? 1.0 : value;
        this.spreadTicks = 0;

        Object.assign(this, Humidity.DEFAULTS,
            options);
    }

    step(cell, map) {
        if (this.value <= 0) return;

        this.stepDrain();
        this.stepReplenish();
        this.stepSpread(cell, map);

        this.value = Math.max(0, Math.min(this.value, 1));
    }

    stepReplenish() {
        if (this.isSource && this.value < 1) {
            this.value += this.replenishRate;
        }
    }

    stepDrain() {
        this.value -= this.drainRate;
    }

    stepSpread(cell, map) {
        if (this.value >= this.sprThreshold) {
            if (this.spreadTicks >= this.sprInterval && Math.random() < this.sprProb) {
                let dx = Math.floor(Math.random() * 5) - 2;
                let dy = Math.floor(Math.random() * 5) - 2;
                if (dx !== 0 || dy !== 0) {
                    let neighbor = map.getCell(cell.x + dx, cell.y + dy);
                    if (neighbor) {
                        let s = this.value * this.sprPercent;
                        let accepted = neighbor.humidity.add(s);
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

    add(spr) {;
        if (this.value >= 1.0) return 0;
        let accepted = Math.min(spr, 1.0 - this.value);
        this.value += accepted;
        return accepted;
    }
}