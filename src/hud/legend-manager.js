'use strict'

import { eventBus } from '../utils/event-emitters.js';
import { EVENTS } from '../utils/events.js';
import {
    ELEVATION_COLOR_STOPS,
    FERTILITY_COLOR_STOPS,
    HUMIDITY_COLOR_STOPS,
    TEMPERATURE_COLOR_STOPS,
} from '../renderer/world/colors/tile-color-data.js';

// only filters backed by a continuous gradient get a legend here; Biome
// (categorical) and Elevation Gradient (directional hue) need a different
// legend shape and are handled elsewhere
const LEGEND_CONFIG = {
    "Elevation":   { stops: ELEVATION_COLOR_STOPS,   format: v => `${v.toFixed(0)}m` },
    "Temperature": { stops: TEMPERATURE_COLOR_STOPS, format: v => `${v.toFixed(0)} degC` },
    "Fertility":   { stops: FERTILITY_COLOR_STOPS,   format: v => `${(v * 100).toFixed(0)}%` },
    "Humidity":    { stops: HUMIDITY_COLOR_STOPS,    format: v => `${(v * 100).toFixed(0)}%` },
};

export default class LegendManager {
    constructor() {
        this.boxEl = document.getElementById("legendBox");
        this.titleEl = document.getElementById("legendTitle");
        this.gradientEl = document.getElementById("legendGradient");
        this.minEl = document.getElementById("legendMin");
        this.maxEl = document.getElementById("legendMax");
        this.markerEl = document.getElementById("legendMarker");
        this.tooltipEl = document.getElementById("legendTooltip");

        this.activeConfig = null;

        eventBus.on(EVENTS.APPLY_TERRAIN_FILTER, (filterName) => {
            this.updateFilter(filterName);
        });

        this.gradientEl.addEventListener("mousemove", (e) => this.onGradientHover(e));
        this.gradientEl.addEventListener("mouseleave", () => this.hideHover());
    }

    updateFilter(filterName) {
        const config = LEGEND_CONFIG[filterName];
        this.activeConfig = config ?? null;

        if (!config) {
            this.boxEl.classList.remove("visible");
            return;
        }

        this.boxEl.classList.add("visible");
        this.titleEl.textContent = filterName;
        this.gradientEl.style.background = this.buildGradientCSS(config.stops);

        const values = config.stops.map(([v]) => v);
        this.minEl.textContent = config.format(Math.min(...values));
        this.maxEl.textContent = config.format(Math.max(...values));
    }

    onGradientHover(e) {
        if (!this.activeConfig) return;

        const rect = this.gradientEl.getBoundingClientRect();
        const t = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));

        const values = this.activeConfig.stops.map(([v]) => v);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const value = min + t * (max - min);

        const pct = `${(t * 100).toFixed(1)}%`;
        this.markerEl.style.left = pct;
        this.markerEl.classList.add("visible");
        this.tooltipEl.style.left = pct;
        this.tooltipEl.textContent = this.activeConfig.format(value);
        this.tooltipEl.classList.add("visible");
    }

    hideHover() {
        this.markerEl.classList.remove("visible");
        this.tooltipEl.classList.remove("visible");
    }

    buildGradientCSS(stops) {
        const values = stops.map(([v]) => v);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        const parts = stops.map(([v, hex]) => {
            const pct = ((v - min) / range * 100).toFixed(1);
            const rgb = hex.toString(16).padStart(6, '0');
            return `#${rgb} ${pct}%`;
        });

        return `linear-gradient(90deg, ${parts.join(', ')})`;
    }
}
