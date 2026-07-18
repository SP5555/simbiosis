'use strict'

// Ring-buffer scheduler: entities schedule their own next wake-up tick
// instead of being polled every tick. Cost of step() is proportional to how
// many entities are actually due, not total population - the point of this
// is to let mostly-idle populations (settled/dormant entities) cost nothing
// on ticks where nothing is happening to them.
export default class TickScheduler {
    constructor(bucketCount = 1024) {
        this.bucketCount = bucketCount;
        this.buckets = Array.from({ length: bucketCount }, () => new Set());
        this.tick = 0;
    }

    schedule(entity, delay) {
        const d = Math.max(1, Math.min(delay, this.bucketCount - 1));
        const bucketIndex = (this.tick + d) % this.bucketCount;
        this.buckets[bucketIndex].add(entity);
    }

    step(processFn) {
        const bucket = this.buckets[this.tick % this.bucketCount];
        if (bucket.size > 0) {
            const due = Array.from(bucket);
            bucket.clear();
            for (const entity of due) {
                processFn(entity);
            }
        }
        this.tick++;
    }

    // forces every currently-scheduled entity to wake up soon, spread over a
    // short window rather than all on the same tick - used when something
    // external (e.g. a season change) may have invalidated everyone's
    // previously-computed "nothing's happening, check back later" delay
    wakeAllSoon(spreadWindow = 50) {
        for (let i = 0; i < this.bucketCount; i++) {
            const bucket = this.buckets[i];
            if (bucket.size === 0) continue;
            const entities = Array.from(bucket);
            bucket.clear();
            for (const entity of entities) {
                this.schedule(entity, 1 + Math.floor(Math.random() * spreadWindow));
            }
        }
    }
}
