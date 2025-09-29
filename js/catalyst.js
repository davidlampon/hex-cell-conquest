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
        this.mode = 'hunt'; // hunt, chase, flee, gang_up
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Death/respawn system
        this.isAlive = true;
        this.respawnTimer = 0;
        this.spawnX = x; // remember spawn position
        this.spawnY = y;

        // Elimination tracking
        this.isEliminated = false;

        // Territory-based stats
        this.territoryPercent = 0.33; // updated from game
        this.speedMultiplier = 1.0;
        this.impactMultiplier = 1.0;

        // Kill streak system
        this.kills = 0;
        this.killStreak = 0;
        this.lastKillTime = 0;
        this.killStreakActive = false;

        // Last Stand system
        this.lastStandMode = false;
        this.lastStandTimer = 0;
    }

    // Predator-Prey chain: Orange > Gray > Cyan > Orange
    getPrey() {
        return (this.color + 1) % 3;
    }

    getPredator() {
        return (this.color + 2) % 3;
    }

    kill() {
        if (!this.isAlive) return;
        this.isAlive = false;

        // Reset kill streak on death
        this.killStreak = 0;
        this.lastKillTime = 0;
        this.killStreakActive = false;

        // Dynamic respawn delay based on territory
        let delay = config.catalyst.respawnDelay;
        if (this.territoryPercent < config.catalyst.weakTerritoryThreshold) {
            // Add extra delay for each 10% territory lost below 30%
            const territoryLoss = (config.catalyst.weakTerritoryThreshold - this.territoryPercent) * 10;
            delay += territoryLoss * (config.catalyst.respawnDelayPerTerritoryLoss / 10);
            delay = Math.min(delay, config.catalyst.maxRespawnDelay);
        }

        this.respawnTimer = Math.floor(delay);
    }

    registerKill(frameCount) {
        this.kills++;

        // Check if this extends a kill streak
        if (frameCount - this.lastKillTime < config.catalyst.killStreakDecayTime) {
            this.killStreak++;
        } else {
            this.killStreak = 1; // Start new streak
        }

        this.lastKillTime = frameCount;
        this.killStreakActive = this.killStreak >= 2;

        return this.killStreak; // Return for announcements
    }

    eliminate() {
        this.isEliminated = true;
        this.isAlive = false;
    }

    updatePowerMultipliers(frameCount) {
        // Base multipliers from territory
        if (this.territoryPercent >= config.catalyst.dominantTerritoryThreshold) {
            this.speedMultiplier = config.catalyst.dominantSpeedBonus;
            this.impactMultiplier = config.catalyst.dominantImpactBonus;
        } else if (this.territoryPercent < config.catalyst.weakTerritoryThreshold) {
            this.speedMultiplier = config.catalyst.weakSpeedPenalty;
            this.impactMultiplier = 1.0;
        } else {
            this.speedMultiplier = 1.0;
            this.impactMultiplier = 1.0;
        }

        // Check for Last Stand mode
        if (!this.lastStandMode && this.territoryPercent < config.catalyst.lastStandThreshold) {
            this.lastStandMode = true;
            this.lastStandTimer = config.catalyst.lastStandDuration;
        }

        // Last Stand bonuses (override territory bonuses)
        if (this.lastStandMode && this.lastStandTimer > 0) {
            this.lastStandTimer--;
            this.speedMultiplier = config.catalyst.lastStandSpeedBonus;
            this.impactMultiplier = config.catalyst.lastStandImpactBonus;

            // Time's up - force elimination
            if (this.lastStandTimer === 0 && this.territoryPercent < config.catalyst.lastStandThreshold) {
                this.eliminate();
            }
        }

        // Kill streak bonuses (stack on top)
        if (this.killStreakActive && frameCount - this.lastKillTime < config.catalyst.killStreakDecayTime) {
            if (this.killStreak >= 2) {
                this.speedMultiplier *= config.catalyst.killStreakSpeedBonus;
            }
            if (this.killStreak >= 3) {
                this.impactMultiplier *= config.catalyst.killStreakSizeBonus;
            }
        } else if (this.killStreakActive) {
            // Streak expired
            this.killStreakActive = false;
            this.killStreak = 0;
        }
    }

    update(catalysts, grid, frameCount) {
        // Handle respawn countdown
        if (!this.isAlive && !this.isEliminated) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return; // Don't update while dead
        }

        // Don't update if eliminated
        if (this.isEliminated) return;

        // Update territory-based power multipliers
        this.updatePowerMultipliers(frameCount);

        let totalForceX = 0;
        let totalForceY = 0;

        // Determine gang up strategy - find weakest catalyst
        const aliveCatalysts = catalysts.filter(c => c.isAlive);
        let weakestCatalyst = null;
        let shouldGangUp = false;

        if (aliveCatalysts.length === 3) {
            // Find the weakest by territory
            weakestCatalyst = aliveCatalysts.reduce((weakest, cat) =>
                cat.territoryPercent < weakest.territoryPercent ? cat : weakest
            );

            // Check if there's significant territory gap (>10%)
            const territoryGap = Math.max(...aliveCatalysts.map(c => c.territoryPercent)) - weakestCatalyst.territoryPercent;
            shouldGangUp = territoryGap > config.catalyst.gangUpThreshold && weakestCatalyst !== this;
        }

        let predator = null;
        let prey = null;
        let minPredatorDist = Infinity;
        let minPreyDist = Infinity;

        // Find nearest predator and prey (only alive ones)
        catalysts.forEach((other) => {
            if (other === this || !other.isAlive) return;

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

        // Check if prey is alive
        const preyAlive = prey ? catalysts.find(c => c.color === this.getPrey() && c.isAlive) : null;

        // Predator-prey behavior
        if (predator && !shouldGangUp) {
            // FLEE from predator (highest priority, unless gang up overrides)
            const dx = this.x - predator.x;
            const dy = this.y - predator.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                const force = config.catalyst.fleeStrength * (1 - dist / config.catalyst.predatorDetectionRange);
                totalForceX += (dx / dist) * force;
                totalForceY += (dy / dist) * force;
            }
            this.mode = 'flee';
        } else if (shouldGangUp && weakestCatalyst) {
            // GANG UP on weakest - target their territory aggressively
            this.mode = 'gang_up';
            // This will be handled in territory targeting below
        } else if (prey && preyAlive) {
            // CHASE prey only if prey is alive
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
            // HUNT for enemy territory (prioritize weaker/dead enemies)
            this.mode = 'hunt';

            // Target acquisition for enemy territory
            if (Math.random() < config.catalyst.targetReacquireChance || this.mode === 'gang_up') {
                let bestTarget = null;
                let bestScore = -1;

                // Check which enemies are dead/weak
                const enemyStatus = [0, 1, 2].map(color => {
                    if (color === this.color) return { alive: true, priority: 0 };
                    const enemy = catalysts.find(c => c.color === color);
                    return {
                        alive: enemy ? enemy.isAlive : false,
                        eliminated: enemy ? enemy.isEliminated : true,
                        priority: enemy && !enemy.isAlive ? 2 : 1 // dead enemies = priority 2
                    };
                });

                for (let attempts = 0; attempts < config.catalyst.targetSearchAttempts; attempts++) {
                    const testRow = Math.floor(Math.random() * grid.rows);
                    const testCol = Math.floor(Math.random() * grid.cols);
                    const cell = grid.getCell(testRow, testCol);

                    if (cell.color !== this.color) {
                        const { x, y } = grid.getHexCenter(testRow, testCol);
                        const dist = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);

                        const neighbors = grid.getNeighbors(testRow, testCol);
                        let enemyCount = 0;
                        let myColorCount = 0;
                        neighbors.forEach(({ row: nRow, col: nCol }) => {
                            const nColor = grid.getCell(nRow, nCol).color;
                            if (nColor !== this.color) enemyCount++;
                            else myColorCount++;
                        });

                        // Boost score for dead enemy territory or weak cell strength
                        let enemyPriority = enemyStatus[cell.color].priority;

                        // Gang up mode: massively prioritize weakest catalyst's territory
                        if (this.mode === 'gang_up' && weakestCatalyst && cell.color === weakestCatalyst.color) {
                            enemyPriority *= 3; // 3x priority for weakest
                        }

                        const weaknessBonus = (config.grid.maxStrength - cell.strength) / config.grid.maxStrength;
                        const borderBonus = myColorCount > 0 ? 1.5 : 1.0; // prefer cells near our territory

                        const score = enemyCount * enemyPriority * (1 + weaknessBonus) * borderBonus * (1 - dist / 1000);
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

        // Speed limiting - hunters get speed boost, territory affects speed
        let maxSpeed = config.catalyst.maxSpeed * this.speedMultiplier;
        if (this.mode === 'chase') {
            maxSpeed *= config.catalyst.hunterSpeedBoost;
        }

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
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

        // Impact on grid - territory affects impact radius
        const impactRadius = config.hex.radius * config.catalyst.impactRadius * this.impactMultiplier;
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

    respawn() {
        this.isAlive = true;
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.vx = Math.random() * 4 - 2;
        this.vy = Math.random() * 4 - 2;
        this.targetX = null;
        this.targetY = null;
    }

    static handleCollisions(catalysts, frameCount) {
        for (let i = 0; i < catalysts.length; i++) {
            for (let j = i + 1; j < catalysts.length; j++) {
                const cat1 = catalysts[i];
                const cat2 = catalysts[j];

                // Skip if either is dead or eliminated
                if (!cat1.isAlive || !cat2.isAlive) continue;

                const dx = cat2.x - cat1.x;
                const dy = cat2.y - cat1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < cat1.radius + cat2.radius + 10) {
                    // Check for lethal collision (hunter kills prey)
                    let killer = null;
                    let victim = null;

                    // Last Stand mode: can kill ANY color
                    if (cat1.lastStandMode && cat1.lastStandTimer > 0) {
                        killer = cat1;
                        victim = cat2;
                    } else if (cat2.lastStandMode && cat2.lastStandTimer > 0) {
                        killer = cat2;
                        victim = cat1;
                    }
                    // Normal predator-prey rules
                    else if (cat1.mode === 'chase' && cat2.color === cat1.getPrey()) {
                        killer = cat1;
                        victim = cat2;
                    } else if (cat2.mode === 'chase' && cat1.color === cat2.getPrey()) {
                        killer = cat2;
                        victim = cat1;
                    }

                    if (killer && victim) {
                        // LETHAL COLLISION - victim dies
                        victim.kill();
                        const killStreak = killer.registerKill(frameCount);
                        return {
                            collided: true,
                            catalyst1: cat1,
                            catalyst2: cat2,
                            lethal: true,
                            killer,
                            victim,
                            killStreak
                        };
                    } else {
                        // Normal elastic collision
                        const angle = Math.atan2(dy, dx);
                        const cos = Math.cos(angle);
                        const sin = Math.sin(angle);

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

                        return {
                            collided: true,
                            catalyst1: cat1,
                            catalyst2: cat2,
                            lethal: false
                        };
                    }
                }
            }
        }
        return { collided: false };
    }
}