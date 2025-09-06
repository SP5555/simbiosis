'use strict'

// import Stats from '../../node_modules/three/examples/jsm/libs/stats.module.js';
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
        this.guiManager = new GuiManager();
        this.hud = new HudManager();
    }

    start() {
        this.guiManager.emitInitialEvents();

        const simSpeed = 60; // 60 steps per second
        const fixedDt = 1 / simSpeed;
        let simAccumulator = 0;

        let overlayAccumulator = 0;
        let overlayFrameCount = 0;

        let lastTime = performance.now();
        
        const loop = (currentTime) => {
            const dt = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            simAccumulator += dt;
            overlayAccumulator += dt;
            overlayFrameCount++;

            while (simAccumulator >= fixedDt) {
                this.simulation.step();
                simAccumulator -= fixedDt;
            }

            this.renderer.render(dt);

            // update overlay FPS 8 times/sec
            if (overlayAccumulator >= 0.125) {
                this.hud.updateFPS(overlayAccumulator, overlayFrameCount);
                overlayAccumulator = 0;
                overlayFrameCount = 0;
            }

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }
}
