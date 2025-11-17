// Scene coordinates - stored positions and zoom levels for different scenes
// Each scene has a name, center coordinates (x, y), and zoom level
// You can use these with smoothMoveTo() to navigate to specific locations

// Global variable for scene coordinates (loaded before script.js)
var sceneCoordinates = [
    {
        name: 'pos0',
        centerX: -1.5,
        centerY: 0.0,
        zoom: 1.35
    },
    {
        name: "pos1",
        centerX: -0.6619150588774977,
        centerY: 0.4626763853121446,
        zoom: 6252.914748397133
    }
    // Add more scene coordinates here as needed
    // Example:
    // {
    //     name: 'Deep Zoom Location',
    //     centerX: -0.5,
    //     centerY: 0.5,
    //     zoom: 1000.0
    // }
];

