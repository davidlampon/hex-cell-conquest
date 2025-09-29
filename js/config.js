// Game configuration and constants
export const config = {
    canvas: {
        width: 1000,
        height: 700
    },
    hex: {
        radius: 15,
        get height() { return this.radius * 2; },
        get width() { return Math.sqrt(3) * this.radius; }
    },
    colors: [
        { light: '#FF9B50', dark: '#D96B2A', name: 'Orange' },
        { light: '#E8E8E8', dark: '#B8B8B8', name: 'Gray' },
        { light: '#4ECDC4', dark: '#0B7285', name: 'Cyan' }
    ],
    catalyst: {
        radius: 14,
        maxSpeed: 3.5,
        impactRadius: 2.5, // multiplier of hex radius
        attractionDistance: 250,
        repulsionDistance: 100,
        attractionStrength: 0.05,
        repulsionStrength: 0.3,
        steerStrength: 0.03,
        targetSearchAttempts: 20,
        targetReacquireChance: 0.02
    },
    grid: {
        updateInterval: 5, // frames between grid updates
        strengthDecayRate: 0.25,
        strengthGrowthRate: 0.15,
        defaultStrength: 3,
        maxStrength: 5
    },
    animation: {
        colorTransitionSpeed: 0.1 // for smooth color transitions
    }
};