'use strict'

export default class Vegetation {
    static DEFAULTS = {
        // growth attempt: bump value by a random fraction of remaining headroom
        growthFractionMin: 0.05,
        growthFractionMax: 0.20,

        // dieback attempt: shrink toward max by a random fraction of the excess,
        // with a chance of total collapse instead - the collapse chance is
        // dampened by current size (see attemptDieback), so an established,
        // thriving population resists sudden wipeout and mostly just takes
        // a proportional hit, while a small/marginal one stays vulnerable
        diebackFractionMin: 0.2,
        diebackFractionMax: 0.5,
        diebackCollapseProb: 0.15,
        collapseResilience: 20,

        // spread attempt: chance-gated, targets a random neighbor in a 5x5 window
        spreadProb: 0.15,
        spreadFraction: 0.05,

        // next-wake delay ranges (ticks) - shorter while actively changing,
        // longer once settled. The settled case is intentionally capped well
        // below the scheduler's bucket size so nothing sleeps too long even
        // before FloraSystem's season-change wake-up safety net kicks in.
        delayStruggling: [10, 30],
        delayGrowing: [15, 40],
        delaySettled: [80, 180],
    };

    constructor(floraSystem, cell, value = 0, options = {}) {
        this.floraSystem = floraSystem;
        this.cell = cell;
        this.value = value;

        this.biome = cell.biome;
        this.lastTemp = cell.temperature;
        Object.assign(this, Vegetation.DEFAULTS,
            this.calcParams(cell.temperature, cell.fertility, cell.humidity),
            options);

        // dormant (value === 0) instances schedule nothing and cost nothing
        // until add() wakes them via an external spread event
        if (this.value > 0) {
            this.floraSystem.scheduler.schedule(this, this.rollDelay());
        }
    }

    // called by the scheduler when this instance's wake-up tick arrives
    step() {
        if (this.cell.isWater || this.value <= 0) return;

        if (Math.abs(this.cell.temperature - this.lastTemp) > 0.1) {
            this.lastTemp = this.cell.temperature;
            Object.assign(this, this.calcParams(this.cell.temperature, this.cell.fertility, this.cell.humidity));
        }

        const ratio = this.value / (this.max + 1e-2);
        let state;
        if (ratio > 1.1) {
            this.attemptDieback();
            state = "struggling";
        } else if (ratio < 0.95) {
            this.attemptGrowth();
            state = "growing";
        } else {
            this.attemptSpread();
            state = "settled";
        }

        this.value = Math.max(0, this.value);

        if (this.value > 0) {
            this.floraSystem.scheduler.schedule(this, this.rollDelay(state));
        }
        // else: dies, goes dormant, not rescheduled - waits for add()
    }

    attemptGrowth() {
        const headroom = Math.max(0, this.max - this.value);
        const fraction = this.growthFractionMin + Math.random() * (this.growthFractionMax - this.growthFractionMin);
        this.value += headroom * fraction;
    }

    attemptDieback() {
        // resilience is based on size going into this event, not the
        // shrunken value coming out of it
        const collapseProb = this.diebackCollapseProb / (1 + this.value / this.collapseResilience);

        const excess = this.value - this.max;
        const fraction = this.diebackFractionMin + Math.random() * (this.diebackFractionMax - this.diebackFractionMin);
        this.value -= excess * fraction;

        if (Math.random() < collapseProb) {
            this.value = 0;
        }
    }

    attemptSpread() {
        if (Math.random() > this.spreadProb) return;

        const dx = Math.floor(Math.random() * 5) - 2;
        const dy = Math.floor(Math.random() * 5) - 2;
        if (dx === 0 && dy === 0) return;

        const neighbor = this.floraSystem.getSpeciesAt("veg", this.cell.x + dx, this.cell.y + dy);
        if (!neighbor) return;

        const amount = this.value * this.spreadFraction;
        const accepted = neighbor.add(amount);
        this.value -= accepted;
    }

    // receives spread from a neighbor
    add(spr) {
        const wasDormant = this.value <= 0;
        const cap = Math.max(this.max * 1.2, 1);
        const accepted = Math.min(spr, Math.max(0, cap - this.value));
        this.value += accepted;

        if (wasDormant && this.value > 0) {
            this.floraSystem.scheduler.schedule(this, this.rollDelay());
        }
        return accepted;
    }

    rollDelay(state = "settled") {
        const [min, max] = state === "struggling" ? this.delayStruggling
            : state === "growing" ? this.delayGrowing
            : this.delaySettled;
        return min + Math.floor(Math.random() * (max - min));
    }

    calcParams(t, f, h) {
        let G = this.gauss;
        let max = (100 + Math.min(0, 6 * (t - 15)) - Math.max(0, 5 * (t - 32))) * G(f, 1, 0.5) * G(h, 1, 0.5);
        return { max: Math.max(0, max) }
    }

    gauss(x, opt, sigma) {
        return Math.exp( -0.5 * ((x - opt)/sigma) ** 2 );
    }

    getDisplayStats() {
        if (this.value <= 0) return null;
        return {
            [this.constructor.name]: this.value.toFixed(2)
        };
    }
}
