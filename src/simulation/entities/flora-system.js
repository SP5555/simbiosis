'use strict'

import Vegetation from "./flora/vegetation.js";
import TickScheduler from "../utils/tick-scheduler.js";
import { eventBus } from "../../utils/event-emitters.js";
import { EVENTS } from "../../utils/events.js";

export default class FloraSystem {
    constructor(map) {
        this.map = map;
        this.width = this.map.width;
        this.height = this.map.height;

        this.species = {};
        this.scheduler = new TickScheduler(1024);

        this.initFlora();

        // a season change can invalidate a settled instance's "nothing's
        // happening, check back later" assumption (e.g. winter suddenly
        // dropping its carrying capacity) - force everyone to recheck soon
        // rather than potentially sleeping through it
        this.unsubscribeSeasonChanged = eventBus.on(EVENTS.SEASON_CHANGED, () => this.scheduler.wakeAllSoon());
    }

    // a new FloraSystem is created on every map regeneration (see
    // Simulation.generateMap) - without this, the old instance's
    // SEASON_CHANGED subscription (and everything it closes over) would
    // leak forever instead of being garbage collected
    dispose() {
        this.unsubscribeSeasonChanged();
    }

    initFlora() {
        this.addSpecies("veg", (cell) => {
            if (!cell.isWater)
                return new Vegetation(this, cell, this.map.randomEngine.rand1f() < 0.05 ? 1 : 0);
        });
    }

    addSpecies(name, factoryFn) {
        const instances = new Array(this.width * this.height);
        let count = 0;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const idx = this._index(x, y);
                const cell = this.map.getCell(x, y);
                const obj = factoryFn(cell);
                instances[idx] = obj;
                if (obj) count++;
            }
        }

        this.species[name] = {
            meta: { count },
            instances,
        };
    }

    getSpeciesAt(speciesName, x, y) {
        const species = this.species[speciesName];
        if (!species || x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return species.instances[this._index(x, y)];
    }

    getAllAt(x, y) {
        const result = {};
        for (const speciesName in this.species) {
            result[speciesName] = this.getSpeciesAt(speciesName, x, y);
        }
        return result;
    }

    getCountOf(speciesName) {
        return this.species[speciesName]?.meta.count || 0;
    }

    step() {
        this.scheduler.step(inst => inst.step());
    }

    _index(x, y) {
        return y * this.width + x;
    }
}
