'use strict'

export default class Map {
    constructor(width, height, cells) {
        this.width = width;
        this.height = height;
        this.cells = cells;
    }

    step(bT) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.getCell(x, y).step(bT, this);
            }
        }
    }

    getCell(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return this.cells[y][x];
    }
}
