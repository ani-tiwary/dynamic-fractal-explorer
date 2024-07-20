const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');
const width = screen.width / 2;
const height = screen.width / 2;
canvas.width = width;
canvas.height = height;
canvas.style = "position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; margin: auto;";

let fractalType = 'julia';
let cReal = -0.54;
let cImag = 0.54;
let zoom = 1;
let centerX = 0;
let centerY = 0;

function mapToComplex(x, y) {
    const real = (x - width / 2) / (width / 4 * zoom) + centerX;
    const imag = (y - height / 2) / (height / 4 * zoom) + centerY;
    return { real, imag };
}

function juliaSet(x, y) {
    let real = x;
    let imag = y;
    let iteration = 0;
    const maxIteration = 100;
    while (iteration < maxIteration && real * real + imag * imag < 4) {
        const tempReal = real * real - imag * imag + cReal;
        imag = 2 * real * imag + cImag;
        real = tempReal;
        iteration++;
    }
    return iteration;
}

function mandelbrotSet(x, y) {
    let real = 0;
    let imag = 0;
    let iteration = 0;
    const maxIteration = 100;
    while (iteration < maxIteration && real * real + imag * imag < 4) {
        const tempReal = real * real - imag * imag + x;
        imag = 2 * real * imag + y;
        real = tempReal;
        iteration++;
    }
    return iteration;
}

function drawFractal() {
    const imageData = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const complex = mapToComplex(x, y);
            const iteration = fractalType === 'julia' ? 
                juliaSet(complex.real, complex.imag) : 
                mandelbrotSet(complex.real, complex.imag);
            const color = iteration === 100 ? 0 : 255 * Math.sqrt(iteration / 100);
            const index = (y * width + x) * 4;
            imageData.data[index] = color;
            imageData.data[index + 1] = color;
            imageData.data[index + 2] = color;
            imageData.data[index + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

canvas.addEventListener('mousemove', (event) => {
    if (event.buttons === 2 && fractalType === 'julia') {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const complex = mapToComplex(mouseX, mouseY);
        cReal = complex.real;
        cImag = complex.imag;
        drawFractal();
    }
});

canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const complex = mapToComplex(mouseX, mouseY);

    if (event.deltaY < 0) {
        zoom *= 1.1;
    } else {
        zoom /= 1.1;
    }

    centerX += (complex.real - centerX) * (1 - 1 / 1.1);
    centerY += (complex.imag - centerY) * (1 - 1 / 1.1);

    drawFractal();
});

canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

document.getElementById('fractalType').addEventListener('change', (event) => {
    fractalType = event.target.value;
    zoom = 1;
    centerX = 0;
    centerY = 0;
    if (fractalType === 'julia') {
        cReal = -0.54;
        cImag = 0.54;
    }
    drawFractal();
});

drawFractal();
