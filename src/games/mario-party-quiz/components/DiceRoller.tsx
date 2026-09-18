import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Dices, Sparkles } from 'lucide-react';
import { sounds } from '@/shared/utils/sound';

interface DiceRollerProps {
  onRollComplete: (result: number) => void;
  title?: string;
  subtitle?: string;
  themeColor?: 'purple' | 'red' | 'gold';
  autoRoll?: boolean;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  onRollComplete,
  title = 'Roll the 6-Sided Die!',
  subtitle = 'Tap the die to roll and determine your steal amount',
  themeColor = 'purple',
  autoRoll = false,
}) => {
  const [face, setFace] = useState<number>(1);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const startRoll = () => {
    if (isRolling || hasRolled) return;
    setIsRolling(true);

    let counter = 0;
    const maxTicks = 16;
    const intervalTime = 65;

    timerRef.current = window.setInterval(() => {
      counter++;
      const randomFace = Math.floor(Math.random() * 6) + 1;
      setFace(randomFace);
      sounds.playDiceTick();

      if (counter >= maxTicks) {
        if (timerRef.current) clearInterval(timerRef.current);
        const finalResult = Math.floor(Math.random() * 6) + 1;
        setFace(finalResult);
        setIsRolling(false);
        setHasRolled(true);
        sounds.playDiceRoll();
        onRollComplete(finalResult);
      }
    }, intervalTime);
  };

  useEffect(() => {
    if (autoRoll) {
      const delay = window.setTimeout(() => {
        startRoll();
      }, 400);
      return () => clearTimeout(delay);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRoll]);

  // Pip coordinates for faces 1-6 in a 3x3 grid
  const renderPips = (num: number) => {
    // 3x3 grid positions:
    // [0, 1, 2]
    // [3, 4, 5]
    // [6, 7, 8]
    const pipsForNum: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    const activePips = pipsForNum[num] || [4];

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-16 h-16 sm:w-20 sm:h-20 p-2.5 sm:p-3 pointer-events-none">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(pos => {
          const isPip = activePips.includes(pos);
          const isCenter = pos === 4;
          return (
            <div key={pos} className="flex items-center justify-center">
              {isPip && (
                <div
                  className={`rounded-full shadow-inner ${
                    num === 1 && isCenter
                      ? 'w-4 h-4 sm:w-5 sm:h-5 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]'
                      : 'w-3 h-3 sm:w-3.5 sm:h-3.5 bg-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const bgStyles = {
    purple: 'bg-gradient-to-b from-purple-950/90 to-indigo-950/90 border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.3)]',
    red: 'bg-gradient-to-b from-red-950/90 to-amber-950/90 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]',
    gold: 'bg-gradient-to-b from-amber-950/90 to-yellow-950/90 border-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.3)]',
  }[themeColor];

  return (
    <div className={`p-4 sm:p-5 rounded-3xl border ${bgStyles} flex flex-col items-center text-center gap-3.5`}>
      <div>
        <h4 className="font-mario text-xl sm:text-2xl text-white text-shadow-mario flex items-center justify-center gap-2">
          <Dices className="w-6 h-6 text-yellow-300" />
          {title}
        </h4>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
          {subtitle}
        </p>
      </div>

      {/* 3D Mario Die */}
      <div className="relative my-2">
        <motion.button
          type="button"
          onClick={startRoll}
          disabled={isRolling || hasRolled}
          whileHover={!hasRolled && !isRolling ? { scale: 1.08 } : undefined}
          whileTap={!hasRolled && !isRolling ? { scale: 0.95 } : undefined}
          animate={
            isRolling
              ? {
                  rotate: [0, -15, 18, -12, 15, 0],
                  scale: [1, 1.15, 0.95, 1.1, 1],
                  y: [0, -18, 5, -12, 0],
                }
              : hasRolled
              ? { scale: [0.9, 1.12, 1] }
              : { y: [0, -4, 0] }
          }
          transition={
            isRolling
              ? { repeat: Infinity, duration: 0.35 }
              : hasRolled
              ? { type: 'spring', stiffness: 350, damping: 14 }
              : { repeat: Infinity, duration: 2, ease: 'easeInOut' }
          }
          className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-slate-200 border-4 border-slate-300 shadow-[0_12px_28px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center relative cursor-pointer ${
            isRolling ? 'cursor-wait ring-4 ring-yellow-400' : hasRolled ? 'ring-4 ring-emerald-400 cursor-default' : 'hover:ring-4 hover:ring-yellow-300'
          }`}
        >
          {/* Subtle 3D edge shading */}
          <div className="absolute inset-1 rounded-2xl border border-black/10 pointer-events-none" />
          {renderPips(face)}

          {/* Large corner badge showing the face number */}
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 border-2 border-slate-900 flex items-center justify-center shadow-lg">
            <span className="font-mario text-slate-950 text-sm leading-none">{face}</span>
          </div>
        </motion.button>
      </div>

      {/* Button & Result Display */}
      {!hasRolled ? (
        <button
          type="button"
          onClick={startRoll}
          disabled={isRolling}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-mario text-lg sm:text-xl rounded-2xl shadow-xl border-2 border-white flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Dices className="w-5 h-5 text-slate-950" />
          {isRolling ? 'ROLLING...' : 'TAP TO ROLL!'}
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/25 border border-emerald-400/60 text-emerald-200 font-mario text-lg sm:text-xl shadow-lg"
        >
          <Sparkles className="w-5 h-5 text-emerald-300" />
          <span>ROLLED A {face}!</span>
        </motion.div>
      )}
    </div>
  );
};
