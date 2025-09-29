import { config } from './config.js';

export class HexGrid {
    constructor(canvasWidth, canvasHeight) {
        this.hexWidth = config.hex.width;
        this.hexHeight = config.hex.height;
        this.hexRadius = config.hex.radius;

        this.cols = Math.floor(canvasWidth / this.hexWidth) + 2;
        this.rows = Math.floor(canvasHeight / (this.hexHeight * 0.75)) + 2;

        this.grid = [];
        this.initialize();
    }

    initialize() {
        this.grid = [];
        const centerX = this.cols / 2;
        const centerY = this.rows / 2;

        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                // Triangular territory distribution
                // Top third: Orange
                // Bottom-left: Gray
                // Bottom-right: Cyan

                let color;
                const relativeRow = row / this.rows;
                const relativeCol = col / this.cols;

                if (relativeRow < 0.4) {
                    // Top section - Orange
                    color = 0;
                } else if (relativeCol < 0.5) {
                    // Bottom-left - Gray
                    color = 1;
                } else {
                    // Bottom-right - Cyan
                    color = 2;
                }

                this.grid[row][col] = {
                    color: color,
                    targetColor: color, // for smooth transitions
                    colorTransition: 1.0, // 0 to 1, where 1 = fully transitioned
                    strength: config.grid.defaultStrength,
                    lastChanged: 0
                };
            }
        }
    }

    getHexCenter(row, col) {
        const x = col * this.hexWidth + (row % 2) * (this.hexWidth / 2);
        const y = row * (this.hexHeight * 0.75);
        return { x, y };
    }

    getNeighbors(row, col) {
        const isEvenRow = row % 2 === 0;
        const neighbors = [];
        const offsets = isEvenRow
            ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
            : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];

        for (const [dr, dc] of offsets) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
        return neighbors;
    }

    update(frameCount) {
        const newGrid = this.grid.map(row => row.map(cell => ({ ...cell })));

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const neighbors = this.getNeighbors(row, col);
                const counts = [0, 0, 0];

                neighbors.forEach(({ row: nRow, col: nCol }) => {
                    counts[this.grid[nRow][nCol].color]++;
                });

                const currentColor = this.grid[row][col].color;
                const currentStrength = this.grid[row][col].strength;

                let maxCount = 0;
                let dominantColor = currentColor;
                for (let i = 0; i < 3; i++) {
                    if (i !== currentColor && counts[i] > maxCount) {
                        maxCount = counts[i];
                        dominantColor = i;
                    }
                }

                if (maxCount > counts[currentColor]) {
                    newGrid[row][col].strength = Math.max(0, currentStrength - config.grid.strengthDecayRate);
                    if (newGrid[row][col].strength === 0) {
                        newGrid[row][col].color = dominantColor;
                        newGrid[row][col].targetColor = dominantColor;
                        newGrid[row][col].strength = config.grid.defaultStrength;
                        newGrid[row][col].lastChanged = frameCount;
                        newGrid[row][col].colorTransition = 0; // Start transition
                    }
                } else if (counts[currentColor] >= maxCount) {
                    newGrid[row][col].strength = Math.min(config.grid.maxStrength, currentStrength + config.grid.strengthGrowthRate);
                }

                // Update color transition
                if (newGrid[row][col].colorTransition < 1.0) {
                    newGrid[row][col].colorTransition = Math.min(1.0,
                        newGrid[row][col].colorTransition + config.animation.colorTransitionSpeed);
                }
            }
        }

        // Copy back to main grid
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = newGrid[row][col];
            }
        }
    }

    setCell(row, col, color, strength, frameCount) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.grid[row][col].color = color;
            this.grid[row][col].targetColor = color;
            this.grid[row][col].strength = strength;
            this.grid[row][col].lastChanged = frameCount;
            this.grid[row][col].colorTransition = 0;
        }
    }

    getCell(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.grid[row][col];
        }
        return null;
    }

    getTerritoryStats() {
        const counts = [0, 0, 0];
        let total = 0;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                counts[this.grid[row][col].color]++;
                total++;
            }
        }

        return {
            counts,
            percentages: counts.map(c => Math.round((c / total) * 100))
        };
    }
}