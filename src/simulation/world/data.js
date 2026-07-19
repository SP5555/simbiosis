'use strict'

// Seasonal temperature follows a single sinusoid rather than piecewise-linear
// stops: real annual temperature cycles are well-approximated this way, and
// it naturally gives zero slope at the peak/trough (summer/winter) and
// maximum rate of change at the zero-crossings (spring/fall), instead of
// linear segments kinking at every hand-placed point.
//
// Each climate zone supplies its own mean/amplitude - equatorial regions are
// warm with very little seasonal swing (day length/sun angle barely change
// near the equator), while polar regions are cold with a *larger* swing than
// temperate (extreme winters relative to comparatively mild summers), not
// just a colder version of the same curve. "Temperate" matches the original
// hand-tuned values (peak 26, trough -2).
export const CLIMATE_ZONES = {
    "Equatorial": { mean: 26, amplitude: 3 },
    "Temperate":  { mean: 12, amplitude: 14 },
    "Polar":      { mean: -6, amplitude: 20 },
};

// Southern hemisphere is the same curve shape, just half a year out of phase
// (summer/winter swapped) - not a different zone shape, a phase flip that
// applies to any zone. It naturally becomes a near no-op for a low-amplitude
// zone like Equatorial, which is physically consistent rather than a hack.
//
// Offsets land on the MIDPOINT of each hemisphere's summer/winter quarter
// (e.g. Northern summer spans [0.25, 0.5), midpoint 0.375), not the quarter
// boundary - the peak/trough should fall in the middle of the season it
// defines, not at the moment that season starts.
export const HEMISPHERE_PEAK_OFFSET = {
    "Northern": 0.375,
    "Southern": 0.875,
};

export const DAYS_PER_YEAR = 20; // IRL 5m = sim 1y

export const SEASON_NAMES = ["Spring", "Summer", "Fall", "Winter"];

// The four calendar quarters are fixed, but which season NAME occupies which
// quarter depends on hemisphere - Southern is exactly 2 quarters (6 months)
// out of phase with Northern, since HEMISPHERE_PEAK_OFFSET differs by 0.5.
// This keeps "Summer" meaning "the warm quarter" for both hemispheres,
// instead of a fixed name-to-quarter mapping that only holds for Northern.
export function getSeasonNamesForHemisphere(hemisphereName) {
    const rotate = hemisphereName === "Southern" ? 2 : 0;
    return SEASON_NAMES.map((_, i) => SEASON_NAMES[(i + rotate) % 4]);
}
