'use strict'

import { interpolateColorStops, lerpColorHex } from '../../utils/color-utils.js';
import { SUN_TEMP_COLOR_STOPS, SUN_WARMING_TINT, SUN_COOLING_TINT } from './sun-color-data.js';

// Shared by Sun (the actual light) and the HUD's season wheel, so both
// render identically-derived colors instead of two hand-tuned copies.
export function computeSunColorHex(yearProgress, peakOffset, amplitude, baseTemp) {
    const baseColorHex = interpolateColorStops(baseTemp, SUN_TEMP_COLOR_STOPS);

    // spring and fall sit at the exact same temperature on our symmetric
    // seasonal curve (differ only in whether it's rising or falling), so
    // temperature alone can't tell them apart - a small secondary tint
    // keyed to the direction of change recovers that distinction. Tint
    // strength also scales with the zone's amplitude, so a low-swing zone
    // (Equatorial) barely tints at all while a high-swing zone (Polar)
    // tints more noticeably.
    const rate = -Math.sin(2 * Math.PI * (yearProgress - peakOffset)); // -1 (cooling) .. +1 (warming)
    const tintStrength = Math.abs(rate) * Math.min(1, amplitude / 20) * 0.2;
    const tintHex = rate > 0 ? SUN_WARMING_TINT : SUN_COOLING_TINT;

    return lerpColorHex(baseColorHex, tintHex, tintStrength);
}
