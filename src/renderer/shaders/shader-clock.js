'use strict'

import { TWO_PI } from '../../utils/utils.js';

// Shared time uniforms fed into tile shader effects (see tile-shader-effects.js).
// simTime freezes when the simulation is paused (drives water wave, tied to simDt);
// uiTime always advances (drives hover/select pulse, a UI affordance, tied to coreDt).
export const simTimeUniform = { value: 0 };
export const uiTimeUniform = { value: 0 };

// Wrapping at a multiple of TWO_PI keeps sin()-based effects continuous
// across the wrap as long as their speed multipliers are integers, while
// preventing unbounded float growth over long play sessions.
const WRAP = 1000 * TWO_PI;

export function advance(simDt, coreDt) {
    simTimeUniform.value = (simTimeUniform.value + simDt) % WRAP;
    uiTimeUniform.value = (uiTimeUniform.value + coreDt) % WRAP;
}
