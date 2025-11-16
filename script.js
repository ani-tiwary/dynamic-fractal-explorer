const canvas = document.getElementById('fractalCanvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

if (!gl) {
    alert('WebGL not supported. Please use a modern browser.');
}

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;
canvas.style = "position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; margin: auto;";

gl.viewport(0, 0, width, height);

// Vertex shader - simple full-screen quad
const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

// Fragment shader - Mandelbrot set
const fragmentShaderSource = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_zoom;
    uniform vec2 u_center;
    uniform int u_maxIterations;
    
    void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        
        // Map screen coordinates to complex plane
        float aspect = u_resolution.x / u_resolution.y;
        vec2 c = (uv - 0.5) * vec2(aspect, 1.0) * 3.0 / u_zoom + u_center;
        vec2 z = vec2(0.0, 0.0);
        
        int iterations = u_maxIterations;
        for (int i = 0; i < 1000; i++) {
            if (i < u_maxIterations) {
                if (dot(z, z) > 4.0) {
                    iterations = i;
                    break;
                } else {
                    float x = (z.x * z.x - z.y * z.y) + c.x;
                    float y = (z.x * z.y * 2.0) + c.y;
                    z = vec2(x, y);
                }
            }
        }
        
        // Binary black and white - no grayscale
        // Black if in set (iterations == maxIterations), white if escaped
        float color = iterations == u_maxIterations ? 0.0 : 1.0;
        gl_FragColor = vec4(color, color, color, 1.0);
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    
    return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

// Create full-screen quad
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

// Get attribute and uniform locations
const positionLocation = gl.getAttribLocation(program, 'a_position');
const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
const zoomLocation = gl.getUniformLocation(program, 'u_zoom');
const centerLocation = gl.getUniformLocation(program, 'u_center');
const maxIterationsLocation = gl.getUniformLocation(program, 'u_maxIterations');

// View state
let zoom = 1.35;
let centerX = -1.5;
let centerY = 0.0;
let maxIterations = 1;

// Debug mode
let debugMode = false;
let savedLocations = [];

// Panning state
let isDragging = false;
let lastX = 0;
let lastY = 0;

// Iteration animation state
let isAnimatingIterations = true;
let iterationAnimationStartTime = performance.now();
let iterationAnimationDuration = 3000; // 3 seconds

// Easing function for smooth animation (ease-in-out)
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function render() {
    gl.useProgram(program);
    
    // Set up attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Set uniforms
    gl.uniform2f(resolutionLocation, width, height);
    gl.uniform1f(zoomLocation, zoom);
    gl.uniform2f(centerLocation, centerX, centerY);
    gl.uniform1i(maxIterationsLocation, maxIterations);
    
    // Clear and draw
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Map screen coordinates to complex plane
function mapToComplex(x, y) {
    const aspect = width / height;
    const real = (x / width - 0.5) * aspect * 3.0 / zoom + centerX;
    const imag = (y / height - 0.5) * 3.0 / zoom + centerY;
    return { real, imag };
}

// Save current location (debug mode only)
function saveLocation() {
    if (!debugMode) return;
    
    const location = {
        name: `Location ${savedLocations.length + 1}`,
        zoom: zoom,
        centerX: centerX,
        centerY: centerY
    };
    
    savedLocations.push(location);
    console.log('Saved location:', location);
    console.log('All saved locations:', savedLocations);
}

// Toggle debug mode
function toggleDebugMode() {
    debugMode = !debugMode;
    console.log('Debug mode:', debugMode ? 'ON' : 'OFF');
    if (debugMode) {
        console.log('Debug mode enabled. Press S to save current location.');
        console.log('Saved locations:', savedLocations);
    }
}

// Mouse wheel zoom (zooms to cursor position)
canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Get the complex coordinate at the mouse position before zooming
    const aspect = width / height;
    const complexX = (mouseX / width - 0.5) * aspect * 3.0 / zoom + centerX;
    const complexY = (0.5 - mouseY / height) * 3.0 / zoom + centerY; // Flip Y: screen Y increases downward, complex Y increases upward
    
    const zoomFactor = event.deltaY < 0 ? 1.05 : 1 / 1.05; // Slower zoom (5% per step instead of 10%)
    zoom *= zoomFactor;
    
    // Adjust center so the point under the cursor stays fixed
    centerX = complexX - (mouseX / width - 0.5) * aspect * 3.0 / zoom;
    centerY = complexY - (0.5 - mouseY / height) * 3.0 / zoom; // Flip Y to match
    
    render();
});

// Panning with mouse drag
canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // Left mouse button
        isDragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (isDragging) {
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        const aspect = width / height;
        centerX -= dx / width * aspect * 3.0 / zoom;
        centerY += dy / height * 3.0 / zoom; // Note: + instead of - for correct direction
        lastX = event.clientX;
        lastY = event.clientY;
        render();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});

// Keyboard controls
window.addEventListener('keydown', (event) => {
    // Toggle debug mode with 'D' key
    if (event.key === 'd' || event.key === 'D') {
        toggleDebugMode();
    }
    
    // Save location with 'S' key (debug mode only)
    if ((event.key === 's' || event.key === 'S') && debugMode) {
        saveLocation();
    }
});

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    render();
});

// Animate iterations from 1 to 1000 on page load
function animateIterations() {
    iteration = 500;
    if (!isAnimatingIterations) return;
    
    const currentTime = performance.now();
    const elapsed = currentTime - iterationAnimationStartTime;
    const progress = Math.min(elapsed / iterationAnimationDuration, 1.0);
    
    // Smooth ease-in-out curve
    const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    // Interpolate from 1 to 1000
    maxIterations = Math.floor(1 + (iteration - 1) * eased);
    
    render();
    
    if (progress < 1.0) {
        requestAnimationFrame(animateIterations);
    } else {
        isAnimatingIterations = false;
        maxIterations = iteration; // Ensure we end exactly at 1000
        render();
    }
}

// Start iteration animation
animateIterations();
