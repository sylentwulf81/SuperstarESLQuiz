import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import { Team } from '@/shared/types';
import { MysteryBlockOutcome } from '@/games/mario-blast-classic/data/classicRewards';
import { CHARACTERS } from '@/games/mario-party-quiz/data/characters';
import { getRevealArt, PIRANHA_REVEAL_ART, pickMysteryBlockBacks } from '@/games/mario-party-quiz/data/revealArt';
import { sounds } from '@/shared/utils/sound';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { InkedPayoutReveal } from '@/shared/components/InkedPayoutReveal';
import { TeamAvatar } from '@/games/mario-party-quiz/components/TeamAvatar';
import { GameModalShell } from '@/shared/components/GameModalShell';

interface MysteryBlocksMiniGameProps {
  currentTeam: Team;
  outcomes: MysteryBlockOutcome[];
  onResolved: (outcome: MysteryBlockOutcome) => void;
  testMode?: boolean;
}

function outcomeLabel(outcome: MysteryBlockOutcome, mushroomBoost: boolean, bloopered: boolean) {
  if (outcome.kind === 'treasure') {
    const coins = mushroomBoost ? outcome.coins * 2 : outcome.coins;
    if (bloopered) return `Treasure +${coins}`;
    return `Treasure Block! +${coins}`;
  }
  if (outcome.kind === 'bust') return 'Empty Block… 0 coins';
  return 'Piranha Plant! Round Over!';
}

export const MysteryBlocksMiniGame: React.FC<MysteryBlocksMiniGameProps> = ({
  currentTeam,
  outcomes,
  onResolved,
  testMode = false,
}) => {
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [claimReady, setClaimReady] = useState(false);
  const char = CHARACTERS[currentTeam.characterId];

  const picked = pickedIndex !== null ? outcomes[pickedIndex] : null;
  const bloopered = Boolean(currentTeam.blooperNextCoin);
  const mushroomBoost = Boolean(currentTeam.doubleNextCoinReward) && !bloopered;

  useEffect(() => {
    if (pickedIndex === null) {
      setClaimReady(false);
      return;
    }
    const waitForInk = bloopered && picked?.kind === 'treasure';
    if (!waitForInk) {
      setClaimReady(true);
      return;
    }
    const t = window.setTimeout(() => setClaimReady(true), 1450);
    return () => window.clearTimeout(t);
  }, [pickedIndex, bloopered, picked?.kind]);

  const handlePick = (idx: number) => {
    if (pickedIndex !== null) return;
    sounds.playBlockHit();
    setPickedIndex(idx);
    const outcome = outcomes[idx];
    window.setTimeout(() => {
      if (outcome.kind === 'treasure') {
        if (bloopered) return;
        if (mushroomBoost) sounds.playPowerUp();
        else sounds.playStarCoin();
      } else if (outcome.kind === 'piranha') sounds.playWrong();
      else sounds.playPop();
    }, 420);
  };

  const blockBacks = useMemo(() => pickMysteryBlockBacks(outcomes.length), [outcomes.length]);

  const faces = useMemo(
    () =>
      outcomes.map(outcome => {
        if (outcome.kind === 'treasure') {
          const coins = mushroomBoost ? outcome.coins * 2 : outcome.coins;
          return {
            shell: 'from-amber-300 via-yellow-500 to-orange-700',
            title: mushroomBoost ? 'TREASURE ×2!' : 'TREASURE!',
            coins,
            mushroom: mushroomBoost,
            inkOriginal: coins,
          };
        }
        if (outcome.kind === 'bust') {
          return {
            shell: 'from-slate-500 via-slate-700 to-slate-950',
            title: 'EMPTY',
            coins: 0,
            mushroom: false,
            inkOriginal: undefined,
          };
        }
        return {
          shell: 'from-lime-500 via-green-800 to-red-950',
          art: PIRANHA_REVEAL_ART,
          title: 'PIRANHA!',
          coins: undefined,
          mushroom: false,
          inkOriginal: undefined,
        };
      }),
    [outcomes, mushroomBoost, bloopered]
  );

  return (
    <GameModalShell zIndexClass="z-[70]" className="border-amber-300/50">
        <div className="px-4 sm:px-6 py-3 border-b border-white/15 flex items-center justify-between gap-3 shrink-0">
          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-2xl ${char.bgColor} bg-opacity-50 border border-white/20`}>
            <TeamAvatar characterId={currentTeam.characterId} size="sm" customUrl={currentTeam.customImageUrl} />
            <span className="text-sm font-bold text-white">{currentTeam.name}</span>
            {mushroomBoost && (
              <span className="flex items-center gap-0.5 rounded-full bg-red-700 border border-yellow-300 pl-0.5 pr-1.5 py-0.5">
                <img
                  src={getRevealArt('mushroom_x2')}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="font-mario text-[11px] text-yellow-200 leading-none">×2</span>
              </span>
            )}
            {bloopered && (
              <span className="rounded-full bg-indigo-900 border border-indigo-200 px-1.5 py-0.5 font-mario text-[11px] text-indigo-100 leading-none">
                🦑1
              </span>
            )}
          </div>
          <div className="text-center">
            <h2 className="font-mario text-xl sm:text-3xl text-yellow-300 text-shadow-mario">MYSTERY BLOCKS</h2>
            <p className="text-xs sm:text-sm text-amber-100 font-bold">Pick 1 of 3 ? Blocks</p>
          </div>
          <div className="w-[120px] hidden sm:block" />
        </div>

        <div className="flex-1 min-h-0 p-4 sm:p-6 flex flex-col">
          <div className="flex-1 min-h-0 grid grid-cols-3 gap-3 sm:gap-5">
            {outcomes.map((_, idx) => {
              const isChosen = pickedIndex === idx;
              const revealing = pickedIndex !== null;
              const face = faces[idx];
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={revealing}
                  onClick={() => handlePick(idx)}
                  className={`relative h-full min-h-0 [perspective:900px] cursor-pointer disabled:cursor-default ${
                    isChosen ? 'z-[1]' : ''
                  }`}
                >
                  <motion.div
                    animate={{ rotateY: revealing ? 180 : 0 }}
                    transition={{
                      duration: 0.55,
                      delay: revealing && !isChosen ? 0.5 : 0,
                      ease: [0.34, 1.2, 0.64, 1],
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="relative w-full h-full"
                  >
                    <div
                      style={{ backfaceVisibility: 'hidden' }}
                      className={`absolute inset-0 rounded-2xl border-2 overflow-hidden shadow-xl ${
                        testMode ? 'border-red-300' : 'border-amber-300'
                      }`}
                    >
                      <img
                        src={blockBacks[idx]}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {testMode ? (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1 p-2">
                          <span className="font-mario text-[10px] text-yellow-200 bg-black/50 px-1.5 py-0.5 rounded-full">TEST</span>
                          <span className="font-mario text-lg sm:text-xl text-yellow-100 text-shadow-mario text-center leading-tight">
                            {face.title}
                          </span>
                          {face.coins != null && (
                            <span className="font-mario text-2xl text-yellow-200 leading-none">+{face.coins}</span>
                          )}
                        </div>
                      ) : (
                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-950 bg-yellow-200/95 px-2 py-0.5 rounded-full">
                          Block {idx + 1}
                        </span>
                      )}
                    </div>
                    <div
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      className={`absolute inset-0 rounded-2xl border-2 overflow-hidden ${
                        isChosen
                          ? `border-yellow-200 bg-gradient-to-b ${face.shell}`
                          : `border-white/25 bg-gradient-to-b ${face.shell}`
                      } ${'art' in face && face.art ? '' : 'flex flex-col items-center justify-center gap-2 p-3'}`}
                    >
                      {'art' in face && face.art ? (
                        <>
                          <img src={face.art} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex flex-col items-center">
                            <span className="font-mario text-lg sm:text-xl text-white text-shadow-mario">{face.title}</span>
                            <span className="font-mario text-sm sm:text-base text-yellow-100">Round Over</span>
                          </div>
                        </>
                      ) : isChosen && bloopered && face.inkOriginal != null ? (
                        <InkedPayoutReveal original={face.inkOriginal} compact />
                      ) : face.coins != null && face.coins > 0 ? (
                        <>
                          <div className="inline-flex items-center gap-2 sm:gap-3">
                            <span className="font-mario text-[clamp(2.75rem,8vw,5.5rem)] text-yellow-300 leading-none text-shadow-mario drop-shadow-[0_0_24px_rgba(250,204,21,0.55)]">
                              +{face.coins}
                            </span>
                            <MarioCoin size="2xl" />
                          </div>
                          <span className="font-mario text-base sm:text-xl text-white text-shadow-mario">{face.title}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-mario text-[clamp(3rem,9vw,6rem)] text-slate-100 leading-none text-shadow-mario">
                            0
                          </span>
                          <span className="font-mario text-base sm:text-xl text-white text-shadow-mario">{face.title}</span>
                        </>
                      )}
                      {face.mushroom && (
                        <img
                          src={getRevealArt('mushroom_x2')}
                          alt=""
                          className="absolute top-2 right-2 w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-yellow-300"
                        />
                      )}
                      {revealing && !isChosen && (
                        <div className="absolute inset-0 rounded-2xl bg-black/25 flex items-center justify-center pointer-events-none">
                          <X
                            className="w-20 h-20 sm:w-28 sm:h-28 text-rose-400 drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]"
                            strokeWidth={5}
                            aria-hidden
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </button>
              );
            })}
          </div>

          {picked && claimReady ? (
            <div className="h-[6.5rem] shrink-0 flex flex-col items-center justify-center gap-2">
              <p className="font-mario text-lg sm:text-2xl text-yellow-300 text-center">
                {picked.kind === 'treasure' && bloopered
                  ? ''
                  : outcomeLabel(picked, mushroomBoost, bloopered)}
              </p>
              <button
                type="button"
                onClick={() => onResolved(picked)}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-mario text-lg sm:text-xl rounded-2xl border-2 border-emerald-300 cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {picked.kind === 'piranha' ? 'ROUND OVER' : 'CONTINUE'}
                {picked.kind === 'treasure' && <MarioCoin size="lg" />}
              </button>
            </div>
          ) : (
            <div className="h-[6.5rem] shrink-0" />
          )}
        </div>
    </GameModalShell>
  );
};
