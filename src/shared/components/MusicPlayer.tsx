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
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { sounds } from '@/shared/utils/sound';
import { bgm, BgmState, BgmTrack } from '@/shared/utils/bgm';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';

interface MusicPlayerProps {
  className?: string;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Fixed-width title that pauses, then scrolls like Apple Music / Spotify when text overflows. */
function MarqueeText({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [shiftPx, setShiftPx] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    const measure = measureRef.current;
    if (!viewport || !measure) return;

    const update = () => {
      const overflow = measure.scrollWidth - viewport.clientWidth;
      setShiftPx(overflow > 4 ? overflow : 0);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(viewport);
    ro.observe(measure);
    return () => ro.disconnect();
  }, [text]);

  // Hold ~20% of the cycle at each end; longer overflow → slower full loop
  const durationSec = shiftPx > 0 ? Math.min(18, Math.max(7, 6 + shiftPx / 22)) : 0;

  return (
    <div
      ref={viewportRef}
      className={`relative min-w-0 w-full overflow-hidden ${className}`}
      style={
        shiftPx > 0
          ? {
              maskImage:
                'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
              WebkitMaskImage:
                'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
            }
          : undefined
      }
    >
      {/* Hidden probe for accurate scrollWidth (unconstrained) */}
      <span
        ref={measureRef}
        aria-hidden
        className="invisible absolute left-0 top-0 whitespace-nowrap text-[0.6875rem] font-bold pointer-events-none"
      >
        {text}
      </span>
      <span
        key={`${text}-${shiftPx}`}
        title={text}
        className={`block whitespace-nowrap text-[0.6875rem] font-bold ${
          shiftPx > 0 ? 'will-change-transform animate-music-marquee' : 'truncate'
        }`}
        style={
          shiftPx > 0
            ? ({
                ['--marquee-shift' as string]: `-${Math.ceil(shiftPx)}px`,
                animationDuration: `${durationSec}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </div>
  );
}

function VisualizerBars({
  active,
  bars = 5,
  className = '',
}: {
  active: boolean;
  bars?: number;
  className?: string;
}) {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const dataRef = useRef(new Uint8Array(32));

  useEffect(() => {
    if (!active) {
      refs.current.forEach(el => {
        if (el) el.style.height = '15%';
      });
      return;
    }
    let frame = 0;
    let t0 = performance.now();
    const tick = (now: number) => {
      const data = dataRef.current;
      const ok = bgm.getVisualizerData(data);
      const step = Math.max(1, Math.floor(data.length / bars));
      const pulse = 0.35 + 0.25 * Math.sin((now - t0) / 140);
      for (let i = 0; i < bars; i++) {
        const el = refs.current[i];
        if (!el) continue;
        // Real analyser for chiptunes; gentle pulse fallback for MP3 element playback.
        const analysed = ok ? data[i * step] / 255 : 0;
        const v = analysed > 0.02 ? analysed : pulse * (0.55 + (i % 3) * 0.15);
        const h = Math.max(0.12, Math.min(1, v * 1.15));
        el.style.height = `${Math.round(h * 100)}%`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, bars]);

  return (
    <div className={`flex items-end gap-0.5 shrink-0 ${className || 'h-2.5'}`}>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          ref={el => {
            refs.current[i] = el;
          }}
          className="w-0.5 min-w-[2px] bg-amber-400 rounded-full transition-[height] duration-75"
          style={{ height: '15%' }}
        />
      ))}
    </div>
  );
}

type TrackRowProps = {
  track: BgmTrack;
  idx: number;
  isCurrent: boolean;
  isPlaying: boolean;
  accent: 'amber' | 'sky' | 'emerald';
  onSelect: (idx: number) => void;
  onDelete?: (e: React.MouseEvent, id: string) => void;
};

function TrackRow({
  track,
  idx,
  isCurrent,
  isPlaying,
  accent,
  onSelect,
  onDelete,
}: TrackRowProps): React.ReactElement {
  const accentOn =
    accent === 'amber'
      ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
      : accent === 'sky'
        ? 'bg-sky-500/20 border-sky-400/50 text-sky-100'
        : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100';
  const badgeOn =
    accent === 'amber'
      ? 'bg-amber-500 text-slate-950'
      : accent === 'sky'
        ? 'bg-sky-500 text-slate-950'
        : 'bg-emerald-500 text-slate-950';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(idx)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(idx);
        }
      }}
      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-all cursor-pointer border ${
        isCurrent ? accentOn : 'hover:bg-white/10 text-slate-200 border-transparent'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 pr-2">
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
            isCurrent ? badgeOn : 'bg-white/10 text-slate-300'
          }`}
        >
          {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{track.name}</p>
          {track.fileSize ? (
            <span className="text-[0.5625rem] text-slate-400">
              {(track.fileSize / (1024 * 1024)).toFixed(1)} MB
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isPlaying && <VisualizerBars active bars={3} />}
        {onDelete && (
          <button
            type="button"
            onClick={e => onDelete(e, track.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
            title="Delete custom track"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function BreakoutPlayer({
  bgmState,
  currentTrack,
  onClose,
  onTogglePlay,
  onPrev,
  onNext,
  onToggleMute,
  onVolume,
  onSeek,
  onOpenList,
}: {
  bgmState: BgmState;
  currentTrack?: BgmTrack;
  onClose: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleMute: () => void;
  onVolume: (v: number) => void;
  onSeek: (v: number) => void;
  onOpenList: () => void;
}) {
  useBodyScrollLock();
  const seekable = bgmState.seekable;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80">
      <div
        id="music-breakout-player"
        className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl overflow-hidden text-white"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/15 cursor-pointer"
          title="Close"
        >
          <Minimize2 className="w-4 h-4" />
        </button>

        <div className="px-6 pt-8 pb-4 flex flex-col items-center gap-4">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-400/30 to-indigo-600/40 border-2 border-amber-300/40 flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.25)]">
            <Music className="w-12 h-12 text-amber-200" />
          </div>
          <div className="text-center min-w-0 w-full px-2">
            <p className="text-[0.625rem] uppercase tracking-widest text-amber-300/80 font-bold">
              {currentTrack?.category === 'synth'
                ? 'Chiptune'
                : currentTrack?.category === 'custom'
                  ? 'My Upload'
                  : 'Game Music'}
            </p>
            <h3 className="font-mario text-xl sm:text-2xl text-yellow-100 text-shadow-mario mt-1 truncate">
              {currentTrack?.name || 'No Track'}
            </h3>
          </div>

          {(bgmState.isPlaying && !bgmState.isMuted) && (
            <VisualizerBars active bars={12} className="h-10 gap-1" />
          )}

          <div className="w-full space-y-1.5">
            {seekable ? (
              <>
                <input
                  type="range"
                  min={0}
                  max={Math.max(bgmState.duration, 0.1)}
                  step={0.1}
                  value={Math.min(bgmState.currentTime, bgmState.duration || 0)}
                  onChange={e => onSeek(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  title="Seek"
                />
                <div className="flex justify-between text-[0.625rem] text-slate-400 font-mono">
                  <span>{formatTime(bgmState.currentTime)}</span>
                  <span>{formatTime(bgmState.duration)}</span>
                </div>
              </>
            ) : (
              <p className="text-center text-xs text-sky-200/80 py-2">
                Looping chiptune — seek unavailable
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onPrev}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 cursor-pointer"
              title="Previous"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onTogglePlay}
              className={`p-4 rounded-2xl shadow-lg cursor-pointer ${
                bgmState.isPlaying
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
              title={bgmState.isPlaying ? 'Pause' : 'Play'}
            >
              {bgmState.isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current" />
              )}
            </button>
            <button
              type="button"
              onClick={onNext}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 cursor-pointer"
              title="Next"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full flex items-center gap-2 px-1">
            <button
              type="button"
              onClick={onToggleMute}
              className={`p-2 rounded-xl cursor-pointer ${
                bgmState.isMuted ? 'text-red-400' : 'text-indigo-200 hover:text-white'
              }`}
              title={bgmState.isMuted ? 'Unmute' : 'Mute'}
            >
              {bgmState.isMuted || bgmState.volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : bgmState.volume < 0.5 ? (
                <Volume1 className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={bgmState.isMuted ? 0 : bgmState.volume}
              onChange={e => onVolume(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400"
              title={`Volume ${Math.round((bgmState.isMuted ? 0 : bgmState.volume) * 100)}%`}
            />
            <span className="text-xs text-slate-400 w-10 text-right tabular-nums">
              {Math.round((bgmState.isMuted ? 0 : bgmState.volume) * 100)}%
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenList}
            className="mt-1 mb-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <ListMusic className="w-4 h-4 text-amber-300" />
            Browse Tracklist
          </button>
        </div>
      </div>
    </div>
  );
}

export const MusicPlayer = React.memo(function MusicPlayer({ className = '' }: MusicPlayerProps) {
  const [bgmState, setBgmState] = useState<BgmState>(() => ({
    isPlaying: false,
    isMuted: false,
    volume: 0.45,
    currentTrackIndex: 0,
    tracks: bgm.tracks,
    currentTime: 0,
    duration: 0,
    seekable: false,
  }));
  const [showTracklist, setShowTracklist] = useState(false);
  const [breakoutOpen, setBreakoutOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tracklistRef = useRef<HTMLDivElement>(null);

  useEffect(() => bgm.subscribe(setBgmState), []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tracklistRef.current && !tracklistRef.current.contains(e.target as Node)) {
        setShowTracklist(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowTracklist(false);
        setBreakoutOpen(false);
      }
    };
    if (showTracklist || breakoutOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showTracklist, breakoutOpen]);

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
  const handleVolumeChange = (val: number) => bgm.setVolume(val);
  const handleSeek = (val: number) => bgm.seek(val);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      sounds.playCoin();
      void bgm.addCustomTracks(e.target.files);
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

  const staticTracks = useMemo(
    () =>
      bgmState.tracks
        .map((track, idx) => ({ track, idx }))
        .filter(({ track }) => track.category === 'static'),
    [bgmState.tracks]
  );
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

  const vizActive = bgmState.isPlaying && !bgmState.isMuted;

  return (
    <div className={`relative w-[min(100%,20.75rem)] sm:w-[22.5rem] shrink-0 ${className}`} ref={tracklistRef}>
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-2xl border shadow-lg bg-slate-900/90 border-white/20 text-white select-none w-full">
        <button
          id="music-track-title-btn"
          type="button"
          onClick={() => {
            sounds.playClick();
            setShowTracklist(prev => !prev);
          }}
          className="flex items-center gap-1.5 min-w-0 flex-1 h-7 text-left hover:opacity-90 transition-opacity cursor-pointer group py-0.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-400"
          title={currentTrack?.name || 'Tracklist'}
        >
          <Music className="w-3.5 h-3.5 text-amber-300 shrink-0 group-hover:scale-110 transition-transform" />
          <div className="min-w-0 flex-1 overflow-hidden text-indigo-100 group-hover:text-amber-200 transition-colors">
            <MarqueeText text={currentTrack?.name || 'No Track'} />
          </div>
          <ChevronDown
            className={`w-3 h-3 text-white/50 shrink-0 transition-transform duration-200 ${
              showTracklist ? 'rotate-180 text-amber-300' : 'group-hover:text-white'
            }`}
          />
          <VisualizerBars
            active={vizActive}
            className={`hidden xs:flex ml-0.5 w-3 justify-end ${vizActive ? 'opacity-100' : 'opacity-0'}`}
          />
        </button>

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            id="music-prev-btn"
            onClick={handlePrev}
            className="p-1 sm:p-1.5 hover:bg-white/20 active:scale-95 rounded-lg transition-colors cursor-pointer text-slate-300 hover:text-white"
            title="Previous Track"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            id="music-play-pause-btn"
            onClick={handleTogglePlay}
            className={`p-1 sm:p-1.5 rounded-xl transition-all cursor-pointer shadow-md ${
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
            className="p-1 sm:p-1.5 hover:bg-white/20 active:scale-95 rounded-lg transition-colors cursor-pointer text-slate-300 hover:text-white"
            title="Next Track"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button
              id="music-mute-btn"
              onClick={handleToggleMute}
              className={`p-1 sm:p-1.5 hover:bg-white/20 active:scale-95 rounded-lg transition-colors cursor-pointer ${
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
              onChange={e => handleVolumeChange(parseFloat(e.target.value))}
              title={`Volume ${bgmState.isMuted ? '0' : Math.round(bgmState.volume * 100)}%`}
              className="w-12 sm:w-16 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400 shrink-0"
            />
          </div>

          <button
            id="music-breakout-btn"
            type="button"
            onClick={() => {
              sounds.playClick();
              setBreakoutOpen(true);
              setShowTracklist(false);
            }}
            className="p-1 sm:p-1.5 rounded-lg transition-colors cursor-pointer text-indigo-300 hover:text-white hover:bg-white/10 border-l border-white/20 pl-1 sm:pl-1.5"
            title="Open full music player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            id="music-tracklist-quick-btn"
            onClick={() => {
              sounds.playClick();
              setShowTracklist(prev => !prev);
            }}
            className={`p-1 sm:p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
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

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="audio/*"
        multiple
        className="hidden"
      />

      {showTracklist && (
        <div
          id="music-tracklist-popover"
          className="absolute right-0 top-full mt-2 w-72 sm:w-96 max-w-[calc(100vw-2rem)] bg-slate-900 border border-white/25 rounded-2xl shadow-2xl z-50 overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <ListMusic className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">Jukebox Tracklist</h4>
                <p className="text-[0.625rem] text-slate-400">{bgmState.tracks.length} tracks available</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  fileInputRef.current?.click();
                }}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[0.625rem] font-bold flex items-center gap-1 transition-colors shadow"
              >
                <Upload className="w-3 h-3" />
                Upload
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

          <div className="max-h-80 overflow-y-auto p-2.5 space-y-3 divide-y divide-white/5">
            <div>
              <div className="px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-amber-300">
                Game Music
              </div>
              <div className="space-y-1 mt-1">
                {staticTracks.map(({ track, idx }) => (
                  <div key={track.id}>
                    <TrackRow
                      track={track}
                      idx={idx}
                      isCurrent={bgmState.currentTrackIndex === idx}
                      isPlaying={bgmState.currentTrackIndex === idx && bgmState.isPlaying}
                      accent="amber"
                      onSelect={handleSelectTrack}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <div className="px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-sky-300">
                Chiptunes
              </div>
              <div className="space-y-1 mt-1">
                {synthTracks.map(({ track, idx }) => (
                  <div key={track.id}>
                    <TrackRow
                      track={track}
                      idx={idx}
                      isCurrent={bgmState.currentTrackIndex === idx}
                      isPlaying={bgmState.currentTrackIndex === idx && bgmState.isPlaying}
                      accent="sky"
                      onSelect={handleSelectTrack}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <div className="px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                <span>My Uploaded Music</span>
                <span className="text-[0.5625rem] text-slate-400 font-normal">Saved in browser</span>
              </div>
              {customTracks.length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-white/5 border border-dashed border-white/10 mt-1">
                  <p className="text-xs text-slate-300 font-medium">No custom music uploaded</p>
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
                  {customTracks.map(({ track, idx }) => (
                    <div key={track.id}>
                      <TrackRow
                        track={track}
                        idx={idx}
                        isCurrent={bgmState.currentTrackIndex === idx}
                        isPlaying={bgmState.currentTrackIndex === idx && bgmState.isPlaying}
                        accent="emerald"
                        onSelect={handleSelectTrack}
                        onDelete={handleDeleteTrack}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-4 py-2 border-t border-white/10 bg-black/40 flex items-center justify-between text-[0.625rem] text-slate-400">
            <span>MP3s + chiptunes + your uploads</span>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setShowTracklist(false);
                setBreakoutOpen(true);
              }}
              className="text-amber-300 hover:text-amber-200 font-bold cursor-pointer"
            >
              Open full player
            </button>
          </div>
        </div>
      )}

      {breakoutOpen && (
        <BreakoutPlayer
          bgmState={bgmState}
          currentTrack={currentTrack}
          onClose={() => setBreakoutOpen(false)}
          onTogglePlay={handleTogglePlay}
          onPrev={handlePrev}
          onNext={handleNext}
          onToggleMute={handleToggleMute}
          onVolume={handleVolumeChange}
          onSeek={handleSeek}
          onOpenList={() => {
            setBreakoutOpen(false);
            setShowTracklist(true);
          }}
        />
      )}
    </div>
  );
});
