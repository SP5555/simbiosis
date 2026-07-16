'use strict'

export const SEA_LEVEL = 0.0;

export default class Cell {
    constructor(x, y, elevation, fertility, gradient, baseTemp, animOffset = 0, humidity = 0, microclimate = 0) {
        this.x = x;
        this.y = y;
        this.animOffset = animOffset;

        this.elevation = elevation;
        this.fertility = fertility;
        this.gradient = gradient;
        this.isWater = elevation < SEA_LEVEL;
        // static per-cell property computed once at generation, same as
        // fertility (see MapGenerator's water-proximity + noise blend);
        // water is always fully humid
        this.humidity = this.isWater ? 1.0 : humidity;
        // small persistent per-cell temperature jitter, same generation
        // pipeline as fertility/humidity; up to +/-2.5 degC
        this.microclimateOffset = microclimate * 2.5;

        this.temperature = this.elevationToTemp(baseTemp, elevation);
        // internal use
        this.lastRecordedTemp = this.temperature;
        this.tempChanged = false;

        this.biome = this.classifyBiome();

        this.flora = {};
    }

    buildRefs(floraSpecies) {
        this.flora = { ...floraSpecies };
    }

    step(baseTemp) {
        this.updateTemp(baseTemp);
    }

    elevationToTemp(baseTemp, elevation) {
        const minElev = 0, maxElev = 4000;
        const minTOffset = -10, maxTOffset = 20;

        let e = Math.max(0, elevation);
        let t = (e - minElev) / (maxElev - minElev);
        let elevOffset = maxTOffset - t * (maxTOffset - minTOffset);

        // water moderates temperature swings: humid/coastal cells stay
        // closer to the seasonal baseline, arid/inland cells swing further
        // hot and cold
        const moderation = 1 - 0.6 * this.humidity;
        elevOffset *= moderation;

        return baseTemp + elevOffset + this.microclimateOffset;
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

    getSpecies(speciesName) {
        return this.flora[speciesName] ?? null;
    }

    // biome is temperature (elevation proxy) x precipitation (humidity);
    // fertility is soil richness only and plays no part in biome type
    classifyBiome() {
        if (this.isWater) return "Ocean";

        const e = this.elevation;
        const h = this.humidity;

        if (h < 0.3) {
            if (e < 1800)   return "Desert";
            if (e < 3200)   return "Steppe";
                            return "Tundra";
        } else if (h < 0.7) {
            if (e < 1000)   return "Savanna";
            if (e < 3400)   return "Grassland";
                            return "Taiga";
        } else {
            if (e < 750)    return "Jungle";
            if (e < 3600)   return "Forest";
                            return "Boreal";
        }
    }

    // only return string values
    getDisplayStats() {
        let baseStats = {
            Location: `(${this.x},${this.y})`,
            Elevation: `${this.elevation.toFixed(0)}m`,
            Temperature: `${this.temperature.toFixed(1)} degC`,
        };

        if (this.isWater) return baseStats;

        baseStats.Biome = this.biome;
        baseStats.Fertility = `${(this.fertility * 100).toFixed(2)}%`;
        baseStats.Humidity = `${(this.humidity * 100).toFixed(2)}%`;

        for (let speciesName in this.flora) {
            const flora = this.flora[speciesName];
            if (flora?.getDisplayStats) {
                Object.assign(baseStats, flora.getDisplayStats());
            }
        }

        return baseStats;
    }
}
