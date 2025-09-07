'use strict'

export default class Input {
    constructor() {
        this.mouseX = -1;
        this.mouseY = -1;
        this.dx = 0;
        this.dy = 0;
        this.mouseDown = false;

        this.lastX = 0;
        this.lastY = 0;

        window.addEventListener("mousedown", () => {
            this.mouseDown = true;
        });

        window.addEventListener("mouseup", () => {
            this.mouseDown = false;
            this.dx = 0;
            this.dy = 0;
        });

        window.addEventListener("mousemove", (event) => {
            if (this.mouseDown) {
                this.dx = event.clientX - this.lastX;
                this.dy = event.clientY - this.lastY;
            } else {
                this.dx = 0;
                this.dy = 0;
            }
            this.lastX = event.clientX;
            this.lastY = event.clientY;

            const halfWidth = window.innerWidth / 2;
            const halfHeight = window.innerHeight / 2;
            // normalized [-1, 1]
            this.mouseX = (event.clientX - halfWidth) / halfWidth;
            this.mouseY = (event.clientY - halfHeight) / halfHeight;
        });

    }

    consumeDelta() {
        const { dx, dy } = this;
        this.dx = 0;
        this.dy = 0;
        return { dx, dy };
    }
}