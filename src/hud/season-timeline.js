'use strict'

import { computeSunColorHex } from '../renderer/world/colors/sun-color-core.js';
import { DAYS_PER_YEAR } from '../simulation/world/data.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_WIDTH = 170;
const BAR_HEIGHT = 16;
const BAR_Y = 4;
const GAP = 3;
const SEGMENT_WIDTH = (SVG_WIDTH - GAP * 3) / 4;
const MARKER_RADIUS = 5;

function segmentX(i) {
    return i * (SEGMENT_WIDTH + GAP);
}

function toColorHex(n) {
    return '#' + n.toString(16).padStart(6, '0');
}

// A flat timeline bar (four season segments + an orbiting marker), same
// underlying data and temperature-driven coloring (computeSunColorHex,
// shared with the actual sun), laid out linearly to free vertical space
// for larger day/year/climate text above it.
export default class SeasonTimeline {
    constructor() {
        this.svg = document.getElementById('seasonTimeline');
        this.dayEl = document.getElementById('timelineDay');
        this.dayTotalEl = document.getElementById('timelineDayTotal');
        this.yearEl = document.getElementById('timelineYear');
        this.climateLabelEl = document.getElementById('timelineClimateLabel');

        this.dayTotalEl.textContent = `/${DAYS_PER_YEAR}`;

        this.segments = [];
        this.labels = [];
        this.buildBar();

        this.marker = document.createElementNS(SVG_NS, 'circle');
        this.marker.setAttribute('class', 'timeline-marker');
        this.marker.setAttribute('r', MARKER_RADIUS);
        this.marker.setAttribute('cy', BAR_Y + BAR_HEIGHT / 2);
        this.svg.appendChild(this.marker);
    }

    buildBar() {
        for (let i = 0; i < 4; i++) {
            const rect = document.createElementNS(SVG_NS, 'rect');
            rect.setAttribute('class', 'timeline-segment');
            rect.setAttribute('x', segmentX(i));
            rect.setAttribute('y', BAR_Y);
            rect.setAttribute('width', SEGMENT_WIDTH);
            rect.setAttribute('height', BAR_HEIGHT);
            rect.setAttribute('rx', 3);
            this.svg.appendChild(rect);
            this.segments.push(rect);

            const label = document.createElementNS(SVG_NS, 'text');
            label.setAttribute('class', 'timeline-label');
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('x', segmentX(i) + SEGMENT_WIDTH / 2);
            label.setAttribute('y', BAR_Y + BAR_HEIGHT + 13);
            this.svg.appendChild(label);
            this.labels.push(label);
        }
    }

    // called whenever the climate (zone/hemisphere) changes - recolors the
    // static bar, relabels each segment with the season that now occupies
    // that quarter (season->quarter mapping rotates with hemisphere), and
    // updates the climate readout above it
    updateClimate(climate) {
        const { seasons, tempCurve, hemisphereName, climateZoneName } = climate;
        const { mean, amplitude, peakOffset } = tempCurve;

        for (let i = 0; i < 4; i++) {
            const t = i * 0.25 + 0.125; // midpoint of this quarter
            const baseTemp = mean + amplitude * Math.cos(2 * Math.PI * (t - peakOffset));
            const hex = computeSunColorHex(t, peakOffset, amplitude, baseTemp);

            this.segments[i].setAttribute('fill', toColorHex(hex));
            this.labels[i].textContent = seasons[i].slice(0, 2).toUpperCase();
        }

        this.climateLabelEl.textContent = `${hemisphereName} ${climateZoneName}`;
    }

    // called every frame-ish (see HudManager) for smooth marker motion,
    // decoupled from the once-per-day DATE_CHANGED event which would look
    // choppy at higher sim speeds
    updatePosition(yearProgress) {
        this.marker.setAttribute('cx', yearProgress * SVG_WIDTH);
    }

    updateDate(day, year) {
        this.dayEl.textContent = day;
        this.yearEl.textContent = `Year ${year}`;
    }
}
