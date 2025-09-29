import { config } from './config.js';

export class Catalyst {
    constructor(x, y, vx, vy, color, canvasWidth, canvasHeight) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.radius = config.catalyst.radius;
        this.targetX = null;
        this.targetY = null;
        this.mode = 'hunt'; // hunt, chase, flee
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    // Predator-Prey chain: Orange > Gray > Cyan > Orange
    getPrey() {
        return (this.color + 1) % 3;
    }

    getPredator() {
        return (this.color + 2) % 3;
    }

    update(catalysts, grid, frameCount) {
        let totalForceX = 0;
        let totalForceY = 0;

        let predator = null;
        let prey = null;
        let minPredatorDist = Infinity;
        let minPreyDist = Infinity;

        // Find nearest predator and prey
        catalysts.forEach((other) => {
            if (other === this) return;

            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Check if this is my predator
            if (other.color === this.getPredator() && dist < config.catalyst.predatorDetectionRange) {
                if (dist < minPredatorDist) {
                    minPredatorDist = dist;
                    predator = other;
                }
            }

            // Check if this is my prey
            if (other.color === this.getPrey() && dist < config.catalyst.preyDetectionRange) {
                if (dist < minPreyDist) {
                    minPreyDist = dist;
                    prey = other;
                }
            }
        });

        // Predator-prey behavior
        if (predator) {
            // FLEE from predator (highest priority)
            const dx = this.x - predator.x;
            const dy = this.y - predator.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                const force = config.catalyst.fleeStrength * (1 - dist / config.catalyst.predatorDetectionRange);
                totalForceX += (dx / dist) * force;
                totalForceY += (dy / dist) * force;
            }
            this.mode = 'flee';
        } else if (prey) {
            // CHASE prey
            const dx = prey.x - this.x;
            const dy = prey.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                const force = config.catalyst.chaseStrength;
                totalForceX += (dx / dist) * force;
                totalForceY += (dy / dist) * force;
            }
            this.mode = 'chase';
        } else {
            // HUNT for enemy territory
            this.mode = 'hunt';

            // Target acquisition for enemy territory
            if (Math.random() < config.catalyst.targetReacquireChance) {
                let bestTarget = null;
                let bestScore = -1;

                for (let attempts = 0; attempts < config.catalyst.targetSearchAttempts; attempts++) {
                    const testRow = Math.floor(Math.random() * grid.rows);
                    const testCol = Math.floor(Math.random() * grid.cols);

                    if (grid.getCell(testRow, testCol).color !== this.color) {
                        const { x, y } = grid.getHexCenter(testRow, testCol);
                        const dist = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);

                        const neighbors = grid.getNeighbors(testRow, testCol);
                        let enemyCount = 0;
                        neighbors.forEach(({ row: nRow, col: nCol }) => {
                            if (grid.getCell(nRow, nCol).color !== this.color) enemyCount++;
                        });

                        const score = enemyCount * (1 - dist / 1000);
                        if (score > bestScore) {
                            bestScore = score;
                            bestTarget = { x, y };
                        }
                    }
                }

                if (bestTarget) {
                    this.targetX = bestTarget.x;
                    this.targetY = bestTarget.y;
                }
            }

            // Target steering
            if (this.targetX && this.targetY) {
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 50) {
                    totalForceX += (dx / dist) * config.catalyst.territorySeekStrength;
                    totalForceY += (dy / dist) * config.catalyst.territorySeekStrength;
                } else {
                    this.targetX = null;
                    this.targetY = null;
                }
            }
        }

        // Apply forces
        this.vx += totalForceX;
        this.vy += totalForceY;

        // Speed limiting
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > config.catalyst.maxSpeed) {
            this.vx = (this.vx / speed) * config.catalyst.maxSpeed;
            this.vy = (this.vy / speed) * config.catalyst.maxSpeed;
        }

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Boundary collisions
        if (this.x < this.radius || this.x > this.canvasWidth - this.radius) {
            this.vx *= -0.9;
            this.x = Math.max(this.radius, Math.min(this.canvasWidth - this.radius, this.x));
        }
        if (this.y < this.radius || this.y > this.canvasHeight - this.radius) {
            this.vy *= -0.9;
            this.y = Math.max(this.radius, Math.min(this.canvasHeight - this.radius, this.y));
        }

        // Impact on grid
        const impactRadius = config.hex.radius * config.catalyst.impactRadius;
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const { x, y } = grid.getHexCenter(row, col);
                const dx = x - this.x;
                const dy = y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < impactRadius) {
                    grid.setCell(row, col, this.color, config.grid.maxStrength, frameCount);
                }
            }
        }
    }

    static handleCollisions(catalysts) {
        for (let i = 0; i < catalysts.length; i++) {
            for (let j = i + 1; j < catalysts.length; j++) {
                const cat1 = catalysts[i];
                const cat2 = catalysts[j];

                const dx = cat2.x - cat1.x;
                const dy = cat2.y - cat1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < cat1.radius + cat2.radius + 10) {
                    const angle = Math.atan2(dy, dx);
                    const cos = Math.cos(angle);
                    const sin = Math.sin(angle);

                    // Elastic collision with energy boost
                    const v1 = cat1.vx * cos + cat1.vy * sin;
                    const v2 = cat2.vx * cos + cat2.vy * sin;

                    const u1 = v2 * 1.1;
                    const u2 = v1 * 1.1;

                    cat1.vx += (u1 - v1) * cos;
                    cat1.vy += (u1 - v1) * sin;
                    cat2.vx += (u2 - v2) * cos;
                    cat2.vy += (u2 - v2) * sin;

                    // Separate overlapping catalysts
                    const overlap = (cat1.radius + cat2.radius + 10 - dist);
                    const pushForce = 2;
                    cat1.x -= overlap * cos * pushForce;
                    cat1.y -= overlap * sin * pushForce;
                    cat2.x += overlap * cos * pushForce;
                    cat2.y += overlap * sin * pushForce;

                    return { collided: true, catalyst1: cat1, catalyst2: cat2 };
                }
            }
        }
        return { collided: false };
    }
}