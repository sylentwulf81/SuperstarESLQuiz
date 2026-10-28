/**
 * Background music jukebox. Plays the bundled MP3s in /assets/audio and
 * user-uploaded audio files persisted in IndexedDB.
 */

import { getAllStoredAudioTracks, saveAudioTrack, deleteAudioTrack, StoredAudioTrack } from './audioStorage';

export interface BgmTrack {
  id: string;
  name: string;
  category: 'static' | 'custom';
  audioUrl?: string; // For uploaded files
  fileSize?: number;
}

export interface BgmState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number; // 0 to 1
  currentTrackIndex: number;
  tracks: BgmTrack[];
}

const track = (file: string): BgmTrack => ({
  id: `static_${file}`,
  name: file,
  category: 'static',
  audioUrl: `/assets/audio/${encodeURIComponent(file)}.mp3`,
});

const PRESET_TRACKS: BgmTrack[] = [
  'Super Quiz World',
  'Coin Block Groove',
  'Pixel Power Quiz',
  'Quiz Kingdom Beat',
  'Bustling Tavern',
  '8-Bit Quiz Quest',
  'Retro Quiz Run',
].map(track);

class BgmEngine {
  private customAudioElement: HTMLAudioElement | null = null;
  private objectUrlCache: Map<string, string> = new Map();

  private isPlayingState = false;
  private isMutedState = false;
  private volumeState = 0.45;
  private currentTrackIdx = 0;
  private isSwitchingTrack = false;

  private listeners: Set<(state: BgmState) => void> = new Set();

  public tracks: BgmTrack[] = [...PRESET_TRACKS];

  constructor() {
    if (typeof window !== 'undefined') {
      this.customAudioElement = new Audio();
      this.customAudioElement.loop = false;
      this.customAudioElement.addEventListener('play', () => {
        this.isPlayingState = true;
        this.notify();
      });
      this.customAudioElement.addEventListener('playing', () => {
        this.isPlayingState = true;
        this.notify();
      });
      this.customAudioElement.addEventListener('pause', () => {
        if (!this.isSwitchingTrack) {
          this.isPlayingState = false;
          this.notify();
        }
      });
      this.customAudioElement.addEventListener('ended', () => {
        this.nextTrack();
      });
      // Asynchronously restore uploaded tracks from IndexedDB or static /audio/
      this.loadStoredTracks();
    }
  }

  private async loadStoredTracks() {
    try {
      const stored = await getAllStoredAudioTracks();
      const customTracks: BgmTrack[] = stored.map((item) => {
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

      if (customTracks.length > 0) {
        this.tracks = [...customTracks, ...PRESET_TRACKS];
        this.notify();
      }
    } catch (e) {
      console.warn('Failed to restore custom tracks from IndexedDB:', e);
    }
  }

  private notify() {
    const state: BgmState = {
      isPlaying: this.isPlayingState,
      isMuted: this.isMutedState,
      volume: this.volumeState,
      currentTrackIndex: this.currentTrackIdx,
      tracks: [...this.tracks],
    };
    this.listeners.forEach((cb) => cb(state));
  }

  public subscribe(callback: (state: BgmState) => void): () => void {
    this.listeners.add(callback);
    callback({
      isPlaying: this.isPlayingState,
      isMuted: this.isMutedState,
      volume: this.volumeState,
      currentTrackIndex: this.currentTrackIdx,
      tracks: [...this.tracks],
    });
    return () => this.listeners.delete(callback);
  }

  public async play(): Promise<void> {
    const track = this.tracks[this.currentTrackIdx];
    if (!track?.audioUrl || !this.customAudioElement) return;

    this.isPlayingState = true;
    this.notify();

    const el = this.customAudioElement;
    if (el.getAttribute('data-track-id') !== track.id || !el.src) {
      el.setAttribute('data-track-id', track.id);
      el.src = track.audioUrl;
      el.currentTime = 0;
    }

    el.volume = this.isMutedState ? 0 : this.volumeState;
    el.muted = this.isMutedState;

    try {
      await el.play();
    } catch (e) {
      console.warn('Audio playback issue or pending interaction:', e);
      if (el.paused) {
        this.isPlayingState = false;
        this.notify();
      }
    }
  }

  public pause() {
    this.isPlayingState = false;
    if (this.customAudioElement) {
      try { this.customAudioElement.pause(); } catch (_) {}
    }
    this.notify();
  }

  public togglePlay() {
    if (this.isPlayingState) {
      this.pause();
    } else {
      this.play();
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
    const wasPlaying = this.isPlayingState;
    this.isSwitchingTrack = true;
    this.pause();
    this.currentTrackIdx = index;
    this.isSwitchingTrack = false;
    this.notify();
    if (wasPlaying) {
      this.play();
    }
  }

  public toggleMute() {
    this.setMuted(!this.isMutedState);
  }

  public setMuted(muted: boolean) {
    this.isMutedState = muted;
    if (this.customAudioElement) {
      this.customAudioElement.muted = muted;
      this.customAudioElement.volume = muted ? 0 : this.volumeState;
    }
    this.notify();
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volumeState = clamped;
    if (this.customAudioElement) {
      this.customAudioElement.volume = clamped;
    }
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
      this.isPlayingState = true;
      this.notify();
      await this.play();
    }
  }

  public async deleteCustomTrack(trackId: string): Promise<void> {
    const trackIndex = this.tracks.findIndex((t) => t.id === trackId);
    if (trackIndex === -1) return;

    // Revoke cached URL
    const url = this.objectUrlCache.get(trackId);
    if (url) {
      URL.revokeObjectURL(url);
      this.objectUrlCache.delete(trackId);
    }

    // Delete from IndexedDB
    await deleteAudioTrack(trackId);

    const wasCurrent = this.currentTrackIdx === trackIndex;
    const wasPlaying = this.isPlayingState;

    if (wasCurrent) {
      this.pause();
    }

    this.tracks = this.tracks.filter((t) => t.id !== trackId);

    if (this.currentTrackIdx >= this.tracks.length) {
      this.currentTrackIdx = Math.max(0, this.tracks.length - 1);
    }

    this.notify();

    if (wasCurrent && wasPlaying && this.tracks.length > 0) {
      this.play();
    }
  }
}

export const bgm = new BgmEngine();
