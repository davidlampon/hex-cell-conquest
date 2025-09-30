export class AudioSystem {
    constructor() {
        this.sfxEnabled = true;
        this.musicEnabled = true;
        this.audioContext = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;

        // Initialize Web Audio API
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            // Master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 1.0;
            this.masterGain.connect(this.audioContext.destination);

            // Separate gain nodes for SFX and music
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = 0.3; // 30% volume for SFX
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = 0.15; // 15% volume for music (quieter)
            this.musicGain.connect(this.masterGain);

            // Music player
            this.musicPlayer = new MusicPlayer(this.audioContext, this.musicGain);

            // Load preferences from localStorage
            const savedSfx = localStorage.getItem('sfxEnabled');
            const savedMusic = localStorage.getItem('musicEnabled');
            if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';
            if (savedMusic !== null) this.musicEnabled = savedMusic === 'true';

            // Start music if enabled
            if (this.musicEnabled) {
                this.musicPlayer.start();
            }
        } catch (e) {
            console.warn('Web Audio API not supported', e);
            this.sfxEnabled = false;
            this.musicEnabled = false;
        }
    }

    // Play a simple beep tone
    playTone(frequency, duration, type = 'sine') {
        if (!this.sfxEnabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Kill sound - descending tone
    playKillSound() {
        if (!this.sfxEnabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);

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
        if (!this.sfxEnabled || !this.audioContext) return;

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
        gainNode.connect(this.sfxGain);

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
        if (!this.sfxEnabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);

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

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        localStorage.setItem('sfxEnabled', this.sfxEnabled);
        return this.sfxEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('musicEnabled', this.musicEnabled);

        if (this.musicPlayer) {
            if (this.musicEnabled) {
                this.musicPlayer.start();
            } else {
                this.musicPlayer.stop();
            }
        }

        return this.musicEnabled;
    }

    setMusicState(state) {
        if (this.musicPlayer && this.musicEnabled) {
            this.musicPlayer.setState(state);
        }
    }
}

// Music Player - Chiptune style background music
class MusicPlayer {
    constructor(audioContext, gainNode) {
        this.ctx = audioContext;
        this.gainNode = gainNode;
        this.isPlaying = false;
        this.currentState = 'calm'; // calm, intense, laststand, victory
        this.tempo = 140; // BPM
        this.beatDuration = 60 / this.tempo; // seconds per beat

        // Note frequencies (A minor scale + chromatics)
        this.notes = {
            'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00,
            'B3': 246.94, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
            'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25,
            'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00
        };

        // Chord progressions for different states
        this.chords = {
            calm: [
                ['A3', 'C4', 'E4'],  // Am
                ['F3', 'A3', 'C4'],  // F
                ['C4', 'E4', 'G4'],  // C
                ['G3', 'B3', 'D4']   // G
            ],
            intense: [
                ['A3', 'C4', 'E4'],  // Am
                ['G3', 'B3', 'D4'],  // G
                ['F3', 'A3', 'C4'],  // F
                ['E3', 'G#3', 'B3']  // E (dramatic)
            ],
            laststand: [
                ['A3', 'C4', 'E4'],  // Am
                ['E3', 'G#3', 'B3'], // E
                ['F3', 'A3', 'C4'],  // F
                ['A3', 'C4', 'E4']   // Am
            ],
            victory: [
                ['C4', 'E4', 'G4'],  // C (major - triumphant)
                ['G3', 'B3', 'D4'],  // G
                ['F3', 'A3', 'C4'],  // F
                ['C4', 'E4', 'G4']   // C
            ]
        };

        // Melodies for different states
        this.melodies = {
            calm: ['E4', 'C4', 'D4', 'E4', 'A3', 'C4', 'D4', 'E4'],
            intense: ['A4', 'E4', 'G4', 'A4', 'C5', 'B4', 'A4', 'G4'],
            laststand: ['A4', 'A4', 'G#4', 'A4', 'E5', 'D5', 'C5', 'B4'],
            victory: ['C5', 'E5', 'G5', 'E5', 'C5', 'G4', 'C5', 'E5']
        };

        this.oscillators = [];
        this.nextNoteTime = 0;
        this.currentBeat = 0;
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.nextNoteTime = this.ctx.currentTime;
        this.scheduleNotes();
    }

    stop() {
        this.isPlaying = false;
        // Stop all oscillators
        this.oscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // Already stopped
            }
        });
        this.oscillators = [];
    }

    setState(state) {
        if (this.currentState !== state) {
            this.currentState = state;
            this.currentBeat = 0; // Reset to sync with new progression
        }
    }

    scheduleNotes() {
        if (!this.isPlaying) return;

        const now = this.ctx.currentTime;
        const lookAhead = 0.1; // Schedule 100ms ahead

        while (this.nextNoteTime < now + lookAhead) {
            this.playNote(this.nextNoteTime);
            this.nextNoteTime += this.beatDuration / 2; // 8th notes
            this.currentBeat++;
        }

        // Schedule next batch
        setTimeout(() => this.scheduleNotes(), 25);
    }

    playNote(time) {
        const chordProgression = this.chords[this.currentState];
        const melody = this.melodies[this.currentState];

        const chordIndex = Math.floor(this.currentBeat / 8) % chordProgression.length;
        const melodyIndex = this.currentBeat % melody.length;

        // Bass note (every 4 beats)
        if (this.currentBeat % 4 === 0) {
            const chord = chordProgression[chordIndex];
            this.playToneAt(this.notes[chord[0]] / 2, time, 0.4, 0.1, 'square');
        }

        // Melody (every 2 beats)
        if (this.currentBeat % 2 === 0) {
            const note = melody[melodyIndex];
            this.playToneAt(this.notes[note], time, 0.3, 0.05, 'square');
        }

        // Arpeggio (every beat in intense modes)
        if (this.currentState !== 'calm') {
            const chord = chordProgression[chordIndex];
            const arpeggioIndex = this.currentBeat % chord.length;
            this.playToneAt(this.notes[chord[arpeggioIndex]], time, 0.15, 0.02, 'triangle');
        }
    }

    playToneAt(frequency, startTime, gain, duration, type = 'square') {
        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.gainNode);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(gain, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);

        this.oscillators.push(oscillator);

        // Clean up old oscillators
        if (this.oscillators.length > 50) {
            this.oscillators = this.oscillators.slice(-25);
        }
    }
}