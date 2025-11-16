# dynamic-fractal-explorer
Interactive, web-based interface built in JavaScript and WebGL to explore the Mandelbrot set fractal and its infinitely many constituent Julia set fractals.

## Technology
This project uses **WebGL** with GPU-accelerated fragment shaders for real-time fractal rendering. All fractal computations run in parallel on the GPU, providing smooth 60fps performance even at high zoom levels.

## Usage
- **Drag LMB** to pan
- **Drag RMB** to edit the Julia set fractal constant (Julia set only)
- **Scroll** to zoom in/out
- **Select** fractal type from the dropdown menu

The rendering is GPU-accelerated and maintains full resolution at all times without any performance degradation.
