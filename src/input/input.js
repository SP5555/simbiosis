'use strict'

export default class Input {
    constructor() {
        this.mouseX = 0;
        this.mouseY = 0;

        // Listen to mouse movement
        window.addEventListener("mousemove", (event) => {
            const halfWidth = window.innerWidth / 2;
            const halfHeight = window.innerHeight / 2;
            // normalized [-1, 1]
            this.mouseX = (event.clientX - halfWidth) / halfWidth;
            this.mouseY = (event.clientY - halfHeight) / halfHeight;
        });
    }
}