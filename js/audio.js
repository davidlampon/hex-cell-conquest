export class AudioSystem {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
        this.masterGain = null;

        // Initialize Web Audio API
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3; // 30% volume
            this.masterGain.connect(this.audioContext.destination);
        } catch (e) {
            console.warn('Web Audio API not supported', e);
            this.enabled = false;
        }
    }

    // Play a simple beep tone
    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Kill sound - descending tone
    playKillSound() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.15);

        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    // Death explosion - noise burst
    playDeathSound() {
        if (!this.enabled || !this.audioContext) return;

        const bufferSize = this.audioContext.sampleRate * 0.3;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 10);
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.masterGain);

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        source.start(this.audioContext.currentTime);
    }

    // Double kill - triumphant chord
    playDoubleKill() {
        this.playTone(523.25, 0.2); // C
        setTimeout(() => this.playTone(659.25, 0.2), 50); // E
    }

    // Triple kill - epic chord
    playTripleKill() {
        this.playTone(523.25, 0.3); // C
        setTimeout(() => this.playTone(659.25, 0.3), 50); // E
        setTimeout(() => this.playTone(783.99, 0.3), 100); // G
    }

    // Dominating - power chord
    playDominating() {
        this.playTone(392, 0.4, 'sawtooth'); // G
        setTimeout(() => this.playTone(523.25, 0.4, 'sawtooth'), 50); // C
        setTimeout(() => this.playTone(659.25, 0.4, 'sawtooth'), 100); // E
    }

    // Last Stand - dramatic low tone
    playLastStand() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(110, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(55, this.audioContext.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    // Collision - quick beep
    playCollision() {
        this.playTone(440, 0.05, 'triangle');
    }

    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}