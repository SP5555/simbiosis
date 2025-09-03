'use strict'

import Vegetation from "../entities/vegetation.js";

const SEA_LEVEL = 0.4;

export default class Cell {
    constructor(x, y, elevation, moisture) {
        this.x = x;
        this.y = y;
        this.elevation = elevation;
        this.temperature = this.elevationToTemp(elevation);
        this.moisture = moisture;
        this.isWater = elevation < SEA_LEVEL;

        this.biome = this.classifyBiome();
        this.vegetation = new Vegetation(this.biome);

        if (!this.isWater) {
            this.vegetation.value = Math.random() < 0.05 ? 0.01 : 0;
        }
    }

    step(map) {
        if (this.isWater) return;
        this.vegetation.step(this, map);
    }

    elevationToTemp(elevation) {
        const minElev = 0.4;
        const maxElev = 1.0;

        const minTemp = 0;
        const maxTemp = 50;

        let t = (elevation - minElev) / (maxElev - minElev);
        const temp = maxTemp - t * (maxTemp - minTemp);
        return temp;
    }

    classifyBiome() {
        if (this.isWater) return "Ocean";

        const t = this.temperature;
        const m = this.moisture;

        if (m < 0.3) {
            if (t < 4) return "Tundra";
            if (t < 30) return "Steppe";
            return "Desert";
        } else if (m < 0.7) {
            if (t < 4) return "Taiga";
            if (t < 30) return "Temperate";
            return "Savanna";
        } else {
            if (t < 10) return "Boreal";
            if (t < 36) return "Forest";
            return "Rainforest";
        }
    }
}
