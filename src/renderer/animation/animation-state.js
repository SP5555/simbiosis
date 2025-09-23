import { TWO_PI } from "../../utils/utils.js";

class AnimationState {
    constructor({ speed = 0, duration = 0, wrap = false } = {}) {
        this.speed = speed;
        this.duration = duration;
        this.elapsed = 0;
    }

    update(dt) {
        this.elapsed = (this.elapsed + this.speed * dt) % this.duration;
        if (this.elapsed < 0) this.elapsed += this.duration;
    }
}

export class SineAnimation extends AnimationState {
    constructor({ speed = 1, amplitude = 1, offset = 0 } = {}) {
        super({ speed: speed, duration: TWO_PI });

        this.amplitude = amplitude;
        this.offset = offset;
    }

    value() {
        return Math.sin(this.elapsed + this.offset) * this.amplitude;
    }
}

export class AbsSineAnimation extends SineAnimation {
    value() {
        return Math.abs(super.value());
    }
}
