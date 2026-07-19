'use strict'

import * as THREE from 'three';
import Cell, { SEA_LEVEL } from './cell.js';
import Map from './map.js';
import RandomEngine from '../utils/random.js';

export default class MapGenerator {
    constructor() {
        throw new Error("MapGenerator cannot be instantiated.");
    }

    static generate(width, height, expand, seed=null, baseTemp=10) {
        if (seed !== undefined && seed !== null && seed !== "") {
            this.randomEngine = new RandomEngine(seed);
        } else {
            this.randomEngine = new RandomEngine(Math.random().toString());
        }

        // ===== base elevation =====
        let elevationMap = this.random2D(width, height, -2400, 3600);
        this.smooth(elevationMap);
        this.amplify(elevationMap, 0.3, 0.0);
        for ( let i = 0; i < expand; i++ ) {
            this.expand4x(elevationMap);
            this.applyNoise(elevationMap, 2000);
            this.smooth(elevationMap, 0.6);
            this.amplify(elevationMap, 0.2, 0.0);
        }

        // pull elevation to another random smoother elevation by some amount
        let macroNoise = this.random2D(width, height, -3000, 3600);
        this.smooth(macroNoise);
        this.amplify(macroNoise, 0.1, 0);
        for ( let i = 0; i < expand; i++ ) {
            this.expand4x(macroNoise);
            this.applyNoise(macroNoise, 2400);
            this.smooth(macroNoise, 0.6);
            this.amplify(macroNoise, 0.2, 0);
        }
        for ( let i = 0; i < 12; i++ ) this.smooth(macroNoise, 1.0);
        this.amplify(macroNoise, 0.4, 0);
        this.pullToCenterByMap(elevationMap, macroNoise, 0.4);

        // variable smooth
        macroNoise = this.random2D(width, height, 0, 1.0);
        this.smooth(macroNoise);
        this.amplify(macroNoise, 0.1, 0.5);
        for ( let i = 0; i < expand; i++ ) {
            this.expand4x(macroNoise);
            this.applyNoise(macroNoise, 0.2);
            this.smooth(macroNoise, 0.8);
            this.amplify(macroNoise, 0.2, 0.5);
        }
        for ( let i = 0; i < 6; i++ ) this.smooth(macroNoise, 1.0);
        for ( let i = 0; i < 2; i++ ) this.smoothByMap(elevationMap, macroNoise);

        // final uniform smooth
        for ( let i = 0; i < 4; i++ ) this.smooth(elevationMap, 0.3);

        // ===== domain warp =====
        // ao9's blur kernel is isotropic (no preferred direction), so no
        // matter how the variable-smooth macroNoise above dials roughness
        // per-region, smoothed features still come out blob/oval-shaped -
        // that's a separate axis from roughness. Warping bends the
        // COORDINATES elevation is sampled from using a broad, low-frequency
        // noise field, so coastlines/ridgelines meander and twist instead of
        // reading as smoothed blobs. Applied before distanceToWaterMap below
        // so humidity's coastal proximity naturally follows the same bent
        // coastline rather than the old straight one.
        const warpX = this.buildWarpMap(elevationMap.metaData.width, elevationMap.metaData.height);
        const warpY = this.buildWarpMap(elevationMap.metaData.width, elevationMap.metaData.height);
        const warpStrength = elevationMap.metaData.width * 0.035;
        elevationMap = this.warpByMap(elevationMap, warpX, warpY, warpStrength);

        // ===== ground fertility =====
        let fertilityMap = this.random2D(width, height, 0, 1.0);
        this.smooth(fertilityMap);
        this.amplify(fertilityMap, 0.1, 0.5);
        for ( let i = 0; i < expand; i++ ) {
            this.expand4x(fertilityMap);
            this.applyNoise(fertilityMap, 0.4);
            this.smooth(fertilityMap, 0.6);
            this.amplify(fertilityMap, 0.2, 0.5);
        }
        this.smooth(fertilityMap, 0.2);
        this.clamp(fertilityMap, 0, 1);

        // ===== humidity =====
        // water proximity: a one-time distance-to-nearest-water falloff
        const waterDistanceMap = this.distanceToWaterMap(elevationMap);
        const waterProximityMap = this.waterProximityMap(waterDistanceMap);

        // independent noise, generated the same way as fertility, so humidity
        // isn't purely a function of distance to water (real jungles can be
        // humid far inland; real coastlines can be arid)
        let humidityNoiseMap = this.random2D(width, height, 0, 1.0);
        this.smooth(humidityNoiseMap);
        this.amplify(humidityNoiseMap, 0.1, 0.5);
        for ( let i = 0; i < expand; i++ ) {
            this.expand4x(humidityNoiseMap);
            this.applyNoise(humidityNoiseMap, 0.4);
            this.smooth(humidityNoiseMap, 0.6);
            this.amplify(humidityNoiseMap, 0.2, 0.5);
        }
        this.smooth(humidityNoiseMap, 0.2);
        this.clamp(humidityNoiseMap, 0, 1);

        const humidityMap = this.blendMaps(waterProximityMap, humidityNoiseMap, 0.5);
        // averaging two [0,1] maps compresses the result toward the middle;
        // stretch the range back out before clamping so some cells actually
        // land on the true 0.0 (bone dry) and 1.0 (saturated) extremes
        // instead of only ever approaching them
        this.amplify(humidityMap, 0.35, 0.5);
        this.clamp(humidityMap, 0, 1);

        // ===== temperature microclimate =====
        // small persistent per-cell jitter (shady valley, sun-exposed slope, etc)
        // layered onto elevation-driven temperature; same pipeline as fertility/humidity
        let microclimateMap = this.random2D(width, height, -1, 1);
        this.smooth(microclimateMap);
        this.amplify(microclimateMap, 0.1, 0);
        for ( let i = 0; i < expand; i++ ) {
            this.expand4x(microclimateMap);
            this.applyNoise(microclimateMap, 0.4);
            this.smooth(microclimateMap, 0.6);
            this.amplify(microclimateMap, 0.2, 0);
        }
        this.smooth(microclimateMap, 0.2);
        this.clamp(microclimateMap, -1, 1);

        // ===== biome boundary jitter =====
        // small persistent per-cell offset applied to classifyBiome()'s
        // elevation/humidity cutoffs, so biome boundaries are an organically
        // jagged transition instead of a hard line following exact contour
        // values. Unlike fertility/humidity/microclimate, this deliberately
        // skips the smoothing pipeline - it needs raw, independent per-cell
        // noise (no spatial correlation between neighbors), generated
        // directly at final resolution, otherwise neighboring cells land on
        // nearly the same jitter value and the boundary just shifts as a
        // whole instead of breaking up tile-by-tile.
        const biomeJitterMap = this.random2D(
            elevationMap.metaData.width, elevationMap.metaData.height, -1, 1
        );

        // ===== animation offset =====
        let offsetMap = this.random2D(width, height, -Math.PI * 2, Math.PI * 2);
        this.smooth(offsetMap);
        this.amplify(offsetMap, 0.2, 0);
        for ( let i = 0; i < expand; i++ ) {
            this.expand4x(offsetMap);
            this.applyNoise(offsetMap, 0.4);
            this.smooth(offsetMap, 0.8);
            this.amplify(offsetMap, 0.1, 0);
        }
        for ( let i = 0; i < 2; i++ ) this.smooth(offsetMap, 0.2);

        let { gradX, gradY } = this.computeGradient(elevationMap);
        return this.constructMap(elevationMap, fertilityMap, { gradX, gradY }, baseTemp, offsetMap, humidityMap, microclimateMap, biomeJitterMap);
    }

    static computeGradient(elevationMap) {
        let width = elevationMap.metaData.width;
        let height = elevationMap.metaData.height;
        let gradX = Array.from({ length: height }, () => Array(width).fill(0));
        let gradY = Array.from({ length: height }, () => Array(width).fill(0));

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let left  = x > 0 ? elevationMap[y][x-1] : elevationMap[y][x];
                let right = x < width-1 ? elevationMap[y][x+1] : elevationMap[y][x];
                let up    = y > 0 ? elevationMap[y-1][x] : elevationMap[y][x];
                let down  = y < height-1 ? elevationMap[y+1][x] : elevationMap[y][x];

                gradX[y][x] = (right - left) / 2;
                gradY[y][x] = (down - up) / 2;
            }
        }
        return { gradX, gradY };
    }
    
    static random2D(width, height, low, high) {
        const eMap = [];
        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                row.push(this.randomEngine.rand1f() * (high - low) + low);
            }
            eMap.push(row);
        }
        eMap.metaData = { width, height };
        return eMap;
    }

    static pullToCenterByMap(map, centerMap, strength = 1.0) {
        const height = map.metaData.height;
        const width = map.metaData.width;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                map[y][x] += (centerMap[y][x] - map[y][x]) * strength;
            }
        }
    }

    static smoothByMap(map, strengthMap) {
        const newMap = [];
        for (let y = 0; y < map.metaData.height; y++) {
            const row = [];
            for (let x = 0; x < map.metaData.width; x++) {
                let oldVal = map[y][x];
                const avg = oldVal + strengthMap[y][x] * (this.ao9(map, x, y) - oldVal);
                row.push(avg);
            }
            newMap.push(row);
        }
        map.splice(0, map.length, ...newMap);
    }

    static smooth(map, strength = 1.0) {
        const newMap = [];
        for (let y = 0; y < map.metaData.height; y++) {
            const row = [];
            for (let x = 0; x < map.metaData.width; x++) {
                let oldVal = map[y][x];
                const avg = oldVal + strength * (this.ao9(map, x, y) - oldVal);
                row.push(avg);
            }
            newMap.push(row);
        }
        map.splice(0, map.length, ...newMap);
    }

    // a broad, low-frequency [-1, 1] field used to bend sampling coordinates
    // (see warpByMap) - generated directly at final resolution and heavily
    // blurred, rather than run through the progressive expand4x octaves
    // everything else uses, since a warp field specifically wants coarse,
    // sweeping variation, not fine per-cell detail
    static buildWarpMap(width, height) {
        const m = this.random2D(width, height, -1, 1);
        for (let i = 0; i < 10; i++) this.smooth(m, 0.8);
        this.clamp(m, -1, 1);
        return m;
    }

    // resamples `map` through a coordinate offset drawn from warpX/warpY
    // (each cell reads from `map` at (x + warpX*strength, y + warpY*strength)
    // instead of its own position), bilinearly interpolating since the
    // warped position lands between grid cells
    static warpByMap(map, warpX, warpY, strength) {
        const width = map.metaData.width;
        const height = map.metaData.height;
        const newMap = [];

        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const sx = x + warpX[y][x] * strength;
                const sy = y + warpY[y][x] * strength;
                row.push(this.bilinearSample(map, sx, sy));
            }
            newMap.push(row);
        }

        newMap.metaData = { width, height };
        return newMap;
    }

    static bilinearSample(map, x, y) {
        const width = map.metaData.width;
        const height = map.metaData.height;

        const cx = Math.max(0, Math.min(width - 1, x));
        const cy = Math.max(0, Math.min(height - 1, y));
        const x0 = Math.floor(cx), x1 = Math.min(width - 1, x0 + 1);
        const y0 = Math.floor(cy), y1 = Math.min(height - 1, y0 + 1);
        const tx = cx - x0, ty = cy - y0;

        const top = map[y0][x0] + (map[y0][x1] - map[y0][x0]) * tx;
        const bottom = map[y1][x0] + (map[y1][x1] - map[y1][x0]) * tx;
        return top + (bottom - top) * ty;
    }

    static amplify(map, amount, center = 0.0) {
        for (let y = 0; y < map.metaData.height; y++) {
            for (let x = 0; x < map.metaData.width; x++) {
                map[y][x] += (map[y][x] - center) * amount;
            }
        }
    }

    static applyNoise(map, range = 1) {
        for (let y = 0; y < map.metaData.height; y++) {
            for (let x = 0; x < map.metaData.width; x++) {
                map[y][x] += (this.randomEngine.rand1f() - 0.5) * range;
            }
        }
    }

    static clamp(map, min = 0, max = 1) {
        for (let y = 0; y < map.metaData.height; y++) {
            for (let x = 0; x < map.metaData.width; x++) {
                map[y][x] = Math.max(min, Math.min(max, map[y][x]));
            }
        }
    }

    static expand4x(map) {
        const newHeight = map.metaData.height * 2;
        const newWidth = map.metaData.width * 2;
        const newMap = [];

        for (let y = 0; y < newHeight; y++) {
            const row = [];
            for (let x = 0; x < newWidth; x++) {
                row.push(map[Math.floor(y / 2)][Math.floor(x / 2)]);
            }
            newMap.push(row);
        }

        map.metaData.width = newWidth;
        map.metaData.height = newHeight;
        map.splice(0, map.length, ...newMap);
    }

    // multi-source BFS: grid distance from each cell to its nearest water tile
    static distanceToWaterMap(elevationMap) {
        const width = elevationMap.metaData.width;
        const height = elevationMap.metaData.height;
        const dist = Array.from({ length: height }, () => Array(width).fill(Infinity));

        const queue = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (elevationMap[y][x] < SEA_LEVEL) {
                    dist[y][x] = 0;
                    queue.push([x, y]);
                }
            }
        }

        let head = 0;
        while (head < queue.length) {
            const [x, y] = queue[head++];
            const d = dist[y][x];
            for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                if (dist[ny][nx] > d + 1) {
                    dist[ny][nx] = d + 1;
                    queue.push([nx, ny]);
                }
            }
        }

        dist.metaData = { width, height };
        return dist;
    }

    // converts grid distance to a smooth 1 (at the coast) -> 0 (far inland) falloff
    static waterProximityMap(distanceMap, decay = 0.15) {
        const width = distanceMap.metaData.width;
        const height = distanceMap.metaData.height;
        const prox = Array.from({ length: height }, () => Array(width).fill(0));

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                prox[y][x] = Math.exp(-distanceMap[y][x] * decay);
            }
        }

        prox.metaData = { width, height };
        return prox;
    }

    // weighted average of two same-sized maps
    static blendMaps(mapA, mapB, weightA = 0.5) {
        const width = mapA.metaData.width;
        const height = mapA.metaData.height;
        const result = Array.from({ length: height }, () => Array(width).fill(0));

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                result[y][x] = weightA * mapA[y][x] + (1 - weightA) * mapB[y][x];
            }
        }

        result.metaData = { width, height };
        return result;
    }

    // average of 8 neighbors + self
    // if not all neighbors exist (edge and corner tiles),
    // it returns average of existing neighbors
    static ao9(map, x, y) {
        let totalValue = 0.0, neighborCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || nx >= map.metaData.width || ny < 0 || ny >= map.metaData.height) continue;
                totalValue += map[ny][nx]; neighborCount++;
            }
        }
        return totalValue / neighborCount;
    }
    
    static constructMap(elevationMap, fertilityMap, gradientMaps, baseTemp, offsetMap, humidityMap, microclimateMap, biomeJitterMap) {
        const { gradX, gradY } = gradientMaps;

        const width = elevationMap.metaData.width;
        const height = elevationMap.metaData.height;
        const cells = new Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const elevation = elevationMap[y][x];
                const fertility = fertilityMap[y][x];
                const animOffset = offsetMap[y][x];
                const humidity = humidityMap[y][x];
                const microclimate = microclimateMap[y][x];
                const biomeJitter = biomeJitterMap[y][x];
                const gradient = new THREE.Vector2(gradX[y][x], gradY[y][x]);
                const idx = y * width + x;
                cells[idx] = new Cell(x, y, elevation, fertility, gradient, baseTemp, animOffset, humidity, microclimate, biomeJitter);
            }
        }

        const map = new Map(width, height, cells);
        map.randomEngine = this.randomEngine;
        return map;
    }
}
