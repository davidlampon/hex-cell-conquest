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

            // Draw alive catalyst normally
            // Draw glow effect
            this.ctx.beginPath();
            this.ctx.arc(cat.x, cat.y, cat.radius * 2.5, 0, Math.PI * 2);
            const gradient = this.ctx.createRadialGradient(cat.x, cat.y, 0, cat.x, cat.y, cat.radius * 2.5);
            const glowColor = config.colors[cat.color].light;
            const r = parseInt(glowColor.slice(1, 3), 16);
            const g = parseInt(glowColor.slice(3, 5), 16);
            const b = parseInt(glowColor.slice(5, 7), 16);
            gradient.addColorStop(0, `rgba(${r},${g},${b},0.4)`);
            gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Draw catalyst body
            this.ctx.beginPath();
            this.ctx.arc(cat.x, cat.y, cat.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = config.colors[cat.color].light;
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw mode symbol
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            if (cat.mode === 'flee') {
                // Fleeing: scared face or retreat arrow
                this.ctx.fillText('⚠', cat.x, cat.y);
            } else if (cat.mode === 'chase') {
                // Chasing: aggressive symbol
                this.ctx.fillText('⚔', cat.x, cat.y);
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

    render(grid, catalysts) {
        this.clear();
        this.drawGrid(grid);
        this.updateAndDrawParticles();
        this.drawCatalysts(catalysts);
    }
}