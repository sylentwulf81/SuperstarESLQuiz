/**
 * Procedural Web Audio chiptune buffers for the classroom jukebox.
 */
export const CHIP_TUNE_PRESETS = [
  { id: 'mario_overworld', name: '🍄 Mario Party Overworld' },
  { id: 'holiday_jingle', name: '🎄 Festive Holiday Wonderland' },
  { id: 'sunshine_beach', name: '☀️ Tropical Sunshine Beach' },
  { id: 'star_rush', name: '⭐ Superstar Power Rush' },
] as const;

export type ChipTuneId = (typeof CHIP_TUNE_PRESETS)[number]['id'];

const NOTE_FREQS: Record<string, number> = {
  REST: 0,
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Ab5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98,
};

interface SynthNote {
  f: number;
  t: number;
  d: number;
  vol?: number;
}

export async function renderChiptuneBuffer(trackId: string): Promise<AudioBuffer | null> {
    const sampleRate = 44100;
    let bpm = 136;
    let totalBeats = 32;

    if (trackId === 'mario_overworld') {
      bpm = 140;
    } else if (trackId === 'holiday_jingle') {
      bpm = 130;
    } else if (trackId === 'sunshine_beach') {
      bpm = 118;
    } else if (trackId === 'star_rush') {
      bpm = 156;
    }

    const beat = 60 / bpm;
    const duration = totalBeats * beat;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * duration), sampleRate);

    if (trackId === 'mario_overworld') {
      populateMarioOverworld(offlineCtx, beat, totalBeats);
    } else if (trackId === 'holiday_jingle') {
      populateHolidayCarol(offlineCtx, beat, totalBeats);
    } else if (trackId === 'sunshine_beach') {
      populateSunshineBeach(offlineCtx, beat, totalBeats);
    } else {
      populateStarRush(offlineCtx, beat, totalBeats);
    }

    try {
      const buffer = await offlineCtx.startRendering();
      return buffer;
    } catch (e) {
      console.error('Error generating BGM track buffer:', e);
      return null;
    }
}

function populateMarioOverworld(offlineCtx: OfflineAudioContext, beat: number, totalBeats: number) {
    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2500;

    const trackGain = offlineCtx.createGain();
    trackGain.gain.value = 0.4;
    filter.connect(trackGain);
    trackGain.connect(offlineCtx.destination);

    const melody: SynthNote[] = [
      { f: NOTE_FREQS.E5, t: 0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 0.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 1.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.C5, t: 2.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 2.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.G5, t: 3.2 * beat, d: beat * 0.7 },
      { f: NOTE_FREQS.G4, t: 5.0 * beat, d: beat * 0.8 },
      { f: NOTE_FREQS.C5, t: 8.0 * beat, d: beat * 0.7 },
      { f: NOTE_FREQS.G4, t: 9.5 * beat, d: beat * 0.7 },
      { f: NOTE_FREQS.E4, t: 11.0 * beat, d: beat * 0.7 },
      { f: NOTE_FREQS.A4, t: 12.0 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.B4, t: 13.0 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.Bb4, t: 14.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.A4, t: 14.5 * beat, d: beat * 0.6 },
      { f: NOTE_FREQS.G4, t: 16.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 16.6 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.G5, t: 17.3 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.A5, t: 18.0 * beat, d: beat * 0.6 },
      { f: NOTE_FREQS.F5, t: 19.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.G5, t: 19.5 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.E5, t: 20.5 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.C5, t: 21.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.D5, t: 22.2 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.B4, t: 22.8 * beat, d: beat * 0.8 },
      { f: NOTE_FREQS.C5, t: 24.0 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.G4, t: 25.0 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.E4, t: 26.0 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.A4, t: 27.0 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.B4, t: 28.0 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.G5, t: 29.0 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.C6, t: 30.0 * beat, d: beat * 0.9 },
    ];

    melody.forEach((note) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, note.t);
      gain.gain.setValueAtTime(0.2, note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, note.t + note.d);
      osc.connect(gain);
      gain.connect(filter);
      osc.start(note.t);
      osc.stop(note.t + note.d);
    });

    for (let bar = 0; bar < 8; bar++) {
      const root =
        bar === 0 || bar === 1 || bar === 2 || bar === 6 || bar === 7
          ? NOTE_FREQS.C3
          : bar === 3 || bar === 5
          ? NOTE_FREQS.F3
          : NOTE_FREQS.G3;
      const fifth = root * 1.5;
      const tBase = bar * 4 * beat;

      [root, fifth, root, fifth].forEach((f, idx) => {
        const t = tBase + idx * beat;
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.4);
        osc.connect(gain);
        gain.connect(trackGain);
        osc.start(t);
        osc.stop(t + beat * 0.4);
      });
    }

    for (let b = 0; b < totalBeats; b++) {
      const t = (b + 0.5) * beat;
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(3500, t);
      osc.frequency.exponentialRampToValueAtTime(900, t + 0.04);
      gain.gain.setValueAtTime(0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(trackGain);
      osc.start(t);
      osc.stop(t + 0.04);
    }
  }

function populateHolidayCarol(offlineCtx: OfflineAudioContext, beat: number, totalBeats: number) {
    const trackGain = offlineCtx.createGain();
    trackGain.gain.value = 0.45;
    trackGain.connect(offlineCtx.destination);

    const melody: SynthNote[] = [
      { f: NOTE_FREQS.E5, t: 0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 0.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 1.0 * beat, d: beat * 0.8 },
      { f: NOTE_FREQS.E5, t: 2.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 2.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 3.0 * beat, d: beat * 0.8 },
      { f: NOTE_FREQS.E5, t: 4.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.G5, t: 4.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.C5, t: 5.0 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.D5, t: 5.6 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 6.0 * beat, d: beat * 1.5 },
      { f: NOTE_FREQS.F5, t: 8.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.F5, t: 8.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.F5, t: 9.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.F5, t: 9.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.F5, t: 10.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 10.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 11.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 11.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 12.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.D5, t: 12.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.D5, t: 13.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 13.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.D5, t: 14.0 * beat, d: beat * 0.7 },
      { f: NOTE_FREQS.G5, t: 15.0 * beat, d: beat * 0.8 },
      { f: NOTE_FREQS.G5, t: 16.0 * beat, d: beat * 0.6 },
      { f: NOTE_FREQS.F5, t: 16.7 * beat, d: beat * 0.3 },
      { f: NOTE_FREQS.E5, t: 17.0 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.D5, t: 17.6 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.C5, t: 18.2 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.D5, t: 18.8 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.E5, t: 19.4 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.C5, t: 20.0 * beat, d: beat * 0.8 },
      { f: NOTE_FREQS.D5, t: 21.0 * beat, d: beat * 0.35 },
      { f: NOTE_FREQS.E5, t: 21.4 * beat, d: beat * 0.35 },
      { f: NOTE_FREQS.F5, t: 21.8 * beat, d: beat * 0.35 },
      { f: NOTE_FREQS.D5, t: 22.2 * beat, d: beat * 0.35 },
      { f: NOTE_FREQS.E5, t: 22.6 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.D5, t: 23.2 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.C5, t: 23.8 * beat, d: beat * 0.9 },
      { f: NOTE_FREQS.G5, t: 25.0 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.A5, t: 26.0 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.B5, t: 27.0 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.C6, t: 28.0 * beat, d: beat * 1.5 },
    ];

    melody.forEach((n) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, n.t);
      gain.gain.setValueAtTime(0.24, n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, n.t + n.d);
      osc.connect(gain);
      gain.connect(trackGain);
      osc.start(n.t);
      osc.stop(n.t + n.d);
    });

    for (let b = 0; b < totalBeats; b += 2) {
      const t = b * beat;
      const root = b < 16 ? NOTE_FREQS.C3 : NOTE_FREQS.G3;
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(root, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + beat * 1.1);
      osc.connect(gain);
      gain.connect(trackGain);
      osc.start(t);
      osc.stop(t + beat * 1.1);
    }
  }

function populateSunshineBeach(offlineCtx: OfflineAudioContext, beat: number, totalBeats: number) {
    const trackGain = offlineCtx.createGain();
    trackGain.gain.value = 0.42;
    trackGain.connect(offlineCtx.destination);

    const melody: SynthNote[] = [
      { f: NOTE_FREQS.G5, t: 0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 0.75 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.C5, t: 1.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.D5, t: 2.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 2.75 * beat, d: beat * 0.6 },
      { f: NOTE_FREQS.G5, t: 4.0 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.A5, t: 4.75 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.G5, t: 5.5 * beat, d: beat * 0.8 },
      { f: NOTE_FREQS.E5, t: 7.0 * beat, d: beat * 0.6 },
      { f: NOTE_FREQS.A5, t: 8.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.G5, t: 8.75 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 9.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.D5, t: 10.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.C5, t: 10.75 * beat, d: beat * 0.8 },
      { f: NOTE_FREQS.D5, t: 12.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 12.75 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.D5, t: 13.5 * beat, d: beat * 0.9 },
      { f: NOTE_FREQS.G5, t: 16.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 16.75 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.C5, t: 17.5 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 18.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.G5, t: 18.75 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.C6, t: 20.0 * beat, d: beat * 0.9 },
      { f: NOTE_FREQS.A5, t: 21.5 * beat, d: beat * 0.6 },
      { f: NOTE_FREQS.G5, t: 23.0 * beat, d: beat * 0.8 },
      { f: NOTE_FREQS.E5, t: 24.0 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.D5, t: 24.75 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.C5, t: 25.5 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.D5, t: 26.25 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.E5, t: 27.0 * beat, d: beat * 0.5 },
      { f: NOTE_FREQS.D5, t: 27.75 * beat, d: beat * 0.4 },
      { f: NOTE_FREQS.C5, t: 28.5 * beat, d: beat * 1.5 },
    ];

    melody.forEach((n) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, n.t);
      gain.gain.setValueAtTime(0.24, n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, n.t + n.d);
      osc.connect(gain);
      gain.connect(trackGain);
      osc.start(n.t);
      osc.stop(n.t + n.d);
    });

    for (let b = 0; b < totalBeats; b++) {
      const t = (b + 0.5) * beat;
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(NOTE_FREQS.G4, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.25);
      osc.connect(gain);
      gain.connect(trackGain);
      osc.start(t);
      osc.stop(t + beat * 0.25);
    }

    for (let bar = 0; bar < 8; bar++) {
      const t = bar * 4 * beat;
      const root = bar % 2 === 0 ? NOTE_FREQS.C3 : NOTE_FREQS.G2;
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(root, t);
      gain.gain.setValueAtTime(0.26, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + beat * 1.5);
      osc.connect(gain);
      gain.connect(trackGain);
      osc.start(t);
      osc.stop(t + beat * 1.5);
    }
  }

function populateStarRush(offlineCtx: OfflineAudioContext, beat: number, totalBeats: number) {
    const trackGain = offlineCtx.createGain();
    trackGain.gain.value = 0.38;
    trackGain.connect(offlineCtx.destination);

    const arpNotes = [
      NOTE_FREQS.C5, NOTE_FREQS.E5, NOTE_FREQS.G5, NOTE_FREQS.C6,
      NOTE_FREQS.G5, NOTE_FREQS.E5, NOTE_FREQS.C5, NOTE_FREQS.E5,
      NOTE_FREQS.B4, NOTE_FREQS.D5, NOTE_FREQS.G5, NOTE_FREQS.B5,
      NOTE_FREQS.G5, NOTE_FREQS.D5, NOTE_FREQS.B4, NOTE_FREQS.D5,
      NOTE_FREQS.A4, NOTE_FREQS.C5, NOTE_FREQS.E5, NOTE_FREQS.A5,
      NOTE_FREQS.E5, NOTE_FREQS.C5, NOTE_FREQS.A4, NOTE_FREQS.C5,
      NOTE_FREQS.G4, NOTE_FREQS.B4, NOTE_FREQS.D5, NOTE_FREQS.G5,
      NOTE_FREQS.D5, NOTE_FREQS.B4, NOTE_FREQS.G4, NOTE_FREQS.B4,
    ];

    for (let i = 0; i < totalBeats * 4; i++) {
      const t = i * (beat / 4);
      const noteFreq = arpNotes[i % arpNotes.length];
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(noteFreq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (beat / 4) * 0.9);
      osc.connect(gain);
      gain.connect(trackGain);
      osc.start(t);
      osc.stop(t + (beat / 4) * 0.9);
    }

    for (let b = 0; b < totalBeats; b++) {
      const t = b * beat;
      const root = b < 8 ? NOTE_FREQS.C3 : b < 16 ? NOTE_FREQS.G2 : b < 24 ? NOTE_FREQS.A2 : NOTE_FREQS.G2;
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(root, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.7);
      osc.connect(gain);
      gain.connect(trackGain);
      osc.start(t);
      osc.stop(t + beat * 0.7);
    }
  }

