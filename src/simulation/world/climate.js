'use strict'

import { eventBus } from '../../utils/event-emitters.js';
import { EVENTS } from '../../utils/events.js';
import {
    CLIMATE_ZONES,
    HEMISPHERE_PEAK_OFFSET,
    DAYS_PER_YEAR,
    getSeasonNamesForHemisphere,
} from './data.js';

// Owns the calendar (day/year/season progression) and the seasonal
// temperature model (climate zone, hemisphere, baseTemp). Split out of
// Simulation so that class can stay focused on orchestrating subsystems
// (Flora/Fauna/map generation/ticking) rather than also being the calendar.
export default class Climate {
    constructor() {
        this.time = 0;
        this.ticksPerDay = 900;  // IRL 15s  = sim 1d
        this.daysPerYear = DAYS_PER_YEAR;

        this.currentDate = -1;
        this.currentYear = -1;
        this.currentSeasonIdx = -1;
        this.nextSeasonIdx = -1;

        this.seasonOffset = 0; // in days
        this.yearProgress = 0;
        this.baseTemp = 0;

        this.setClimate("Temperate", "Northern");
    }

    // called when a new map is generated, so DATE_CHANGED/SEASON_CHANGED
    // fire fresh for it - otherwise the "did it change" check in update()
    // could see no difference from wherever the previous map's simulation
    // had drifted to and silently skip emitting, leaving stale HUD labels
    reset() {
        this.time = 0;
        this.currentDate = -1;
        this.currentYear = -1;
        this.currentSeasonIdx = -1;
        this.nextSeasonIdx = -1;
    }

    setStartSeason(seasonName) {
        // which quarter a season NAME occupies depends on hemisphere (see
        // setClimate) - this.seasons is already the hemisphere-correct list
        const startIndex = Math.max(0, this.seasons.indexOf(seasonName));

        const seasonLength = this.daysPerYear / 4;
        this.seasonOffset = startIndex * seasonLength;
    }

    setClimate(zoneName, hemisphereName) {
        zoneName = CLIMATE_ZONES[zoneName] ? zoneName : "Temperate";
        hemisphereName = HEMISPHERE_PEAK_OFFSET[hemisphereName] ? hemisphereName : "Northern";

        this.climateZoneName = zoneName;
        this.hemisphereName = hemisphereName;

        const zone = CLIMATE_ZONES[zoneName];
        const peakOffset = HEMISPHERE_PEAK_OFFSET[hemisphereName];
        this.tempCurve = { ...zone, peakOffset };

        // the four calendar quarters are fixed, but which season NAME
        // occupies which quarter rotates with hemisphere, so "Summer"
        // always lands on the actual temperature peak (see data.js)
        this.seasons = getSeasonNamesForHemisphere(hemisphereName);

        eventBus.emit(EVENTS.CLIMATE_CHANGED, {
            zoneName: this.climateZoneName,
            hemisphereName: this.hemisphereName,
        });
    }

    step() {
        this.time++;
        this.updateTime();
        this.updateBaseTemp();
    }

    updateTime() {
        const totalDays = (this.time / this.ticksPerDay) + this.seasonOffset;
        const dayOfYear = totalDays % this.daysPerYear;
        const seasonLength = this.daysPerYear / 4;

        const seasonIndex = Math.floor(dayOfYear / seasonLength);
        const nextSeasonIndex = (seasonIndex + 1) % 4;
        this.yearProgress = dayOfYear / this.daysPerYear;

        const day = Math.floor(dayOfYear) + 1;
        const year = Math.floor((totalDays) / this.daysPerYear) + 1;

        if (this.currentDate !== day) {
            this.currentDate = day; this.currentYear = year;
            eventBus.emit(EVENTS.DATE_CHANGED, {
                day: this.currentDate, year: this.currentYear
            });
        }
        if (this.currentSeasonIdx !== seasonIndex) {
            this.currentSeasonIdx = seasonIndex; this.nextSeasonIdx = nextSeasonIndex;
            eventBus.emit(EVENTS.SEASON_CHANGED, {
                name: this.seasons[seasonIndex]
            });
        }
    }

    updateBaseTemp() {
        const { mean, amplitude, peakOffset } = this.tempCurve;
        this.baseTemp = mean + amplitude * Math.cos(2 * Math.PI * (this.yearProgress - peakOffset));
    }
}
