'use strict'

import Vegetation from "./flora/vegetation.js";

export default class FloraSystem {
    constructor(map) {
        this.map = map;
        this.width = this.map.width;
        this.height = this.map.height;

        this.species = {};

        this.initFlora();
    }

    initFlora() {
        this.addSpecies("veg", (cell) => {
            if (!cell.isWater)
                return new Vegetation(this, cell, Math.random() < 0.05 ? 1 : 0);
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
        for (const speciesName in this.species) {
            const { instances } = this.species[speciesName];
            for (let i = 0; i < instances.length; i++) {
                if (instances[i]) instances[i].step();
            }
        }
    }

    _index(x, y) {
        return y * this.width + x;
    }
}
