// Text labels - stored in fractal coordinates (complex plane)
// You can specify either 'fontSize' (in fractal units) or 'zoom' (zoom level for automatic sizing)
// Example with zoom: { text: 'Hello', x: 0, y: 0, zoom: 1.35, color: '#000000' }
// Example with fontSize: { text: 'Hello', x: 0, y: 0, fontSize: 0.15, color: '#000000' }

// Global variable for text labels (loaded before script.js)
var textLabels = [
    {
        text: 'welcome.',
        x: -2.5,  // fractal x coordinate
        y: 0.0,   // fractal y coordinate
        fontSize: 0.15, // base font size in fractal units (will scale with zoom)
        color: '#000000',
        opacity: 0 // Start invisible, will fade in
    }
    // Add more text labels here as needed
];

