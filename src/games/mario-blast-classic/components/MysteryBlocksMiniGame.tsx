import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Bug, Coins, Sparkles } from 'lucide-react';
import { Team } from '@/shared/types';
import { MysteryBlockOutcome } from '@/games/mario-blast-classic/data/classicRewards';
import { CHARACTERS } from '@/games/mario-party-quiz/data/characters';
import { sounds } from '@/shared/utils/sound';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { TeamAvatar } from '@/games/mario-party-quiz/components/TeamAvatar';

interface MysteryBlocksMiniGameProps {
  currentTeam: Team;
  outcomes: MysteryBlockOutcome[];
  onResolved: (outcome: MysteryBlockOutcome) => void;
}

function outcomeLabel(outcome: MysteryBlockOutcome) {
  if (outcome.kind === 'treasure') return `Treasure Block! +${outcome.coins}`;
  if (outcome.kind === 'bust') return 'Empty Block… 0 coins';
  return 'Piranha Plant! Round Over!';
}

export const MysteryBlocksMiniGame: React.FC<MysteryBlocksMiniGameProps> = ({
  currentTeam,
  outcomes,
  onResolved,
}) => {
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const char = CHARACTERS[currentTeam.characterId];

  const picked = pickedIndex !== null ? outcomes[pickedIndex] : null;

  const handlePick = (idx: number) => {
    if (pickedIndex !== null) return;
    sounds.playBlockHit();
    setPickedIndex(idx);
    const outcome = outcomes[idx];
    window.setTimeout(() => {
      if (outcome.kind === 'treasure') sounds.playStarCoin();
      else if (outcome.kind === 'piranha') sounds.playWrong();
      else sounds.playPop();
    }, 420);
  };

  const faces = useMemo(
    () =>
      outcomes.map((outcome, idx) => {
        if (outcome.kind === 'treasure') {
          return {
            shell: 'from-amber-300 via-yellow-500 to-orange-700',
            icon: <Coins className="w-14 h-14 text-yellow-100 fill-yellow-300" />,
            title: 'TREASURE!',
            sub: `+${outcome.coins} Coins`,
          };
        }
        if (outcome.kind === 'bust') {
          return {
            shell: 'from-slate-500 via-slate-700 to-slate-950',
            icon: <span className="font-mario text-5xl text-slate-200">0</span>,
            title: 'EMPTY',
            sub: '0 Coins',
          };
        }
        return {
          shell: 'from-lime-500 via-green-800 to-red-950',
          icon: <Bug className="w-14 h-14 text-lime-200" />,
          title: 'PIRANHA!',
          sub: 'Round Over',
        };
      }),
    [outcomes]
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-slate-950/90">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-4xl bg-slate-900 rounded-3xl border-2 border-amber-300/50 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500" />
        <div className="px-4 sm:px-6 py-3 border-b border-white/15 flex items-center justify-between gap-3">
          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-2xl ${char.bgColor} bg-opacity-50 border border-white/20`}>
            <TeamAvatar characterId={currentTeam.characterId} size="sm" customUrl={currentTeam.customImageUrl} />
            <span className="text-sm font-bold text-white">{currentTeam.name}</span>
          </div>
          <div className="text-center">
            <h2 className="font-mario text-xl sm:text-3xl text-yellow-300 text-shadow-mario">MYSTERY BLOCKS</h2>
            <p className="text-xs sm:text-sm text-amber-100 font-bold">Pick 1 of 3 ? Blocks</p>
          </div>
          <div className="w-[120px] hidden sm:block" />
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            {outcomes.map((_, idx) => {
              const flipped = pickedIndex === idx;
              const face = faces[idx];
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={pickedIndex !== null}
                  onClick={() => handlePick(idx)}
                  className="relative aspect-[3/4] [perspective:900px] cursor-pointer disabled:cursor-default"
                >
                  <motion.div
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.55, ease: [0.34, 1.2, 0.64, 1] }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="relative w-full h-full"
                  >
                    <div
                      style={{ backfaceVisibility: 'hidden' }}
                      className="absolute inset-0 rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-yellow-400 via-amber-600 to-orange-900 flex flex-col items-center justify-center gap-3 shadow-xl"
                    >
                      <span className="font-mario text-6xl sm:text-7xl text-yellow-100 text-shadow-mario">?</span>
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-950 bg-yellow-200 px-2 py-0.5 rounded-full">
                        Block {idx + 1}
                      </span>
                    </div>
                    <div
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      className={`absolute inset-0 rounded-2xl border-2 border-white/40 bg-gradient-to-b ${face.shell} flex flex-col items-center justify-center gap-2 p-3`}
                    >
                      {face.icon}
                      <span className="font-mario text-lg sm:text-xl text-white text-shadow-mario">{face.title}</span>
                      <span className="text-xs sm:text-sm font-bold text-yellow-100">{face.sub}</span>
                    </div>
                  </motion.div>
                </button>
              );
            })}
          </div>

          {picked && (
            <div className="mt-5 flex flex-col items-center gap-3">
              <p className="font-mario text-lg sm:text-2xl text-yellow-300 text-center">
                {outcomeLabel(picked)}
              </p>
              <button
                type="button"
                onClick={() => onResolved(picked)}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-mario text-lg sm:text-xl rounded-2xl border-2 border-emerald-300 cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {picked.kind === 'piranha' ? 'ROUND OVER' : 'CONTINUE'}
                {picked.kind === 'treasure' && <MarioCoin size="sm" />}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
