import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CinematicScene } from '../data/cinematicScenes';

interface InvasionCinematicProps {
  scenes: CinematicScene[];
  soundEnabled: boolean;
  skipLabel?: string;
  onDone: () => void;
}

export const InvasionCinematic: React.FC<InvasionCinematicProps> = ({
  scenes,
  soundEnabled,
  skipLabel = 'SKIP',
  onDone,
}) => {
  const [index, setIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const scene = scenes[index];
  const isLast = index >= scenes.length - 1;

  const advance = () => {
    if (isLast) onDoneRef.current();
    else setIndex(current => current + 1);
  };

  useEffect(() => {
    if (!scene) {
      onDoneRef.current();
      return;
    }
    const timer = window.setTimeout(() => {
      if (index >= scenes.length - 1) onDoneRef.current();
      else setIndex(current => current + 1);
    }, scene.durationMs);
    return () => window.clearTimeout(timer);
  }, [index, scene]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !scene) return;
    if (!soundEnabled) {
      audio.pause();
      return;
    }
    const nextSrc = new URL(scene.audio, window.location.origin).href;
    if (audio.src !== nextSrc) {
      audio.src = scene.audio;
      audio.currentTime = 0;
    }
    audio.loop = true;
    audio.volume = 0.72;
    void audio.play().catch(() => {});
  }, [scene, soundEnabled]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  if (!scene) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black cursor-pointer overflow-hidden"
      onClick={advance}
    >
      <audio ref={audioRef} preload="auto" />
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        >
          <img src={scene.bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
          {scene.layers.map((layer, layerIndex) => (
            <img
              key={`${scene.id}-${layerIndex}-${layer.src}`}
              src={layer.src}
              alt=""
              className="absolute pointer-events-none select-none"
              style={{
                left: layer.left,
                top: layer.top,
                width: layer.width,
                height: layer.height,
                mixBlendMode: layer.blend === 'normal' ? 'normal' : 'screen',
                zIndex: layer.z ?? 1,
                objectFit: 'contain',
              }}
            />
          ))}
          {(scene.headline || scene.subhead) && (
            <div className="absolute inset-x-0 top-[8%] z-20 text-center pointer-events-none px-4">
              {scene.headline && (
                <p className="font-mario text-4xl sm:text-7xl text-yellow-300 drop-shadow-[0_4px_0_#7f1d1d]">
                  {scene.headline}
                </p>
              )}
              {scene.subhead && (
                <p className="font-mario text-3xl sm:text-6xl text-white mt-3 drop-shadow-[0_4px_0_#0f172a]">
                  {scene.subhead}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <button
        type="button"
        onClick={event => {
          event.stopPropagation();
          onDone();
        }}
        className="absolute top-4 right-4 z-30 px-4 py-2 rounded-2xl bg-slate-950/80 border-2 border-yellow-300 text-yellow-300 font-mario text-lg sm:text-xl cursor-pointer"
      >
        {skipLabel}
      </button>
    </div>
  );
};
