import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { sounds } from '@/shared/utils/sound';

export type RoundOverReason = 'cards' | 'gold_star' | 'bowser_revolution' | 'piranha' | 'host';

interface RoundOverOverlayProps {
  reason: RoundOverReason;
  onContinue: () => void;
}

const COPY: Record<RoundOverReason, { title: string; body: string }> = {
  cards: {
    title: 'ROUND OVER!',
    body: 'All six mystery cards have been claimed. Time for the next question!',
  },
  gold_star: {
    title: 'ROUND OVER!',
    body: 'A Gold Star ended the round after that huge payout!',
  },
  bowser_revolution: {
    title: 'ROUND OVER!',
    body: "Bowser's Revolution shook the scores — this question round is done!",
  },
  piranha: {
    title: 'ROUND OVER!',
    body: 'A Piranha Plant popped out of the Mystery Blocks and ended the round!',
  },
  host: {
    title: 'ROUND OVER!',
    body: 'The host closed this round. On to the next question!',
  },
};

export const RoundOverOverlay: React.FC<RoundOverOverlayProps> = ({ reason, onContinue }) => {
  const copy = COPY[reason];
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl border-2 border-yellow-300 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(250,204,21,0.35)]"
      >
        <span className="inline-block px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest mb-3">
          Question complete
        </span>
        <h2 className="font-mario text-4xl sm:text-5xl text-yellow-300 text-shadow-mario leading-tight">
          {copy.title}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-200 font-semibold">{copy.body}</p>
        <button
          type="button"
          onClick={() => {
            sounds.playGameStart();
            onContinue();
          }}
          className="mt-6 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-mario text-lg sm:text-xl border-2 border-yellow-100 cursor-pointer hover:scale-105 active:scale-95 transition-transform inline-flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          NEXT QUESTION
        </button>
      </motion.div>
    </div>
  );
};
