# Simbiosis

A hobby project, a small simulator featuring procedural terrain generation, dynamic seasons, and vegetation.

Hosted here: [Simbiosis World](https://simbiosis-world.netlify.app)

## Features
- **Procedural Terrain Generation**
    - Generates varied terrain with multiple attributes (biome, elevation, temperature, fertility).
- **Dynamic Seasons and Vegetation**
    - Seasonal changes affect the world, with toggleable vegetation display.

## Technical Design Choices
- **Decoupled Simulation and Rendering**
    - Frame-rate independent simulation.
    - Adjustable simulation speed and pause control without affecting rendering.
    - Gracefully handles browser tab/window visibility changes.
- **Event-driven Architecture**
    - Cross-module communication via an event bus.
    - Enables clean separation of concerns between simulation, rendering, and GUI.

---

## How to run

1. Clone the repository
```bash
git clone https://github.com/SP5555/simbiosis.git
cd simbiosis
```

2. Install dependencies
```bash
npm install
```

3. Start local server
```bash
python3 -m http.server 8000
```
or any other static server you prefer.

4. Open in your browser
```bash
http://localhost:8000/
```