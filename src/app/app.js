'use strict'

// import Stats from '../../node_modules/three/examples/jsm/libs/stats.module.js';
import Input from '../input/input.js';
import Renderer from '../renderer/renderer.js';
import Simulation from '../simulation/simulation.js';
import GuiManager from '../gui/gui-manager.js';

export default class App {
    constructor() {
        this.input = new Input();
        this.simulation = new Simulation();
        this.renderer = new Renderer(this.simulation);
        this.guiManager = new GuiManager(this.renderer, this.simulation);
    }

    start() {
        const simSpeed = 60; // 60 steps per second
        const fixedDt = 1 / simSpeed;
        let accumulator = 0;
        let lastTime = performance.now();
        
        const loop = (currentTime) => {
            const dt = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            accumulator += dt;
            while (accumulator >= fixedDt) {
                this.simulation.step();
                accumulator -= fixedDt;
            }
            
            this.renderer.render(this.input, dt);
            requestAnimationFrame(loop);
        };
        
        requestAnimationFrame(loop);
    }
}
