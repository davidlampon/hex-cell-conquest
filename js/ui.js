export class UIController {
    constructor(canvas) {
        this.canvas = canvas;
        this.infoBtn = document.getElementById('infoBtn');
        this.infoModal = document.getElementById('infoModal');
        this.closeModalBtn = document.getElementById('closeModal');

        this.isPaused = false;
        this.gameSpeed = 1.0; // 0.5, 1.0, or 2.0

        this.onPause = null;
        this.onReset = null;
        this.onSpeedChange = null;
        this.onButtonClick = null;
        this.onButtonHover = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
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

        // Canvas click for controls
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.onButtonClick) {
                this.onButtonClick(x, y);
            }
        });

        // Canvas hover for button feedback
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.onButtonHover) {
                this.onButtonHover(x, y);
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
        if (this.onPause) this.onPause(this.isPaused);
    }

    setSpeed(speed) {
        this.gameSpeed = speed;
        if (this.onSpeedChange) this.onSpeedChange(speed);
    }

    reset() {
        this.isPaused = false;
    }
}