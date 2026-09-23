import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { sounds } from '@/shared/utils/sound';

interface InkedPayoutRevealProps {
  original: number;
  /** Compact face for the 3-card mini-games. */
  compact?: boolean;
}

/**
 * Show the coin haul that would have paid, then slam it to +1 INKED.
 * Layout height is reserved so the claim button does not jump.
 */
export function InkedPayoutReveal({ original, compact = false }: InkedPayoutRevealProps) {
  const [inked, setInked] = useState(false);

  useEffect(() => {
    setInked(false);
    const t = window.setTimeout(() => {
      sounds.playBlooper();
      setInked(true);
    }, 1100);
    return () => window.clearTimeout(t);
  }, [original]);

  const numberClass = compact
    ? 'font-mario text-4xl sm:text-5xl leading-none text-shadow-mario'
    : 'font-mario text-[clamp(4.25rem,22cqh,10rem)] leading-none tracking-tight text-shadow-mario drop-shadow-[0_0_42px_rgba(250,204,21,0.6)]';

  return (
    <div
      className={`flex flex-col items-center justify-center ${compact ? 'h-[7.5rem] gap-1' : 'min-h-[11rem] gap-2 sm:gap-3'}`}
    >
      <AnimatePresence mode="wait">
        {!inked ? (
          <motion.div
            key="original"
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6, rotate: -8 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="inline-flex items-center gap-3 sm:gap-5">
              <span className={`${numberClass} text-yellow-300`}>+{original}</span>
              <MarioCoin size={compact ? 'md' : '2xl'} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="inked"
            initial={{ opacity: 0, scale: 1.45, rotate: 6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="inline-flex items-center gap-3 sm:gap-5">
              <span className={`${numberClass} text-indigo-100`}>+1</span>
              <MarioCoin size={compact ? 'md' : '2xl'} />
            </div>
            <span
              className={`inline-flex items-center justify-center rounded-full bg-indigo-700 border-2 border-indigo-200 font-mario text-white text-shadow-mario leading-none ${
                compact ? 'px-3 py-1 text-base' : 'px-4 py-1.5 text-xl sm:text-3xl'
              }`}
            >
              INKED!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
