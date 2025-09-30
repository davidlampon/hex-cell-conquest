export class UIController {
    constructor() {
        // Control buttons
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.slowBtn = document.getElementById('slowBtn');
        this.normalBtn = document.getElementById('normalBtn');
        this.fastBtn = document.getElementById('fastBtn');
        this.audioBtn = document.getElementById('audioBtn');
        this.infoBtn = document.getElementById('infoBtn');

        // Modal
        this.infoModal = document.getElementById('infoModal');
        this.closeModalBtn = document.getElementById('closeModal');

        // Territory stats
        this.statOrange = document.getElementById('stat-orange');
        this.statGray = document.getElementById('stat-gray');
        this.statBlue = document.getElementById('stat-blue');
        this.orangePercent = document.getElementById('orange-percent');
        this.grayPercent = document.getElementById('gray-percent');
        this.bluePercent = document.getElementById('blue-percent');

        this.isPaused = false;
        this.gameSpeed = 1.0;

        this.onPause = null;
        this.onReset = null;
        this.onSpeedChange = null;
        this.onAudioToggle = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Pause button
        this.pauseBtn.addEventListener('click', () => {
            this.togglePause();
        });

        // Reset button
        this.resetBtn.addEventListener('click', () => {
            if (this.onReset) this.onReset();
        });

        // Speed buttons
        this.slowBtn.addEventListener('click', () => {
            this.setSpeed(0.5);
        });

        this.normalBtn.addEventListener('click', () => {
            this.setSpeed(1.0);
        });

        this.fastBtn.addEventListener('click', () => {
            this.setSpeed(2.0);
        });

        // Audio button
        this.audioBtn.addEventListener('click', () => {
            this.toggleAudio();
        });

        // Info modal
        this.infoBtn.addEventListener('click', () => {
            this.showModal();
        });

        this.closeModalBtn.addEventListener('click', () => {
            this.hideModal();
        });

        this.infoModal.addEventListener('click', (e) => {
            if (e.target === this.infoModal) {
                this.hideModal();
            }
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
            } else if (e.code === 'KeyM') {
                this.toggleAudio();
            } else if (e.code === 'Escape') {
                this.hideModal();
            }
        });
    }

    showModal() {
        this.infoModal.classList.remove('hidden');
    }

    hideModal() {
        this.infoModal.classList.add('hidden');
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
        if (this.onPause) this.onPause(this.isPaused);
    }

    toggleAudio() {
        if (this.onAudioToggle) {
            const musicEnabled = this.onAudioToggle();
            this.audioBtn.textContent = musicEnabled ? '🔊' : '🔇';
        }
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

        this.statOrange.classList.toggle('leader', percentages[0] === maxPercent);
        this.statGray.classList.toggle('leader', percentages[1] === maxPercent);
        this.statBlue.classList.toggle('leader', percentages[2] === maxPercent);
    }

    reset() {
        this.isPaused = false;
        this.pauseBtn.textContent = 'Pause';
    }
}