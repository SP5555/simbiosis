'use strict'

/**
 * Interpolates between two values with wrap-around handling.
 *
 * @param {number} current - The current value between min and max.
 * @param {number} target - The target value between min and max.
 * @param {number} t - Interpolation factor [0..1].
 * @param {number} min - Minimum bound of range (inclusive).
 * @param {number} max - Maximum bound of range (exclusive).
 * @returns {number} The wrapped interpolated value.
 */
export function lerpWrap(current, target, t, min = 0, max = 1) {
    const range = max - min;
    let diff = target - current;

    if (diff > range / 2) diff -= range;
    if (diff < -range / 2) diff += range;

    return ((current + diff * t + range - min) % range) + min;
}
