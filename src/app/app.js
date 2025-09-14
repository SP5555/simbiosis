'use strict'

import Input from '../input/input.js';
import Renderer from '../renderer/renderer.js';
import Simulation from '../simulation/simulation.js';
import GuiManager from '../gui/gui-manager.js';
import HudManager from '../hud/hud-manager.js';
import { EVENTS } from '../utils/events.js';
import { eventBus } from '../utils/event-emitters.js';

export default class App {
    constructor() {
        this.input = new Input();
        this.simulation = new Simulation();
        this.renderer = new Renderer(this.simulation, this.input);
        this.gui = new GuiManager();
        this.hud = new HudManager();

        this.simSpeed = 60;
        this.fixedDt = 1 / this.simSpeed;
        this.simAccumulator = 0;
        this.simSpeedMultiplier = 1;

        this.overlayAccumulator = 0;
        this.overlayFrameCount = 0;

        this.lastTime = 0;

        this.userPaused = false;
        this.systemPaused = false;
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        document.addEventListener("visibilitychange", () => this.onVisibilityChange());
        eventBus.on(EVENTS.TOGGLE_SIMULATION, (value) =>
            this.updateUserPaused(value)
        );
        eventBus.on(EVENTS.SET_SIM_SPEED, (value) =>
            this.setSimSpeed(value)
        );
    }

    start() {
        this.gui.emitInitialEvents();
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }

    loop = (currentTime) => {
        // coreDt:  the "true" delta time since last frame in seconds.
        //          Used for essential features that should always update
        //          regardless of sim speed multiplier, like camera movement.
        const coreDt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // simDt:   the scaled delta time for the simulation and animations.
        //          Takes into account user/system pause and simulation speed multiplier.
        //          This ensures the simulation and certain animated objects
        //          only progresses when allowed.
        const simDt = (this.userPaused || this.systemPaused) ? 0 : coreDt * this.simSpeedMultiplier;

        this.stepSimulation(simDt);
        this.renderFrame(coreDt, simDt);
        this.updateOverlay(coreDt);

        requestAnimationFrame(this.loop);
    };

    onVisibilityChange = () => {
        this.updateSystemPaused(document.hidden);
    }

    updateUserPaused(value) {
        this.userPaused = value;
        if (!value) {
            this.lastTime = performance.now();
        }
    }

    updateSystemPaused(value) {
        this.systemPaused = value;
        if (!value) {
            this.lastTime = performance.now();
        }
    }

    setSimSpeed(value) {
        this.simSpeedMultiplier = value;
    }

    stepSimulation(simDt) {
        if (this.userPaused || this.systemPaused) return;

        this.simAccumulator += simDt;
        // Prevent sim step pile-up
        let steps = 0;
        const maxSteps = 3 * this.simSpeedMultiplier;
        while (this.simAccumulator >= this.fixedDt && steps < maxSteps) {
            this.simulation.step();
            this.simAccumulator -= this.fixedDt;
            steps++;
        }
    }

    renderFrame(coreDt, simDt) {
        if (this.systemPaused) return;

        this.renderer.render(coreDt, simDt);
    }

    updateOverlay(coreDt) {
        this.overlayAccumulator += coreDt;
        this.overlayFrameCount++;
        if (this.overlayAccumulator >= 0.125) {
            this.hud.update(this.overlayAccumulator, this.overlayFrameCount);
            this.overlayAccumulator = 0;
            this.overlayFrameCount = 0;
        }
    }
}
