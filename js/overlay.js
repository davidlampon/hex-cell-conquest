import { config } from './config.js';

export class OverlayRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.territoryStats = { percentages: [33, 33, 33] };
        this.isPaused = false;
        this.gameSpeed = 1.0;
        this.controlsHovered = null;
    }

    updateStats(stats) {
        this.territoryStats = stats;
    }

    updatePauseState(isPaused) {
        this.isPaused = isPaused;
    }

    updateSpeed(speed) {
        this.gameSpeed = speed;
    }

    drawStatsBar() {
        const barHeight = 50;
        const padding = 20;

        // Semi-transparent background
        this.ctx.fillStyle = 'rgba(26, 26, 26, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, barHeight);

        // Draw territory percentages
        const barWidth = 200;
        const barX = padding;
        const barY = 15;
        const barSegmentHeight = 20;

        // Calculate widths based on percentages
        const total = this.territoryStats.percentages.reduce((a, b) => a + b, 0);
        const widths = this.territoryStats.percentages.map(p => (p / total) * barWidth);

        let currentX = barX;
        this.territoryStats.percentages.forEach((percent, i) => {
            const width = widths[i];

            // Draw colored segment
            this.ctx.fillStyle = config.colors[i].light;
            this.ctx.fillRect(currentX, barY, width, barSegmentHeight);

            // Draw percentage text if segment is wide enough
            if (width > 40) {
                this.ctx.fillStyle = '#000';
                this.ctx.font = 'bold 12px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(`${percent}%`, currentX + width / 2, barY + barSegmentHeight / 2);
            }

            currentX += width;
        });

        // Draw border around bar
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barSegmentHeight);
    }

    drawControls() {
        const padding = 20;
        const controlsY = this.canvas.height - 60;
        const buttonWidth = 70;
        const buttonHeight = 36;
        const gap = 10;

        // Semi-transparent background panel
        const panelWidth = buttonWidth * 4 + gap * 3 + padding * 2;
        const panelHeight = buttonHeight + padding * 2;
        const panelX = padding;
        const panelY = controlsY - padding;

        this.ctx.fillStyle = 'rgba(26, 26, 26, 0.85)';
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

        // Draw buttons
        const buttons = [
            { label: this.isPaused ? 'Resume' : 'Pause', key: 'pause' },
            { label: 'Reset', key: 'reset' },
            { label: '0.5x', key: 'slow', active: this.gameSpeed === 0.5 },
            { label: '1x', key: 'normal', active: this.gameSpeed === 1.0 },
            { label: '2x', key: 'fast', active: this.gameSpeed === 2.0 }
        ];

        buttons.forEach((btn, i) => {
            const x = padding + i * (buttonWidth + gap);
            const y = controlsY;

            // Button background
            if (btn.active) {
                this.ctx.fillStyle = '#4ECDC4';
            } else if (this.controlsHovered === btn.key) {
                this.ctx.fillStyle = 'rgba(78, 205, 196, 0.6)';
            } else {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            }

            this.ctx.fillRect(x, y, buttonWidth, buttonHeight);

            // Button border
            this.ctx.strokeStyle = btn.active ? '#4ECDC4' : 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, buttonWidth, buttonHeight);

            // Button text
            this.ctx.fillStyle = btn.active ? '#000' : '#fff';
            this.ctx.font = 'bold 14px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(btn.label, x + buttonWidth / 2, y + buttonHeight / 2);

            // Store button bounds for click detection
            btn.bounds = { x, y, width: buttonWidth, height: buttonHeight };
        });

        this.buttons = buttons;
    }

    getButtonAt(x, y) {
        if (!this.buttons) return null;

        for (const btn of this.buttons) {
            if (x >= btn.bounds.x && x <= btn.bounds.x + btn.bounds.width &&
                y >= btn.bounds.y && y <= btn.bounds.y + btn.bounds.height) {
                return btn.key;
            }
        }
        return null;
    }

    setHoveredButton(key) {
        this.controlsHovered = key;
    }

    render() {
        this.drawStatsBar();
        this.drawControls();
    }
}