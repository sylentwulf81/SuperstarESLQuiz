import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Crown, Library, Medal, RotateCcw, Trophy, X } from 'lucide-react';
import { InvasionTeam, factionOf } from '../data/factions';
import { sounds } from '@/shared/utils/sound';
import { FactionAvatar } from './FactionAvatar';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';

interface InvasionVictoryModalProps {
  teams: InvasionTeam[];
  counts: Record<string, number>;
  onRestart: () => void;
  onClose: () => void;
  onExitToLauncher: () => void;
}

export const InvasionVictoryModal: React.FC<InvasionVictoryModalProps> = ({
  teams,
  counts,
  onRestart,
  onClose,
  onExitToLauncher,
}) => {
  useBodyScrollLock();
  const sorted = [...teams].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
  const winner = sorted[0] ?? teams[0];
  const faction = factionOf(winner);
  const winnerCount = counts[winner.id] ?? 0;

  useEffect(() => {
    sounds.playSuperstar();
    const colors = ['#f472b6', '#22d3ee', '#84cc16', '#c084fc', '#f97316'];
    const end = Date.now() + 3500;
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [winner.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 overflow-hidden">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-4xl max-h-[94vh] bg-slate-900 rounded-3xl border border-white/20 shadow-2xl overflow-y-auto my-auto text-center"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-fuchsia-400 via-yellow-300 to-cyan-400" />
        <div className={`p-6 sm:p-8 ${faction.bgColor} bg-opacity-70 relative overflow-hidden border-b border-white/20`}>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white border border-white/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-28 h-28 sm:w-36 sm:h-36 mx-auto mb-4">
            <FactionAvatar
              factionId={winner.factionId}
              size="2xl"
              customUrl={winner.customImageUrl}
              className="w-28 h-28 sm:w-36 sm:h-36 shadow-2xl ring-4 ring-yellow-400 rounded-3xl"
            />
          </div>
          <h1 className="font-mario text-4xl sm:text-6xl text-white text-shadow-mario tracking-wider uppercase">
            {winner.name}
          </h1>
          <h2 className="font-mario text-2xl sm:text-4xl text-yellow-300 text-shadow-gold mt-1">EARTH IS YOURS!</h2>
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border mt-4 bg-slate-800/90 border-yellow-300/60">
            <Trophy className="w-8 h-8 text-yellow-300" />
            <span className="font-mario text-3xl sm:text-4xl text-yellow-300">{winnerCount}</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <h3 className="font-mario text-2xl text-yellow-400 flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6" /> STATES
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sorted.map((team, index) => (
              <div
                key={team.id}
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  index === 0
                    ? 'bg-amber-950/70 border-yellow-400/80 ring-2 ring-yellow-400/50'
                    : 'bg-slate-800/80 border-white/15'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center border border-white/10">
                    {index === 0 && <Crown className="w-4 h-4 text-yellow-400" />}
                    {index === 1 && <Medal className="w-4 h-4 text-slate-300" />}
                    {index === 2 && <Medal className="w-4 h-4 text-amber-600" />}
                    {index > 2 && <span className="text-xs font-black">#{index + 1}</span>}
                  </div>
                  <FactionAvatar factionId={team.factionId} size="sm" customUrl={team.customImageUrl} />
                  <span className="font-bold text-sm text-white">{team.name}</span>
                </div>
                <span className="font-mario text-xl text-yellow-400">{counts[team.id] ?? 0}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-white/15">
            <button
              onClick={() => {
                sounds.playClick();
                onExitToLauncher();
              }}
              className="px-5 py-3 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 hover:text-white rounded-2xl font-bold text-sm border border-indigo-400/40 flex items-center gap-1.5 cursor-pointer"
            >
              <Library className="w-4 h-4" />
              Exit to Library
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="px-5 py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-sm border border-white/20 cursor-pointer"
            >
              Review Map
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                onRestart();
              }}
              className="px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-mario text-lg rounded-2xl shadow-xl border border-emerald-300/80 flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              PLAY AGAIN
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
