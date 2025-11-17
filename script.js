const canvas = document.getElementById('fractalCanvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

if (!gl) {
    alert('WebGL not supported. Please use a modern browser.');
}

// Text canvas setup
const textCanvas = document.getElementById('textCanvas');
const textCtx = textCanvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;
textCanvas.width = width;
textCanvas.height = height;
canvas.style = "position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; margin: auto;";

gl.viewport(0, 0, width, height);

// Vertex shader - simple full-screen quad
const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

// Fragment shader - Mandelbrot set with adaptive precision
const fragmentShaderSource = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_zoom;
    uniform vec2 u_center;
    uniform vec2 u_centerHigh;  // High precision center offset
    uniform int u_maxIterations;
    uniform float u_useHighPrecision;  // 1.0 if zoom > threshold, 0.0 otherwise
    
    // Fast single precision Mandelbrot (used at low zoom)
    int mandelbrot_single(vec2 c) {
        vec2 z = vec2(0.0, 0.0);
        for (int i = 0; i < 1000; i++) {
            if (i >= u_maxIterations) break;
            if (dot(z, z) > 4.0) return i;
            float x = (z.x * z.x - z.y * z.y) + c.x;
            float y = (z.x * z.y * 2.0) + c.y;
            z = vec2(x, y);
        }
        return u_maxIterations;
    }
    
    // Double-double arithmetic functions (used at high zoom)
    vec2 dd_add(vec2 a, vec2 b) {
        float s = a.x + b.x;
        float v = s - a.x;
        float e = (a.x - (s - v)) + (b.x - v);
        e += a.y + b.y;
        return vec2(s, e);
    }
    
    vec2 dd_mul(vec2 a, vec2 b) {
        float p = a.x * b.x;
        float e = (a.x * b.x) - p;
        e += a.x * b.y + a.y * b.x;
        return vec2(p, e);
    }
    
    vec2 dd_sqr(vec2 a) {
        float p = a.x * a.x;
        float e = (a.x * a.x) - p;
        e += 2.0 * a.x * a.y;
        return vec2(p, e);
    }
    
    float dd_mag2(vec2 real, vec2 imag) {
        vec2 real2 = dd_sqr(real);
        vec2 imag2 = dd_sqr(imag);
        vec2 sum = dd_add(real2, imag2);
        return sum.x + sum.y;
    }
    
    // High precision Mandelbrot (used at high zoom)
    int mandelbrot_double(vec2 c_single, vec2 centerHigh) {
        // Reconstruct c with high precision
        // c_single already includes u_center, so we add the high precision correction
        vec2 c_real = vec2(c_single.x, 0.0);
        vec2 c_imag = vec2(c_single.y, 0.0);
        c_real = dd_add(c_real, vec2(centerHigh.x, 0.0));
        c_imag = dd_add(c_imag, vec2(centerHigh.y, 0.0));
        
        vec2 z_real = vec2(0.0, 0.0);
        vec2 z_imag = vec2(0.0, 0.0);
        
        for (int i = 0; i < 1000; i++) {
            if (i >= u_maxIterations) break;
            if (dd_mag2(z_real, z_imag) > 4.0) return i;
            
            // z = z^2 + c using double-double arithmetic
            vec2 z_real_sq = dd_sqr(z_real);
            vec2 z_imag_sq = dd_sqr(z_imag);
            vec2 z_real_imag = dd_mul(z_real, z_imag);
            
            // real part: z_real^2 - z_imag^2 + c_real
            vec2 real_diff = dd_add(z_real_sq, vec2(-z_imag_sq.x, -z_imag_sq.y));
            z_real = dd_add(real_diff, c_real);
            
            // imag part: 2 * z_real * z_imag + c_imag
            vec2 imag_prod = dd_add(z_real_imag, z_real_imag);
            z_imag = dd_add(imag_prod, c_imag);
        }
        return u_maxIterations;
    }
    
    void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float aspect = u_resolution.x / u_resolution.y;
        vec2 c = (uv - 0.5) * vec2(aspect, 1.0) * 3.0 / u_zoom + u_center;
        
        int iterations;
        if (u_useHighPrecision > 0.5) {
            iterations = mandelbrot_double(c, u_centerHigh);
        } else {
            iterations = mandelbrot_single(c);
        }
        
        // Enhanced grayscale gradient with rich gray variations
        // Points in the set (max iterations) = black
        // Points that escaped get various shades of gray based on iteration count
        float color;
        if (iterations == u_maxIterations) {
            color = 0.0; // Black for points in the set
        } else {
            // Normalize iteration count
            float normalized = float(iterations) / float(u_maxIterations);
            
            // Create many distinct gray bands with smooth transitions
            // More bands in darker ranges for richer black/gray variation
            float gray;
            
            // Use a piecewise function with many more gray levels
            if (normalized < 0.05) {
                // Very light gray
                gray = mix(0.98, 0.92, normalized / 0.05);
            } else if (normalized < 0.1) {
                // Light gray
                gray = mix(0.92, 0.85, (normalized - 0.05) / 0.05);
            } else if (normalized < 0.15) {
                // Light-medium gray
                gray = mix(0.85, 0.78, (normalized - 0.1) / 0.05);
            } else if (normalized < 0.22) {
                // Medium-light gray
                gray = mix(0.78, 0.68, (normalized - 0.15) / 0.07);
            } else if (normalized < 0.3) {
                // Medium gray
                gray = mix(0.68, 0.58, (normalized - 0.22) / 0.08);
            } else if (normalized < 0.38) {
                // Medium gray (darker)
                gray = mix(0.58, 0.48, (normalized - 0.3) / 0.08);
            } else if (normalized < 0.46) {
                // Medium-dark gray
                gray = mix(0.48, 0.38, (normalized - 0.38) / 0.08);
            } else if (normalized < 0.54) {
                // Dark gray
                gray = mix(0.38, 0.28, (normalized - 0.46) / 0.08);
            } else if (normalized < 0.62) {
                // Dark gray (darker)
                gray = mix(0.28, 0.20, (normalized - 0.54) / 0.08);
            } else if (normalized < 0.70) {
                // Very dark gray
                gray = mix(0.20, 0.14, (normalized - 0.62) / 0.08);
            } else if (normalized < 0.78) {
                // Very dark gray (darker)
                gray = mix(0.14, 0.09, (normalized - 0.70) / 0.08);
            } else if (normalized < 0.85) {
                // Nearly black
                gray = mix(0.09, 0.05, (normalized - 0.78) / 0.07);
            } else if (normalized < 0.91) {
                // Almost black
                gray = mix(0.05, 0.025, (normalized - 0.85) / 0.06);
            } else if (normalized < 0.96) {
                // Very nearly black
                gray = mix(0.025, 0.01, (normalized - 0.91) / 0.05);
            } else {
                // Extremely dark, almost pure black
                gray = mix(0.01, 0.002, (normalized - 0.96) / 0.04);
            }
            
            // Add subtle banding/texture for more visual interest
            // Creates fine detail in the gray transitions
            float banding = sin(normalized * 30.0) * 0.025;
            gray = clamp(gray + banding, 0.0, 1.0);
            
            // Add micro-variation for smoother transitions and more texture
            float microVariation = sin(normalized * 60.0 + float(iterations) * 0.15) * 0.012;
            gray = clamp(gray + microVariation, 0.0, 1.0);
            
            // Add additional fine detail variation
            float fineDetail = sin(normalized * 100.0 + float(iterations) * 0.3) * 0.008;
            gray = clamp(gray + fineDetail, 0.0, 1.0);
            
            color = gray;
        }
        
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
const centerHighLocation = gl.getUniformLocation(program, 'u_centerHigh');
const maxIterationsLocation = gl.getUniformLocation(program, 'u_maxIterations');
const useHighPrecisionLocation = gl.getUniformLocation(program, 'u_useHighPrecision');

// View state
let zoom = 1.35;
let centerX = -1.5;
let centerY = 0.0;
let maxIterations = 1;

// Text labels are now loaded from text-labels.js
// If textLabels is not defined, initialize with empty array
if (typeof textLabels === 'undefined') {
    var textLabels = [];
}

// Debug info - cursor tracking
let cursorFractalX = 0;
let cursorFractalY = 0;
let showDebugInfo = true; // Temporary debug feature

// Text fade-in animation state
let isFadingInText = false;
let textFadeStartTime = 0;
let textFadeDuration = 1500; // 1.5 seconds fade-in

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

// Smooth movement animation state
let isAnimatingMovement = false;
let movementAnimationStartTime = 0;
let movementAnimationDuration = 2000; // 2 seconds default
let movementStartZoom = 1.35;
let movementStartCenterX = -1.5;
let movementStartCenterY = 0.0;
let movementTargetZoom = 1.35;
let movementTargetCenterX = -1.5;
let movementTargetCenterY = 0.0;
let movementPhase = 'position'; // 'position' or 'zoom' - controls animation order
let movementNeedsReset = false; // Flag for high zoom reset
let movementOriginalTarget = null; // Store original target when reset is needed

/**
 * Smoothly animates the canvas to a specific center coordinate and zoom level
 * Can be called with either:
 * - A scene name (string): smoothMoveTo('Scene Name', duration)
 * - Coordinates: smoothMoveTo(targetCenterX, targetCenterY, targetZoom, duration)
 * 
 * @param {string|number} sceneNameOrX - Scene name (string) or target center X coordinate (number)
 * @param {number} [targetCenterY] - Target center Y coordinate (if first arg is number)
 * @param {number} [targetZoom] - Target zoom level (if first arg is number)
 * @param {number} [duration] - Animation duration in milliseconds (default: 2000)
 */
function smoothMoveTo(sceneNameOrX, targetCenterY, targetZoom, duration = 2000) {
    let targetCenterX, finalTargetCenterY, finalTargetZoom, finalDuration;
    
    // Check if first argument is a string (scene name)
    if (typeof sceneNameOrX === 'string') {
        // Look up scene by name
        if (typeof sceneCoordinates === 'undefined' || !sceneCoordinates) {
            console.error('Scene coordinates not loaded. Cannot find scene:', sceneNameOrX);
            return;
        }
        
        const scene = sceneCoordinates.find(s => s.name === sceneNameOrX);
        if (!scene) {
            console.error('Scene not found:', sceneNameOrX);
            console.log('Available scenes:', sceneCoordinates.map(s => s.name));
            return;
        }
        
        targetCenterX = scene.centerX;
        finalTargetCenterY = scene.centerY;
        finalTargetZoom = scene.zoom;
        // If second argument is provided and is a number, use it as duration
        finalDuration = (typeof targetCenterY === 'number' && targetCenterY > 0) ? targetCenterY : duration;
    } else {
        // Original behavior: coordinates provided
        targetCenterX = sceneNameOrX;
        finalTargetCenterY = targetCenterY;
        finalTargetZoom = targetZoom;
        finalDuration = duration;
    }
    
    // If current zoom is > 2, first go back to pos0's zoom level (for both zooming in and out)
    if (zoom > 2.0) {
        movementNeedsReset = true;
        // Store original target for after reset
        movementOriginalTarget = {
            centerX: targetCenterX,
            centerY: finalTargetCenterY,
            zoom: finalTargetZoom,
            duration: finalDuration
        };
        // Find pos0 to get its zoom level
        const pos0Scene = sceneCoordinates && sceneCoordinates.find(s => s.name === 'pos0');
        if (pos0Scene) {
            // Zoom to pos0's zoom level at current position (don't change x,y)
            movementStartZoom = zoom;
            movementStartCenterX = centerX;
            movementStartCenterY = centerY;
            movementTargetZoom = pos0Scene.zoom; // Zoom to pos0's zoom level first
            movementTargetCenterX = centerX; // Keep current position
            movementTargetCenterY = centerY; // Keep current position
            movementAnimationDuration = 500; // Quick reset
            movementPhase = 'zoom'; // Zoom to pos0 first (position stays constant)
            movementAnimationStartTime = performance.now();
            isAnimatingMovement = true;
            animateMovement();
            return; // Will continue to target position after reset completes
        } else {
            // If pos0 not found, fall back to original behavior
            console.warn('pos0 scene not found, proceeding without reset');
        }
    }
    
    // Store starting values
    movementStartZoom = zoom;
    movementStartCenterX = centerX;
    movementStartCenterY = centerY;
    
    // Store target values
    movementTargetZoom = finalTargetZoom;
    movementTargetCenterX = targetCenterX;
    movementTargetCenterY = finalTargetCenterY;
    
    // Set animation parameters
    // Split duration: half for position, half for zoom
    movementAnimationDuration = finalDuration / 2;
    movementNeedsReset = false;
    movementAnimationStartTime = performance.now();
    isAnimatingMovement = true;
    
    // Determine animation order based on zoom direction
    // Zooming in (target > start): position first, then zoom
    // Zooming out (target < start): zoom first, then position
    const isZoomingIn = finalTargetZoom > zoom;
    movementPhase = isZoomingIn ? 'position' : 'zoom';
    
    // Start animation loop
    animateMovement();
}

/**
 * Animation loop for smooth movement
 * Animates position first, then zoom, for smoother visual experience
 */
function animateMovement() {
    if (!isAnimatingMovement) return;
    
    const currentTime = performance.now();
    const elapsed = currentTime - movementAnimationStartTime;
    const progress = Math.min(elapsed / movementAnimationDuration, 1.0);
    
    // Apply easing function for smooth animation
    const eased = easeInOutCubic(progress);
    
    if (movementPhase === 'position') {
        // Position phase: Move position (keep zoom constant)
        centerX = movementStartCenterX + (movementTargetCenterX - movementStartCenterX) * eased;
        centerY = movementStartCenterY + (movementTargetCenterY - movementStartCenterY) * eased;
        
        // Keep zoom constant during position movement
        zoom = movementStartZoom;
        
        render();
        
        if (progress >= 1.0) {
            // Position phase complete, now start zoom phase
            movementPhase = 'zoom';
            // Store the zoom at the start of zoom phase (should be same as movementStartZoom)
            movementStartZoom = zoom;
            movementStartCenterX = centerX;
            movementStartCenterY = centerY;
            movementAnimationStartTime = performance.now();
            // Continue to zoom phase immediately
            requestAnimationFrame(animateMovement);
            return;
        } else {
            // Position phase - continue animation if not complete
            requestAnimationFrame(animateMovement);
            return;
        }
    }
    
    if (movementPhase === 'zoom') {
        // Zoom phase: Zoom to target
        // Recalculate progress for zoom phase (starts fresh)
        const zoomElapsed = currentTime - movementAnimationStartTime;
        const zoomProgress = Math.min(zoomElapsed / movementAnimationDuration, 1.0);
        const zoomEased = easeInOutCubic(zoomProgress);
        
        // Interpolate zoom (use exponential interpolation for zoom to feel more natural)
        // For very large zoom differences, use logarithmic interpolation for better precision
        const zoomRatio = movementTargetZoom / movementStartZoom;
        if (zoomRatio > 100 || zoomRatio < 0.01) {
            // For very large ratios, use logarithmic interpolation to avoid precision issues
            const logStart = Math.log(movementStartZoom);
            const logTarget = Math.log(movementTargetZoom);
            const logCurrent = logStart + (logTarget - logStart) * zoomEased;
            zoom = Math.exp(logCurrent);
        } else {
            // Normal exponential interpolation for smaller ratios
            zoom = movementStartZoom * Math.pow(zoomRatio, zoomEased);
        }
        
        // During zoom phase, position behavior depends on whether we're zooming in or out
        const isZoomingIn = movementTargetZoom > movementStartZoom;
        if (isZoomingIn) {
            // Zooming in: position already at target (set during position phase)
            centerX = movementTargetCenterX;
            centerY = movementTargetCenterY;
        } else {
            // Zooming out: keep position constant during zoom
            centerX = movementStartCenterX;
            centerY = movementStartCenterY;
        }
        
        render();
        
        if (zoomProgress >= 1.0) {
            // Zoom phase complete
            // First check if this is a reset phase that needs to continue to target
            if (movementNeedsReset && movementOriginalTarget) {
                // Reset complete, now animate to final target
                const originalTarget = movementOriginalTarget;
                movementNeedsReset = false;
                movementOriginalTarget = null;
                // Small delay to ensure smooth transition
                setTimeout(() => {
                    smoothMoveTo(originalTarget.centerX, originalTarget.centerY, originalTarget.zoom, originalTarget.duration);
                }, 50);
                return;
            }
            
            // Normal zoom phase completion
            // Check if we need to move position (when zooming out)
            if (!isZoomingIn) {
                // Zooming out: now move position to target
                movementPhase = 'position';
                movementStartZoom = zoom;
                movementStartCenterX = centerX;
                movementStartCenterY = centerY;
                movementAnimationStartTime = performance.now();
                // Continue to position phase immediately
                requestAnimationFrame(animateMovement);
                return;
            }
        } else {
            // Zoom phase - continue animation if not complete
            requestAnimationFrame(animateMovement);
            return;
        }
    }
    
    // Animation complete
    // Check if we need to continue to final target after reset (fallback check)
    if (movementNeedsReset && movementPhase === 'zoom' && movementOriginalTarget) {
        // Reset complete, now animate to final target
        const originalTarget = movementOriginalTarget;
        movementNeedsReset = false;
        movementOriginalTarget = null;
        // Small delay to ensure smooth transition
        setTimeout(() => {
            smoothMoveTo(originalTarget.centerX, originalTarget.centerY, originalTarget.zoom, originalTarget.duration);
        }, 50);
        return;
    }
    
    // Animation complete - ensure exact target values
    isAnimatingMovement = false;
    // Force exact values to avoid any precision issues
    zoom = movementTargetZoom;
    centerX = movementTargetCenterX;
    centerY = movementTargetCenterY;
    render();
    
    // Double-check zoom is set correctly (for very large values)
    if (Math.abs(zoom - movementTargetZoom) > 0.01) {
        zoom = movementTargetZoom;
        render();
    }
}

// Split a number into high and low parts for double-double precision
// This maintains precision at very high zoom levels
function splitDouble(value) {
    const splitter = 134217729.0; // 2^27 + 1, used for splitting
    const temp = splitter * value;
    const high = temp - (temp - value);
    const low = value - high;
    return { high: high, low: low };
}

// Convert fractal coordinates to screen coordinates
function fractalToScreen(fractalX, fractalY) {
    const aspect = width / height;
    const screenX = ((fractalX - centerX) * zoom / (3.0 * aspect) + 0.5) * width;
    const screenY = ((fractalY - centerY) * zoom / 3.0 + 0.5) * height;
    // Flip Y coordinate (screen Y increases downward, fractal Y increases upward)
    return { x: screenX, y: height - screenY };
}

// Calculate font size in fractal units from zoom amount
// This allows text to be specified by zoom level instead of fontSize
function fontSizeFromZoom(targetZoom) {
    // Base size that works well at zoom level 1.35
    // Formula: fontSize scales inversely with zoom
    return 0.15 * (1.35 / targetZoom);
}

// Render text labels
function renderText() {
    // Clear text canvas
    textCtx.clearRect(0, 0, width, height);
    
    // Set font
    textCtx.font = 'Manrope';
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';
    
    // Render each label
    textLabels.forEach(label => {
        // Convert fractal coordinates to screen coordinates
        const screenPos = fractalToScreen(label.x, label.y);
        
        // Calculate font size - use zoom-based calculation if zoom is specified, otherwise use fontSize
        let fontSizeInFractalUnits;
        if (label.zoom !== undefined) {
            fontSizeInFractalUnits = fontSizeFromZoom(label.zoom);
        } else {
            fontSizeInFractalUnits = label.fontSize;
        }
        
        // Calculate font size in pixels based on zoom
        // The font size scales with zoom so it appears the same size relative to the fractal
        const fontSizePixels = fontSizeInFractalUnits * zoom * Math.min(width, height) / 3.0;
        
        // Only render if the text would be visible (not too small or off-screen)
        if (fontSizePixels > 1 && 
            screenPos.x > -100 && screenPos.x < width + 100 &&
            screenPos.y > -100 && screenPos.y < height + 100) {
            textCtx.font = `${fontSizePixels}px Manrope`;
            
            // Convert hex color to rgba with opacity
            const opacity = label.opacity !== undefined ? label.opacity : 1.0;
            const hex = label.color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            textCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            
            textCtx.fillText(label.text, screenPos.x, screenPos.y);
        }
    });
    
    // Render debug info in top left
    if (showDebugInfo) {
        textCtx.font = '14px Manrope';
        textCtx.textAlign = 'left';
        textCtx.textBaseline = 'top';
        
        const debugText = [
            `Cursor: (${cursorFractalX.toFixed(6)}, ${cursorFractalY.toFixed(6)})`,
            `Center: (${centerX.toFixed(6)}, ${centerY.toFixed(6)})`,
            `Zoom: ${zoom.toFixed(2)}`
        ];
        
        // Calculate text dimensions for background
        const padding = 8;
        const lineHeight = 20;
        const textWidth = Math.max(
            ...debugText.map(line => {
                const metrics = textCtx.measureText(line);
                return metrics.width;
            })
        );
        const textHeight = debugText.length * lineHeight;
        
        // Draw background with slight transparency
        textCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        textCtx.fillRect(10 - padding, 10 - padding, textWidth + padding * 2, textHeight + padding * 2);
        
        // Draw text
        textCtx.fillStyle = '#000000';
        debugText.forEach((line, index) => {
            textCtx.fillText(line, 10, 10 + index * lineHeight);
        });
        
        // Show copy position button
        const copyBtn = document.getElementById('copyPositionBtn');
        if (copyBtn) {
            copyBtn.style.display = 'block';
        }
    } else {
        // Hide copy position button when debug info is hidden
        const copyBtn = document.getElementById('copyPositionBtn');
        if (copyBtn) {
            copyBtn.style.display = 'none';
        }
    }
}

function render() {
    gl.useProgram(program);
    
    // Set up attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Calculate high precision center offset
    // Split center into high (single precision) and low (error) parts
    // This maintains precision at very high zoom levels
    const centerXSplit = splitDouble(centerX);
    const centerYSplit = splitDouble(centerY);
    const centerXHigh = centerXSplit.high;
    const centerYHigh = centerYSplit.high;
    const centerXLow = centerXSplit.low;   // Error term for double-double precision
    const centerYLow = centerYSplit.low;    // Error term for double-double precision
    
    // Use high precision only when zoom is very high (above 1000)
    // This keeps performance good at normal zoom levels
    const useHighPrecision = zoom > 1000.0 ? 1.0 : 0.0;
    
    // Adaptive iteration count based on zoom for better performance and quality
    // More iterations needed at higher zoom to see detail
    // Scale more aggressively at very high zoom levels
    let adaptiveIterations;
    if (zoom > 1000000) {
        // At 10^6+ zoom, need many iterations
        adaptiveIterations = Math.min(maxIterations, Math.max(500, Math.floor(Math.log(zoom + 1) * 200)));
    } else if (zoom > 10000) {
        // At 10^4+ zoom, moderate iterations
        adaptiveIterations = Math.min(maxIterations, Math.max(300, Math.floor(Math.log(zoom + 1) * 180)));
    } else {
        // Lower zoom, fewer iterations
        adaptiveIterations = Math.min(maxIterations, Math.max(100, Math.floor(Math.log(zoom + 1) * 150)));
    }
    
    // Set uniforms
    gl.uniform2f(resolutionLocation, width, height);
    gl.uniform1f(zoomLocation, zoom);
    gl.uniform2f(centerLocation, centerXHigh, centerYHigh);
    gl.uniform2f(centerHighLocation, centerXLow, centerYLow);
    gl.uniform1i(maxIterationsLocation, adaptiveIterations);
    gl.uniform1f(useHighPrecisionLocation, useHighPrecision);
    
    // Clear and draw
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    // Render text overlay
    renderText();
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
    
    // Stop any ongoing smooth movement animation
    if (isAnimatingMovement) {
        isAnimatingMovement = false;
    }
    
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
        // Stop any ongoing smooth movement animation
        if (isAnimatingMovement) {
            isAnimatingMovement = false;
        }
        
        isDragging = true;
        lastX = event.clientX;
        lastY = event.clientY;
    }
});

canvas.addEventListener('mousemove', (event) => {
    // Update cursor fractal coordinates for debug display
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const aspect = width / height;
    cursorFractalX = (mouseX / width - 0.5) * aspect * 3.0 / zoom + centerX;
    cursorFractalY = (0.5 - mouseY / height) * 3.0 / zoom + centerY; // Flip Y: screen Y increases downward, complex Y increases upward
    
    if (isDragging) {
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        centerX -= dx / width * aspect * 3.0 / zoom;
        centerY += dy / height * 3.0 / zoom; // Note: + instead of - for correct direction
        lastX = event.clientX;
        lastY = event.clientY;
        render();
    } else if (showDebugInfo) {
        // Only update text overlay for debug display (more efficient than full render)
        renderText();
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
    
    // Copy cursor position with 'C' key (formatted for text-labels.js)
    if (event.key === 'c' || event.key === 'C') {
        // Format as text-labels.js entry with all fields
        const labelJson = `    {
        text: 'Label Text',
        x: ${cursorFractalX},
        y: ${cursorFractalY},
        zoom: ${zoom},
        color: '#000000',
        opacity: 1.0
    }`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(labelJson).then(() => {
            // Visual feedback
            console.log('Copied cursor position to clipboard!');
            console.log('Paste this into text-labels.js:');
            console.log(labelJson);
        }).catch(err => {
            console.error('Failed to copy:', err);
            // Fallback: show in alert
            alert('Cursor Position (copy this):\n\n' + labelJson);
        });
    }
    
    // Number keys 0-9 to navigate to pos0, pos1, pos2, etc.
    if (event.key >= '0' && event.key <= '9') {
        const posNumber = parseInt(event.key);
        const sceneName = `pos${posNumber}`;
        
        // Check if scene exists
        if (typeof sceneCoordinates !== 'undefined' && sceneCoordinates) {
            const scene = sceneCoordinates.find(s => s.name === sceneName);
            if (scene) {
                smoothMoveTo(sceneName);
            } else {
                console.log(`Scene "${sceneName}" not found. Available scenes:`, 
                    sceneCoordinates.map(s => s.name));
            }
        }
    }
});

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    textCanvas.width = width;
    textCanvas.height = height;
    gl.viewport(0, 0, width, height);
    render();
});

// Animate text fade-in
function animateTextFadeIn() {
    if (!isFadingInText) return;
    
    const currentTime = performance.now();
    const elapsed = currentTime - textFadeStartTime;
    const progress = Math.min(elapsed / textFadeDuration, 1.0);
    
    // Smooth ease-in curve for fade
    const eased = progress * progress; // Simple ease-in
    
    // Update opacity for welcome text (first label)
    if (textLabels.length > 0) {
        textLabels[0].opacity = eased;
    }
    
    render();
    
    if (progress < 1.0) {
        requestAnimationFrame(animateTextFadeIn);
    } else {
        isFadingInText = false;
        // Ensure opacity is exactly 1.0
        if (textLabels.length > 0) {
            textLabels[0].opacity = 1.0;
        }
        render();
    }
}

// Animate iterations from 1 to 500 on page load (reduced for performance)
function animateIterations() {
    const iteration = 1500;
    if (!isAnimatingIterations) return;
    
    const currentTime = performance.now();
    const elapsed = currentTime - iterationAnimationStartTime;
    const progress = Math.min(elapsed / iterationAnimationDuration, 1.0);
    
    // Smooth ease-in-out curve
    const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    // Interpolate from 1 to target iteration count
    maxIterations = Math.floor(1 + (iteration - 1) * eased);
    
    render();
    
    if (progress < 1.0) {
        requestAnimationFrame(animateIterations);
    } else {
        isAnimatingIterations = false;
        maxIterations = iteration; // Ensure we end exactly at target
        render();
        
        // Don't start fade-in here - it's already started 0.5s after click
    }
}

// Black overlay click handler
function setupBlackOverlay() {
    const blackOverlay = document.getElementById('blackOverlay');
    if (!blackOverlay) {
        console.error('Black overlay element not found!');
        return;
    }
    
    // Remove any existing listeners by using a one-time handler flag
    if (blackOverlay.dataset.listenerAttached) {
        return; // Already set up
    }
    blackOverlay.dataset.listenerAttached = 'true';
    
    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Remove the overlay
        blackOverlay.style.display = 'none';
        
        // Reset animation state and start
        isAnimatingIterations = true;
        iterationAnimationStartTime = performance.now();
        maxIterations = 1;
        
        // Initial render with 1 iteration
        render();
        
        // Start iteration animation
        animateIterations();
        
        // Start text fade-in animation 0.5 seconds after click
        setTimeout(() => {
            if (!isFadingInText) {
                isFadingInText = true;
                textFadeStartTime = performance.now();
                animateTextFadeIn();
            }
        }, 500);
    };
    
    blackOverlay.addEventListener('click', handleClick);
    blackOverlay.addEventListener('mousedown', handleClick);
}

// Set up overlay when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupBlackOverlay);
} else {
    // DOM already loaded
    setupBlackOverlay();
}

// Copy position button functionality
const copyPositionBtn = document.getElementById('copyPositionBtn');
if (copyPositionBtn) {
    copyPositionBtn.addEventListener('click', () => {
        // Format as JavaScript object syntax (no quotes on keys) with leading comma
        const jsObjectString = `,
    {
        name: "Current Position",
        centerX: ${centerX},
        centerY: ${centerY},
        zoom: ${zoom}
    }`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(jsObjectString).then(() => {
            // Visual feedback
            const originalText = copyPositionBtn.textContent;
            copyPositionBtn.textContent = 'Copied!';
            copyPositionBtn.style.backgroundColor = 'rgba(144, 238, 144, 0.8)';
            
            setTimeout(() => {
                copyPositionBtn.textContent = originalText;
                copyPositionBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            }, 1000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            // Fallback: show in alert
            alert('Position:\n\n' + jsObjectString);
        });
    });
}

// Don't start animation automatically - wait for click
// Initial render with black screen (maxIterations = 1 will show mostly black anyway, but overlay covers it)
render();
