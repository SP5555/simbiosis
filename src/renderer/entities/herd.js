'use strict'

import * as THREE from 'three';
import { cellToWorldPosition } from '../utils/render-utils.js';

// half of FaunaManager's ConeGeometry(0.4, 0.8, 4) height - kept in sync
// manually since the geometry lives in a different file
const CONE_HALF_HEIGHT = 0.4;

// unlike Vegetation (which only recomputes on a meaningful sim-value
// change), a herd's visual position must keep easing across MANY frames
// after its sim cell changes, so `dirty` tracks "is the eased position
// still converging" rather than "did the sim change this frame"
export default class Herd {
    constructor(simHerd, mapWidth, mapHeight) {
        this.simHerd = simHerd;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;

        // separate tunable from CameraController's 16.0 - herds should
        // feel a bit more "animal-weighted"/slower than camera pans
        this.smoothFactor = 10.0;
        this.snapEpsilon = 0.01;

        const startPos = cellToWorldPosition(this.simHerd.cell, mapWidth, mapHeight);
        this.currentPosition = startPos.clone();
        this.targetPosition = startPos.clone();

        this.lastPopulation = 0;
        this.scale = 0.3;

        this.renderColor = new THREE.Color(0xcc8844);

        // hover/select highlighting, same mechanism as Tile: written into a
        // shared aState shader attribute, independent of the dirty-gated
        // matrix/color upload below
        this.hovered = false;
        this.selected = false;
        this.stateAttribute = null;
        this.instanceIndex = -1;

        this._scaleMatrix = new THREE.Matrix4();
        this._translateMatrix = new THREE.Matrix4();
        this.TSRMatrix = new THREE.Matrix4();

        this.dirty = true; // force first upload
        this.updateMatrix();
    }

    // called once by FaunaManager after the InstancedMesh/geometry is built
    bindStateAttribute(attribute, index) {
        this.stateAttribute = attribute;
        this.instanceIndex = index;
    }

    setHovered(hovered) {
        this.hovered = hovered;
        this.syncState();
    }

    setSelected(selected) {
        this.selected = selected;
        this.syncState();
    }

    syncState() {
        if (!this.stateAttribute) return;
        const state = this.selected ? 2 : (this.hovered ? 1 : 0);
        this.stateAttribute.setX(this.instanceIndex, state);
        this.stateAttribute.needsUpdate = true;
    }

    // uniform interface with Tile so HudManager can hold either as "the
    // current selection" without needing to know which - reads live off
    // the sim herd every call, so it stays correct as it moves between cells
    getDisplayStats() {
        return this.simHerd.getFocusedDisplayStats();
    }

    updateAnimationState(coreDt, simDt) {
        this.targetPosition.copy(cellToWorldPosition(this.simHerd.cell, this.mapWidth, this.mapHeight));

        // same easing formula as CameraController.update() - frame-rate-
        // independent exponential decay. Uses coreDt (not simDt) so a herd
        // mid-glide keeps settling into position even while the sim is
        // user-paused, matching how the rest of the render loop already
        // keeps animating through a user pause (only a hidden tab stops it)
        const sF = 1 - Math.exp(-coreDt * this.smoothFactor);
        const stillMoving = this.currentPosition.distanceToSquared(this.targetPosition) > this.snapEpsilon * this.snapEpsilon;
        if (stillMoving) this.currentPosition.lerp(this.targetPosition, sF);

        const pop = this.simHerd.population;
        // the alive/dead boundary always counts as significant, even when
        // the numeric delta is tiny - same fix as Vegetation's renderer
        // entity: otherwise a death that happens right after a small
        // registered population can fall under the magnitude threshold
        // below and get silently swallowed, leaving a dead herd rendered
        // forever at its last position
        const crossedZero = (this.lastPopulation > 0) !== (pop > 0);
        const popChanged = crossedZero || Math.abs(pop - this.lastPopulation) >= 1;
        if (popChanged) {
            this.lastPopulation = pop;
            // max size at carryingCapacity=150: 0.3 + 1.05 = 1.35 - and a
            // dead herd (pop 0) scales to nothing rather than a floor size,
            // matching how dead vegetation disappears instead of ghosting
            this.scale = pop > 0 ? 0.3 + 0.007 * pop : 0;
        }

        if (stillMoving || popChanged) {
            this.updateMatrix();
            this.dirty = true;
        }
        // else: converged and population stable - stop marking dirty,
        // avoids uploading a motionless/unchanged instance every frame
    }

    updateMatrix() {
        this._scaleMatrix.makeScale(this.scale, this.scale, this.scale);
        // land tiles are BoxGeometry(1,2,1,...) centered at cellToWorldPosition,
        // so their top surface sits at +1 above it - the cone (half-height
        // CONE_HALF_HEIGHT in FaunaManager's geometry) needs to clear that,
        // scaled the same as the cone itself so it sits on the surface
        // rather than floating or clipping into it at any population size
        const yOffset = 1.0 + CONE_HALF_HEIGHT * this.scale;
        this._translateMatrix.makeTranslation(this.currentPosition.x, this.currentPosition.y + yOffset, this.currentPosition.z);
        this.TSRMatrix.copy(this._translateMatrix).multiply(this._scaleMatrix);
    }
}
