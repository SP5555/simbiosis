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

        // deep water resists temperature change far more than shallow water
        // (thermal mass, no direct surface exposure) - not a different
        // equilibrium temperature, just a much slower response to it, so a
        // single winter chills a shallow bay to freezing while deep ocean
        // barely moves (though sustained multi-year cold still eventually
        // catches up, same as this loosely approximates real oceans). Land
        // keeps today's fast response.
        this.tempInertiaRate = this.computeTempInertiaRate(elevation);

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
        this.temperature += this.tempInertiaRate * (target - this.temperature);
    }

    // a first-order lag driven by a seasonal sine wave doesn't just delay
    // the response, it also shrinks its amplitude - and if the lag's time
    // constant is too large relative to the wave's period, that shrinkage
    // dominates and the response barely oscillates at all. Our year is only
    // 18000 ticks, so a rate calibrated for "real ocean, takes years" was
    // actually crushing deep water's seasonal swing down to ~27% of the
    // surface's, not just delaying it - a polar deep cell would then never
    // get anywhere near its (already cold) seasonal peak. This instead
    // targets keeping roughly 60% of the swing at extreme depth, with a lag
    // of a few days behind the surface - noticeably damped and delayed, not
    // amplitude-crushed into permafrost.
    //
    // FAST_RATE is 200x SLOW_RATE, so blending them directly (in either rate
    // or tau space) is dominated by whichever endpoint has the larger raw
    // magnitude, even at a small blend weight - rate-space blending made
    // deep water snap to "slow" almost immediately, tau-space blending made
    // shallow water snap to "slow" almost immediately. Blending in LOG space
    // (a geometric interpolation) is the right tool for two values spanning
    // orders of magnitude and doesn't have either problem: shallow/moderate
    // depths stay close to FAST_RATE, only genuinely deep water approaches
    // SLOW_RATE. The depth falloff itself is a true exponential asymptote
    // (never hits a hard floor), unlike an earlier version that clamped at
    // a fixed max depth - that clamp made the rate go from steeply changing
    // to perfectly flat right at the cutoff, and that slope kink was visible
    // as a distinct band on the map even though the value itself never
    // actually jumped.
    computeTempInertiaRate(elevation) {
        const FAST_RATE = 0.05;    // land / shallow water - today's behavior
        const SLOW_RATE = 0.003;   // deep ocean asymptote - damped and delayed, not frozen solid
        const DEPTH_SCALE = 1000;  // depth (m) over which the rate approaches SLOW_RATE

        if (elevation >= SEA_LEVEL) return FAST_RATE;
        const depth = -elevation;
        const t = 1 - Math.exp(-depth / DEPTH_SCALE);
        const logRate = Math.log(FAST_RATE) + (Math.log(SLOW_RATE) - Math.log(FAST_RATE)) * t;
        return Math.exp(logRate);
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
