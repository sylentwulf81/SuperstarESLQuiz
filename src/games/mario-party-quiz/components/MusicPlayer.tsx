import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Music,
  Volume2,
  VolumeX,
  Upload,
  Volume1,
  ListMusic,
  Trash2,
  X,
  ChevronDown,
} from 'lucide-react';
import { sounds } from '@/shared/utils/sound';
import { bgm, BgmState, BgmTrack } from '@/shared/utils/bgm';

export const MusicPlayer: React.FC = () => {
  const [bgmState, setBgmState] = useState<BgmState>(() => ({
    isPlaying: false,
    isMuted: false,
    volume: 0.45,
    currentTrackIndex: 0,
    tracks: bgm.tracks,
  }));
  const [showTracklist, setShowTracklist] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tracklistRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return bgm.subscribe((state) => {
      setBgmState(state);
    });
  }, []);

  // Close tracklist on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tracklistRef.current && !tracklistRef.current.contains(e.target as Node)) {
        setShowTracklist(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowTracklist(false);
      }
    };

    if (showTracklist) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showTracklist]);

  const currentTrack: BgmTrack | undefined = bgmState.tracks[bgmState.currentTrackIndex];

  const handleTogglePlay = () => {
    sounds.playClick();
    bgm.togglePlay();
  };

  const handleNext = () => {
    sounds.playClick();
    bgm.nextTrack();
  };

  const handlePrev = () => {
    sounds.playClick();
    bgm.prevTrack();
  };

  const handleToggleMute = () => {
    sounds.playClick();
    bgm.toggleMute();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    bgm.setVolume(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      sounds.playCoin();
      bgm.addCustomTracks(e.target.files);
      // Reset input so re-uploading same file name triggers onChange
      e.target.value = '';
    }
  };

  const handleSelectTrack = (index: number) => {
    sounds.playClick();
    if (bgmState.currentTrackIndex === index) {
      bgm.togglePlay();
    } else {
      bgm.setTrackIndex(index);
    }
  };

  const handleDeleteTrack = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    sounds.playBlockHit();
    await bgm.deleteCustomTrack(trackId);
  };

  const synthTracks = useMemo(
    () =>
      bgmState.tracks
        .map((track, idx) => ({ track, idx }))
        .filter(({ track }) => track.category === 'synth'),
    [bgmState.tracks]
  );

  const customTracks = useMemo(
    () =>
      bgmState.tracks
        .map((track, idx) => ({ track, idx }))
        .filter(({ track }) => track.category === 'custom'),
    [bgmState.tracks]
  );

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="relative" ref={tracklistRef}>
      {/* Mini Player Bar — keep intrinsic width; never let the header squash controls */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border shadow-lg bg-slate-900/90 border-white/20 text-white select-none w-max max-w-none shrink-0">
        {/* Track Title (Clickable to open Tracklist) */}
        <button
          id="music-track-title-btn"
          type="button"
          onClick={() => {
            sounds.playClick();
            setShowTracklist((prev) => !prev);
          }}
          className="flex items-center gap-1.5 w-[9.5rem] shrink-0 text-left hover:opacity-90 transition-opacity cursor-pointer group py-0.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400"
          title="Click to view tracklist & choose songs"
        >
          <Music className="w-3.5 h-3.5 text-amber-300 shrink-0 group-hover:scale-110 transition-transform" />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-[11px] font-bold text-indigo-100 group-hover:text-amber-200">
                {currentTrack?.name || 'No Track'}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-white/50 shrink-0 transition-transform duration-200 ${
                  showTracklist ? 'rotate-180 text-amber-300' : 'group-hover:text-white'
                }`}
              />
            </div>
          </div>

          {/* Equalizer animation when playing */}
          {bgmState.isPlaying && !bgmState.isMuted && (
            <div className="flex items-end gap-0.5 h-2.5 shrink-0 ml-1">
              <span className="w-0.5 bg-amber-400 rounded-full animate-pulse h-2" />
              <span className="w-0.5 bg-yellow-300 rounded-full animate-bounce h-2.5" />
              <span className="w-0.5 bg-amber-500 rounded-full animate-pulse h-1.5" />
            </div>
          )}
        </button>

        {/* Control Buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            id="music-prev-btn"
            onClick={handlePrev}
            className="p-1.5 hover:bg-white/20 active:scale-95 rounded-lg transition-colors cursor-pointer text-slate-300 hover:text-white"
            title="Previous Track"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            id="music-play-pause-btn"
            onClick={handleTogglePlay}
            className={`p-1.5 rounded-xl transition-all cursor-pointer shadow-md ${
              bgmState.isPlaying
                ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
            title={bgmState.isPlaying ? 'Pause Background Music' : 'Play Background Music'}
          >
            {bgmState.isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
          </button>

          <button
            id="music-next-btn"
            onClick={handleNext}
            className="p-1.5 hover:bg-white/20 active:scale-95 rounded-lg transition-colors cursor-pointer text-slate-300 hover:text-white"
            title="Next Track"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Volume / Mute with mini slider */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              id="music-mute-btn"
              onClick={handleToggleMute}
              className={`p-1.5 hover:bg-white/20 active:scale-95 rounded-lg transition-colors cursor-pointer ${
                bgmState.isMuted ? 'text-red-400' : 'text-indigo-300 hover:text-white'
              }`}
              title={bgmState.isMuted ? 'Unmute BGM' : 'Mute BGM'}
            >
              {bgmState.isMuted || bgmState.volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : bgmState.volume < 0.5 ? (
                <Volume1 className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bgmState.isMuted ? 0 : bgmState.volume}
              onChange={handleVolumeChange}
              title={`Volume ${bgmState.isMuted ? '0' : Math.round(bgmState.volume * 100)}%`}
              className="w-16 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400 shrink-0"
            />
          </div>

          {/* Tracklist Menu Quick Toggle */}
          <button
            id="music-tracklist-quick-btn"
            onClick={() => {
              sounds.playClick();
              setShowTracklist((prev) => !prev);
            }}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer border-l border-white/20 pl-1.5 shrink-0 ${
              showTracklist
                ? 'text-amber-300 bg-white/20'
                : 'text-indigo-300 hover:text-white hover:bg-white/10'
            }`}
            title="Open Tracklist & Jukebox"
          >
            <ListMusic className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hidden File Input for Custom Music */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="audio/*"
        multiple
        className="hidden"
      />

      {/* Interactive Tracklist Dropdown Menu */}
      {showTracklist && (
        <div
          id="music-tracklist-popover"
          className="absolute left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-white/25 rounded-2xl shadow-2xl z-50 overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <ListMusic className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">Jukebox Tracklist</h4>
                <p className="text-[10px] text-slate-400">
                  {bgmState.tracks.length} tracks available
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  fileInputRef.current?.click();
                }}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shadow"
              >
                <Upload className="w-3 h-3" />
                Upload Audio
              </button>

              <button
                type="button"
                onClick={() => setShowTracklist(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tracklist Body */}
          <div className="max-h-72 overflow-y-auto p-2.5 space-y-3 divide-y divide-white/5">
            {/* Section: 8-Bit Retro Chiptunes */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between">
                <span>Retro Chiptunes (Zero-Lag Synthesizer)</span>
                <span className="text-[9px] text-slate-400 font-normal">Looping 8-Bit</span>
              </div>
              <div className="space-y-1 mt-1">
                {synthTracks.map(({ track, idx }) => {
                  const isCurrent = bgmState.currentTrackIndex === idx;
                  const isCurrentlyPlaying = isCurrent && bgmState.isPlaying;

                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handleSelectTrack(idx)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500/20 border border-amber-400/50 text-amber-200'
                          : 'hover:bg-white/10 text-slate-200 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {isCurrentlyPlaying ? (
                            <Pause className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current" />
                          )}
                        </div>
                        <span className="truncate font-medium">{track.name}</span>
                      </div>

                      {isCurrentlyPlaying && (
                        <div className="flex items-end gap-0.5 h-3 shrink-0">
                          <span className="w-0.5 bg-amber-400 rounded-full animate-pulse h-2.5" />
                          <span className="w-0.5 bg-yellow-300 rounded-full animate-bounce h-3" />
                          <span className="w-0.5 bg-amber-500 rounded-full animate-pulse h-1.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section: Custom Uploaded Tracks */}
            <div className="pt-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                <span>My Uploaded Music</span>
                <span className="text-[9px] text-slate-400 font-normal">
                  Saved to your browser
                </span>
              </div>

              {customTracks.length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-white/5 border border-dashed border-white/10 mt-1">
                  <p className="text-xs text-slate-300 font-medium">No custom music uploaded</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Upload your MP3, WAV, or audio files to enjoy your own soundtrack while playing.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      fileInputRef.current?.click();
                    }}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    Upload MP3 / Audio
                  </button>
                </div>
              ) : (
                <div className="space-y-1 mt-1">
                  {customTracks.map(({ track, idx }) => {
                    const isCurrent = bgmState.currentTrackIndex === idx;
                    const isCurrentlyPlaying = isCurrent && bgmState.isPlaying;

                    return (
                      <div
                        key={track.id}
                        onClick={() => handleSelectTrack(idx)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-all cursor-pointer group ${
                          isCurrent
                            ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-100'
                            : 'hover:bg-white/10 text-slate-200 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                              isCurrent
                                ? 'bg-emerald-500 text-slate-950 font-bold'
                                : 'bg-white/10 text-slate-300'
                            }`}
                          >
                            {isCurrentlyPlaying ? (
                              <Pause className="w-3 h-3 fill-current" />
                            ) : (
                              <Play className="w-3 h-3 fill-current" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{track.name}</p>
                            {track.fileSize && (
                              <span className="text-[9px] text-slate-400">
                                {formatFileSize(track.fileSize)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isCurrentlyPlaying && (
                            <div className="flex items-end gap-0.5 h-3">
                              <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2.5" />
                              <span className="w-0.5 bg-emerald-300 rounded-full animate-bounce h-3" />
                              <span className="w-0.5 bg-emerald-500 rounded-full animate-pulse h-1.5" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTrack(e, track.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Delete custom track"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Popover Footer Info */}
          <div className="px-4 py-2 border-t border-white/10 bg-black/40 flex items-center justify-between text-[10px] text-slate-400">
            <span>💾 Custom MP3s saved locally in your browser</span>
            <span className="text-slate-500">HTML5 + IndexedDB</span>
          </div>
        </div>
      )}
    </div>
  );
};
