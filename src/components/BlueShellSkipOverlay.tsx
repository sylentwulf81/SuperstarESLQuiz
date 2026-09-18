import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, SkipForward, Sparkles, Snowflake, CheckCircle } from 'lucide-react';
import { Team } from '../types';
import { TeamAvatar } from './TeamAvatar';

interface BlueShellSkipOverlayProps {
  skippedTeam: Team;
  nextTeam: Team;
  onClose: () => void;
}

export const BlueShellSkipOverlay: React.FC<BlueShellSkipOverlayProps> = ({
  skippedTeam,
  nextTeam,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div 
        id="blue-shell-skip-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative max-w-lg w-full bg-gradient-to-b from-sky-950 via-slate-900 to-indigo-950 border-3 border-sky-400/90 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(56,189,248,0.5)] overflow-hidden text-center text-white"
        >
          {/* Frost & Snowflake Ambient Ornaments */}
          <div className="absolute top-2 left-3 text-sky-400/30">
            <Snowflake className="w-8 h-8 animate-spin" style={{ animationDuration: '12s' }} />
          </div>
          <div className="absolute top-3 right-4 text-sky-400/30">
            <Snowflake className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Blue Shell Header Icon */}
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-500 to-indigo-600 border-2 border-sky-300 flex items-center justify-center shadow-[0_0_25px_rgba(56,189,248,0.6)] mb-3.5 animate-bounce">
            <span className="text-3xl sm:text-4xl" role="img" aria-label="Blue Shell">
              🐢💥
            </span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/25 border border-sky-300/50 text-sky-200 text-xs sm:text-sm font-bold tracking-wider uppercase mb-2">
            <ShieldAlert className="w-4 h-4 text-sky-300" />
            <span>Blue Shell Freeze</span>
          </div>

          {/* Title */}
          <h2 className="font-mario text-2xl sm:text-3xl md:text-4xl text-sky-200 text-shadow-sky mb-2 leading-tight">
            TURN SKIPPED!
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-sm mx-auto mb-5 leading-snug">
            <strong className="text-sky-300">{skippedTeam.name}</strong> was blasted by the Blue Shell! Their turn was automatically frozen.
          </p>

          {/* Visual Team Transition Cards */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 my-4 bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-sky-500/30 shadow-inner">
            {/* Frozen Team */}
            <div className="flex-1 flex flex-col items-center p-2 rounded-xl bg-sky-950/70 border border-sky-400/50 relative overflow-hidden">
              <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                FROZEN
              </div>
              <TeamAvatar
                characterId={skippedTeam.characterId}
                size="md"
                customUrl={skippedTeam.customImageUrl}
                className="opacity-75 grayscale-25 ring-2 ring-sky-400/70"
              />
              <span className="font-bold text-xs sm:text-sm text-slate-300 mt-1.5 truncate max-w-[110px]">
                {skippedTeam.name}
              </span>
              <span className="text-[10px] text-sky-300 font-bold uppercase tracking-wider">
                Skipped
              </span>
            </div>

            {/* Transition Arrow */}
            <div className="flex flex-col items-center justify-center text-sky-300 px-1">
              <SkipForward className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse text-sky-400" />
              <span className="text-[10px] uppercase font-bold text-sky-300 tracking-wider">
                Auto-Pass
              </span>
            </div>

            {/* Next Team */}
            <div className="flex-1 flex flex-col items-center p-2 rounded-xl bg-emerald-950/70 border border-emerald-400/60 shadow-[0_0_15px_rgba(52,211,153,0.25)] relative overflow-hidden">
              <div className="absolute -top-2 -right-2 bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                ACTIVE
              </div>
              <TeamAvatar
                characterId={nextTeam.characterId}
                size="md"
                customUrl={nextTeam.customImageUrl}
                className="ring-2 ring-emerald-400"
              />
              <span className="font-bold text-xs sm:text-sm text-emerald-200 mt-1.5 truncate max-w-[110px]">
                {nextTeam.name}
              </span>
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                Plays Now!
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="continue-after-skip-btn"
              onClick={onClose}
              className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-mario text-base sm:text-lg rounded-2xl shadow-xl border-2 border-sky-300/80 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sky-950/60"
            >
              <CheckCircle className="w-5 h-5 text-sky-200" />
              CONTINUE GAME ({secondsLeft}s)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
