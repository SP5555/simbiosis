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
        
        this.weightedAvgFPS = 0;

        // event subscription
        eventBus.on(EVENTS.DATE_CHANGED, ({ day, year }) => {
            this.updateDate(day, year);
        });
        eventBus.on(EVENTS.SEASON_CHANGED, ({ name }) => {
            this.updateSeason(name);
        });
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
}
