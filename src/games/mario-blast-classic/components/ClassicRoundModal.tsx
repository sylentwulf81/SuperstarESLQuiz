import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, X, Check, OctagonX } from 'lucide-react';
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
  lessonGoal: string;
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
  lessonGoal,
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
  const anyClaimed = slots.some(s => s.claimedByTeamId);
  const answerText =
    question.type === 'open_trivia' ? question.answer : question.type === 'unscramble' ? question.targetWord : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/88">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="relative w-full max-w-[1600px] h-[min(96dvh,1080px)] max-h-[96dvh] bg-slate-900 rounded-3xl border-2 border-white/25 shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-400 to-yellow-300" />

        <div className="bg-slate-800/95 px-3 sm:px-5 py-2.5 flex items-center justify-between border-b border-white/15 shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mario text-lg sm:text-2xl text-yellow-300 text-shadow-mario whitespace-nowrap">
              BLOCK #{question.blockNumber}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl ${pickChar.bgColor} bg-opacity-50 border border-white/20 text-xs font-bold text-white`}
            >
              <TeamAvatar characterId={pickingTeam.characterId} size="xs" customUrl={pickingTeam.customImageUrl} />
              <span className="max-w-[120px] truncate">{pickingTeam.name}</span>
            </div>
            <span className="font-mario text-sm text-amber-200">{cardsRemaining}/6</span>
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

        <div className="flex-1 min-h-0 flex flex-col px-3 sm:px-5 py-3">
          <div className="shrink-0 text-center px-2 sm:px-6 pb-1">
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] text-rose-200 mb-1.5">
              {lessonGoal}
            </p>
            <h2 className="font-mario text-[clamp(1.7rem,3.6vw,3.35rem)] text-yellow-300 leading-tight text-shadow-mario">
              {question.title}
            </h2>
            {answerText && (
              <div
                className={`relative mt-3 mx-auto w-full min-h-[4.75rem] px-5 rounded-2xl border-2 flex items-center justify-center ${
                  answerRevealed
                    ? 'bg-black/75 border-white/25 py-3 pr-14'
                    : 'h-[4.75rem] overflow-hidden bg-indigo-700/75 border-indigo-300/50'
                }`}
              >
                {answerRevealed ? (
                  <>
                    <p className="font-mario text-[clamp(1.35rem,3vw,2.75rem)] text-white leading-snug text-center text-balance break-words w-full">
                      {answerText}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setAnswerRevealed(false);
                      }}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/55 hover:bg-white/20 text-indigo-100 border border-white/20 cursor-pointer"
                      aria-label="Hide"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playCardFlip();
                      setAnswerRevealed(true);
                    }}
                    className="absolute inset-0 w-full h-full rounded-[14px] hover:bg-indigo-600/80 text-white font-mario text-[clamp(1.15rem,2.2vw,1.85rem)] cursor-pointer inline-flex items-center justify-center gap-2.5"
                  >
                    <Eye className="w-6 h-6 text-yellow-300" />
                    Reveal answer
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-auto shrink-0 rounded-3xl bg-black/30 border-t-2 border-t-amber-300/45 border-x border-b border-white/10 px-3 sm:px-4 py-4">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
              {teams.map(team => {
                const char = CHARACTERS[team.characterId];
                const alreadyDrew = drawnTeamIds.includes(team.id);
                const isSelected = selectedTeamId === team.id;
                return (
                  <button
                    key={team.id}
                    type="button"
                    disabled={alreadyDrew}
                    aria-pressed={isSelected}
                    aria-label={team.name}
                    onClick={() => {
                      if (alreadyDrew) return;
                      sounds.playPop();
                      onSelectTeam(team.id);
                    }}
                    className={`relative flex flex-col items-center justify-center gap-1.5 p-2.5 sm:p-3 w-[8.5rem] sm:w-[10rem] min-h-[7.25rem] rounded-2xl border-2 text-white transition-all ${
                      alreadyDrew
                        ? 'bg-emerald-950/80 border-emerald-400 cursor-default'
                        : isSelected
                          ? `${char.bgColor} bg-opacity-80 border-yellow-300 ring-4 ring-yellow-400/80 cursor-pointer`
                          : 'bg-slate-800/80 border-white/15 hover:border-white/40 cursor-pointer'
                    }`}
                  >
                    {alreadyDrew && (
                      <span
                        className="absolute top-1.5 right-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 border-2 border-white shadow-[0_0_12px_rgba(16,185,129,0.9)]"
                        aria-hidden
                      >
                        <Check className="w-4 h-4 text-white" strokeWidth={3.5} />
                      </span>
                    )}
                    <div className="relative">
                      <TeamAvatar characterId={team.characterId} size="xl" customUrl={team.customImageUrl} />
                      {team.doubleNextCoinReward && (
                        <span
                          className="absolute -top-1.5 -left-1.5 z-10 flex items-center gap-0.5 rounded-full bg-red-700 border-2 border-yellow-300 pl-0.5 pr-1.5 py-0.5 shadow-[0_0_14px_rgba(250,204,21,0.6)]"
                          aria-hidden
                        >
                          <img
                            src="/assets/effects/reveal_mariosupermushroom.jpeg"
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="font-mario text-xs text-yellow-200 leading-none">×2</span>
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 w-full text-center leading-tight">
                      <div className="text-sm font-black truncate">{team.name}</div>
                      <div className="flex items-center justify-center gap-1 text-amber-200 mt-0.5">
                        <MarioCoin size="sm" />
                        <span className="font-mario text-base leading-none">{team.coins}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-2">
              <div className="grid grid-cols-6 gap-1.5 sm:gap-3 max-w-5xl mx-auto">
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
                          <TeamAvatar
                            characterId={claimedTeam.characterId}
                            size="xs"
                            customUrl={claimedTeam.customImageUrl}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-rose-900 to-red-950 flex flex-col items-center justify-between p-2">
                        <span className="font-mario text-[8px] sm:text-[10px] text-yellow-300 bg-black/50 px-1.5 py-0.5 rounded-full">
                          ★
                        </span>
                        <span className="font-mario text-3xl sm:text-5xl text-yellow-300 text-shadow-mario">?</span>
                        <span className="text-[9px] font-black text-amber-200">{idx + 1}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onEndRound();
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-800/90 hover:bg-rose-700 text-white font-bold text-sm sm:text-base border-2 border-rose-300/50 cursor-pointer inline-flex items-center gap-2 shadow-[0_0_16px_rgba(244,63,94,0.25)]"
              >
                <OctagonX className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
                End round
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
