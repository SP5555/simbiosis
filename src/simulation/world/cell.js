'use strict'

import Vegetation from "../entities/vegetation.js";

const SEA_LEVEL = 0.4;

export default class Cell {
    constructor(x, y, elevation, moisture, baseTemp) {
        this.x = x;
        this.y = y;
        this.elevation = elevation;
        this.moisture = moisture;
        this.isWater = elevation < SEA_LEVEL;
        
        this.temperature = this.elevationToTemp(baseTemp, elevation);
        // internal use
        this.lastRecordedTemp = this.temperature;
        this.tempChanged = false;

        this.biome = this.classifyBiome();
        this.vegetation = new Vegetation(this.temperature, this.moisture, this.biome);

        if (!this.isWater) {
            this.vegetation.value = Math.random() < 0.05 ? 0.01 : 0;
        }
    }

    step(baseTemp, map) {
        if (this.isWater) return;
        this.updateTemp(baseTemp);
        this.vegetation.step(this, map);
    }

    elevationToTemp(baseTemp, elevation) {
        const minElev = 0.4;
        const maxElev = 1.0;

        const minTOffset = -10;
        const maxTOffset = 20;

        let e = Math.max(0.4, elevation);
        let t = (e - minElev) / (maxElev - minElev);
        const temp = baseTemp + maxTOffset - t * (maxTOffset - minTOffset);
        return temp;
    }

    updateTemp(baseTemp) {
        const elevTarget = this.elevationToTemp(baseTemp, this.elevation);
        const elevMomentum = 0.5;
        const target = (1 - elevMomentum) * baseTemp + elevMomentum * elevTarget;
        this.temperature += 0.05 * (target - this.temperature);
        
        if (Math.abs(this.temperature - this.lastRecordedTemp) > 0.1) {
            this.lastRecordedTemp = this.temperature;
            this.tempChanged = true;
        }
        this.tempChanged = false;
    }

    classifyBiome() {
        if (this.isWater) return "Ocean";

        const t = this.temperature;
        const m = this.moisture;

        if (m < 0.2) {
            if (t < 4)  return "Tundra";
            if (t < 26) return "Steppe";
                        return "Desert";
        } else if (m < 0.8) {
            if (t < 4)  return "Taiga";
            if (t < 30) return "Temperate";
                        return "Savanna";
        } else {
            if (t < 10) return "Boreal";
            if (t < 36) return "Forest";
                        return "Rainforest";
        }
    }
}
