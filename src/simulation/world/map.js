'use strict'

export default class Map {
    constructor(width, height, cells) {
        this.width = width;
        this.height = height;
        this.cells = cells;
    }

    buildRefs(floraSystem) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.cells[y][x].buildRefs(floraSystem.getAllAt(x, y));
            }
        }
    }

    step(bT) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.cells[y][x].step(bT);
            }
        }
    }

    getCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return this.cells[y][x];
    }
}
