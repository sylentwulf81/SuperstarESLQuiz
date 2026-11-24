import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, X, Check, OctagonX, Sparkles, ArrowRight, Star, Ban, ArrowLeft, Layers, Plus, Minus } from 'lucide-react';
import { GameQuestion, Team } from '@/shared/types';
import { CHARACTERS } from '@/games/mario-party-quiz/data/characters';
import { sounds } from '@/shared/utils/sound';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { TeamAvatar } from '@/games/mario-party-quiz/components/TeamAvatar';
import { GameModalShell } from '@/shared/components/GameModalShell';
import { ClassicCardSlot, RoundOverReason } from '../engine';
import { MarkedPrompt } from '@/shared/components/MarkedPrompt';
import { MysteryCardBack } from '@/shared/components/MysteryCardBack';
import { shuffleWordLetters } from '@/shared/utils/shuffle';

export type { ClassicCardSlot };

const EMPTY_IDS: string[] = [];

interface ClassicRoundModalProps {
  question: GameQuestion;
  lessonGoal: string;
  pickingTeam: Team;
  teams: Team[];
  slots: ClassicCardSlot[];
  drawnTeamIds: string[];
  passedTeamIds?: string[];
  selectedTeamId: string | null;
  cardsRemaining: number;
  onSelectTeam: (teamId: string) => void;
  onTogglePassTeam?: (teamId: string) => void;
  /** Teacher edge-case coin fix (same as board sidebars) */
  onAdjustCoins?: (teamId: string, delta: number) => void;
  onPickSlot: (slotIndex: number) => void;
  onEndRound: () => void;
  onCancelIfEmpty: () => void;
  /** Close the modal without ending the round */
  onBack?: () => void;
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
  passedTeamIds = EMPTY_IDS,
  selectedTeamId,
  cardsRemaining,
  onSelectTeam,
  onTogglePassTeam,
  onAdjustCoins,
  onPickSlot,
  onEndRound,
  onCancelIfEmpty,
  onBack,
  testGame = false,
  isRoundOver = false,
  roundOverReason = null,
  onFinishRound,
}: ClassicRoundModalProps) {
  const [answerRevealed, setAnswerRevealed] = useState(isRoundOver);
  const [showScrambledClue, setShowScrambledClue] = useState(false);
  /** Host can pin the tray open; otherwise it appears when a team is selected. */
  const [cardTrayPinned, setCardTrayPinned] = useState(false);
  const cardTrayRef = useRef<HTMLDivElement>(null);

  const scrambledChars = useMemo(() => {
    if (question.type !== 'unscramble') return [];
    const targetStr = question.targetWord || (Array.isArray(question.scrambledLetters) ? question.scrambledLetters.join('') : '') || '';
    return shuffleWordLetters(targetStr);
  }, [question]);

  const teamsMap = useMemo(() => {
    const map = new Map<string, Team>();
    for (const team of teams) {
      map.set(team.id, team);
    }
    return map;
  }, [teams]);

  const drawnTeamSet = useMemo(() => new Set(drawnTeamIds), [drawnTeamIds]);
  const passedTeamSet = useMemo(() => new Set(passedTeamIds), [passedTeamIds]);

  // Keys 1-8 select the matching team (same rules as clicking its row)
  useEffect(() => {
    if (isRoundOver) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (!/^[1-8]$/.test(e.key)) return;
      const team = teams[Number(e.key) - 1];
      if (!team || drawnTeamSet.has(team.id) || passedTeamSet.has(team.id)) return;
      sounds.playPop();
      onSelectTeam(team.id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isRoundOver, teams, drawnTeamSet, passedTeamSet, onSelectTeam]);

  const pickChar = CHARACTERS[pickingTeam.characterId];
  const answerText =
    question.type === 'open_trivia'
      ? question.answer
      : question.type === 'unscramble'
      ? question.targetWord
      : question.type === 'true_false'
      ? `${question.isTrue ? 'TRUE' : 'FALSE'}${question.explanation ? ` — ${question.explanation}` : ''}`
      : question.type === 'multiple_choice'
      ? `${['A', 'B', 'C', 'D'][question.correctIndex]}: ${question.options[question.correctIndex]}`
      : undefined;

  const selectedTeam = selectedTeamId ? teamsMap.get(selectedTeamId) ?? null : null;
  const isMysteryBlock = question.type === 'mystery_card';
  const selectedAlreadyDrew = Boolean(selectedTeamId && drawnTeamSet.has(selectedTeamId));
  const canSkipSelected =
    Boolean(onTogglePassTeam) &&
    Boolean(selectedTeamId) &&
    !selectedAlreadyDrew &&
    !isRoundOver;
  const anyCardClaimed = useMemo(() => slots.some(s => Boolean(s.claimedByTeamId)), [slots]);
  const showCardTray = isRoundOver || Boolean(selectedTeamId) || cardTrayPinned || anyCardClaimed;
  const cardsActionLit = Boolean(selectedTeamId) && !selectedAlreadyDrew && !isRoundOver;

  // One reveal control per question, placed with the answer (choice questions only)
  const choiceRevealToggle = (
    <div className="flex justify-center mt-1">
      <button
        type="button"
        onClick={() => {
          if (answerRevealed) {
            sounds.playClick();
          } else {
            sounds.playCardFlip();
          }
          setAnswerRevealed(prev => !prev);
        }}
        className={`px-8 py-3.5 rounded-2xl font-mario text-xl sm:text-2xl border inline-flex items-center gap-2 cursor-pointer shadow transition-colors ${
          answerRevealed
            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/20'
            : 'bg-indigo-700/80 hover:bg-indigo-600 text-white border-indigo-400/40'
        }`}
      >
        {answerRevealed ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6 text-yellow-300" />}
        {answerRevealed ? 'Hide Answer' : 'Reveal Answer'}
      </button>
    </div>
  );

  return (
    <GameModalShell barColor={pickChar.accentColor} instant fullscreen>
      {/* Top Header */}
      <div className={`${pickChar.bgColor} px-3 sm:px-5 py-2 flex items-center justify-between border-b-2 ${pickChar.borderColor} shrink-0 gap-3`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {!isRoundOver && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                (onBack ?? onCancelIfEmpty)();
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer inline-flex items-center gap-1.5 font-mario text-sm shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
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
            <span className="text-[0.6875rem] font-black uppercase tracking-wider text-white/90 truncate block">
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
            <span className="hidden sm:inline-flex px-2 py-1 rounded-lg bg-red-700 border border-yellow-300 text-[0.625rem] font-black uppercase tracking-widest text-yellow-200">
              Test
            </span>
          )}
          <span className="font-mario text-sm sm:text-base text-yellow-200 bg-black/40 px-2.5 py-1 rounded-xl border border-white/20">
            {cardsRemaining}/{slots.length} Cards
          </span>
          {isRoundOver ? (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                if (onFinishRound) onFinishRound();
                else onEndRound();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onEndRound();
              }}
              className="px-3 py-2 rounded-xl bg-rose-800/90 hover:bg-rose-700 text-white font-mario text-sm border-2 border-rose-300/50 cursor-pointer inline-flex items-center gap-2 shadow"
            >
              <OctagonX className="w-4 h-4" />
              End Round
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Classroom Layout */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: big score rows + footer Skip / Cards */}
        <div className="w-full md:w-[22rem] lg:w-[26rem] bg-slate-950/70 border-b md:border-b-0 md:border-r border-white/15 flex flex-col shrink-0 max-h-36 sm:max-h-40 md:max-h-none">
          <div className="flex items-center justify-between px-2.5 sm:px-3 pt-2 pb-1.5 border-b border-white/10 shrink-0">
            <span className="text-[0.6875rem] font-black uppercase tracking-wider text-yellow-300 font-mario">
              {isRoundOver ? 'SCORES' : '1. SELECT WINNER'}
            </span>
            <span className="text-[0.625rem] text-slate-400 font-bold tabular-nums">
              {drawnTeamIds.length}/{teams.length}
              {passedTeamIds.length > 0 ? ` · ${passedTeamIds.length}⏭` : ''}
            </span>
          </div>

          <div className="flex-1 min-h-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto px-2 sm:px-2.5 py-2 [scrollbar-width:thin]">
            {teams.map((team, teamIdx) => {
              const char = CHARACTERS[team.characterId];
              const alreadyDrew = drawnTeamSet.has(team.id);
              const isPassed = passedTeamSet.has(team.id);
              const isSelected = selectedTeamId === team.id;

              const rowDisabled = alreadyDrew || isRoundOver || (isPassed && !onTogglePassTeam);

              return (
                <div
                  key={team.id}
                  className={`relative flex items-center gap-1.5 sm:gap-2 min-w-[16rem] md:min-w-0 p-2 sm:p-2.5 rounded-2xl border-2 transition-all ${
                    alreadyDrew
                      ? 'bg-emerald-950/60 border-emerald-400/50'
                      : isPassed
                      ? 'bg-rose-950/45 border-rose-400/35'
                      : isSelected
                      ? `${char.bgColor} bg-opacity-75 border-yellow-300 ring-2 ring-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.45)] z-10`
                      : isRoundOver
                      ? 'bg-slate-800/60 border-white/10'
                      : 'bg-slate-800/85 border-white/15'
                  }`}
                >
                  <button
                    type="button"
                    disabled={rowDisabled}
                    onClick={() => {
                      if (alreadyDrew || isRoundOver) return;
                      // Tap a skipped row to undo; engine clears selection when skipping.
                      if (isPassed) {
                        if (!onTogglePassTeam) return;
                        sounds.playClick();
                        onTogglePassTeam(team.id);
                        return;
                      }
                      sounds.playPop();
                      onSelectTeam(team.id);
                    }}
                    title={isPassed ? `Undo skip — let ${team.name} draw` : undefined}
                    className={`flex-1 min-w-0 flex items-center gap-2 sm:gap-2.5 text-left rounded-xl ${
                      alreadyDrew || isRoundOver
                        ? 'cursor-default'
                        : isPassed
                        ? 'cursor-pointer hover:opacity-100'
                        : 'cursor-pointer hover:brightness-110'
                    }`}
                  >
                    <span
                      className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl font-mario text-lg sm:text-xl border-2 ${
                        isSelected
                          ? 'bg-yellow-300 text-slate-900 border-yellow-100'
                          : 'bg-black/55 text-yellow-300 border-amber-300/40'
                      }`}
                      aria-hidden="true"
                    >
                      {teamIdx + 1}
                    </span>

                    <div className="relative shrink-0">
                      <TeamAvatar
                        characterId={team.characterId}
                        size="md"
                        customUrl={team.customImageUrl}
                        className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl ring-2 ring-white/25"
                      />
                      {alreadyDrew && (
                        <span className="absolute -top-1 -right-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-slate-900 shadow">
                          <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
                        </span>
                      )}
                      {isPassed && (
                        <span className="absolute -top-1 -right-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 border-2 border-slate-900 shadow">
                          <Ban className="w-3 h-3 text-white" strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    <span className="flex-1 min-w-0 font-mario text-base sm:text-lg md:text-xl text-white truncate text-shadow-mario">
                      {team.name}
                    </span>
                  </button>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-black/65 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-amber-300/35">
                      <MarioCoin size="sm" />
                      <span
                        className={`font-mario text-2xl sm:text-3xl md:text-4xl leading-none tabular-nums tracking-tight ${
                          team.coins < 0
                            ? 'text-red-400'
                            : 'text-yellow-300'
                        }`}
                      >
                        {team.coins}
                      </span>
                    </div>
                    {onAdjustCoins && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playPop();
                            onAdjustCoins(team.id, 1);
                          }}
                          title={`Add 1 coin to ${team.name}`}
                          aria-label={`Add 1 coin to ${team.name}`}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-emerald-600/80 text-white flex items-center justify-center border border-white/20 hover:border-emerald-300 cursor-pointer transition-all active:scale-90"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playPop();
                            onAdjustCoins(team.id, -1);
                          }}
                          title={`Deduct 1 coin from ${team.name}`}
                          aria-label={`Deduct 1 coin from ${team.name}`}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-rose-600/80 text-white flex items-center justify-center border border-white/20 hover:border-rose-300 cursor-pointer transition-all active:scale-90"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isRoundOver && onTogglePassTeam && (
            <div className="shrink-0 grid grid-cols-2 gap-2 p-2 sm:p-2.5 border-t border-white/10 bg-black/40">
              <button
                type="button"
                disabled={!canSkipSelected}
                onClick={() => {
                  if (!canSkipSelected || !selectedTeamId) return;
                  sounds.playClick();
                  onTogglePassTeam(selectedTeamId);
                }}
                title={
                  !selectedTeamId
                    ? 'Select a team first'
                    : `${selectedTeam?.name} gets no card this round`
                }
                aria-label="Skip selected team"
                className={`rounded-2xl border-2 py-2.5 sm:py-3 font-mario text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-all ${
                  !canSkipSelected
                    ? 'bg-slate-900/50 border-white/10 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-rose-900/80 border-white/20 hover:border-rose-300/60 text-slate-200 hover:text-white cursor-pointer'
                }`}
              >
                <Ban className="w-4 h-4" />
                Skip
              </button>
              <button
                type="button"
                disabled={isRoundOver}
                onClick={() => {
                  sounds.playClick();
                  setCardTrayPinned(true);
                  requestAnimationFrame(() => {
                    cardTrayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  });
                }}
                aria-label="Show mystery cards"
                className={`rounded-2xl border-2 py-2.5 sm:py-3 font-mario text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-all ${
                  cardsActionLit
                    ? 'bg-amber-500 hover:bg-amber-400 border-yellow-200 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.45)] cursor-pointer animate-pulse'
                    : showCardTray
                    ? 'bg-amber-800/70 hover:bg-amber-700 border-amber-400/50 text-amber-100 cursor-pointer'
                    : 'bg-slate-800 hover:bg-slate-700 border-white/20 text-slate-200 cursor-pointer'
                }`}
              >
                <Layers className="w-4 h-4" />
                Cards
              </button>
            </div>
          )}
        </div>

        {/* Right Stage: Question Title, Answer Reveal & 6 Mystery Cards */}
        <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-5 overflow-y-auto">
          {/* Question Header & Prompt */}
          <div className="text-center px-1 sm:px-4 pb-2 shrink-0">
            {isMysteryBlock ? (
              <div className="mx-auto max-w-2xl flex flex-col items-center gap-2 py-2">
                <h2 className="font-mario text-[clamp(1.4rem,3vw,2.75rem)] text-yellow-300 leading-tight text-shadow-mario flex items-center gap-3">
                  <Star className="w-[1em] h-[1em] fill-yellow-300 text-yellow-300" />
                  MYSTERY CARD BLOCK
                  <Star className="w-[1em] h-[1em] fill-yellow-300 text-yellow-300" />
                </h2>
                <p className="text-sm sm:text-lg text-amber-100 font-semibold">
                  {question.description?.trim() || `No question this time: ${pickingTeam.name} draws a Mystery Card!`}
                </p>
              </div>
            ) : (
              <>
                {lessonGoal && (
                  <p className="text-[0.6875rem] sm:text-xs font-black uppercase tracking-[0.25em] text-rose-300 mb-1">
                    {lessonGoal}
                  </p>
                )}
                <h2 className="font-mario text-[clamp(2rem,4.5vw,4.25rem)] text-yellow-300 leading-tight text-shadow-mario">
                  <MarkedPrompt text={question.title} />
                </h2>
              </>
            )}

            {/* Unscramble Clue Toggle & Banner */}
            {question.type === 'unscramble' && scrambledChars.length > 0 && (
              <div className="mt-3 mx-auto w-full max-w-xl flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setShowScrambledClue(prev => !prev);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    showScrambledClue
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-amber-200 border-white/15'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-amber-300" />
                  <span>{showScrambledClue ? 'Hide Scrambled Clue' : 'Show Scrambled Clue (Hint)'}</span>
                </button>

                {showScrambledClue && (
                  <div className="p-3 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400/60 rounded-2xl flex flex-wrap items-center justify-center gap-2 shadow-lg animate-in fade-in duration-200">
                    <span className="text-[0.625rem] font-black uppercase tracking-widest text-amber-300 w-full text-center">
                      Scrambled Word Letters:
                    </span>
                    {scrambledChars.map((char, idx) => (
                      <span
                        key={idx}
                        className="font-mario text-2xl sm:text-3xl text-yellow-300 bg-black/70 px-3 py-1.5 rounded-xl border border-yellow-400/50 shadow-sm"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Optional Question Image (For Visual True/False, Vocab Clues & Prompts) */}
            {(question.imageUrl || (question as any).image) && (
              <div className="my-2.5 mx-auto max-w-sm sm:max-w-md max-h-48 sm:max-h-56 rounded-2xl overflow-hidden border-2 border-amber-300/50 shadow-xl bg-black/60 flex items-center justify-center">
                <img
                  src={question.imageUrl || (question as any).image}
                  alt={question.title || 'Question Clue'}
                  className="max-h-48 sm:max-h-56 w-auto object-contain rounded-xl"
                  loading="lazy"
                />
              </div>
            )}

            {/* Answer Display Section */}
            {question.type === 'multiple_choice' ? (
              <div className="mt-4 mx-auto w-full max-w-6xl flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                  {question.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === question.correctIndex;
                    const letter = ['A', 'B', 'C', 'D'][optIdx];
                    return (
                      <div
                        key={optIdx}
                        className={`p-3 sm:p-5 rounded-2xl border-2 flex items-center gap-4 font-mario text-xl sm:text-3xl transition-all text-left min-h-[5rem] sm:min-h-[7rem] ${
                          answerRevealed
                            ? isCorrect
                              ? 'bg-emerald-600 border-emerald-300 text-white ring-4 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] font-black'
                              : 'bg-slate-900/50 border-white/10 text-slate-500 opacity-40'
                            : 'bg-slate-800/90 text-white border-white/20'
                        }`}
                      >
                        <span
                          className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-black text-xl sm:text-3xl shrink-0 ${
                            answerRevealed && isCorrect
                              ? 'bg-white text-emerald-900 shadow-md'
                              : 'bg-black/50 text-yellow-300 border border-white/20'
                          }`}
                        >
                          {answerRevealed && isCorrect ? <Check className="w-6 h-6 sm:w-8 sm:h-8 stroke-[3]" /> : letter}
                        </span>
                        <span className="break-words leading-snug flex-1">{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {answerRevealed && (
                  <div className="flex justify-center mt-1 animate-in fade-in duration-200">
                    <span className="text-base sm:text-2xl text-yellow-200 font-bold bg-black/60 px-5 py-2 rounded-xl border border-white/15 shadow">
                      Correct Answer: {['A', 'B', 'C', 'D'][question.correctIndex]} — {question.options[question.correctIndex]}
                    </span>
                  </div>
                )}
                {choiceRevealToggle}
              </div>
            ) : question.type === 'true_false' ? (
              <div className="mt-4 mx-auto w-full max-w-5xl flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full">
                  <div
                    className={`p-5 sm:p-8 rounded-3xl border-2 flex items-center justify-center gap-4 font-mario text-3xl sm:text-5xl transition-all shadow-md ${
                      answerRevealed
                        ? question.isTrue
                          ? 'bg-emerald-600 border-emerald-300 text-white ring-4 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] font-black scale-102'
                          : 'bg-slate-900/50 border-white/10 text-slate-500 opacity-40'
                        : 'bg-slate-800/90 text-white border-white/20'
                    }`}
                  >
                    <Check className={`w-10 h-10 sm:w-14 sm:h-14 ${answerRevealed && question.isTrue ? 'text-white' : 'text-emerald-400'}`} strokeWidth={3} />
                    <span>TRUE</span>
                  </div>
                  <div
                    className={`p-5 sm:p-8 rounded-3xl border-2 flex items-center justify-center gap-4 font-mario text-3xl sm:text-5xl transition-all shadow-md ${
                      answerRevealed
                        ? !question.isTrue
                          ? 'bg-rose-600 border-rose-300 text-white ring-4 ring-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.5)] font-black scale-102'
                          : 'bg-slate-900/50 border-white/10 text-slate-500 opacity-40'
                        : 'bg-slate-800/90 text-white border-white/20'
                    }`}
                  >
                    <X className={`w-10 h-10 sm:w-14 sm:h-14 ${answerRevealed && !question.isTrue ? 'text-white' : 'text-rose-400'}`} strokeWidth={3} />
                    <span>FALSE</span>
                  </div>
                </div>

                {answerRevealed && question.explanation && (
                  <div className="flex justify-center mt-1 animate-in fade-in duration-200">
                    <span className="text-base sm:text-2xl text-yellow-200 font-bold bg-black/60 px-5 py-2 rounded-xl border border-white/15 shadow">
                      {question.explanation}
                    </span>
                  </div>
                )}
                {choiceRevealToggle}
              </div>
            ) : answerText && (
              <div
                className={`relative mt-4 mx-auto w-full max-w-4xl min-h-[5rem] px-6 rounded-2xl border-2 flex items-center justify-center transition-all ${
                  answerRevealed
                    ? 'bg-black/85 border-emerald-400/50 py-3 pr-14 shadow-lg'
                    : 'h-[5rem] bg-indigo-700/80 hover:bg-indigo-650 border-indigo-300/50 cursor-pointer shadow-md'
                }`}
                onClick={!answerRevealed ? () => { sounds.playCardFlip(); setAnswerRevealed(true); } : undefined}
              >
                {answerRevealed ? (
                  <>
                    <p className="font-mario text-3xl sm:text-5xl text-emerald-300 leading-snug text-center text-balance break-words w-full">
                      {answerText}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
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
                  <div className="flex items-center justify-center gap-2.5 text-white font-mario text-2xl sm:text-3xl">
                    <Eye className="w-7 h-7 text-yellow-300" />
                    <span>Click to Reveal Answer</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cards Section — gated until a winner is selected (or host pins via Cards) */}
          <div
            ref={cardTrayRef}
            className="mt-auto rounded-3xl bg-black/35 border-t-2 border-t-amber-300/40 border-x border-b border-white/10 p-3 sm:p-4 flex flex-col shrink-0"
          >
            {showCardTray ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mario text-xs sm:text-sm text-yellow-300">
                    {selectedTeam
                      ? `${selectedTeam.name} — Pick your Mystery Card!`
                      : isRoundOver
                      ? 'All Mystery Cards in this round:'
                      : 'Mystery Cards'}
                  </span>
                </div>

                <div className="flex items-center justify-center">
                  <div
                    className={`grid gap-2 sm:gap-2.5 w-full ${
                      slots.length >= 8
                        ? 'grid-cols-4 sm:grid-cols-8 max-w-4xl'
                        : slots.length === 7
                        ? 'grid-cols-4 sm:grid-cols-7 max-w-4xl'
                        : 'grid-cols-3 sm:grid-cols-6 max-w-3xl'
                    }`}
                  >
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
                            <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-between p-1.5 sm:p-2 text-center">
                              <span className="font-mario text-[0.5313rem] sm:text-[0.625rem] md:text-xs text-yellow-200 leading-tight line-clamp-2">
                                {slot.card.title}
                              </span>
                              {(slot.card.type === 'gold_star' ||
                                slot.card.type === 'bowser_revolution' ||
                                slot.card.type === 'bowser_fury') && (
                                <span className="text-[0.4688rem] sm:text-[0.5rem] font-black uppercase tracking-wider text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded-full border border-rose-400/40">
                                  Round Over
                                </span>
                              )}
                              {claimedTeam && (
                                <div className="flex flex-col items-center justify-center gap-0.5 mt-auto min-w-0 max-w-full">
                                  <TeamAvatar
                                    characterId={claimedTeam.characterId}
                                    size="xs"
                                    customUrl={claimedTeam.customImageUrl}
                                  />
                                  <span className="text-[0.5rem] sm:text-[0.5625rem] font-bold text-white truncate max-w-full">
                                    {claimedTeam.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : isRoundOver && slot.card ? (
                            <div className="absolute inset-0 bg-gradient-to-b from-slate-800/70 to-slate-950/80 flex flex-col items-center justify-between p-1.5 sm:p-2 text-center opacity-70">
                              <span className="font-mario text-[0.5313rem] sm:text-[0.625rem] md:text-xs text-slate-200 leading-tight line-clamp-2">
                                {slot.card.title}
                              </span>
                              <span className="mt-auto text-[0.4688rem] sm:text-[0.5rem] font-black uppercase tracking-wider text-slate-300 bg-black/60 px-1.5 py-0.5 rounded-full border border-white/20">
                                Not picked
                              </span>
                            </div>
                          ) : (
                            <MysteryCardBack
                              idx={idx}
                              slotNumber={idx + 1}
                              numberMedallion
                              bottomLabel={null}
                              badgeText={previewUnclaimed ? 'TEST' : undefined}
                              previewTitle={previewUnclaimed ? slot.card?.title : undefined}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setCardTrayPinned(true);
                }}
                className="w-full py-6 rounded-2xl border-2 border-dashed border-amber-300/40 bg-black/25 hover:bg-black/40 text-amber-200/90 font-mario text-sm sm:text-base inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Layers className="w-5 h-5 text-amber-300" />
                Select a winner, then pick a card
              </button>
            )}

            {isRoundOver && (
              <div className="flex items-center justify-end mt-3 pt-2 border-t border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playGameStart();
                    if (onFinishRound) onFinishRound();
                    else onEndRound();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-mario text-sm sm:text-base border-2 border-yellow-200 cursor-pointer inline-flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-transform"
                >
                  <Sparkles className="w-4 h-4" />
                  FINISH ROUND & NEXT BLOCK
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </GameModalShell>
  );
});
