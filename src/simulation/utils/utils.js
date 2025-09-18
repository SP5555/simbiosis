'use strict'

export function interpolateStops(value, stops) {
    const n = stops.length;
    for (let i = 0; i < n - 1; i++) {
        const [v1, t1] = stops[i];
        const [v2, t2] = stops[i + 1];
        if (value <= v2) {
            const t = Math.max(0, Math.min((value - v1) / (v2 - v1), 1));
            return t1 + (t2 - t1) * t;
        }
    }
    return stops[n - 1][1]; // fallback
}
