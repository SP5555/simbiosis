'use strict'

import Herd from './fauna/herd.js';
import TickScheduler from '../utils/tick-scheduler.js';

export default class FaunaSystem {
    constructor(map, floraSystem) {
        this.map = map;
        this.floraSystem = floraSystem;
        this.width = this.map.width;
        this.height = this.map.height;

        // sparse, unlike flora's dense per-cell array - herds are mobile,
        // so there's no fixed slot to pin them to
        this.species = { herbivore: { herds: new Set() } };
        this.scheduler = new TickScheduler(1024);

        this.initFauna();
    }

    initFauna() {
        const herds = this.species.herbivore.herds;
        let placed = 0, attempts = 0;

        while (placed < Herd.DEFAULTS.initialHerdCount && attempts < 1000) {
            attempts++;
            const x = Math.floor(this.map.randomEngine.rand1f() * this.width);
            const y = Math.floor(this.map.randomEngine.rand1f() * this.height);
            const cell = this.map.getCell(x, y);
            if (!cell || cell.isWater || cell.getFauna("herbivore")) continue;

            herds.add(new Herd(this, this.floraSystem, "herbivore", cell, Herd.DEFAULTS.startingPopulation));
            placed++;
        }
    }

    getHerds(speciesName) {
        return this.species[speciesName]?.herds ?? new Set();
    }

    // called by a herd itself when its population reaches 0 (see Herd.die)
    removeHerd(speciesName, herd) {
        this.species[speciesName]?.herds.delete(herd);
    }

    step() {
        this.scheduler.step(inst => inst.step());
    }

    // no event subscriptions in v1 (herds are never dormant, always
    // self-reschedule, so there's no sleeping population that needs an
    // external nudge the way flora's SEASON_CHANGED->wakeAllSoon does) -
    // present for symmetry so Simulation can call it unconditionally
    dispose() {
    }
}
