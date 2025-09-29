import { config } from './config.js';
import { HexGrid } from './grid.js';
import { Catalyst } from './catalyst.js';
import { Renderer } from './renderer.js';
import { UIController } from './ui.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.canvas.width = config.canvas.width;
        this.canvas.height = config.canvas.height;

        this.grid = new HexGrid(this.canvas.width, this.canvas.height);
        this.renderer = new Renderer(this.canvas);
        this.ui = new UIController();

        this.catalysts = [];
        this.frameCount = 0;
        this.isPaused = false;
        this.gameSpeed = 1.0;
        this.animationId = null;
        this.lastCollision = null;

        this.setupEventHandlers();
        this.initialize();
        this.animate();
    }

    setupEventHandlers() {
        this.ui.onPause = (paused) => {
            this.isPaused = paused;
        };

        this.ui.onReset = () => {
            this.reset();
        };

        this.ui.onSpeedChange = (speed) => {
            this.gameSpeed = speed;
        };
    }

    initialize() {
        this.grid.initialize();

        // Initialize three catalysts
        this.catalysts = [
            new Catalyst(
                this.canvas.width * 0.17,
                this.canvas.height * 0.5,
                2.2,
                1.5,
                0,
                this.canvas.width,
                this.canvas.height
            ),
            new Catalyst(
                this.canvas.width * 0.5,
                this.canvas.height * 0.5,
                -1.5,
                2.2,
                1,
                this.canvas.width,
                this.canvas.height
            ),
            new Catalyst(
                this.canvas.width * 0.83,
                this.canvas.height * 0.5,
                -2.2,
                -1.5,
                2,
                this.canvas.width,
                this.canvas.height
            )
        ];

        this.frameCount = 0;
    }

    reset() {
        this.initialize();
        this.ui.reset();
        this.renderer.particles = []; // Clear particles
    }

    update() {
        if (this.isPaused) return;

        // Apply game speed by running multiple updates for fast mode
        const updates = this.gameSpeed >= 1.0 ? Math.floor(this.gameSpeed) : 1;

        for (let i = 0; i < updates; i++) {
            this.frameCount++;

            // Update grid at intervals
            if (this.frameCount % config.grid.updateInterval === 0) {
                this.grid.update(this.frameCount);
            }

            // Update catalysts
            this.catalysts.forEach(cat => {
                cat.update(this.catalysts, this.grid, this.frameCount);
            });

            // Handle catalyst collisions
            const collision = Catalyst.handleCollisions(this.catalysts);
            if (collision.collided && this.lastCollision !== this.frameCount) {
                this.lastCollision = this.frameCount;
                // Create particle effect at collision point
                const x = (collision.catalyst1.x + collision.catalyst2.x) / 2;
                const y = (collision.catalyst1.y + collision.catalyst2.y) / 2;
                this.renderer.createCollisionParticles(
                    x, y,
                    collision.catalyst1.color,
                    collision.catalyst2.color
                );
            }

            // Update territory stats every 30 frames
            if (this.frameCount % 30 === 0) {
                const stats = this.grid.getTerritoryStats();
                this.ui.updateTerritoryStats(stats.percentages);
            }
        }

        // For slow mode, only update every other frame
        if (this.gameSpeed < 1.0 && this.frameCount % 2 !== 0) {
            return;
        }
    }

    animate() {
        this.update();
        this.renderer.render(this.grid, this.catalysts);
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Game();
    });
} else {
    new Game();
}