import { config } from './config.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
    }

    clear() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid(grid) {
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const { x, y } = grid.getHexCenter(row, col);
                const cell = grid.getCell(row, col);
                this.drawHex(x, y, cell.color, cell.strength, cell.colorTransition);
            }
        }
    }

    drawHex(x, y, colorIdx, strength, transition = 1.0) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const hx = x + config.hex.radius * Math.cos(angle);
            const hy = y + config.hex.radius * Math.sin(angle);
            if (i === 0) this.ctx.moveTo(hx, hy);
            else this.ctx.lineTo(hx, hy);
        }
        this.ctx.closePath();

        // Smooth color transition effect
        const intensity = 0.5 + (strength / 5) * 0.5;
        const colorPalette = config.colors[colorIdx];
        let fillColor = strength > 3 ? colorPalette.dark : colorPalette.light;

        // Apply transition effect (pulsing during color change)
        if (transition < 1.0) {
            const pulseIntensity = 1.0 - transition;
            this.ctx.globalAlpha = intensity * (0.7 + pulseIntensity * 0.3);
        } else {
            this.ctx.globalAlpha = intensity;
        }

        this.ctx.fillStyle = fillColor;
        this.ctx.fill();
        this.ctx.globalAlpha = 1;

        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    drawCatalysts(catalysts) {
        catalysts.forEach(cat => {
            // Skip eliminated catalysts completely
            if (cat.isEliminated) return;

            // Handle dead but not eliminated catalysts (respawning)
            if (!cat.isAlive) {
                // Draw faint ghost at spawn location
                const respawnProgress = 1 - (cat.respawnTimer / config.catalyst.respawnDelay);
                const alpha = 0.2 + respawnProgress * 0.3;

                this.ctx.globalAlpha = alpha;
                this.ctx.beginPath();
                this.ctx.arc(cat.spawnX, cat.spawnY, cat.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = config.colors[cat.color].light;
                this.ctx.fill();
                this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                this.ctx.globalAlpha = 1;

                // Draw respawn timer
                this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                const seconds = Math.ceil(cat.respawnTimer / 60);
                this.ctx.fillText(seconds + 's', cat.spawnX, cat.spawnY);
                return;
            }

            // Calculate visual size based on kill streak, power, and evolution
            const evolutionBonus = config.evolution.stages[cat.evolutionStage].sizeBonus;
            const visualRadius = cat.radius * cat.impactMultiplier * evolutionBonus;

            // Last Stand mode: RED pulsing aura
            if (cat.lastStandMode && cat.lastStandTimer > 0) {
                const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 100);
                this.ctx.beginPath();
                this.ctx.arc(cat.x, cat.y, visualRadius * 3, 0, Math.PI * 2);
                const gradient = this.ctx.createRadialGradient(cat.x, cat.y, 0, cat.x, cat.y, visualRadius * 3);
                gradient.addColorStop(0, `rgba(255,0,0,${0.6 * pulse})`);
                gradient.addColorStop(1, `rgba(255,0,0,0)`);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
            // Kill streak: enhanced glow
            else if (cat.killStreakActive) {
                const streakIntensity = Math.min(cat.killStreak / 4, 1);
                this.ctx.beginPath();
                this.ctx.arc(cat.x, cat.y, visualRadius * 3, 0, Math.PI * 2);
                const gradient = this.ctx.createRadialGradient(cat.x, cat.y, 0, cat.x, cat.y, visualRadius * 3);
                const glowColor = config.colors[cat.color].light;
                const r = parseInt(glowColor.slice(1, 3), 16);
                const g = parseInt(glowColor.slice(3, 5), 16);
                const b = parseInt(glowColor.slice(5, 7), 16);
                gradient.addColorStop(0, `rgba(${r},${g},${b},${0.6 * streakIntensity})`);
                gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
            // Normal glow
            else {
                this.ctx.beginPath();
                this.ctx.arc(cat.x, cat.y, visualRadius * 2.5, 0, Math.PI * 2);
                const gradient = this.ctx.createRadialGradient(cat.x, cat.y, 0, cat.x, cat.y, visualRadius * 2.5);
                const glowColor = config.colors[cat.color].light;
                const r = parseInt(glowColor.slice(1, 3), 16);
                const g = parseInt(glowColor.slice(3, 5), 16);
                const b = parseInt(glowColor.slice(5, 7), 16);
                gradient.addColorStop(0, `rgba(${r},${g},${b},0.4)`);
                gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }

            // Draw catalyst body (size based on power and evolution)
            this.ctx.beginPath();
            this.ctx.arc(cat.x, cat.y, visualRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = config.colors[cat.color].light;
            this.ctx.fill();

            // Shield visual effect
            if (cat.hasShield && cat.shieldTimer > 0) {
                const shieldPulse = 0.7 + 0.3 * Math.sin(Date.now() / 150);
                this.ctx.beginPath();
                this.ctx.arc(cat.x, cat.y, visualRadius + 6, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${shieldPulse})`;
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }

            // Last Stand: Red pulsing border
            if (cat.lastStandMode && cat.lastStandTimer > 0) {
                this.ctx.strokeStyle = '#FF0000';
                this.ctx.lineWidth = 4;
            } else {
                this.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                this.ctx.lineWidth = 2;
            }
            this.ctx.stroke();

            // Draw evolution icon (if high stage) or mode symbol
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            const evolutionIcon = config.evolution.stages[cat.evolutionStage].icon;
            if (evolutionIcon) {
                // High evolution stage: show crown or star
                this.ctx.fillText(evolutionIcon, cat.x, cat.y);
            } else if (cat.mode === 'flee') {
                // Fleeing: scared face or retreat arrow
                this.ctx.fillText('⚠', cat.x, cat.y);
            } else if (cat.mode === 'chase') {
                // Chasing: aggressive symbol
                this.ctx.fillText('⚔', cat.x, cat.y);
            } else if (cat.mode === 'gang_up') {
                // Gang up: double swords (alliance attack)
                this.ctx.fillText('⚔⚔', cat.x, cat.y);
            } else {
                // Hunting: target symbol
                this.ctx.fillText('◎', cat.x, cat.y);
            }
        });
    }

    createCollisionParticles(x, y, color1, color2) {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: i % 2 === 0 ? color1 : color2,
                life: 1.0,
                size: 2 + Math.random() * 3
            });
        }
    }

    createDeathParticles(x, y, color) {
        const particleCount = 40;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 3 + Math.random() * 5;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                life: 1.5,
                size: 3 + Math.random() * 4
            });
        }
    }

    createNukeParticles(x, y, color) {
        const particleCount = 80;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 5 + Math.random() * 10;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                life: 2.0,
                size: 5 + Math.random() * 6
            });
        }
    }

    createResurrectionParticles(x, y, color) {
        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 4 + Math.random() * 6;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed * -1, // Converge inward
                vy: Math.sin(angle) * speed * -1,
                color: color,
                life: 1.2,
                size: 4 + Math.random() * 5
            });
        }
    }

    drawPowerups(powerups) {
        powerups.forEach(powerup => {
            if (!powerup.active) return;

            const powerupConfig = config.powerups.types[powerup.type];
            const alpha = powerup.life < 120 ? powerup.life / 120 : 1.0; // Fade when expiring

            // Pulsing glow
            const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 200);
            this.ctx.globalAlpha = alpha * pulse;

            // Outer glow
            this.ctx.beginPath();
            this.ctx.arc(powerup.x, powerup.y, config.powerups.zoneRadius, 0, Math.PI * 2);
            const gradient = this.ctx.createRadialGradient(
                powerup.x, powerup.y, 0,
                powerup.x, powerup.y, config.powerups.zoneRadius
            );
            gradient.addColorStop(0, powerupConfig.color + 'AA');
            gradient.addColorStop(1, powerupConfig.color + '00');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            this.ctx.globalAlpha = alpha;

            // Inner hexagon
            this.ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 6;
                const radius = 15 + 3 * Math.sin(Date.now() / 300 + i);
                const hx = powerup.x + radius * Math.cos(angle);
                const hy = powerup.y + radius * Math.sin(angle);
                if (i === 0) this.ctx.moveTo(hx, hy);
                else this.ctx.lineTo(hx, hy);
            }
            this.ctx.closePath();
            this.ctx.fillStyle = powerupConfig.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Icon
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            let icon = '';
            if (powerup.type === 'shield') icon = '🛡';
            else if (powerup.type === 'speed') icon = '⚡';
            else if (powerup.type === 'nuke') icon = '💣';
            else if (powerup.type === 'resurrection') icon = '✨';

            this.ctx.fillText(icon, powerup.x, powerup.y);

            this.ctx.globalAlpha = 1;
        });
    }

    updateAndDrawParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= 0.02;

            if (p.life > 0) {
                this.ctx.globalAlpha = p.life;
                this.ctx.fillStyle = config.colors[p.color].light;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
                return true;
            }
            return false;
        });
    }

    drawAnnouncements(announcements) {
        announcements.forEach((announcement, index) => {
            announcement.life--;

            if (announcement.life > 0) {
                // Fade in/out
                let alpha = 1.0;
                if (announcement.life < 30) alpha = announcement.life / 30;
                if (announcement.life > 150) alpha = (180 - announcement.life) / 30;

                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = config.colors[announcement.color].light;
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 4;
                this.ctx.font = 'bold 48px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                const y = announcement.y + index * 60;
                this.ctx.strokeText(announcement.text, this.canvas.width / 2, y);
                this.ctx.fillText(announcement.text, this.canvas.width / 2, y);
                this.ctx.globalAlpha = 1;
            }
        });

        // Remove expired announcements
        for (let i = announcements.length - 1; i >= 0; i--) {
            if (announcements[i].life <= 0) {
                announcements.splice(i, 1);
            }
        }
    }

    render(grid, catalysts, announcements = [], powerups = []) {
        this.clear();
        this.drawGrid(grid);
        this.drawPowerups(powerups);
        this.updateAndDrawParticles();
        this.drawCatalysts(catalysts);
        this.drawAnnouncements(announcements);
    }
}