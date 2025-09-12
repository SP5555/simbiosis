'use strict'

import { eventBus } from '../utils/event-emitters.js';
import { EVENTS } from '../utils/events.js';

export default class HudManager {
    constructor(simulation) {
        this.simulation = simulation;

        this.dayEl = document.getElementById("simStatDay");
        this.yearEl = document.getElementById("simStatYear");
        this.seasonEl = document.getElementById("simStatSeason");
        this.fpsEl = document.getElementById("simStatFPS");
        this.hoveredTileTableEl = document.getElementById("hoveredTileTable");
        
        this.weightedAvgFPS = 0;
        this.hoveredTile = null;

        // event subscription
        eventBus.on(EVENTS.DATE_CHANGED, ({ day, year }) => {
            this.updateDate(day, year);
        });
        eventBus.on(EVENTS.SEASON_CHANGED, ({ name }) => {
            this.updateSeason(name);
        });
        eventBus.on(EVENTS.TILE_HOVERED, (tile) => {
            this.updateHoveredTile(tile);
        })
    }

    update(intervalTime, framesInInterval) {
        this.updateFPS(intervalTime, framesInInterval);
        this.updateHoveredTileStats();
    }

    updateFPS(intervalTime, framesInInterval) {
        const fps = framesInInterval / intervalTime;
        this.weightedAvgFPS = this.weightedAvgFPS * 0.6 + fps * 0.4;
        this.fpsEl.textContent = this.weightedAvgFPS.toFixed(1);
    }

    updateDate(day, year) {
        this.dayEl.textContent = day;
        this.yearEl.textContent = year;
    }

    updateSeason(name) {
        this.seasonEl.textContent = name;
    }

    updateHoveredTile(tile) {
        this.hoveredTile = tile;
    }

    updateHoveredTileStats() {
        this.hoveredTileTableEl.innerHTML = '';

        if (!this.hoveredTile) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 3;
            td.textContent = "Nothing here";
            tr.appendChild(td);
            this.hoveredTileTableEl.appendChild(tr);
            return;
        }

        const stats = this.hoveredTile.cell.getDisplayStats();

        for (const [label, value] of Object.entries(stats)) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${label}</td><td>:</td><td>${value}</td>`;
            this.hoveredTileTableEl.appendChild(tr);
        }
    }
}
