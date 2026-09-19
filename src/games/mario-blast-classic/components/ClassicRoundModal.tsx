import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, X, SkipForward } from 'lucide-react';
import { GameQuestion, RewardCard, Team } from '@/shared/types';
import { CHARACTERS } from '@/games/mario-party-quiz/data/characters';
import { sounds } from '@/shared/utils/sound';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { TeamAvatar } from '@/games/mario-party-quiz/components/TeamAvatar';

export interface ClassicCardSlot {
  claimedByTeamId?: string;
  card?: RewardCard;
}

interface ClassicRoundModalProps {
  question: GameQuestion;
  pickingTeam: Team;
  teams: Team[];
  slots: ClassicCardSlot[];
  drawnTeamIds: string[];
  selectedTeamId: string | null;
  cardsRemaining: number;
  onSelectTeam: (teamId: string) => void;
  onPickSlot: (slotIndex: number) => void;
  onEndRound: () => void;
  onCancelIfEmpty: () => void;
}

export const ClassicRoundModal: React.FC<ClassicRoundModalProps> = ({
  question,
  pickingTeam,
  teams,
  slots,
  drawnTeamIds,
  selectedTeamId,
  cardsRemaining,
  onSelectTeam,
  onPickSlot,
  onEndRound,
  onCancelIfEmpty,
}) => {
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const pickChar = CHARACTERS[pickingTeam.characterId];
  const selectedTeam = teams.find(t => t.id === selectedTeamId) || null;
  const anyClaimed = slots.some(s => s.claimedByTeamId);
  const answerText = question.type === 'open_trivia' ? question.answer : question.type === 'unscramble' ? question.targetWord : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/88">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="relative w-full max-w-6xl h-[min(94dvh,980px)] max-h-[94dvh] bg-slate-900 rounded-3xl border-2 border-white/25 shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-400 to-yellow-300" />

        <div className="bg-slate-800/95 px-3 sm:px-5 py-2.5 flex items-center justify-between border-b border-white/15 shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mario text-lg sm:text-2xl text-yellow-300 text-shadow-mario whitespace-nowrap">
              BLOCK #{question.blockNumber}
            </span>
            <span className="hidden sm:inline bg-rose-500/20 text-rose-100 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-300/40">
              Live answer — any team
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl ${pickChar.bgColor} bg-opacity-50 border border-white/20 text-xs font-bold text-white`}>
              <TeamAvatar characterId={pickingTeam.characterId} size="xs" customUrl={pickingTeam.customImageUrl} />
              <span className="max-w-[120px] truncate">Picked by {pickingTeam.name}</span>
            </div>
            <span className="font-mario text-sm text-amber-200">{cardsRemaining}/6 cards</span>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                if (anyClaimed) onEndRound();
                else onCancelIfEmpty();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-3 flex flex-col gap-3">
          <div className="shrink-0 space-y-2">
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-rose-200">
              Make this into a “Have you ever…?” question
            </p>
            <h2 className="font-mario text-xl sm:text-3xl lg:text-4xl text-yellow-300 leading-tight drop-shadow-md">
              {question.title}
            </h2>
            {question.type === 'open_trivia' && question.hint && !answerRevealed && (
              <p className="text-xs sm:text-sm text-indigo-200">Hint: {question.hint}</p>
            )}
            {answerText && (
              answerRevealed ? (
                <div className="p-3 sm:p-4 rounded-2xl bg-black/70 border border-white/20 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 block">Model answer</span>
                  <p className="font-mario text-lg sm:text-2xl text-white mt-1">{answerText}</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playCardFlip();
                    setAnswerRevealed(true);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm border border-indigo-300/40 cursor-pointer inline-flex items-center gap-2"
                >
                  <Eye className="w-4 h-4 text-yellow-300" />
                  Reveal answer
                </button>
              )
            )}
          </div>

          <div className="shrink-0">
            <p className="text-xs font-black uppercase tracking-wider text-amber-200 mb-2">
              {selectedTeam
                ? `Card for ${selectedTeam.name} — tap a remaining mystery card`
                : '1. Click the team that answered correctly'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {teams.map(team => {
                const char = CHARACTERS[team.characterId];
                const alreadyDrew = drawnTeamIds.includes(team.id);
                const isSelected = selectedTeamId === team.id;
                return (
                  <button
                    key={team.id}
                    type="button"
                    disabled={alreadyDrew}
                    onClick={() => {
                      if (alreadyDrew) return;
                      sounds.playPop();
                      onSelectTeam(team.id);
                    }}
                    className={`p-2 rounded-xl border text-white flex items-center gap-2 transition-all ${
                      alreadyDrew
                        ? 'opacity-40 cursor-not-allowed bg-slate-800 border-white/10'
                        : isSelected
                          ? `${char.bgColor} bg-opacity-60 border-yellow-300 ring-2 ring-yellow-400 cursor-pointer`
                          : 'bg-slate-800/80 border-white/15 hover:border-white/40 cursor-pointer'
                    }`}
                  >
                    <TeamAvatar characterId={team.characterId} size="sm" customUrl={team.customImageUrl} />
                    <div className="min-w-0 text-left">
                      <div className="text-xs font-bold truncate">{team.name}</div>
                      <div className="flex items-center gap-1 text-[10px] text-amber-200">
                        <MarioCoin size="xs" />
                        {team.coins}
                        {alreadyDrew && <span className="text-slate-400">· drawn</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 min-h-[180px] flex flex-col justify-center">
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {slots.map((slot, idx) => {
                const claimedTeam = slot.claimedByTeamId ? teams.find(t => t.id === slot.claimedByTeamId) : null;
                const canPick = Boolean(selectedTeamId) && !slot.claimedByTeamId;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!canPick}
                    onClick={() => canPick && onPickSlot(idx)}
                    className={`relative aspect-[2/3] rounded-2xl border-2 overflow-hidden transition-all ${
                      slot.claimedByTeamId
                        ? 'border-white/30 cursor-default'
                        : canPick
                          ? 'border-amber-300 cursor-pointer hover:scale-105 hover:shadow-[0_0_20px_rgba(250,204,21,0.45)]'
                          : 'border-white/15 opacity-70 cursor-not-allowed'
                    }`}
                  >
                    {slot.card ? (
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center gap-1 p-2">
                        <span className="font-mario text-[10px] sm:text-xs text-yellow-200 text-center leading-tight">
                          {slot.card.title}
                        </span>
                        {claimedTeam && (
                          <TeamAvatar characterId={claimedTeam.characterId} size="xs" customUrl={claimedTeam.customImageUrl} />
                        )}
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-rose-900 to-red-950 flex flex-col items-center justify-between p-2">
                        <span className="font-mario text-[9px] text-yellow-300 bg-black/50 px-1.5 py-0.5 rounded-full">
                          ★ MYSTERY ★
                        </span>
                        <span className="font-mario text-4xl sm:text-5xl text-yellow-300 text-shadow-mario">?</span>
                        <span className="text-[9px] font-black text-amber-200">{idx + 1}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-[11px] text-slate-300 font-semibold">
              One card per team. Faster answers get first pick from the remaining cards.
            </p>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onEndRound();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 font-bold text-xs border border-amber-400/40 cursor-pointer inline-flex items-center gap-1.5"
            >
              <SkipForward className="w-3.5 h-3.5" />
              End round
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
