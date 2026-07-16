'use strict'

export const TWO_PI = Math.PI * 2;

// `stops` is an array of [x, y] pairs sorted by x. Finds the segment
// containing `value` and interpolates between its y values using `lerpFn`.
export function interpolateStops(value, stops, lerpFn = (a, b, t) => a + (b - a) * t) {
    const n = stops.length;
    for (let i = 0; i < n - 1; i++) {
        const [v1, y1] = stops[i];
        const [v2, y2] = stops[i + 1];
        if (value <= v2) {
            const t = Math.max(0, Math.min((value - v1) / (v2 - v1), 1));
            return lerpFn(y1, y2, t);
        }
    }
    return stops[n - 1][1]; // fallback
}