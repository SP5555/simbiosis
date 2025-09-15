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
        this.initSpecies("veg", (cell) => {
            if (!cell.isWater)
                return new Vegetation(this, cell, Math.random() < 0.05 ? 1 : 0);
        });
    }

    initSpecies(speciesName, factoryFn) {
        const grid = new Array(this.height);
        for (let y = 0; y < this.height; y++) {
            grid[y] = new Array(this.width);
            for (let x = 0; x < this.width; x++) {
                const cell = this.map.getCell(x, y);
                grid[y][x] = factoryFn(cell);
            }
        }
        this.species[speciesName] = grid;
    }

    step() {
        for (const speciesName in this.species) {
            const grid = this.species[speciesName];
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (grid[y][x]) grid[y][x].step();
                }
            }
        }
    }

    getSpecies(speciesName, x, y) {
        const grid = this.species[speciesName];
        if (!grid || x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return grid[y][x];
    }

    getAllAt(x, y) {
        const result = {};
        for (const speciesName in this.species) {
            result[speciesName] = this.getSpecies(speciesName, x, y);
        }
        return result;
    }
}
