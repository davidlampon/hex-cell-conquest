export class UIController {
    constructor() {
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.slowBtn = document.getElementById('slowBtn');
        this.normalBtn = document.getElementById('normalBtn');
        this.fastBtn = document.getElementById('fastBtn');

        this.orangePercent = document.getElementById('orange-percent');
        this.grayPercent = document.getElementById('gray-percent');
        this.bluePercent = document.getElementById('blue-percent');

        this.isPaused = false;
        this.gameSpeed = 1.0; // 0.5, 1.0, or 2.0

        this.onPause = null;
        this.onReset = null;
        this.onSpeedChange = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.pauseBtn.addEventListener('click', () => {
            this.togglePause();
        });

        this.resetBtn.addEventListener('click', () => {
            if (this.onReset) this.onReset();
        });

        this.slowBtn.addEventListener('click', () => {
            this.setSpeed(0.5);
        });

        this.normalBtn.addEventListener('click', () => {
            this.setSpeed(1.0);
        });

        this.fastBtn.addEventListener('click', () => {
            this.setSpeed(2.0);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePause();
            } else if (e.code === 'KeyR') {
                if (this.onReset) this.onReset();
            } else if (e.code === 'Digit1') {
                this.setSpeed(0.5);
            } else if (e.code === 'Digit2') {
                this.setSpeed(1.0);
            } else if (e.code === 'Digit3') {
                this.setSpeed(2.0);
            }
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
        if (this.onPause) this.onPause(this.isPaused);
    }

    setSpeed(speed) {
        this.gameSpeed = speed;

        // Update button states
        this.slowBtn.classList.remove('active');
        this.normalBtn.classList.remove('active');
        this.fastBtn.classList.remove('active');

        if (speed === 0.5) this.slowBtn.classList.add('active');
        else if (speed === 1.0) this.normalBtn.classList.add('active');
        else if (speed === 2.0) this.fastBtn.classList.add('active');

        if (this.onSpeedChange) this.onSpeedChange(speed);
    }

    updateTerritoryStats(percentages) {
        this.orangePercent.textContent = `${percentages[0]}%`;
        this.grayPercent.textContent = `${percentages[1]}%`;
        this.bluePercent.textContent = `${percentages[2]}%`;

        // Highlight the leader
        const maxPercent = Math.max(...percentages);

        document.getElementById('stat-orange').style.transform =
            percentages[0] === maxPercent ? 'scale(1.1)' : 'scale(1)';
        document.getElementById('stat-gray').style.transform =
            percentages[1] === maxPercent ? 'scale(1.1)' : 'scale(1)';
        document.getElementById('stat-blue').style.transform =
            percentages[2] === maxPercent ? 'scale(1.1)' : 'scale(1)';
    }

    reset() {
        this.isPaused = false;
        this.pauseBtn.textContent = 'Pause';
    }
}