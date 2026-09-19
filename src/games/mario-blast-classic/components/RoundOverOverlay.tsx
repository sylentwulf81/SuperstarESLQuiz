import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Star, Flame, Bug } from 'lucide-react';
import { sounds } from '@/shared/utils/sound';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';

export type RoundOverReason = 'cards' | 'gold_star' | 'bowser_revolution' | 'bowser_fury' | 'piranha' | 'host';

interface RoundOverOverlayProps {
  reason: RoundOverReason;
  onContinue: () => void;
}

const COPY: Record<RoundOverReason, { title: string; body: string; accent: string }> = {
  cards: {
    title: 'ROUND OVER!',
    body: 'All 6 cards claimed',
    accent: 'from-amber-400 to-yellow-300',
  },
  gold_star: {
    title: 'ROUND OVER!',
    body: 'Gold Star!',
    accent: 'from-yellow-300 to-amber-400',
  },
  bowser_revolution: {
    title: 'ROUND OVER!',
    body: "Bowser's Revolution!",
    accent: 'from-orange-500 to-red-600',
  },
  bowser_fury: {
    title: 'ROUND OVER!',
    body: "Bowser's Fury!",
    accent: 'from-red-500 to-amber-500',
  },
  piranha: {
    title: 'ROUND OVER!',
    body: 'Piranha Plant!',
    accent: 'from-lime-400 to-green-700',
  },
  host: {
    title: 'ROUND OVER!',
    body: 'Host closed the round',
    accent: 'from-rose-400 to-amber-300',
  },
};

function ReasonMark({ reason }: { reason: RoundOverReason }) {
  if (reason === 'gold_star') return <Star className="w-16 h-16 sm:w-24 sm:h-24 text-yellow-300 fill-yellow-300" />;
  if (reason === 'bowser_revolution' || reason === 'bowser_fury') {
    return <Flame className="w-16 h-16 sm:w-24 sm:h-24 text-orange-400 fill-red-500" />;
  }
  if (reason === 'piranha') return <Bug className="w-16 h-16 sm:w-24 sm:h-24 text-lime-300" />;
  return <Sparkles className="w-16 h-16 sm:w-24 sm:h-24 text-yellow-300" />;
}

export const RoundOverOverlay: React.FC<RoundOverOverlayProps> = ({ reason, onContinue }) => {
  useBodyScrollLock();
  const copy = COPY[reason];
  const hitCard = reason === 'gold_star' || reason === 'bowser_revolution' || reason === 'bowser_fury' || reason === 'piranha';

  useEffect(() => {
    if (reason === 'gold_star') sounds.playSuperstar();
    else if (reason === 'bowser_revolution') sounds.playBowser();
    else if (reason === 'bowser_fury') sounds.playBowserFury();
    else if (reason === 'piranha') sounds.playWrong();
    sounds.playRoundOver();
  }, [reason]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/90">
      <motion.div
        initial={{ scale: 0.45, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 12 }}
        className={`relative w-full max-w-3xl rounded-[2rem] border-4 border-yellow-300 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-8 sm:px-10 sm:py-12 text-center shadow-[0_0_80px_rgba(250,204,21,0.55)] ${
          hitCard ? 'ring-8 ring-red-500/40' : ''
        }`}
      >
        <motion.div
          animate={{ opacity: [0.35, 0.8, 0.35], scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className={`absolute inset-0 rounded-[2rem] bg-gradient-to-r ${copy.accent} opacity-20 pointer-events-none`}
        />
        <div className="relative">
          <div className="flex justify-center mb-3">
            <ReasonMark reason={reason} />
          </div>
          <motion.h2
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.08 }}
            className="font-mario text-[clamp(3rem,10vw,7rem)] text-yellow-300 text-shadow-mario leading-[0.9]"
          >
            ROUND OVER!
          </motion.h2>
          <p className="mt-4 font-mario text-xl sm:text-3xl text-white text-shadow-mario">{copy.body}</p>
          <button
            type="button"
            onClick={() => {
              sounds.playGameStart();
              onContinue();
            }}
            className="mt-8 px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-mario text-2xl sm:text-3xl border-4 border-yellow-100 cursor-pointer hover:scale-105 active:scale-95 transition-transform inline-flex items-center gap-2 shadow-[0_0_30px_rgba(250,204,21,0.45)]"
          >
            <Sparkles className="w-7 h-7" />
            NEXT
          </button>
        </div>
      </motion.div>
    </div>
  );
};
