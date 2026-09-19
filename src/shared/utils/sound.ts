/**
 * Web Audio API Sound Synthesizer for Super Mario Christmas Party Game
 * Generates authentic retro 8-bit sound effects & holiday melodies without external files.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public musicEnabled: boolean = false;
  private musicInterval: number | null = null;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Classic Mario Coin sound (B5 -> E6)
  playCoin() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'square';
    osc2.detune.value = 4;

    // B5 (987.77 Hz) to E6 (1318.51 Hz)
    osc1.frequency.setValueAtTime(987.77, now);
    osc1.frequency.setValueAtTime(1318.51, now + 0.08);

    osc2.frequency.setValueAtTime(987.77, now);
    osc2.frequency.setValueAtTime(1318.51, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  }

  // Star Coin / Big Coins (+10) fanfare
  playStarCoin() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5 to G6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playNote(freq, 0.12, 'triangle', 0.22);
      }, i * 65);
    });
  }

  // Block hit / bump sound
  playBlockHit() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Mushroom 1-Up / Extra Turn
  playPowerUp() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [330, 392, 659, 523, 587, 784];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playNote(freq, 0.1, 'sine', 0.2);
      }, idx * 75);
    });
  }

  // Correct Answer Jingle
  playCorrect() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playNote(freq, 0.18, 'triangle', 0.25);
      }, idx * 90);
    });
  }

  // Wrong Buzz
  playWrong() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(140, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Boo Ghost Laugh / Steal Sound
  playBoo() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.1);
    osc.frequency.linearRampToValueAtTime(500, now + 0.2);
    osc.frequency.linearRampToValueAtTime(900, now + 0.35);
    osc.frequency.linearRampToValueAtTime(350, now + 0.55);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Bowser Revolution / Dramatic Event
  playBowser() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Deep heavy square bass chord
    [65.41, 98.00, 130.81].forEach(f => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.7, now + 0.9);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    });

    // Dramatic descending brass
    setTimeout(() => {
      [220, 207.65, 196, 174.61].forEach((freq, i) => {
        setTimeout(() => {
          this.playNote(freq, 0.25, 'sawtooth', 0.2);
        }, i * 140);
      });
    }, 300);
  }

  // Victory / Superstar Fanfare
  playSuperstar() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Mario Party Superstar fanfare notes
    const fanfare = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 523.25, d: 0.12, t: 120 },
      { f: 523.25, d: 0.12, t: 240 },
      { f: 523.25, d: 0.24, t: 360 },
      { f: 415.30, d: 0.24, t: 520 },
      { f: 466.16, d: 0.24, t: 680 },
      { f: 523.25, d: 0.35, t: 840 },
      { f: 466.16, d: 0.15, t: 1100 },
      { f: 523.25, d: 0.60, t: 1250 },
    ];

    fanfare.forEach(item => {
      setTimeout(() => {
        this.playNote(item.f, item.d, 'triangle', 0.28);
      }, item.t);
    });
  }

  // Blue Shell Warning Siren & Explosion
  playBlueShell() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(1050, now + 0.35);
    osc.frequency.linearRampToValueAtTime(260, now + 0.7);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.75);

    // Blast thud
    setTimeout(() => {
      this.playWrong();
    }, 380);
  }

  // Festive Jingle Bells melody line
  playJingleBells() {
    const ctx = this.getContext();
    if (!ctx) return;

    // E E E, E E E, E G C D E
    const jingle = [
      { f: 659.25, d: 0.18, t: 0 },
      { f: 659.25, d: 0.18, t: 200 },
      { f: 659.25, d: 0.35, t: 400 },
      { f: 659.25, d: 0.18, t: 700 },
      { f: 659.25, d: 0.18, t: 900 },
      { f: 659.25, d: 0.35, t: 1100 },
      { f: 659.25, d: 0.18, t: 1400 },
      { f: 783.99, d: 0.18, t: 1600 },
      { f: 523.25, d: 0.18, t: 1800 },
      { f: 587.33, d: 0.18, t: 2000 },
      { f: 659.25, d: 0.50, t: 2200 },
    ];

    jingle.forEach(item => {
      setTimeout(() => {
        this.playNote(item.f, item.d, 'sine', 0.22);
      }, item.t);
    });
  }

  // Card Flip / Shuffle sound
  playCardFlip() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Special Card Get / Item Fanfare (Fast ascending bright chime & fanfare)
  playSpecialCardFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Fast ascending glissando arpeggio C5 -> G5 -> C6 -> E6 -> G6 -> C7
    const arpeggio = [
      { f: 523.25, d: 0.1, t: 0 },
      { f: 659.25, d: 0.1, t: 70 },
      { f: 783.99, d: 0.1, t: 140 },
      { f: 1046.50, d: 0.15, t: 210 },
      { f: 1318.51, d: 0.18, t: 290 },
      { f: 1567.98, d: 0.22, t: 380 },
      { f: 2093.00, d: 0.50, t: 480 },
    ];

    arpeggio.forEach(item => {
      setTimeout(() => {
        this.playNote(item.f, item.d, 'triangle', 0.28);
      }, item.t);
    });

    // Layer with subtle sparkling coin harmonizer
    setTimeout(() => {
      this.playCoin();
    }, 490);
  }

  // Generic UI Click (short percussive snap)
  playClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Soft Pop (for tiny interactions, letters, toggles)
  playPop() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Summer Edition Theme Switch: Warm tropical sunny marimba arpeggio & ocean breeze shimmer
  playSummerTheme() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Upbeat tropical pentatonic flourish: F4, A4, C5, F5, G5, C6
    const notes = [
      { f: 349.23, d: 0.14, t: 0, v: 0.22 },     // F4
      { f: 440.00, d: 0.14, t: 75, v: 0.22 },    // A4
      { f: 523.25, d: 0.14, t: 150, v: 0.24 },   // C5
      { f: 698.46, d: 0.16, t: 225, v: 0.25 },   // F5
      { f: 783.99, d: 0.18, t: 300, v: 0.26 },   // G5
      { f: 1046.50, d: 0.45, t: 380, v: 0.30 },  // C6 (resonant bright finish)
    ];

    notes.forEach(n => {
      setTimeout(() => {
        this.playNote(n.f, n.d, 'triangle', n.v);
      }, n.t);
    });

    // Gentle sunny harmonic breeze sparkle at peak
    setTimeout(() => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1318.51, now); // E6
      osc.frequency.linearRampToValueAtTime(1760.00, now + 0.25); // A6
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }, 400);
  }

  // Winter / Christmas Edition Theme Switch: Sparkling crystalline snow bells & holiday sleigh chimes
  playWinterTheme() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Crystalline holiday glockenspiel bells: E6, G#6, B6, E7
    const bells = [
      { f: 1318.51, d: 0.25, t: 0, v: 0.22 },   // E6
      { f: 1661.22, d: 0.25, t: 80, v: 0.24 },  // G#6
      { f: 1975.53, d: 0.30, t: 160, v: 0.25 }, // B6
      { f: 2637.02, d: 0.60, t: 250, v: 0.28 }, // E7
    ];

    bells.forEach(b => {
      setTimeout(() => {
        this.playNote(b.f, b.d, 'sine', b.v);
      }, b.t);
    });

    // Festive sleigh bell double-jingle (high metallic sparkle cluster)
    [320, 420].forEach(delay => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [2200, 2800, 3400].forEach(freq => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
        });
      }, delay);
    });
  }

  // Character Selection (snappy Mario Party character join chirp)
  playCharacterSelect() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    // Bouncy 2-step chirp: 392Hz (G4) -> 587Hz (D5) -> 784Hz (G5)
    osc.frequency.setValueAtTime(392, now);
    osc.frequency.setValueAtTime(587.33, now + 0.05);
    osc.frequency.setValueAtTime(783.99, now + 0.10);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Character Deselection (soft cancel blip)
  playCharacterDeselect() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.14);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Game Start Fanfare (Mario Party Board Launch / Pipe Entrance)
  playGameStart() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Classic pipe whoosh descending into triumphant grand opening fanfare
    const notes = [
      { f: 261.63, d: 0.12, t: 0, type: 'triangle' as const, v: 0.22 },  // C4
      { f: 329.63, d: 0.12, t: 80, type: 'triangle' as const, v: 0.24 }, // E4
      { f: 392.00, d: 0.12, t: 160, type: 'triangle' as const, v: 0.24 },// G4
      { f: 523.25, d: 0.14, t: 240, type: 'triangle' as const, v: 0.26 },// C5
      { f: 659.25, d: 0.18, t: 320, type: 'triangle' as const, v: 0.28 },// E5
      { f: 783.99, d: 0.20, t: 400, type: 'triangle' as const, v: 0.30 },// G5
      { f: 1046.50, d: 0.60, t: 480, type: 'sine' as const, v: 0.32 },   // C6 high sustain
    ];

    notes.forEach(n => {
      setTimeout(() => {
        this.playNote(n.f, n.d, n.type, n.v);
      }, n.t);
    });

    // Sustained major chord backing
    setTimeout(() => {
      [523.25, 659.25, 783.99].forEach(freq => {
        this.playNote(freq, 0.55, 'sine', 0.12);
      });
    }, 480);
  }

  // Board / Deck Reshuffle Flutter
  playShuffle() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Rapid fluttering sequence of cards / blocks tumbling into place
    const freqs = [350, 420, 520, 680, 560, 450, 380, 520];
    freqs.forEach((f, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.045);
      }, i * 38);
    });

    // Final confident snap
    setTimeout(() => {
      this.playClick();
    }, freqs.length * 38 + 20);
  }

  // Unscramble Letter Tile Click (Wooden tactile tile placement, pitches up slightly per letter)
  playLetterTile(index: number = 0) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const baseFreq = 420 + Math.min(index * 35, 300);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.06);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Unscramble Word Solved (Warm, triumphant 4-tone puzzle completed chime)
  playWordSolved() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [
      { f: 587.33, d: 0.12, t: 0 },   // D5
      { f: 783.99, d: 0.14, t: 80 },  // G5
      { f: 987.77, d: 0.16, t: 160 }, // B5
      { f: 1174.66, d: 0.40, t: 240 },// D6
    ];

    notes.forEach(n => {
      setTimeout(() => {
        this.playNote(n.f, n.d, 'triangle', 0.24);
      }, n.t);
    });
  }

  // Cloud Save Confirmation (Smooth rising digital upload sound + confirmation chimes)
  playSaveCloud() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);

    setTimeout(() => {
      this.playNote(1318.51, 0.25, 'sine', 0.22);
    }, 180);
    setTimeout(() => {
      this.playNote(1760.00, 0.4, 'sine', 0.25);
    }, 280);
  }

  // Cloud Sync / Deck Download Pulse
  playCloudSync() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.linearRampToValueAtTime(987.77, now + 0.12);
    osc.frequency.linearRampToValueAtTime(1318.51, now + 0.24);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Reset Deck / Rewind
  playResetDeck() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);

    setTimeout(() => {
      this.playNote(523.25, 0.25, 'sine', 0.2);
    }, 200);
  }

  // Steal Target Confirmation (Sneaky phantom Boo theft confirmed)
  playStealConfirmed() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Phantom wobble
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(320, now + 0.12);
    osc.frequency.linearRampToValueAtTime(620, now + 0.24);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);

    // Followed by sneaky Boo chuckle
    setTimeout(() => {
      this.playBoo();
    }, 260);
  }

  // Claim Reward & Finish Turn (Grand reward collection fanfare with coin sparkle)
  playClaimReward() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Clean ascending major triumph
    const notes = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 659.25, d: 0.12, t: 70 },
      { f: 783.99, d: 0.14, t: 140 },
      { f: 1046.50, d: 0.35, t: 210 },
    ];

    notes.forEach(n => {
      setTimeout(() => {
        this.playNote(n.f, n.d, 'triangle', 0.25);
      }, n.t);
    });

    setTimeout(() => {
      this.playCoin();
    }, 240);
  }

  /** Classroom-loud round-ender sting — students look up. */
  playRoundOver() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = 'sawtooth';
    boom.frequency.setValueAtTime(90, now);
    boom.frequency.exponentialRampToValueAtTime(38, now + 0.45);
    boomGain.gain.setValueAtTime(0.42, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    boom.connect(boomGain);
    boomGain.connect(ctx.destination);
    boom.start(now);
    boom.stop(now + 0.55);

    const sting = [
      { f: 392.0, d: 0.18, t: 80 },
      { f: 523.25, d: 0.18, t: 220 },
      { f: 659.25, d: 0.22, t: 360 },
      { f: 783.99, d: 0.55, t: 520 },
      { f: 1046.5, d: 0.7, t: 780 },
    ];
    sting.forEach(n => {
      setTimeout(() => {
        this.playNote(n.f, n.d, 'triangle', 0.34);
      }, n.t);
    });
  }

  playBlooper() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.38);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
    setTimeout(() => {
      this.playNote(196, 0.2, 'sine', 0.18);
    }, 120);
  }

  // Helper note player
  private playNote(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.2) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Quick dice ticking sound when die face flips
  playDiceTick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Authentic Mario Party dice roll landing fanfare / chime
  playDiceRoll() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Satisfying two-tone landing impact
    this.playNote(523.25, 0.08, 'triangle', 0.25); // C5
    setTimeout(() => {
      this.playNote(783.99, 0.18, 'sine', 0.3); // G5
    }, 60);
    setTimeout(() => {
      this.playNote(1046.50, 0.28, 'triangle', 0.35); // C6
    }, 130);
  }

  // POW Block board-shaking seismic rumble & shockwave
  playPowBlock() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Heavy low rumble
    [55, 73.42, 110].forEach(f => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.7);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.75);
    });

    // Metallic spring / shockwave ping
    setTimeout(() => {
      this.playNote(440, 0.15, 'square', 0.2);
      this.playNote(880, 0.2, 'sine', 0.25);
    }, 100);
  }

  // Bowser's Fury roar & infernal blast
  playBowserFury() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Infernal deep roar
    [48.99, 65.41, 92.50].forEach(f => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f * 1.5, now + 0.3);
      osc.frequency.linearRampToValueAtTime(35, now + 1.1);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 1.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.1);
    });

    // Fire whoosh
    setTimeout(() => {
      this.playBowser();
    }, 180);
  }
}

export const sounds = new SoundEngine();
