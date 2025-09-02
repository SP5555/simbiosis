'use strict'

import seedrandom from 'seedrandom';

export default class RandomEngine {
    constructor(seed) {
        this.rng = seedrandom(seed);
    }

    rand1f() {
        return this.rng();
    }
}