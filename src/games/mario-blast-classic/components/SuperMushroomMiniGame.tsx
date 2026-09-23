import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import { Team } from '@/shared/types';
import { SuperMushroomOffer } from '@/games/mario-blast-classic/data/classicRewards';
import { CHARACTERS } from '@/games/mario-party-quiz/data/characters';
import { getRevealArt } from '@/games/mario-party-quiz/data/revealArt';
import { sounds } from '@/shared/utils/sound';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { InkedPayoutReveal } from '@/shared/components/InkedPayoutReveal';
import { TeamAvatar } from '@/games/mario-party-quiz/components/TeamAvatar';
import { GameModalShell } from '@/shared/components/GameModalShell';

interface SuperMushroomMiniGameProps {
  currentTeam: Team;
  offers: SuperMushroomOffer[];
  onResolved: (coins: SuperMushroomOffer) => void;
  testMode?: boolean;
}

const MUSHROOM_ART = getRevealArt('mushroom_x2') || '/assets/effects/reveal_mariosupermushroom.jpeg';

export const SuperMushroomMiniGame: React.FC<SuperMushroomMiniGameProps> = ({
  currentTeam,
  offers,
  onResolved,
  testMode = false,
}) => {
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [claimReady, setClaimReady] = useState(false);
  const char = CHARACTERS[currentTeam.characterId];
  const bloopered = Boolean(currentTeam.blooperNextCoin);
  const picked = pickedIndex !== null ? offers[pickedIndex] : null;

  useEffect(() => {
    if (pickedIndex === null) {
      setClaimReady(false);
      return;
    }
    if (!bloopered) {
      setClaimReady(true);
      return;
    }
    const t = window.setTimeout(() => setClaimReady(true), 1450);
    return () => window.clearTimeout(t);
  }, [pickedIndex, bloopered]);

  const handlePick = (idx: number) => {
    if (pickedIndex !== null) return;
    sounds.playBlockHit();
    setPickedIndex(idx);
    window.setTimeout(() => {
      if (!bloopered) sounds.playPowerUp();
    }, 420);
  };

  const faces = useMemo(
    () =>
      offers.map(coins => ({
        base: coins,
        doubled: coins * 2,
      })),
    [offers]
  );

  return (
    <GameModalShell zIndexClass="z-[70]" className="border-red-300/50">
      <div className="px-4 sm:px-6 py-3 border-b border-white/15 flex items-center justify-between gap-3 shrink-0">
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-2xl ${char.bgColor} bg-opacity-50 border border-white/20`}>
          <TeamAvatar characterId={currentTeam.characterId} size="sm" customUrl={currentTeam.customImageUrl} />
          <span className="text-sm font-bold text-white">{currentTeam.name}</span>
          <span className="flex items-center gap-0.5 rounded-full bg-red-700 border border-yellow-300 pl-0.5 pr-1.5 py-0.5">
            <img src={MUSHROOM_ART} alt="" className="w-5 h-5 rounded-full object-cover" />
            <span className="font-mario text-[11px] text-yellow-200 leading-none">×2</span>
          </span>
        </div>
        <div className="text-center">
          <h2 className="font-mario text-xl sm:text-3xl text-yellow-300 text-shadow-mario">SUPER MUSHROOM</h2>
          <p className="text-xs sm:text-sm text-amber-100 font-bold">Pick 1 of 3 — then ×2</p>
        </div>
        <div className="w-[120px] hidden sm:block" />
      </div>

      <div className="flex-1 min-h-0 p-4 sm:p-6 flex flex-col">
        <div className="flex-1 min-h-0 grid grid-cols-3 gap-3 sm:gap-5">
          {offers.map((_, idx) => {
            const isChosen = pickedIndex === idx;
            const revealing = pickedIndex !== null;
            const face = faces[idx];
            const showInked = Boolean(isChosen && bloopered);
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
                      testMode ? 'border-red-300' : 'border-yellow-300'
                    }`}
                  >
                    <img src={MUSHROOM_ART} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    {testMode ? (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1 p-2">
                        <span className="font-mario text-[10px] text-yellow-200 bg-black/50 px-1.5 py-0.5 rounded-full">TEST</span>
                        <span className="font-mario text-3xl sm:text-4xl text-yellow-100 text-shadow-mario leading-none">
                          +{face.base}
                        </span>
                        <span className="font-mario text-lg text-yellow-200">×2 → +{face.doubled}</span>
                      </div>
                    ) : (
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-950 bg-yellow-200/95 px-2 py-0.5 rounded-full">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <div
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    className={`absolute inset-0 rounded-2xl border-2 overflow-hidden flex flex-col items-center justify-center gap-1.5 p-3 ${
                      isChosen
                        ? 'border-yellow-200 bg-gradient-to-b from-red-500 via-rose-800 to-red-950'
                        : 'border-white/25 bg-gradient-to-b from-red-600 via-rose-900 to-slate-950'
                    }`}
                  >
                    {showInked ? (
                      <InkedPayoutReveal original={face.doubled} compact />
                    ) : (
                      <>
                        <span className="font-mario text-[10px] sm:text-xs text-white/80">{face.base} ×2</span>
                        <div className="inline-flex items-center gap-2 sm:gap-3">
                          <span className="font-mario text-[clamp(2.75rem,8vw,5.5rem)] text-yellow-300 leading-none text-shadow-mario">
                            +{face.doubled}
                          </span>
                          <MarioCoin size="2xl" />
                        </div>
                        <img
                          src={MUSHROOM_ART}
                          alt=""
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border-2 border-yellow-300"
                        />
                      </>
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

        {picked !== null && claimReady ? (
          <div className="h-[6.5rem] shrink-0 flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onResolved(picked)}
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-mario text-lg sm:text-xl rounded-2xl border-2 border-emerald-300 cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              CLAIM
              <MarioCoin size="lg" />
            </button>
          </div>
        ) : (
          <div className="h-[6.5rem] shrink-0" />
        )}
      </div>
    </GameModalShell>
  );
};
