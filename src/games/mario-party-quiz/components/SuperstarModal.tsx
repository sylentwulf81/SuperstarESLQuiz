import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, RotateCcw, X, Medal, Library } from 'lucide-react';
import { Team } from '@/shared/types';
import { CHARACTERS } from '@/games/mario-party-quiz/data/characters';
import { sounds } from '@/shared/utils/sound';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { TeamAvatar } from './TeamAvatar';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';

interface SuperstarModalProps {
  teams: Team[];
  onRestart: () => void;
  onClose: () => void;
  onExitToLauncher?: () => void;
}

export const SuperstarModal: React.FC<SuperstarModalProps> = ({
  teams,
  onRestart,
  onClose,
  onExitToLauncher,
}) => {
  useBodyScrollLock();
  // Determine winner (highest coins)
  const sortedTeams = [...teams].sort((a, b) => b.coins - a.coins);
  const winner = sortedTeams[0] || teams[0];
  const charInfo = CHARACTERS[winner.characterId];
  const victoryArt = charInfo.victoryImageUrl;

  useEffect(() => {
    sounds.playSuperstar();

    // Trigger colorful confetti shower
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [winner]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 overflow-hidden">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative w-full max-w-4xl max-h-[94vh] bg-slate-900 rounded-3xl border border-white/20 shadow-2xl overflow-y-auto my-auto text-center"
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 opacity-90 shadow-[0_0_20px_rgba(250,204,21,0.6)] z-20" />

        {/* Victory hero + Superstar banner */}
        <div className={`relative overflow-hidden border-b border-white/20 shadow-2xl ${charInfo.bgColor}`}>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="absolute top-4 right-4 z-30 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white transition-colors border border-white/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {victoryArt ? (
            <div className="relative w-full aspect-[4/3] sm:aspect-[1024/764] max-h-[42vh] sm:max-h-[48vh] bg-black/30">
              <img
                src={victoryArt}
                alt={`${charInfo.name} Superstar celebration`}
                className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 space-y-2">
                <h1 className="font-mario text-3xl sm:text-5xl text-white text-shadow-mario tracking-wider uppercase drop-shadow-2xl">
                  {charInfo.name}
                </h1>
                <h2 className="font-mario text-xl sm:text-3xl text-yellow-300 text-shadow-gold tracking-wide">
                  YOU ARE THE SUPERSTAR!
                </h2>
                <p className="text-indigo-100 text-sm sm:text-base font-bold italic">
                  &ldquo;{charInfo.catchphrase}&rdquo;
                </p>
                <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border mt-1 shadow-inner ${
                  winner.coins < 0
                    ? 'bg-red-950/90 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                    : 'bg-slate-800/90 border-yellow-300/60 glass-glow-gold'
                }`}>
                  <MarioCoin size="xl" animated />
                  <span className={`font-mario text-3xl sm:text-4xl ${
                    winner.coins < 0 ? 'text-red-500 font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-yellow-300 text-shadow-gold'
                  }`}>
                    {winner.coins} COINS
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 bg-opacity-70 relative overflow-hidden">
              <div className="absolute top-2 left-6 text-3xl animate-bounce">⭐</div>
              <div className="absolute top-4 right-16 text-3xl animate-bounce delay-150">⭐</div>
              <div className="absolute bottom-2 left-1/4 text-2xl animate-spin">✨</div>

              <div className="w-28 h-28 sm:w-36 sm:h-36 mx-auto mb-4 flex items-center justify-center">
                <TeamAvatar
                  characterId={winner.characterId}
                  size="2xl"
                  customUrl={winner.customImageUrl}
                  className="w-28 h-28 sm:w-36 sm:h-36 shadow-2xl ring-4 ring-yellow-400 rounded-3xl"
                />
              </div>

              <h1 className="font-mario text-4xl sm:text-6xl text-white text-shadow-mario tracking-wider uppercase drop-shadow-2xl">
                {charInfo.name}
              </h1>
              <h2 className="font-mario text-2xl sm:text-4xl text-yellow-300 text-shadow-gold mt-1 tracking-wide">
                YOU ARE THE SUPERSTAR!
              </h2>

              <p className="text-indigo-100 text-sm sm:text-base font-bold italic mt-2">
                &ldquo;{charInfo.catchphrase}&rdquo;
              </p>

              <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border mt-4 shadow-inner ${
                winner.coins < 0
                  ? 'bg-red-950/90 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                  : 'bg-slate-800/90 border-yellow-300/60 glass-glow-gold'
              }`}>
                <MarioCoin size="xl" animated />
                <span className={`font-mario text-3xl sm:text-4xl ${
                  winner.coins < 0 ? 'text-red-500 font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-yellow-300 text-shadow-gold'
                }`}>
                  {winner.coins} COINS
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Final Standings Table */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1">
            <h3 className="font-mario text-2xl sm:text-3xl text-yellow-400 flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" /> FINAL LEADERBOARD & STANDINGS
            </h3>
            <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">
              Official Results & Medals
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedTeams.map((team, index) => {
              const isWinner = index === 0;

              return (
                <div
                  key={team.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between shadow-lg ${
                    isWinner
                      ? 'bg-amber-950/70 border-yellow-400/80 ring-2 ring-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.25)]'
                      : 'bg-slate-800/80 border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-black/40 font-black text-sm border border-white/10">
                      {index === 0 && <Crown className="w-4 h-4 text-yellow-400" />}
                      {index === 1 && <Medal className="w-4 h-4 text-slate-300" />}
                      {index === 2 && <Medal className="w-4 h-4 text-amber-600" />}
                      {index > 2 && `#${index + 1}`}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <TeamAvatar characterId={team.characterId} size="sm" customUrl={team.customImageUrl} />
                        <span className="font-bold text-sm text-white">{team.name}</span>
                      </div>
                      <span className="text-[11px] text-indigo-200">
                        {team.blocksOpened} blocks opened
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex items-center justify-end gap-1.5 shrink-0">
                    <MarioCoin size="sm" animated={isWinner} />
                    <span className={`font-mario text-xl ${
                      team.coins < 0 ? 'text-red-400 font-bold drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]' : 'text-yellow-400 text-shadow-gold'
                    }`}>
                      {team.coins}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-white/15">
            {onExitToLauncher && (
              <button
                onClick={() => { sounds.playClick(); onExitToLauncher(); }}
                className="px-5 py-3 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 hover:text-white rounded-2xl font-bold text-sm transition-all border border-indigo-400/40 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Library className="w-4 h-4 text-indigo-300" />
                Exit to Library
              </button>
            )}

            <button
              onClick={() => { sounds.playClick(); onClose(); }}
              className="px-5 py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-sm transition-all border border-white/20 cursor-pointer"
            >
              Review Board
            </button>

            <button
              onClick={() => { sounds.playClick(); onRestart(); }}
              className="px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 hover:scale-105 text-white font-mario text-lg sm:text-xl rounded-2xl shadow-xl border border-emerald-300/80 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              START AGAIN
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
