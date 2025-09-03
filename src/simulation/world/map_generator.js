'use strict'

import Cell from './cell.js';
import Map from './map.js';
import RandomEngine from '../utils/random.js';

export default class MapGenerator {
    constructor() {
        throw new Error("MapGenerator cannot be instantiated.");
    }

    static generate(width, height, expand, seed=null) {
        if (seed !== undefined && seed !== null && seed !== "") {
            this.randomEngine = new RandomEngine(seed);
        } else {
            this.randomEngine = new RandomEngine(Math.random().toString());
        }

        // ===== elevation =====
        let elevationMap = this.random2D(width, height);
        this.smooth(elevationMap);
        this.amplify(elevationMap, 0.2, 0.5);
        for ( let i = 0; i < expand; i++ ) {
            this.expand4x(elevationMap);
            this.applyNoise(elevationMap, 0.4);
            this.smooth(elevationMap, 0.4);
            this.amplify(elevationMap, 0.1, 0.4);
        }
        for ( let i = 0; i < 4; i++) this.smooth(elevationMap, 0.5);

        // ===== moisture =====
        let moistureMap = this.random2D(width, height);
        this.smooth(moistureMap);
        this.amplify(moistureMap, 0.1, 0.5);
        for ( let i = 0; i < expand; i++ ) {
            this.expand4x(moistureMap);
            this.applyNoise(moistureMap, 0.4);
            this.smooth(moistureMap, 0.6);
            this.amplify(moistureMap, 0.2, 0.5);
        }
        // this.moistureAdjustByElevation(moistureMap, elevationMap, 0.4);

        return this.constructMap(elevationMap, moistureMap);
    }

    static moistureAdjustByElevation(moistureMap, elevationMap, seaLevel = 0.4) {
        for (let y = 0; y < moistureMap.metaData.height; y++) {
            for (let x = 0; x < moistureMap.metaData.width; x++) {
                const h = elevationMap[y][x];
                let newMoisture;
                if (h < seaLevel) {
                    newMoisture = 1.0;
                } else {
                    let t = (h - seaLevel) / (1 - seaLevel);
                    newMoisture = moistureMap[y][x] * (1.0 - 0.5 * t);
                }
                moistureMap[y][x] = newMoisture;
            }
        }
    }
    
    static random2D(width, height) {
        const eMap = [];
        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                row.push(this.randomEngine.rand1f());
            }
            eMap.push(row);
        }
        eMap.metaData = { width, height };
        return eMap;
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
        map.splice(0, this.height, ...newMap);
    }

    static amplify(map, amount, center = 0.0) {
        for (let y = 0; y < map.metaData.height; y++) {
            for (let x = 0; x < map.metaData.width; x++) {
                map[y][x] += (map[y][x] - center) * amount;
            }
        }
    }

    static applyNoise(map, amount = 0.2) {
        for (let y = 0; y < map.metaData.height; y++) {
            for (let x = 0; x < map.metaData.width; x++) {
                map[y][x] += (this.randomEngine.rand1f() - 0.5) * amount;
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
                row.push(map[Math.floor(y / 2)][ Math.floor(x / 2)]);
            }
            newMap.push(row);
        }

        map.metaData.width = newWidth;
        map.metaData.height = newHeight;
        map.splice(0, map.length, ...newMap);
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
    
    static constructMap(elevationMap, moistureMap) {
        let cells = [];
        for (let y = 0; y < elevationMap.metaData.height; y++) {
            const row = [];
            for (let x = 0; x < elevationMap.metaData.width; x++) {
                const elevation = elevationMap[y][x];
                const moisture = moistureMap[y][x];
                row.push(new Cell(x, y, elevation, moisture));
            }
            cells.push(row);
        }
        let mapObj = new Map(elevationMap.metaData.width, elevationMap.metaData.height, cells);
        return mapObj;
    }
}
