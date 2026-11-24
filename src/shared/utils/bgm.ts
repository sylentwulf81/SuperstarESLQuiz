/**
 * Classroom BGM jukebox: bundled MP3s, procedural chiptunes, and IndexedDB uploads.
 */

import { getAllStoredAudioTracks, saveAudioTrack, deleteAudioTrack } from './audioStorage';
import { CHIP_TUNE_PRESETS, renderChiptuneBuffer } from './bgmChiptunes';
import { sounds } from './sound';

export type BgmTrackCategory = 'static' | 'synth' | 'custom';

export interface BgmTrack {
  id: string;
  name: string;
  category: BgmTrackCategory;
  audioUrl?: string;
  fileSize?: number;
}

export interface BgmState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTrackIndex: number;
  tracks: BgmTrack[];
  /** Seconds; meaningful for static/custom only. */
  currentTime: number;
  /** Seconds; 0 when unknown / synth. */
  duration: number;
  seekable: boolean;
}

const PREFS_KEY = 'mp_bgm_prefs_v1';

interface BgmPrefs {
  wantPlay: boolean;
  muted: boolean;
  volume: number;
  trackId?: string;
}

function loadPrefs(): BgmPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { wantPlay: true, muted: false, volume: 0.45 };
    const parsed = JSON.parse(raw) as Partial<BgmPrefs>;
    return {
      wantPlay: parsed.wantPlay !== false,
      muted: Boolean(parsed.muted),
      volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(1, parsed.volume)) : 0.45,
      trackId: typeof parsed.trackId === 'string' ? parsed.trackId : undefined,
    };
  } catch {
    return { wantPlay: true, muted: false, volume: 0.45 };
  }
}

function savePrefs(prefs: BgmPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

const staticTrack = (file: string): BgmTrack => ({
  id: `static_${file}`,
  name: file,
  category: 'static',
  audioUrl: `/assets/audio/${encodeURIComponent(file)}.mp3`,
});

const STATIC_TRACKS: BgmTrack[] = [
  'Super Quiz World',
  'Coin Block Groove',
  'Pixel Power Quiz',
  'Quiz Kingdom Beat',
  'Bustling Tavern',
  '8-Bit Quiz Quest',
  'Retro Quiz Run',
].map(staticTrack);

const SYNTH_TRACKS: BgmTrack[] = CHIP_TUNE_PRESETS.map(t => ({
  id: t.id,
  name: t.name,
  category: 'synth' as const,
}));

const BUILTIN_TRACKS: BgmTrack[] = [...STATIC_TRACKS, ...SYNTH_TRACKS];

class BgmEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private customAudioElement: HTMLAudioElement | null = null;
  private objectUrlCache: Map<string, string> = new Map();
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private synthStartedAt = 0;
  private synthOffset = 0;
  private synthDuration = 0;
  private progressTimer: number | null = null;

  private isPlayingState = false;
  private isMutedState = false;
  private volumeState = 0.45;
  private currentTrackIdx = 0;
  private isSwitchingTrack = false;
  private wantPlay = true;
  private currentTimeState = 0;
  private durationState = 0;
  /** Bumps on each play/stop so stale async chiptune renders cannot start late. */
  private playGeneration = 0;

  private listeners: Set<(state: BgmState) => void> = new Set();

  public tracks: BgmTrack[] = [...BUILTIN_TRACKS];

  constructor() {
    if (typeof window === 'undefined') return;

    const prefs = loadPrefs();
    this.wantPlay = prefs.wantPlay;
    this.isMutedState = prefs.muted;
    this.volumeState = prefs.volume;

    this.customAudioElement = new Audio();
    this.customAudioElement.loop = false;
    this.customAudioElement.preload = 'metadata';
    this.customAudioElement.addEventListener('play', () => {
      this.isPlayingState = true;
      this.notify();
    });
    this.customAudioElement.addEventListener('playing', () => {
      this.isPlayingState = true;
      this.notify();
    });
    this.customAudioElement.addEventListener('pause', () => {
      if (!this.isSwitchingTrack && this.isMediaTrack()) {
        this.isPlayingState = false;
        this.notify();
      }
    });
    this.customAudioElement.addEventListener('ended', () => {
      this.nextTrack();
    });
    // Throttle seek UI updates — raw timeupdate re-renders the whole header too often.
    let lastProgressNotify = 0;
    this.customAudioElement.addEventListener('timeupdate', () => {
      if (!this.isMediaTrack() || !this.customAudioElement) return;
      this.currentTimeState = this.customAudioElement.currentTime || 0;
      this.durationState = Number.isFinite(this.customAudioElement.duration)
        ? this.customAudioElement.duration
        : 0;
      const now = performance.now();
      if (now - lastProgressNotify > 250) {
        lastProgressNotify = now;
        this.notify();
      }
    });
    this.customAudioElement.addEventListener('loadedmetadata', () => {
      if (this.customAudioElement) {
        this.durationState = Number.isFinite(this.customAudioElement.duration)
          ? this.customAudioElement.duration
          : 0;
        this.notify();
      }
    });

    this.loadStoredTracks().then(() => {
      if (prefs.trackId) {
        const idx = this.tracks.findIndex(t => t.id === prefs.trackId);
        if (idx >= 0) this.currentTrackIdx = idx;
      }
      this.notify();
    });
  }

  private persist() {
    const track = this.tracks[this.currentTrackIdx];
    savePrefs({
      wantPlay: this.wantPlay,
      muted: this.isMutedState,
      volume: this.volumeState,
      trackId: track?.id,
    });
  }

  private isMediaTrack(track = this.tracks[this.currentTrackIdx]) {
    return track?.category === 'static' || track?.category === 'custom';
  }

  private isSeekable(track = this.tracks[this.currentTrackIdx]) {
    return this.isMediaTrack(track);
  }

  private async loadStoredTracks() {
    try {
      const stored = await getAllStoredAudioTracks();
      const customTracks: BgmTrack[] = stored.map(item => {
        const url = URL.createObjectURL(item.blob);
        this.objectUrlCache.set(item.id, url);
        return {
          id: item.id,
          name: item.name,
          category: 'custom',
          audioUrl: url,
          fileSize: item.size,
        };
      });
      this.tracks = [...BUILTIN_TRACKS, ...customTracks];
      this.notify();
    } catch (e) {
      console.warn('Failed to restore custom tracks from IndexedDB:', e);
    }
  }

  private buildState(): BgmState {
    const track = this.tracks[this.currentTrackIdx];
    return {
      isPlaying: this.isPlayingState,
      isMuted: this.isMutedState,
      volume: this.volumeState,
      currentTrackIndex: this.currentTrackIdx,
      tracks: [...this.tracks],
      currentTime: this.currentTimeState,
      duration: this.durationState,
      seekable: this.isSeekable(track),
    };
  }

  private notify() {
    const state = this.buildState();
    this.listeners.forEach(cb => cb(state));
  }

  public subscribe(callback: (state: BgmState) => void): () => void {
    this.listeners.add(callback);
    callback(this.buildState());
    return () => this.listeners.delete(callback);
  }

  private ensureGraph(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.75;
      this.masterGain.gain.value = this.isMutedState ? 0 : this.volumeState;
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private async resumeContext(): Promise<AudioContext | null> {
    const ctx = this.ensureGraph();
    if (!ctx) return null;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume failed:', e);
      }
    }
    return ctx;
  }

  private stopSynthProgress() {
    if (this.progressTimer != null) {
      window.clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  private startSynthProgress() {
    this.stopSynthProgress();
    this.progressTimer = window.setInterval(() => {
      if (!this.isPlayingState || this.isMediaTrack()) return;
      const ctx = this.ctx;
      if (!ctx || this.synthDuration <= 0) return;
      const elapsed = (ctx.currentTime - this.synthStartedAt + this.synthOffset) % this.synthDuration;
      this.currentTimeState = elapsed;
      this.durationState = this.synthDuration;
      this.notify();
    }, 200);
  }

  /** Fill `out` with analyser frequency bins (0–255). Returns false if unavailable. */
  public getVisualizerData(out: Uint8Array): boolean {
    if (!this.analyser || !this.isPlayingState || this.isMutedState) {
      out.fill(0);
      return false;
    }
    try {
      // AnalyserNode typings vary across DOM lib versions.
      this.analyser.getByteFrequencyData(out as unknown as Uint8Array<ArrayBuffer>);
      return true;
    } catch {
      out.fill(0);
      return false;
    }
  }

  public async play(): Promise<void> {
    const track = this.tracks[this.currentTrackIdx];
    if (!track) return;

    const generation = ++this.playGeneration;
    this.wantPlay = true;
    this.isPlayingState = true;
    this.persist();
    this.notify();
    // Same user gesture: unlock SFX context too (shared classroom audio feel).
    sounds.unlock();

    if (this.isMediaTrack(track) && track.audioUrl) {
      // MP3/custom: play through the element directly (do NOT createMediaElementSource —
      // capturing the element into a Web Audio graph made the jukebox brittle / silent).
      if (this.currentSource) {
        try {
          this.currentSource.stop();
        } catch {
          /* ignore */
        }
        this.currentSource = null;
      }
      this.stopSynthProgress();

      const el = this.customAudioElement!;
      const isDifferent =
        el.getAttribute('data-track-id') !== track.id || !el.src;
      if (isDifferent) {
        el.setAttribute('data-track-id', track.id);
        el.src = track.audioUrl;
        el.currentTime = 0;
      }
      el.muted = this.isMutedState;
      el.volume = this.isMutedState ? 0 : this.volumeState;
      try {
        await el.play();
      } catch (e) {
        console.warn('Audio playback issue or pending interaction:', e);
        if (el.paused && generation === this.playGeneration) {
          this.isPlayingState = false;
          this.notify();
        }
      }
      return;
    }

    // Synth — pause any MP3 first so only the buffer source is live
    if (this.customAudioElement) {
      try {
        this.customAudioElement.pause();
      } catch {
        /* ignore */
      }
    }

    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        /* ignore */
      }
      this.currentSource = null;
    }

    const ctx = await this.resumeContext();
    if (!ctx || !this.analyser || !this.masterGain) {
      if (generation === this.playGeneration) {
        this.isPlayingState = false;
        this.notify();
      }
      return;
    }

    let buffer = this.bufferCache.get(track.id) ?? null;
    if (!buffer) {
      try {
        buffer = await renderChiptuneBuffer(track.id);
        if (buffer) this.bufferCache.set(track.id, buffer);
      } catch (e) {
        console.error('Chiptune render failed:', e);
        buffer = null;
      }
    }
    if (generation !== this.playGeneration) return;
    if (!buffer) {
      console.error('Chiptune buffer missing for', track.id);
      this.isPlayingState = false;
      this.notify();
      return;
    }

    this.masterGain.gain.value = this.isMutedState ? 0 : this.volumeState;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    // Analyser is in the chain for the visualizer; it still passes audio through.
    source.connect(this.analyser);
    source.start(0);
    this.currentSource = source;
    this.synthStartedAt = ctx.currentTime;
    this.synthOffset = 0;
    this.synthDuration = buffer.duration;
    this.durationState = buffer.duration;
    this.currentTimeState = 0;
    this.isPlayingState = true;
    this.startSynthProgress();
    this.notify();
  }

  /**
   * Call from a teacher gesture (Start Party). Resumes AudioContext and
   * starts playback when the host prefers music on.
   */
  public async playOnHostGesture(): Promise<void> {
    await this.resumeContext();
    if (!this.wantPlay || this.isMutedState) return;
    await this.play();
  }

  private stopPlayback() {
    this.playGeneration += 1;
    this.isPlayingState = false;
    this.stopSynthProgress();
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        /* ignore */
      }
      this.currentSource = null;
    }
    if (this.customAudioElement) {
      try {
        this.customAudioElement.pause();
      } catch {
        /* ignore */
      }
    }
  }

  public pause() {
    this.wantPlay = false;
    this.stopPlayback();
    this.persist();
    this.notify();
  }

  public togglePlay() {
    if (this.isPlayingState) {
      this.pause();
    } else {
      void this.play();
    }
  }

  public nextTrack() {
    if (this.tracks.length === 0) return;
    this.setTrackIndex((this.currentTrackIdx + 1) % this.tracks.length);
  }

  public prevTrack() {
    if (this.tracks.length === 0) return;
    this.setTrackIndex((this.currentTrackIdx - 1 + this.tracks.length) % this.tracks.length);
  }

  public setTrackIndex(index: number) {
    if (index < 0 || index >= this.tracks.length) return;
    const resume = this.isPlayingState || this.wantPlay;
    this.isSwitchingTrack = true;
    this.stopPlayback();
    this.currentTrackIdx = index;
    this.currentTimeState = 0;
    this.durationState = 0;
    this.isSwitchingTrack = false;
    this.wantPlay = resume;
    this.persist();
    this.notify();
    if (resume) {
      void this.play();
    }
  }

  public seek(seconds: number) {
    if (!this.isSeekable() || !this.customAudioElement) return;
    const el = this.customAudioElement;
    const dur = Number.isFinite(el.duration) ? el.duration : 0;
    const next = Math.max(0, Math.min(dur || seconds, seconds));
    el.currentTime = next;
    this.currentTimeState = next;
    this.notify();
  }

  public toggleMute() {
    this.setMuted(!this.isMutedState);
  }

  public setMuted(muted: boolean) {
    this.isMutedState = muted;
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(muted ? 0 : this.volumeState, this.ctx.currentTime);
      } catch {
        this.masterGain.gain.value = muted ? 0 : this.volumeState;
      }
    } else if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.volumeState;
    }
    if (this.customAudioElement) {
      this.customAudioElement.muted = muted;
      this.customAudioElement.volume = muted ? 0 : this.volumeState;
    }
    this.persist();
    this.notify();
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volumeState = clamped;
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(this.isMutedState ? 0 : clamped, this.ctx.currentTime);
      } catch {
        this.masterGain.gain.value = this.isMutedState ? 0 : clamped;
      }
    } else if (this.masterGain) {
      this.masterGain.gain.value = this.isMutedState ? 0 : clamped;
    }
    if (this.customAudioElement) {
      this.customAudioElement.volume = this.isMutedState ? 0 : clamped;
    }
    this.persist();
    this.notify();
  }

  public async addCustomTracks(files: FileList | File[]): Promise<void> {
    const fileArray = Array.from(files);
    const addedTracks: BgmTrack[] = [];

    for (const file of fileArray) {
      try {
        const stored = await saveAudioTrack(file);
        const url = URL.createObjectURL(stored.blob);
        this.objectUrlCache.set(stored.id, url);
        addedTracks.push({
          id: stored.id,
          name: stored.name,
          category: 'custom',
          audioUrl: url,
          fileSize: stored.size,
        });
      } catch (err) {
        console.error('Failed to save track to IndexedDB:', err);
      }
    }

    if (addedTracks.length > 0) {
      this.tracks = [...this.tracks, ...addedTracks];
      const newIdx = this.tracks.length - addedTracks.length;
      this.isSwitchingTrack = true;
      this.currentTrackIdx = newIdx;
      this.isSwitchingTrack = false;
      this.wantPlay = true;
      this.isPlayingState = true;
      this.persist();
      this.notify();
      await this.play();
    }
  }

  public async deleteCustomTrack(trackId: string): Promise<void> {
    const trackIndex = this.tracks.findIndex(t => t.id === trackId);
    if (trackIndex === -1) return;

    const url = this.objectUrlCache.get(trackId);
    if (url) {
      URL.revokeObjectURL(url);
      this.objectUrlCache.delete(trackId);
    }

    await deleteAudioTrack(trackId);

    const wasCurrent = this.currentTrackIdx === trackIndex;
    const wasPlaying = this.isPlayingState;

    if (wasCurrent) {
      this.pause();
    }

    this.tracks = this.tracks.filter(t => t.id !== trackId);

    if (this.currentTrackIdx >= this.tracks.length) {
      this.currentTrackIdx = Math.max(0, this.tracks.length - 1);
    }

    this.persist();
    this.notify();

    if (wasCurrent && wasPlaying && this.tracks.length > 0) {
      this.wantPlay = true;
      await this.play();
    }
  }
}

export const bgm = new BgmEngine();
