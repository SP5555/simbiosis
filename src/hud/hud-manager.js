'use strict'

import { eventBus } from '../utils/event-emitters.js';
import { EVENTS } from '../utils/events.js';
import SeasonTimeline from './season-timeline.js';
import TilePanel from './tile-panel.js';

export default class HudManager {
    constructor() {
        this.seasonTimeline = new SeasonTimeline();
        this.tilePanel = new TilePanel();
        this.fpsEl = document.getElementById("simStatFPS");

        this.weightedAvgFPS = 0;
        // whatever's currently picked - a Tile or a renderer Herd, both
        // expose a uniform getDisplayStats() (see Tile/Herd), so this
        // doesn't need to know which. Storing the entity itself (not
        // anything tied to a cell) is what lets the panel keep following a
        // herd as it wanders instead of getting stuck on the tile it used
        // to be standing on.
        this.activeSelection = null;

        // event subscription
        eventBus.on(EVENTS.DATE_CHANGED, ({ day, year }) => {
            this.seasonTimeline.updateDate(day, year);
        });
        // note: no SEASON_CHANGED/CLIMATE_CHANGED subscriptions needed here
        // any more - the timeline shows the season directly (segment colors +
        // marker position), refreshed every update() tick below
        eventBus.on(EVENTS.TILE_SELECTED, (entity) => {
            this.activeSelection = entity;
        })
        // a selection pointing at a disposed tile/herd from the old map
        // would otherwise sit frozen showing stale data forever, since
        // nothing else clears it on regeneration
        eventBus.on(EVENTS.MAP_GENERATED, () => {
            this.activeSelection = null;
        })
    }

    // climate is passed in fresh each call (rather than only reacting to
    // CLIMATE_CHANGED) so the timeline's marker gets smooth continuous motion
    // instead of only moving once per simulated day
    update(intervalTime, framesInInterval, climate) {
        this.updateFPS(intervalTime, framesInInterval);
        this.updateSelectedTileStats();
        if (climate) {
            this.seasonTimeline.updatePosition(climate.yearProgress);
            this.seasonTimeline.updateClimate(climate);
        }
    }

    updateFPS(intervalTime, framesInInterval) {
        const fps = framesInInterval / intervalTime;
        this.weightedAvgFPS = this.weightedAvgFPS * 0.6 + fps * 0.4;
        this.fpsEl.textContent = this.weightedAvgFPS.toFixed(1);
    }

    updateSelectedTileStats() {
        const stats = this.activeSelection ? this.activeSelection.getDisplayStats() : null;
        this.tilePanel.update(stats);
    }
}
