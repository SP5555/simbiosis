'use strict'

export default class FaunaSystem {
    constructor(map) {
        this.map = map;
        this.width = this.map.width;
        this.height = this.map.height;

        this.species = {};

        this.initFauna();
    }

    initFauna() {
        // no fauna yet
    }

    step() {
        
    }
}
