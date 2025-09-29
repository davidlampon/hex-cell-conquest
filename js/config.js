// Game configuration and constants
export const config = {
    canvas: {
        width: 1200,
        height: 800
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
        maxSpeed: 4.5,
        hunterSpeedBoost: 1.4, // hunters are 40% faster
        impactRadius: 2.5, // multiplier of hex radius
        chaseStrength: 0.15, // strength when chasing prey
        fleeStrength: 0.20, // strength when fleeing from predator
        territorySeekStrength: 0.05, // strength when seeking enemy territory
        targetSearchAttempts: 20,
        targetReacquireChance: 0.03,
        predatorDetectionRange: 300, // distance to detect predator
        preyDetectionRange: 350, // distance to detect prey
        respawnDelay: 300, // frames (5 seconds at 60fps) - base delay
        eliminationThreshold: 0.05, // 5% territory minimum to stay in game
        // Territory-based power scaling
        dominantTerritoryThreshold: 0.40, // 40% territory = dominant
        dominantSpeedBonus: 1.2, // +20% speed when dominant
        dominantImpactBonus: 1.5, // +50% impact radius when dominant
        weakTerritoryThreshold: 0.30, // below 30% = weak
        weakSpeedPenalty: 0.9, // -10% speed when weak
        // Dynamic respawn scaling
        respawnDelayPerTerritoryLoss: 100, // +100 frames per 10% territory lost below 30%
        maxRespawnDelay: 900, // max 15 seconds (at very low territory)
        // Gang up strategy
        gangUpThreshold: 0.10 // gang up when territory difference > 10%
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