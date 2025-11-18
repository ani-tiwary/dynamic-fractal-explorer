// Text Components - React-like component system for text labels
// Define text regions with location and content, and they'll be automatically converted to labels
// Supports multi-line text that gets automatically positioned

// Global variable for text components (loaded before script.js)
var textComponents = [
    // Example: Resume section
    {
        location: {
            x: -0.6618703848759728,
            y: 0.4626902004655562,
            zoom: 6252.914748397133
        },
        content: `about me.
i'm ani.
im passionate about swe, ml, and ds.
outside of work, i like to play chess, run, and blog about music.`,
        style: {
            align: 'left',
            color: '#000000',
            opacity: 1.0,
            lineSpacing: 0.00004  // spacing between lines in fractal units (small for high zoom)
        }
    }
    // Add more text components here
    // Example:
    // {
    //     location: { x: 0, y: 0, zoom: 1.35 },
    //     content: `Line 1
    // Line 2
    // Line 3`,
    //     style: {
    //         align: 'center',
    //         color: '#000000',
    //         opacity: 1.0,
    //         lineSpacing: 0.05
    //     }
    // }
];

// Convert text components to text labels
// This function is called automatically when the page loads
function convertComponentsToLabels() {
    if (typeof textComponents === 'undefined' || !textComponents || textComponents.length === 0) {
        return;
    }
    
    // Ensure textLabels exists
    if (typeof textLabels === 'undefined') {
        window.textLabels = [];
    }
    
    textComponents.forEach(component => {
        const lines = component.content.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return;
        
        const location = component.location;
        const style = component.style || {};
        
        // Default style values
        const align = style.align || 'center';
        const color = style.color || '#000000';
        const opacity = style.opacity !== undefined ? style.opacity : 1.0;
        const lineSpacing = style.lineSpacing !== undefined ? style.lineSpacing : 0.05;
        
        // Calculate starting y position (center the text block)
        const totalHeight = (lines.length - 1) * lineSpacing;
        const startY = location.y + (totalHeight / 2);
        
        // Create a label for each line
        lines.forEach((line, index) => {
            const y = startY - (index * lineSpacing);
            
            textLabels.push({
                text: line.trim(),
                x: location.x,
                y: y,
                zoom: location.zoom,
                color: color,
                opacity: opacity,
                align: align
            });
        });
    });
}

// Auto-convert when this file loads (after text-labels.js)
// This will run after text-labels.js defines textLabels
if (typeof window !== 'undefined') {
    // Use a small delay to ensure text-labels.js has loaded
    setTimeout(convertComponentsToLabels, 10);
}

