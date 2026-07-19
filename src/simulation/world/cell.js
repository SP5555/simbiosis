'use strict'

export const SEA_LEVEL = 0.0;

export default class Cell {
    constructor(x, y, elevation, fertility, gradient, baseTemp, animOffset = 0, humidity = 0, microclimate = 0, biomeJitter = 0) {
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
        // persistent per-cell jitter applied to classifyBiome()'s cutoffs
        // below, so biome boundaries aren't a hard line following exact
        // elevation/humidity contours
        this.biomeJitter = biomeJitter;

        this.temperature = this.elevationToTemp(baseTemp, elevation);

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
    }

    getSpecies(speciesName) {
        return this.flora[speciesName] ?? null;
    }

    // biome is temperature (elevation proxy) x precipitation (humidity);
    // fertility is soil richness only and plays no part in biome type
    classifyBiome() {
        if (this.isWater) return "Ocean";

        const e = this.elevation + this.biomeJitter * 400;
        const h = this.humidity + this.biomeJitter * 0.08;

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

    // returns a { header, rows } pair for the tile inspector HUD (see
    // TilePanel): header is the always-present Location/Biome/Elevation/
    // Temperature identity line (biome is "Ocean" for water, set by
    // classifyBiome() below), rows are the water-exempt extras
    // (Fertility/Humidity/flora), as type-tagged descriptors rather than
    // pre-formatted strings since the panel renders visuals (color
    // swatches, bars) that need the raw underlying value
    getDisplayStats() {
        const header = {
            location: `(${this.x}, ${this.y})`,
            biome: this.biome,
            elevation: `${Math.round(this.elevation).toLocaleString()}m`,
            temperature: this.temperature,
            temperatureDisplay: `${Math.round(this.temperature)}°C`,
        };

        const rows = [];
        if (!this.isWater) {
            rows.push({ key: "fertility", label: "Fertility", type: "bar", fraction: this.fertility, display: `${(this.fertility * 100).toFixed(1)}%` });
            rows.push({ key: "humidity", label: "Humidity", type: "bar", fraction: this.humidity, display: `${(this.humidity * 100).toFixed(1)}%` });

            for (let speciesName in this.flora) {
                const flora = this.flora[speciesName];
                if (flora?.getDisplayStats) {
                    rows.push(...flora.getDisplayStats());
                }
            }
        }

        return { header, rows };
    }
}
