import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, X, Check, OctagonX, Sparkles, ArrowRight } from 'lucide-react';
import { GameQuestion, Team } from '@/shared/types';
import { CHARACTERS } from '@/games/mario-party-quiz/data/characters';
import { sounds } from '@/shared/utils/sound';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { TeamAvatar } from '@/games/mario-party-quiz/components/TeamAvatar';
import { GameModalShell } from '@/shared/components/GameModalShell';
import { getRevealArt } from '@/games/mario-party-quiz/data/revealArt';
import { ClassicCardSlot, RoundOverReason } from '../engine';
import { MarkedPrompt } from '@/shared/components/MarkedPrompt';
import { MysteryCardBack } from '@/shared/components/MysteryCardBack';

export type { ClassicCardSlot };

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
  testGame?: boolean;
  isRoundOver?: boolean;
  roundOverReason?: RoundOverReason | null;
  onFinishRound?: () => void;
}

export const ClassicRoundModal = React.memo(function ClassicRoundModal({
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
  testGame = false,
  isRoundOver = false,
  roundOverReason = null,
  onFinishRound,
}: ClassicRoundModalProps) {
  const [answerRevealed, setAnswerRevealed] = useState(isRoundOver);

  const teamsMap = useMemo(() => {
    const map = new Map<string, Team>();
    for (const team of teams) {
      map.set(team.id, team);
    }
    return map;
  }, [teams]);

  const drawnTeamSet = useMemo(() => new Set(drawnTeamIds), [drawnTeamIds]);

  const pickChar = CHARACTERS[pickingTeam.characterId];
  const anyClaimed = slots.some(s => s.claimedByTeamId);
  const answerText =
    question.type === 'open_trivia'
      ? question.answer
      : question.type === 'unscramble'
      ? question.targetWord
      : question.type === 'true_false'
      ? `${question.isTrue ? 'TRUE' : 'FALSE'}${question.explanation ? ` — ${question.explanation}` : ''}`
      : undefined;

  const selectedTeam = selectedTeamId ? teamsMap.get(selectedTeamId) ?? null : null;

  return (
    <GameModalShell barColor={pickChar.accentColor} instant>
      {/* Top Header */}
      <div className={`${pickChar.bgColor} px-3 sm:px-5 py-2 flex items-center justify-between border-b-2 ${pickChar.borderColor} shrink-0 gap-3`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <TeamAvatar
            characterId={pickingTeam.characterId}
            size="md"
            customUrl={pickingTeam.customImageUrl}
            className="ring-2 ring-white/80 shadow-lg"
          />
          <div className="min-w-0 leading-tight">
            <span className="font-mario text-lg sm:text-2xl text-white text-shadow-mario whitespace-nowrap block">
              BLOCK #{question.blockNumber}
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-white/90 truncate block">
              Picked by {pickingTeam.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isRoundOver && (
            <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-mario text-xs sm:text-sm shadow-md border border-yellow-300">
              ROUND COMPLETE
            </span>
          )}
          {testGame && (
            <span className="hidden sm:inline-flex px-2 py-1 rounded-lg bg-red-700 border border-yellow-300 text-[10px] font-black uppercase tracking-widest text-yellow-200">
              Test
            </span>
          )}
          <span className="font-mario text-sm sm:text-base text-yellow-200 bg-black/40 px-2.5 py-1 rounded-xl border border-white/20">
            {cardsRemaining}/{slots.length} Cards
          </span>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              if (isRoundOver && onFinishRound) {
                onFinishRound();
              } else if (anyClaimed) {
                onEndRound();
              } else {
                onCancelIfEmpty();
              }
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Classroom Layout */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Vertical Teams Rail with Giant Scores */}
        <div className="w-full md:w-64 lg:w-72 bg-slate-950/70 border-b md:border-b-0 md:border-r border-white/15 p-2 sm:p-3 flex flex-col shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2 shrink-0">
            <span className="text-[11px] font-black uppercase tracking-wider text-yellow-300 font-mario">
              {isRoundOver ? 'SCORES' : '1. SELECT WINNER'}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              {drawnTeamIds.length}/{teams.length} Drew
            </span>
          </div>

          <div className="flex-1 min-h-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto px-1 py-1 [scrollbar-width:thin]">
            {teams.map(team => {
              const char = CHARACTERS[team.characterId];
              const alreadyDrew = drawnTeamSet.has(team.id);
              const isSelected = selectedTeamId === team.id;

              return (
                <button
                  key={team.id}
                  type="button"
                  disabled={alreadyDrew || isRoundOver}
                  onClick={() => {
                    if (alreadyDrew || isRoundOver) return;
                    sounds.playPop();
                    onSelectTeam(team.id);
                  }}
                  className={`relative flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-2xl border-2 transition-all text-left min-w-[9.5rem] md:min-w-0 ${
                    alreadyDrew
                      ? 'bg-emerald-950/60 border-emerald-400/50 cursor-default opacity-85'
                      : isSelected
                      ? `${char.bgColor} bg-opacity-70 border-yellow-300 ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] cursor-pointer z-10`
                      : isRoundOver
                      ? 'bg-slate-800/60 border-white/10 cursor-default'
                      : 'bg-slate-800/80 hover:bg-slate-750 border-white/15 hover:border-amber-300/60 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <TeamAvatar
                        characterId={team.characterId}
                        size="sm"
                        customUrl={team.customImageUrl}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl"
                      />
                      {alreadyDrew && (
                        <span className="absolute -top-1 -right-1 z-20 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 border-2 border-slate-900 shadow">
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 leading-tight">
                      <div className="font-mario text-xs sm:text-sm text-white truncate">
                        {team.name}
                      </div>
                      <div className="text-[10px] text-slate-300 font-bold">
                        {alreadyDrew ? 'Drew card' : isSelected ? 'Drawing now' : 'Can answer'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-xl border border-white/15">
                      <MarioCoin size="xs" />
                      <span className="font-mario text-base sm:text-lg text-yellow-300 leading-none">
                        {team.coins}
                      </span>
                    </div>
                    {alreadyDrew && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/90 text-white border border-emerald-200 shadow-sm shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Stage: Question Title, Answer Reveal & 6 Mystery Cards */}
        <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-5 overflow-y-auto">
          {/* Question Header & Prompt */}
          <div className="text-center px-1 sm:px-4 pb-2 shrink-0">
            <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.25em] text-rose-300 mb-1">
              {lessonGoal}
            </p>
            <h2 className="font-mario text-[clamp(1.4rem,3vw,2.75rem)] text-yellow-300 leading-tight text-shadow-mario">
              <MarkedPrompt text={question.title} />
            </h2>

            {/* Answer Box */}
            {question.type === 'true_false' ? (
              <div className="mt-3 mx-auto w-full max-w-xl flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-mario text-lg sm:text-2xl transition-all ${
                      answerRevealed
                        ? question.isTrue
                          ? 'bg-emerald-600 border-emerald-300 text-white ring-4 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] font-black'
                          : 'bg-slate-900/50 border-white/10 text-slate-500 opacity-40'
                        : 'bg-slate-800/90 text-white border-white/20'
                    }`}
                  >
                    <Check className={`w-6 h-6 ${answerRevealed && question.isTrue ? 'text-white' : 'text-emerald-400'}`} strokeWidth={3} />
                    <span>TRUE</span>
                  </div>
                  <div
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-mario text-lg sm:text-2xl transition-all ${
                      answerRevealed
                        ? !question.isTrue
                          ? 'bg-emerald-600 border-emerald-300 text-white ring-4 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] font-black'
                          : 'bg-slate-900/50 border-white/10 text-slate-500 opacity-40'
                        : 'bg-slate-800/90 text-white border-white/20'
                    }`}
                  >
                    <X className={`w-6 h-6 ${answerRevealed && !question.isTrue ? 'text-white' : 'text-rose-400'}`} strokeWidth={3} />
                    <span>FALSE</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  {!answerRevealed ? (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playCardFlip();
                        setAnswerRevealed(true);
                      }}
                      className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-mario text-sm sm:text-base border border-indigo-300/50 inline-flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                      <Eye className="w-5 h-5 text-yellow-300" />
                      <span>Reveal Answer</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {question.explanation && (
                        <span className="text-xs sm:text-sm text-yellow-200 font-bold bg-black/60 px-3 py-1.5 rounded-xl border border-white/15">
                          {question.explanation}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setAnswerRevealed(false);
                        }}
                        className="p-1.5 rounded-xl bg-black/55 hover:bg-white/20 text-indigo-100 border border-white/20 cursor-pointer"
                        title="Hide answer"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : answerText && (
              <div
                className={`relative mt-3 mx-auto w-full max-w-xl min-h-[3.5rem] px-5 rounded-2xl border-2 flex items-center justify-center transition-all ${
                  answerRevealed
                    ? 'bg-black/80 border-emerald-400/50 py-3 pr-14 shadow-lg'
                    : 'h-[3.5rem] bg-indigo-700/80 hover:bg-indigo-650 border-indigo-300/50'
                }`}
              >
                {answerRevealed ? (
                  <>
                    <p className="font-mario text-xl sm:text-3xl text-emerald-300 leading-snug text-center text-balance break-words w-full">
                      {answerText}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setAnswerRevealed(false);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/55 hover:bg-white/20 text-indigo-100 border border-white/20 cursor-pointer"
                      aria-label="Hide Answer"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playCardFlip();
                      setAnswerRevealed(true);
                    }}
                    className="absolute inset-0 w-full h-full rounded-[14px] text-white font-mario text-lg sm:text-2xl cursor-pointer inline-flex items-center justify-center gap-2.5"
                  >
                    <Eye className="w-6 h-6 text-yellow-300" />
                    Reveal Answer
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Cards Section */}
          <div className="mt-4 flex-1 min-h-0 rounded-3xl bg-black/35 border-t-2 border-t-amber-300/40 border-x border-b border-white/10 p-3 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mario text-xs sm:text-sm text-yellow-300">
                {selectedTeam
                  ? `2. ${selectedTeam.name} — Pick your Mystery Card!`
                  : isRoundOver
                  ? 'All Mystery Cards in this round:'
                  : '2. Select a team on the left, then pick a Mystery Card!'}
              </span>
              {selectedTeam && (
                <span className="font-mario text-xs text-amber-200 bg-amber-950/70 border border-amber-300/50 px-2 py-0.5 rounded-full">
                  Drawing as {selectedTeam.name}
                </span>
              )}
            </div>

            {/* 6 Cards Grid */}
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 w-full max-w-4xl">
                {slots.map((slot, idx) => {
                  const claimedTeam = slot.claimedByTeamId ? teamsMap.get(slot.claimedByTeamId) ?? null : null;
                  const canPick = Boolean(selectedTeamId) && !slot.claimedByTeamId && !isRoundOver;
                  const previewUnclaimed = Boolean(testGame && slot.card && !slot.claimedByTeamId);

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!canPick}
                      onClick={() => canPick && onPickSlot(idx)}
                      className={`relative aspect-[2/3] w-full rounded-2xl border-2 overflow-hidden transition-all select-none ${
                        slot.claimedByTeamId
                          ? 'border-white/30 cursor-default opacity-90'
                          : canPick
                          ? 'border-amber-300 cursor-pointer hover:scale-105 hover:brightness-110 shadow-lg'
                          : 'border-white/15 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {slot.claimedByTeamId && slot.card ? (
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-between p-2 text-center">
                          <span className="font-mario text-[10px] sm:text-xs text-yellow-200 leading-tight">
                            {slot.card.title}
                          </span>
                          {(slot.card.type === 'gold_star' ||
                            slot.card.type === 'bowser_revolution' ||
                            slot.card.type === 'bowser_fury') && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded-full border border-rose-400/40">
                              Round Over
                            </span>
                          )}
                          {claimedTeam && (
                            <div className="flex flex-col items-center gap-0.5 mt-auto">
                              <TeamAvatar
                                characterId={claimedTeam.characterId}
                                size="xs"
                                customUrl={claimedTeam.customImageUrl}
                              />
                              <span className="text-[9px] font-bold text-white truncate max-w-full">
                                {claimedTeam.name}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <MysteryCardBack
                          idx={idx}
                          slotNumber={idx + 1}
                          badgeText={previewUnclaimed ? 'TEST' : undefined}
                          previewTitle={previewUnclaimed ? slot.card?.title : undefined}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                {!answerRevealed ? (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playCardFlip();
                      setAnswerRevealed(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-700/80 hover:bg-indigo-600 text-white font-mario text-xs sm:text-sm border border-indigo-400/40 inline-flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Eye className="w-4 h-4 text-yellow-300" />
                    Reveal Answer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setAnswerRevealed(false);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mario text-xs sm:text-sm border border-white/20 inline-flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <EyeOff className="w-4 h-4" />
                    Hide Answer
                  </button>
                )}
              </div>

              {isRoundOver ? (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playGameStart();
                    if (onFinishRound) onFinishRound();
                    else onEndRound();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-mario text-sm sm:text-base border-2 border-yellow-200 cursor-pointer inline-flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-transform"
                >
                  <Sparkles className="w-4 h-4" />
                  FINISH ROUND & NEXT BLOCK
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onEndRound();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-800/90 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm border-2 border-rose-300/50 cursor-pointer inline-flex items-center gap-2 shadow"
                >
                  <OctagonX className="w-4 h-4" />
                  End Round
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </GameModalShell>
  );
});
