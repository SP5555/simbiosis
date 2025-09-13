'use strict'

import Input from '../input/input.js';
import Renderer from '../renderer/renderer.js';
import Simulation from '../simulation/simulation.js';
import GuiManager from '../gui/gui-manager.js';
import HudManager from '../hud/hud-manager.js';

export default class App {
    constructor() {
        this.input = new Input();
        this.simulation = new Simulation();
        this.renderer = new Renderer(this.simulation, this.input);
        this.gui = new GuiManager();
        this.hud = new HudManager();

        // timing vars
        this.simSpeed = 60;
        this.fixedDt = 1 / this.simSpeed;
        this.simAccumulator = 0;

        this.overlayAccumulator = 0;
        this.overlayFrameCount = 0;

        this.lastTime = 0;
    }

    start() {
        this.gui.emitInitialEvents();
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }

    loop = (currentTime) => {
        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.simAccumulator += dt;
        this.overlayAccumulator += dt;
        this.overlayFrameCount++;

        // Prevent sim step pile-up (cap at 3 per frame)
        let steps = 0;
        const maxSteps = 8;
        while (this.simAccumulator >= this.fixedDt && steps < maxSteps) {
            this.simulation.step();
            this.simAccumulator -= this.fixedDt;
            steps++;
        }

        this.renderer.render(dt);

        // update overlay FPS 8 times/sec
        if (this.overlayAccumulator >= 0.125) {
            this.hud.update(this.overlayAccumulator, this.overlayFrameCount);
            this.overlayAccumulator = 0;
            this.overlayFrameCount = 0;
        }

        requestAnimationFrame(this.loop);
    };
}
