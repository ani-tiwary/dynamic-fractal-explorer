// Text labels - stored in fractal coordinates (complex plane)
// You can specify either 'fontSize' (in fractal units) or 'zoom' (zoom level for automatic sizing)
// Example with zoom: { text: 'Hello', x: 0, y: 0, zoom: 1.35, color: '#000000' }
// Example with fontSize: { text: 'Hello', x: 0, y: 0, fontSize: 0.15, color: '#000000' }

// Global variable for text labels (loaded before script.js)
var textLabels = [
    {
        text: 'hello.',
        x: -2.5,  // fractal x coordinate
        y: 0.075,   // fractal y coordinate
        fontSize: 0.15, // base font size in fractal units (will scale with zoom)
        color: '#000000',
        opacity: 0 // Start invisible, will fade in
    },
    {
        text: 'i\'m ani.',
        x: -2.5,  // fractal x coordinate
        y: -0.075,   // fractal y coordinate
        fontSize: 0.15, // base font size in fractal units (will scale with zoom)
        color: '#000000',
        opacity: 0 // Start invisible, will fade in after hello
    },
    {
        text: 'there\'s nothing here',
        x: 94.03027350878932,
        y: 1.9786974147595222,
        zoom: 0.01188424944061417,
        color: '#000000',
        opacity: 1.0
    },
    {
        text: 'i promise',
        x: 3092.0371654706514,
        y: 21.470043264412567,
        zoom: 0.0003719902223602988,
        color: '#000000',
        opacity: 1.0
    }
    // Note: Resume section is now defined in text-components.js
    // Add more text labels here as needed
];

