'use strict'

import { interpolateColorStops } from '../renderer/utils/color-utils.js';
import { TEMPERATURE_COLOR_STOPS, BIOME_COLOR_MAP } from '../renderer/world/colors/tile-color-data.js';

const BAR_COLORS = {
    fertility: 0x63b06e,
    humidity: 0x4a90c4,
};

function toColorHex(n) {
    return '#' + n.toString(16).padStart(6, '0');
}

// Renders the currently-selected tile's stats (see Cell.getDisplayStats):
// a compact identity header (Location: Biome (Elevation | Temperature),
// biome/temperature colored from the same maps/gradients the terrain
// itself is painted with) followed by a small vertical list of rows for
// the water-exempt extras, with a visual matched to what kind of value it
// is - a percentage bar (matching the season timeline's bar language) for
// Fertility/Humidity, a big/small current-over-max readout for Vegetation.
export default class TilePanel {
    constructor() {
        this.container = document.getElementById('tilePanel');
    }

    update(data) {
        this.container.innerHTML = '';

        if (!data) {
            const empty = document.createElement('div');
            empty.className = 'tile-stat-empty';
            empty.textContent = 'Click on something';
            this.container.appendChild(empty);
            return;
        }

        this.container.appendChild(this.buildHeader(data.header));
        for (const stat of data.rows) {
            this.container.appendChild(this.buildRow(stat));
        }
    }

    buildHeader(header) {
        const el = document.createElement('div');
        el.className = 'tile-header';

        const main = document.createElement('div');
        main.className = 'tile-header-main';

        const biome = document.createElement('span');
        biome.className = 'tile-header-biome';
        biome.textContent = header.biome;
        biome.style.color = toColorHex(BIOME_COLOR_MAP[header.biome] ?? BIOME_COLOR_MAP['undefined']);
        main.appendChild(biome);

        const loc = document.createElement('span');
        loc.className = 'tile-header-location';
        loc.textContent = header.location;
        main.appendChild(loc);

        el.appendChild(main);

        const detail = document.createElement('div');
        detail.className = 'tile-header-detail';

        const elev = document.createElement('span');
        elev.textContent = `${header.elevation}  |  `;
        detail.appendChild(elev);

        const temp = document.createElement('span');
        temp.textContent = header.temperatureDisplay;
        temp.style.color = toColorHex(interpolateColorStops(header.temperature, TEMPERATURE_COLOR_STOPS));
        detail.appendChild(temp);

        el.appendChild(detail);
        return el;
    }

    buildRow(stat) {
        const row = document.createElement('div');
        row.className = 'tile-stat-row';

        const label = document.createElement('span');
        label.className = 'tile-stat-label';
        label.textContent = stat.label;
        row.appendChild(label);

        const right = document.createElement('span');
        right.className = 'tile-stat-right';

        if (stat.type === 'bar') {
            right.appendChild(this.buildBar(stat.fraction, BAR_COLORS[stat.key] ?? 0xffffff));
        }

        if (stat.type === 'ratio') {
            right.appendChild(this.buildRatio(stat.current, stat.max));
        } else {
            const value = document.createElement('span');
            value.className = 'tile-stat-value';
            value.textContent = stat.display;
            right.appendChild(value);
        }

        row.appendChild(right);
        return row;
    }

    buildRatio(current, max) {
        const wrap = document.createElement('span');
        wrap.className = 'tile-stat-value';

        const currentEl = document.createElement('span');
        currentEl.className = 'tile-stat-current';
        currentEl.textContent = current;
        wrap.appendChild(currentEl);

        const maxEl = document.createElement('span');
        maxEl.className = 'tile-stat-max';
        maxEl.textContent = `/${max}`;
        wrap.appendChild(maxEl);

        return wrap;
    }

    buildBar(fraction, hex) {
        const track = document.createElement('span');
        track.className = 'tile-stat-bar-track';
        const fill = document.createElement('span');
        fill.className = 'tile-stat-bar-fill';
        fill.style.width = `${Math.min(1, Math.max(0, fraction)) * 100}%`;
        fill.style.background = toColorHex(hex);
        track.appendChild(fill);
        return track;
    }
}
