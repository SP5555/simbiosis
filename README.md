# Simbiosis

A hobby project, a small simulator featuring procedural terrain generation, dynamic seasons, and vegetation.

Hosted here: [Simbiosis World](https://simbiosis-world.netlify.app)

## Features
- **Procedural Terrain Generation**
- **Dynamic Seasons and Vegetation**

## Technical Design Choices
- **Decoupled Simulation and Rendering**
- **Event-driven Architecture**:
---

## How to run

**Prerequisite:** [Node.js](https://nodejs.org/) (LTS) installed - this works the same way on Windows, macOS, and Linux.

1. Clone the repository
```bash
git clone https://github.com/SP5555/simbiosis.git
cd simbiosis
```

2. Install dependencies
```bash
npm install
```

3. Start the dev server
```bash
npm run dev
```
Vite will print a local URL (defaults to `http://localhost:5173/`), open it in your browser.

### Production build

```bash
npm run build
```
Outputs a bundled, static site to `dist/`, which is what gets deployed to Netlify.