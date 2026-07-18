'use strict'

// Seasonal temperature follows a single sinusoid rather than piecewise-linear
// stops: real annual temperature cycles are well-approximated this way, and
// it naturally gives zero slope at the peak/trough (summer/winter) and
// maximum rate of change at the zero-crossings (spring/fall), instead of
// linear segments kinking at every hand-placed point.
export const SEASON_TEMP = {
    mean: 12,        // yearly average
    amplitude: 14,   // swing above/below the mean (peak 26, trough -2)
    peakOffset: 0.25,  // yearProgress at which the peak (summer) occurs
};
