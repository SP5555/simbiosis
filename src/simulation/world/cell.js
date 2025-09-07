'use strict'

import Vegetation from "../entities/vegetation.js";
// import Humidity from "./humidity.js";

const SEA_LEVEL = 0.0;

export default class Cell {
    constructor(x, y, elevation, fertility, baseTemp, gradient) {
        this.x = x;
        this.y = y;
        this.elevation = elevation;
        this.fertility = fertility;
        this.gradient = gradient;
        this.isWater = elevation < SEA_LEVEL;
        
        this.temperature = this.elevationToTemp(baseTemp, elevation);
        // internal use
        this.lastRecordedTemp = this.temperature;
        this.tempChanged = false;

        this.biome = this.classifyBiome();

        // this.humidity = new Humidity(this.isWater, Math.random() / 5);

        this.vegetation = null;
        if (this.isWater) {
            this.vegetation = new Vegetation(this.temperature, this.fertility, this.biome, 0);
        } else {
            this.vegetation = new Vegetation(this.temperature, this.fertility, this.biome, Math.random() < 0.05 ? 0.02 : 0);
        }
    }

    step(baseTemp, map) {
        // if (this.isWater) return;
        this.updateTemp(baseTemp);
        this.vegetation.step(this, map);
        // this.humidity.step(this, map);
    }

    elevationToTemp(baseTemp, elevation) {
        const minElev = 0, maxElev = 4000;
        const minTOffset = -10, maxTOffset = 20;

        let e = Math.max(0, elevation);
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
        } else {
            this.tempChanged = false;
        }
    }

    classifyBiome() {
        if (this.isWater) return "Ocean";

        const e = this.elevation;
        const f = this.fertility;

        if (f < 0.3) {
            if (e < 1000)   return "Desert";
            if (e < 3000)   return "Steppe";
                            return "Tundra";
        } else if (f < 0.7) {
            if (e < 1000)   return "Savanna";
            if (e < 3000)   return "Grassland";
                            return "Taiga";
        } else {
            if (e < 1000)   return "Jungle";
            if (e < 3000)   return "Forest";
                            return "Boreal"; 
        }
    }

    // only return string values
    getDisplayStats() {
        if (this.isWater) {
            return {
                Elevation: `${this.elevation.toFixed(0)} m`,
                Temperature: `${this.temperature.toFixed(1)}&deg;C`,
            };
        } else {
            return {
                Elevation: `${this.elevation.toFixed(0)}m`,
                Temperature: `${this.temperature.toFixed(1)}&deg;C`,
                Biome: this.biome,
                Fertility: this.fertility.toFixed(2),
                Vegetation: this.vegetation.value.toFixed(2),
            };
        }
    }
}
