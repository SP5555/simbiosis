'use strict'

// Sun color is primarily driven by temperature (see sun.js) rather than
// hardcoded per-season stops, so climates naturally get the right sunlight
// mood without hand-tuning per zone: equatorial stays warm year-round,
// polar stays cool, temperate swings between them. Domain matches the
// coldest/hottest values across all CLIMATE_ZONES (see world/data.js).
export const SUN_TEMP_COLOR_STOPS = [
    [-26, 0x9fb0e8], // deep cold - soft periwinkle-blue
    [  0, 0xd8e6ff], // freezing - pale cool blue-white
    [ 15, 0xfff6e0], // comfortable - warm neutral white, gentle golden cast
    [ 29, 0xffc27a], // hot - warm golden-orange
];

// Small secondary tints blended on top of the temperature color based on
// whether temperature is currently rising or falling - recovers the
// spring/fall distinction that pure temperature loses (both sit at the
// same midpoint value on our symmetric seasonal curve, differing only in
// which direction it's headed).
export const SUN_WARMING_TINT = 0xeaffea; // spring-like - fresh, pale mint-white
export const SUN_COOLING_TINT = 0xff8f4d; // fall-like - rich warm red-orange
