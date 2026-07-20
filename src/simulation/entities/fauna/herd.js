'use strict'

export default class Herd {
    static DEFAULTS = {
        initialHerdCount: 8,
        startingPopulation: 20,
        startingEnergy: 50,
        carryingCapacity: 150,

        // eating gains energy (not population directly) - vegetation.value
        // consumed per bite stays flat, but the energy actually harvested
        // from it scales sub-linearly with population (population^eatScaling),
        // mirroring real metabolic scaling (e.g. Kleiber's law: bigger
        // animals/colonies are more efficient per head, with diminishing
        // returns, not a flat multiple)
        eatVegetationAmount: 15,
        baseEnergyPerEat: 2.5,
        eatScaling: 0.7,

        // moving/staying cost energy, same sub-linear shape but a STEEPER
        // exponent than eating - big herds graze efficiently but are
        // comparatively costly to move, which naturally makes large herds
        // want to settle near good food rather than wander, without
        // scripting that directly
        baseStayCost: 0.15,
        baseMoveCost: 0.4,
        costScaling: 0.85,

        // reproduction: population only grows once energy exceeds a
        // per-head reserve (population * reproductionThreshold) - surplus
        // above that converts into new members. Since the reserve
        // requirement grows LINEARLY with population but eating income
        // grows SUB-linearly, growth naturally decelerates as a herd gets
        // bigger rather than always rushing to carryingCapacity - the herd
        // settles wherever its local food supply can actually sustain it
        reproductionThreshold: 3,
        energyCostPerNewMember: 8,

        // once energy per head crosses this, the herd is well-fed enough
        // to stop actively hunting - not a hard numeric cap, a behavioral
        // one: it simply has no more reason to spend effort searching/
        // grazing, so energy naturally stops climbing rather than being
        // clamped. Set comfortably above reproductionThreshold so growth
        // still gets real room to happen before a herd calls it satisfied.
        satiationPerHead: 20,

        // starvation: energy takes the hit first (goes negative, i.e. debt)
        // - only once negative does population start declining, a little
        // each tick, until either eating recovers energy or population
        // reaches 0 and the herd is removed entirely (see die())
        starvationRate: [1, 3],

        // a ring-search target cell must have at least this much vegetation
        // to count as "found" - not literally the nearest patch, the
        // nearest one that clears this bar
        sufficientVegetationThreshold: 20,
        maxSearchRadius: 6,

        // next-wake delay ranges (ticks) - searching/moving/eating are all
        // short so a herd's motion reads as roughly continuous; idle is a
        // long rest, mirrors Vegetation's delaySettled
        delaySearching: [5, 15],
        delayMoving: [8, 16],
        delayEating: [10, 20],
        delayIdle: [60, 150],

        // per herd, rolled once at construction so different herds feel
        // more eager or more hesitant rather than all behaving identically -
        // on each MOVING tick this is the odds of actually stepping toward
        // the target vs pausing in place, which is what turns a rigid
        // beeline into something more organic
        moveChanceMin: 0.4,
        moveChanceRange: 0.4,
    };

    constructor(faunaSystem, floraSystem, speciesName, cell, population, options = {}) {
        this.faunaSystem = faunaSystem;
        this.floraSystem = floraSystem;
        this.speciesName = speciesName;
        this.cell = cell;
        this.population = population;

        this.state = "SEARCHING";
        this.targetCell = null;

        Object.assign(this, Herd.DEFAULTS, options);
        this.energy = this.startingEnergy;
        this.moveChance = this.moveChanceMin + Math.random() * this.moveChanceRange;

        this.cell.setFauna(this.speciesName, this);

        // herds are always active in v1 (no dormancy concept like
        // Vegetation's value=0), so they always self-schedule immediately
        this.faunaSystem.scheduler.schedule(this, this.rollDelay(this.state));
    }

    // called by the scheduler when this instance's wake-up tick arrives
    step() {
        if (this.applyStarvation()) return; // herd died this tick - don't reschedule

        switch (this.state) {
            case "SEARCHING": this.attemptSearch(); break;
            case "MOVING":    this.attemptMove(); break;
            case "EATING":    this.attemptEat(); break;
            case "IDLE":      this.attemptIdle(); break;
        }
        this.faunaSystem.scheduler.schedule(this, this.rollDelay(this.state));
    }

    // checked every tick regardless of state, since starving is a
    // background condition, not tied to whatever the herd happens to be
    // doing right now
    applyStarvation() {
        if (this.energy >= 0) return false;

        const [min, max] = this.starvationRate;
        const loss = min + Math.random() * (max - min);
        this.population = Math.max(0, this.population - loss);

        if (this.population <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    die() {
        this.cell.clearFauna(this.speciesName);
        this.faunaSystem.removeHerd(this.speciesName, this);
    }

    attemptSearch() {
        if (this.isSatiated()) {
            this.state = "IDLE"; // well-fed, no reason to go hunting right now
            return;
        }

        const found = this.ringSearchForFood();
        if (found) {
            this.targetCell = found;
            this.state = "MOVING";
        } else {
            this.state = "IDLE";
        }
    }

    isSatiated() {
        return this.energy >= this.population * this.satiationPerHead;
    }

    // expanding ring search outward from the herd's current cell - not
    // literally nearest, "good enough within a budget": first radius with
    // any qualifying cell wins, picked randomly among that radius's hits.
    // Bounded worst case O(maxSearchRadius^2), only run on this herd's own
    // schedule, never every tick.
    ringSearchForFood() {
        const { x: cx, y: cy } = this.cell;

        for (let r = 1; r <= this.maxSearchRadius; r++) {
            const candidates = [];

            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) {
                    // ring only - exactly this radius's perimeter (Chebyshev),
                    // don't re-scan cells already checked at a smaller radius
                    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;

                    const x = cx + dx, y = cy + dy;
                    const cell = this.faunaSystem.map.getCell(x, y);
                    if (!cell || cell.isWater) continue;

                    const veg = this.floraSystem.getSpeciesAt("veg", x, y);
                    if (veg && veg.value >= this.sufficientVegetationThreshold) candidates.push(cell);
                }
            }

            if (candidates.length > 0) {
                return candidates[Math.floor(Math.random() * candidates.length)];
            }
        }

        return null;
    }

    // on each MOVING tick, roll whether the herd actually steps toward
    // targetCell or just pauses in place this tick - a deterministic every-
    // tick step reads as a rigid beeline; mixing in random pauses makes the
    // approach feel organic/hesitant instead. Either way costs energy
    // (moving costs more than staying), and the target is re-validated each
    // time since another herd (or natural dieback) may have exhausted it
    // between when it was chosen and now.
    attemptMove() {
        const veg = this.floraSystem.getSpeciesAt("veg", this.targetCell.x, this.targetCell.y);
        if (!veg || veg.value < this.sufficientVegetationThreshold) {
            this.state = "SEARCHING";
            return;
        }

        if (Math.random() >= this.moveChance) {
            this.energy -= this.baseStayCost * Math.pow(this.population, this.costScaling);
            this.state = "MOVING"; // paused this tick, try again next wake
            return;
        }

        const dx = Math.sign(this.targetCell.x - this.cell.x);
        const dy = Math.sign(this.targetCell.y - this.cell.y);
        const nextCell = this.faunaSystem.map.getCell(this.cell.x + dx, this.cell.y + dy);
        if (!nextCell || nextCell.isWater) {
            // no pathfinding around obstacles in v1 - just give up and
            // re-search rather than getting stuck against a shoreline
            this.state = "SEARCHING";
            return;
        }

        this.moveTo(nextCell);
        this.energy -= this.baseMoveCost * Math.pow(this.population, this.costScaling);
        this.state = (this.cell.x === this.targetCell.x && this.cell.y === this.targetCell.y) ? "EATING" : "MOVING";
    }

    moveTo(newCell) {
        this.cell.clearFauna(this.speciesName);
        this.cell = newCell;
        this.cell.setFauna(this.speciesName, this);
    }

    attemptEat() {
        const veg = this.floraSystem.getSpeciesAt("veg", this.cell.x, this.cell.y);
        if (!veg || veg.value <= 0) {
            this.state = "SEARCHING";
            return;
        }

        veg.value = Math.max(0, veg.value - this.eatVegetationAmount);
        this.energy += this.baseEnergyPerEat * Math.pow(this.population, this.eatScaling);

        this.attemptReproduce();

        // keep grazing the same patch while it's still worth it instead of
        // always capping at one bite - a rich patch should support several
        // rounds of income, enough to actually offset the travel cost it
        // took to reach it, before the herd moves on. Stops early if now
        // satiated, even if the patch still has plenty left.
        this.state = (!this.isSatiated() && veg.value >= this.sufficientVegetationThreshold) ? "EATING" : "IDLE";
    }

    // population grows only once energy exceeds a per-head reserve -
    // surplus above that converts into new members, capped at carryingCapacity
    attemptReproduce() {
        const reserveNeeded = this.population * this.reproductionThreshold;
        const surplus = this.energy - reserveNeeded;
        if (surplus <= 0) return;

        const room = this.carryingCapacity - this.population;
        if (room <= 0) return;

        const newMembers = Math.min(Math.floor(surplus / this.energyCostPerNewMember), room);
        if (newMembers <= 0) return;

        this.population += newMembers;
        this.energy -= newMembers * this.energyCostPerNewMember;
    }

    // IDLE's long delay (already spent by the time this fires) is the rest
    // period itself - waking from it just re-enters the search loop
    attemptIdle() {
        this.state = "SEARCHING";
    }

    rollDelay(state) {
        const key = "delay" + state[0] + state.slice(1).toLowerCase();
        const [min, max] = this[key];
        return min + Math.floor(Math.random() * (max - min));
    }

    // spliced into a Cell's rows alongside fertility/humidity/vegetation -
    // see Cell.getDisplayStats()
    getDisplayStats() {
        if (this.population <= 0) return [];
        return [
            {
                key: this.speciesName,
                label: "Herbivore Herd",
                type: "ratio",
                current: this.population.toFixed(0),
                max: this.carryingCapacity.toFixed(0),
            },
            {
                key: this.speciesName + "-energy",
                label: "Energy",
                type: "text",
                display: this.energy.toFixed(1),
            },
        ];
    }

    // the herd itself as the primary tile-panel selection (see TilePanel/
    // HudManager) rather than a supplementary row inside a tile's panel -
    // reads live off this.cell/.population/.energy every call, so it stays
    // correct as the herd moves between cells without needing to track
    // which cell it's "supposed" to be shown for
    getFocusedDisplayStats() {
        return {
            kind: "herd",
            header: {
                title: "Herbivore Herd",
                location: `(${this.cell.x}, ${this.cell.y})`,
            },
            rows: [
                { key: "population", label: "Population", type: "ratio", current: this.population.toFixed(0), max: this.carryingCapacity.toFixed(0) },
                { key: "energy", label: "Energy", type: "text", display: this.energy.toFixed(1) },
                { key: "state", label: "State", type: "text", display: this.state },
            ],
        };
    }
}
