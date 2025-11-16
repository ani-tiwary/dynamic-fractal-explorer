const canvas = document.getElementById('fractalCanvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

if (!gl) {
    alert('WebGL not supported. Please use a modern browser.');
}

const width = window.innerWidth;
const height = window.innerHeight;
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

// Fragment shader - fractal computation
const fragmentShaderSource = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_zoom;
    uniform vec2 u_center;
    uniform vec2 u_c;
    uniform int u_fractalType;
    uniform int u_maxIterations;
    
    void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        vec2 c;
        vec2 z;
        
        // Map screen coordinates to complex plane
        float aspect = u_resolution.x / u_resolution.y;
        vec2 complexCoord = (uv - 0.5) * vec2(aspect, 1.0) * 4.0 / u_zoom + u_center;
        
        if (u_fractalType == 0) {
            // Julia Set
            c = u_c;
            z = complexCoord;
        } else {
            // Mandelbrot Set
            c = complexCoord;
            z = vec2(0.0, 0.0);
        }
        
        int iterations = u_maxIterations;
        for (int i = 0; i < 1000; i++) {
            if (i < u_maxIterations) {
                if (dot(z, z) > 4.0) {
                    iterations = i;
                } else {
                    float x = (z.x * z.x - z.y * z.y) + c.x;
                    float y = (z.x * z.y * 2.0) + c.y;
                    z = vec2(x, y);
                }
            }
        }
        
        float color = iterations == u_maxIterations ? 0.0 : sqrt(float(iterations) / float(u_maxIterations));
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
const cLocation = gl.getUniformLocation(program, 'u_c');
const fractalTypeLocation = gl.getUniformLocation(program, 'u_fractalType');
const maxIterationsLocation = gl.getUniformLocation(program, 'u_maxIterations');

let fractalType = 0; // 0 = julia, 1 = mandelbrot
let cReal = -0.54;
let cImag = 0.54;
let zoom = 1;
let centerX = 0;
let centerY = 0;
let maxIterations = 100;

let isDragging = false;
let lastX, lastY;

function mapToComplex(x, y) {
    const aspect = width / height;
    const real = (x / width - 0.5) * aspect * 4.0 / zoom + centerX;
    const imag = (y / height - 0.5) * 4.0 / zoom + centerY;
    return { real, imag };
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
    gl.uniform2f(cLocation, cReal, cImag);
    gl.uniform1i(fractalTypeLocation, fractalType);
    gl.uniform1i(maxIterationsLocation, maxIterations);
    
    // Clear and draw
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
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
        centerX -= dx / width * aspect * 4.0 / zoom;
        centerY += dy / height * 4.0 / zoom; // Fixed: changed from -= to +=
        lastX = event.clientX;
        lastY = event.clientY;
        render();
    } else if (event.buttons === 2 && fractalType === 0) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const complex = mapToComplex(mouseX, mouseY);
        cReal = complex.real;
        cImag = complex.imag;
        render();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});

canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Get the complex coordinate at the mouse position before zooming
    const aspect = width / height;
    const complexX = (mouseX / width - 0.5) * aspect * 4.0 / zoom + centerX;
    const complexY = (mouseY / height - 0.5) * 4.0 / zoom + centerY;
    
    const zoomFactor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
    zoom *= zoomFactor;
    
    // Adjust center so the point under the cursor stays fixed
    centerX = complexX - (mouseX / width - 0.5) * aspect * 4.0 / zoom;
    centerY = complexY - (mouseY / height - 0.5) * 4.0 / zoom;
    
    render();
});

canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    canvas.width = newWidth;
    canvas.height = newHeight;
    gl.viewport(0, 0, newWidth, newHeight);
    render();
});

document.getElementById('fractalType').addEventListener('change', (event) => {
    fractalType = event.target.value === 'julia' ? 0 : 1;
    zoom = 1;
    centerX = 0;
    centerY = 0;
    if (fractalType === 0) {
        cReal = -0.54;
        cImag = 0.54;
    }
    render();
});

render();
