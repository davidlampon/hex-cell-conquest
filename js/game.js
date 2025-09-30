import { config } from './config.js';
import { HexGrid } from './grid.js';
import { Catalyst } from './catalyst.js';
import { Renderer } from './renderer.js';
import { UIController } from './ui.js';
import { AudioSystem } from './audio.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.canvas.width = config.canvas.width;
        this.canvas.height = config.canvas.height;

        this.grid = new HexGrid(this.canvas.width, this.canvas.height);
        this.renderer = new Renderer(this.canvas);
        this.ui = new UIController();
        this.audio = new AudioSystem();

        this.catalysts = [];
        this.frameCount = 0;
        this.isPaused = false;
        this.gameSpeed = 1.0;
        this.animationId = null;
        this.lastCollision = null;

        // Announcements system
        this.announcements = [];
        this.lastStandAnnounced = [false, false, false];

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

        this.ui.onAudioToggle = () => {
            return this.audio.toggleMusic();
        };

        // Set initial audio button state
        this.ui.audioBtn.textContent = this.audio.musicEnabled ? '🔊' : '🔇';
    }

    initialize() {
        this.grid.initialize();

        // Initialize three catalysts in horizontal formation
        this.catalysts = [
            new Catalyst(
                this.canvas.width * 0.17,
                this.canvas.height * 0.5,
                2.2,
                1.5,
                0, // Orange
                this.canvas.width,
                this.canvas.height
            ),
            new Catalyst(
                this.canvas.width * 0.5,
                this.canvas.height * 0.5,
                -1.5,
                2.2,
                1, // Gray
                this.canvas.width,
                this.canvas.height
            ),
            new Catalyst(
                this.canvas.width * 0.83,
                this.canvas.height * 0.5,
                -2.2,
                -1.5,
                2, // Cyan
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
        this.announcements = [];
        this.lastStandAnnounced = [false, false, false];
    }

    addAnnouncement(type, color) {
        let text = '';
        if (type === 2) text = 'DOUBLE KILL!';
        else if (type === 3) text = 'TRIPLE KILL!';
        else if (type >= 4) text = 'DOMINATING!';
        else if (type === 'laststand') text = 'LAST STAND!';

        if (text) {
            this.announcements.push({
                text,
                color,
                life: 180, // 3 seconds
                y: 100
            });
        }
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
            const collision = Catalyst.handleCollisions(this.catalysts, this.frameCount);
            if (collision.collided && this.lastCollision !== this.frameCount) {
                this.lastCollision = this.frameCount;
                // Create particle effect at collision point
                const x = (collision.catalyst1.x + collision.catalyst2.x) / 2;
                const y = (collision.catalyst1.y + collision.catalyst2.y) / 2;

                if (collision.lethal) {
                    // Create death particles for lethal collision
                    this.renderer.createDeathParticles(
                        collision.victim.x,
                        collision.victim.y,
                        collision.victim.color
                    );

                    // Audio feedback
                    this.audio.playKillSound();
                    this.audio.playDeathSound();

                    // Kill streak announcements and audio
                    if (collision.killStreak) {
                        this.addAnnouncement(collision.killStreak, collision.killer.color);

                        if (collision.killStreak === 2) {
                            this.audio.playDoubleKill();
                        } else if (collision.killStreak === 3) {
                            this.audio.playTripleKill();
                        } else if (collision.killStreak >= 4) {
                            this.audio.playDominating();
                        }
                    }
                } else {
                    // Regular collision particles
                    this.renderer.createCollisionParticles(
                        x, y,
                        collision.catalyst1.color,
                        collision.catalyst2.color
                    );
                    this.audio.playCollision();
                }
            }

            // Check for Last Stand mode triggers
            this.catalysts.forEach(cat => {
                if (cat.lastStandMode && !this.lastStandAnnounced[cat.color]) {
                    this.addAnnouncement('laststand', cat.color);
                    this.audio.playLastStand();
                    this.lastStandAnnounced[cat.color] = true;
                }
            });

            // Update territory stats every 30 frames
            if (this.frameCount % 30 === 0) {
                const stats = this.grid.getTerritoryStats();
                this.ui.updateTerritoryStats(stats.percentages);

                // Update each catalyst's territory percentage
                this.catalysts.forEach(cat => {
                    cat.territoryPercent = stats.percentages[cat.color] / 100;
                });

                // Update music state based on game situation
                const aliveCatalysts = this.catalysts.filter(c => !c.isEliminated).length;
                const inLastStand = this.catalysts.some(c => c.lastStandMode);
                const maxTerritory = Math.max(...stats.percentages);
                const minTerritory = Math.min(...stats.percentages);

                if (aliveCatalysts === 2) {
                    this.audio.setMusicState('victory');
                } else if (inLastStand) {
                    this.audio.setMusicState('laststand');
                } else if (maxTerritory > 45 || minTerritory < 20) {
                    this.audio.setMusicState('intense');
                } else {
                    this.audio.setMusicState('calm');
                }

                // Check for elimination - if territory drops below threshold (5%)
                stats.percentages.forEach((percent, colorIndex) => {
                    if (percent <= config.catalyst.eliminationThreshold * 100) {
                        // Find catalyst of this color and eliminate it
                        const catalyst = this.catalysts.find(cat => cat.color === colorIndex && !cat.isEliminated);
                        if (catalyst) {
                            catalyst.eliminate();
                            this.renderer.createDeathParticles(
                                catalyst.x,
                                catalyst.y,
                                catalyst.color
                            );
                        }
                    }
                });
            }
        }

        // For slow mode, only update every other frame
        if (this.gameSpeed < 1.0 && this.frameCount % 2 !== 0) {
            return;
        }
    }

    animate() {
        this.update();
        this.renderer.render(this.grid, this.catalysts, this.announcements);
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