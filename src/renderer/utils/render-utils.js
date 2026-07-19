'use strict'

import * as THREE from 'three';

// converts a cell's grid coordinates/elevation into the world-space position
// used to place its tile/vegetation instance - shared by every mesh manager
// that places one instance per cell (land, water, vegetation), since it's
// the same formula in each: center the grid on the origin, and scale
// elevation down into the renderer's much flatter vertical range
export function cellToWorldPosition(cell, mapWidth, mapHeight) {
    return new THREE.Vector3(
        cell.x + 0.5 - mapWidth / 2,
        Math.max(cell.elevation, 0) / 600,
        cell.y + 0.5 - mapHeight / 2,
    );
}

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
