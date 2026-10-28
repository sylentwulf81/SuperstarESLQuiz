import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Play, Sun, Snowflake, Shuffle,
  BookOpen, ArrowLeft, Settings2, Star, Calculator, Sparkles, Eye, Check
} from 'lucide-react';
import { CharacterId, CharacterInfo, Team, GameTheme } from '@/shared/types';
import { THEME_UI } from '@/shared/themeMeta';
import { CHARACTERS, CHARACTER_LIST } from '@/games/mario-party-quiz/data/characters';
import { sounds } from '@/shared/utils/sound';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { AccountMenu } from '@/shared/components/AccountMenu';
import { TeamAvatar } from './TeamAvatar';
import { TeamCalculatorModal } from './TeamCalculatorModal';
import { shuffleArray } from '@/shared/utils/shuffle';

interface SetupScreenProps {
  theme: GameTheme;
  lessonGoal?: string;
  onStartGame: (teams: Team[], startingCoins: number) => void;
  onOpenRules: () => void;
  onOpenStudio: () => void;
  onBackToLauncher?: () => void;
  /** Questions in the loaded deck; the board never has more blocks than this. */
  deckLength?: number;
}

const AVAILABLE_COUNTS = [2, 3, 4, 5, 6, 7, 8] as const;
const DECK_COUNT_OPTIONS = [10, 15, 20, 25, 30, 60] as const;

/** Module-level avatar reader helper. */
const readStoredAvatar = (charId: CharacterId) => {
  try {
    return localStorage.getItem(`avatar_${charId}`) || undefined;
  } catch {
    return undefined;
  }
};

/**
 * SetupScreen component:
 * Manages team counts, free-choice mystery character draw, editable team names, and starting coins.
 */
export const SetupScreen: React.FC<SetupScreenProps> = React.memo(function SetupScreen({
  theme,
  lessonGoal,
  onStartGame,
  onOpenRules,
  onOpenStudio,
  onBackToLauncher,
  deckLength,
}) {
  const [teamCount, setTeamCount] = useState<number>(4);
  const [shuffledChars, setShuffledChars] = useState<CharacterInfo[]>(() => shuffleArray(CHARACTER_LIST));
  // slotAssignments: slotIdx (0..7) -> teamNum (1..teamCount) or null
  const [slotAssignments, setSlotAssignments] = useState<(number | null)[]>(() => Array(8).fill(null));
  const [customTeamNames, setCustomTeamNames] = useState<Record<number, string>>({});
  const [editingTeamNum, setEditingTeamNum] = useState<number | null>(null);
  const [celebrationChar, setCelebrationChar] = useState<{ char: CharacterInfo; slotNumber: number; teamNum: number } | null>(null);

  // Deck size and shuffle settings synced with localStorage
  const [deckSize, setDeckSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`mp_block_count_${theme}`);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 10 && val <= 60) return val;
      }
    } catch {}
    return 60;
  });

  const [isShuffleEnabled, setIsShuffleEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`mp_shuffle_blocks_${theme}`);
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const handleUpdateDeckSize = useCallback((count: number) => {
    sounds.playPop();
    setDeckSize(count);
    try {
      localStorage.setItem(`mp_block_count_${theme}`, String(count));
    } catch {}
  }, [theme]);

  const playableCount = deckLength ? Math.min(deckSize, deckLength) : deckSize;
  const deckCountOptions = useMemo(() => {
    if (!deckLength) return DECK_COUNT_OPTIONS.map(count => ({ count, label: String(count) }));
    return [
      ...DECK_COUNT_OPTIONS.filter(count => count < deckLength).map(count => ({ count, label: String(count) })),
      { count: 60, label: `All ${deckLength}` },
    ];
  }, [deckLength]);

  const handleToggleShuffle = useCallback(() => {
    sounds.playClick();
    setIsShuffleEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem(`mp_shuffle_blocks_${theme}`, String(next));
      } catch {}
      return next;
    });
  }, [theme]);

  const [startingCoins, setStartingCoins] = useState<number>(0);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  // Assigned teams count
  const assignedTeamCount = useMemo(() => {
    return slotAssignments.filter(n => n !== null && n <= teamCount).length;
  }, [slotAssignments, teamCount]);

  // Next team number to pick (1..teamCount)
  const nextTeamToPick = useMemo(() => {
    const assignedSet = new Set(slotAssignments.filter(n => n !== null && n <= teamCount));
    for (let t = 1; t <= teamCount; t++) {
      if (!assignedSet.has(t)) return t;
    }
    return null;
  }, [slotAssignments, teamCount]);

  const handleReshuffle = useCallback(() => {
    sounds.playShuffle();
    setShuffledChars(shuffleArray(CHARACTER_LIST));
    setSlotAssignments(Array(8).fill(null));
    setCelebrationChar(null);
  }, []);

  const handleSelectCount = useCallback((count: number) => {
    sounds.playPop();
    setTeamCount(count);
    // Remove assignments that exceed new count
    setSlotAssignments(prev => prev.map(t => (t !== null && t <= count ? t : null)));
  }, []);

  const handlePickSlot = useCallback((slotIdx: number) => {
    const currentTeam = slotAssignments[slotIdx];
    if (currentTeam !== null) {
      // Already picked: allow editing team name
      setEditingTeamNum(currentTeam);
      return;
    }
    if (!nextTeamToPick) return;

    const teamNum = nextTeamToPick;
    const char = shuffledChars[slotIdx];

    sounds.playSpecialCardFanfare();
    setTimeout(() => {
      sounds.playCharacterSelect();
    }, 180);

    setSlotAssignments(prev => {
      const next = [...prev];
      next[slotIdx] = teamNum;
      return next;
    });

    setCelebrationChar({ char, slotNumber: slotIdx + 1, teamNum });
  }, [slotAssignments, nextTeamToPick, shuffledChars]);

  const handleRevealAll = useCallback(() => {
    sounds.playSpecialCardFanfare();
    setSlotAssignments(prev => {
      const next = [...prev];
      const assignedSet = new Set(next.filter(n => n !== null && n <= teamCount));
      let slotIdx = 0;
      for (let t = 1; t <= teamCount; t++) {
        if (!assignedSet.has(t)) {
          while (slotIdx < 8 && next[slotIdx] !== null) {
            slotIdx++;
          }
          if (slotIdx < 8) {
            next[slotIdx] = t;
            slotIdx++;
          }
        }
      }
      return next;
    });
  }, [teamCount]);

  // Auto-dismiss celebration card after 2.2s
  useEffect(() => {
    if (!celebrationChar) return;
    const t = window.setTimeout(() => {
      setCelebrationChar(null);
    }, 2200);
    return () => window.clearTimeout(t);
  }, [celebrationChar]);

  const isStartReady = teamCount >= 2;

  const handleStart = useCallback(() => {
    if (teamCount < 2) return;
    sounds.playGameStart();

    // Collect assigned teams, or assign fallback characters in order
    const teams: Team[] = [];
    const usedCharIds = new Set<CharacterId>();

    for (let t = 1; t <= teamCount; t++) {
      const slotIdx = slotAssignments.findIndex(val => val === t);
      const char = slotIdx !== -1 ? shuffledChars[slotIdx] : shuffledChars.find(c => !usedCharIds.has(c.id)) || shuffledChars[t - 1];
      usedCharIds.add(char.id);

      const teamName = (customTeamNames[t] || '').trim() || char.name;

      teams.push({
        id: `team_${char.id}`,
        characterId: char.id,
        name: teamName,
        coins: startingCoins,
        stars: 0,
        streak: 0,
        blocksOpened: 0,
        coinsStolen: 0,
        hasDoubleTurn: false,
        skipTurns: 0,
        customImageUrl: readStoredAvatar(char.id),
      });
    }

    onStartGame(teams, startingCoins);
  }, [teamCount, slotAssignments, shuffledChars, customTeamNames, startingCoins, onStartGame]);

  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 md:p-4 flex flex-col items-center justify-start sm:justify-center">
      <div className="w-full max-w-4xl max-h-[min(98dvh,54rem)] flex flex-col bg-slate-900 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl overflow-hidden relative my-auto shrink-0 sm:shrink">
        <div
          className={`absolute top-0 inset-x-0 h-1.5 transition-colors duration-500 ${THEME_UI[theme].barClass} opacity-90 shrink-0`}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col flex-1 min-h-0"
        >
          {/* Header Bar */}
          <div className="shrink-0 bg-slate-800/90 px-3.5 py-2 sm:px-5 sm:py-2.5 text-white border-b border-white/15">
            <div className="flex items-center justify-between gap-2.5 flex-wrap">
              {/* Left: Activity library button + Title + Badges */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {onBackToLauncher && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onBackToLauncher();
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-slate-200 hover:text-white border border-white/20 text-xs font-bold transition-all shadow-md cursor-pointer group whitespace-nowrap shrink-0"
                    title="Return to the activity library"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-amber-300" />
                    <span>Activity Library</span>
                  </button>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-mario text-lg sm:text-2xl text-white text-shadow-mario tracking-wider truncate">
                      {THEME_UI[theme].gameTitle.toUpperCase()}
                    </h1>
                    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.625rem] sm:text-xs font-black uppercase border ${THEME_UI[theme].badgeClass}`}>
                      {theme === 'summer' ? (
                        <>
                          <Sun className="w-3 h-3 fill-current" />
                          <span>Summer Edition (60 ESL)</span>
                        </>
                      ) : theme === 'classic' ? (
                        <>
                          <Star className="w-3 h-3 fill-current" />
                          <span>Classic Edition</span>
                        </>
                      ) : theme === 'halloween' ? (
                        <>
                          <span className="text-xs">🎃</span>
                          <span>Halloween Edition (60 Spooky ESL)</span>
                        </>
                      ) : (
                        <>
                          <Snowflake className="w-3 h-3" />
                          <span>Winter Edition (60 Holiday)</span>
                        </>
                      )}
                    </div>
                  </div>
                  {theme === 'classic' && lessonGoal && (
                    <p className="text-[0.6875rem] sm:text-xs font-bold text-rose-100/90 truncate max-w-md sm:max-w-xl">
                      {lessonGoal}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Actions + AccountMenu */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  id="setup-open-guide-btn"
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onOpenRules();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer hover:scale-102 active:scale-97 border border-indigo-300/40"
                >
                  <BookOpen className="w-3.5 h-3.5 text-yellow-300" />
                  <span>RULES & GUIDE</span>
                </button>
                <button
                  id="setup-open-studio-btn"
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onOpenStudio();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-yellow-300 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer hover:scale-102 active:scale-97 border border-yellow-400/40"
                  title={`Edit this ${THEME_UI[theme].deckLabel} question deck`}
                >
                  <Settings2 className="w-3.5 h-3.5 text-yellow-300" />
                  <span>STUDIO</span>
                </button>
                <AccountMenu />
              </div>
            </div>
          </div>

          <div className="p-2.5 sm:p-3.5 md:p-4 lg:px-6 flex-1 min-h-0 flex flex-col justify-between space-y-[clamp(0.4rem,1.2vh,0.85rem)] overflow-y-auto sm:overflow-hidden">
            {/* Team Count Picker Header */}
            <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-800/60 px-3 py-[clamp(0.35rem,0.8vh,0.6rem)] sm:px-4 rounded-xl sm:rounded-2xl border border-white/10">
              <div>
                <h3 className="font-mario text-xs sm:text-sm md:text-base text-yellow-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>NUMBER OF TEAMS</span>
                </h3>
                <p className="text-[0.625rem] sm:text-xs text-indigo-200 mt-0.5">
                  Select how many teams are playing in today's class:
                </p>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {AVAILABLE_COUNTS.map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleSelectCount(count)}
                    className={`w-[clamp(1.85rem,3.8vh,2.35rem)] h-[clamp(1.85rem,3.8vh,2.35rem)] rounded-xl font-mario text-xs sm:text-sm md:text-base transition-all border cursor-pointer flex items-center justify-center ${
                      teamCount === count
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 border-yellow-200 shadow-md scale-105 glass-glow-gold font-black'
                        : 'bg-slate-700/80 hover:bg-slate-650 text-slate-200 border-white/15'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Mystery Randomization Board */}
            <div className="flex-1 min-h-0 flex flex-col justify-center">
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 mb-1.5 sm:mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mario text-xs sm:text-sm md:text-base text-white text-shadow-mario flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                    <span>MYSTERY CHARACTER DRAW</span>
                  </span>
                  <span className="text-[0.625rem] sm:text-xs text-amber-200/90 font-semibold bg-amber-950/60 border border-amber-400/40 px-2 py-0.5 rounded-full">
                    {assignedTeamCount} / {teamCount} Teams Assigned
                  </span>
                  {nextTeamToPick && (
                    <span className="text-[0.625rem] sm:text-xs text-yellow-300 font-black bg-indigo-900/80 border border-yellow-400/60 px-2.5 py-0.5 rounded-full animate-pulse shadow-md">
                      👉 Team {nextTeamToPick}: Pick any card!
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={handleReshuffle}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/20 text-xs font-bold text-amber-300 cursor-pointer transition-all active:scale-95 shadow"
                    title="Reshuffle characters behind the ? blocks"
                  >
                    <Shuffle className="w-3 h-3 text-amber-400" />
                    <span>Reshuffle</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRevealAll}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-700/80 hover:bg-indigo-600 border border-indigo-400/50 text-xs font-bold text-white cursor-pointer transition-all active:scale-95 shadow"
                    title="Automatically reveal and assign all remaining teams"
                  >
                    <Eye className="w-3 h-3 text-yellow-300" />
                    <span>Quick Assign</span>
                  </button>
                </div>
              </div>

              {/* Mystery Cards Grid - Exactly 8 slots in 2x4 grid with fluid viewport-adaptive height */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {shuffledChars.map((char, idx) => {
                  const assignedTeam = slotAssignments[idx];
                  const isRevealed = assignedTeam !== null && assignedTeam <= teamCount;
                  const teamDisplayName = isRevealed
                    ? (customTeamNames[assignedTeam] || '').trim() || char.name
                    : '';

                  return (
                    <div
                      key={char.id}
                      onClick={() => handlePickSlot(idx)}
                      style={{ perspective: '1000px' }}
                      className="relative h-[clamp(5.2rem,13.8vh,8.85rem)] rounded-xl sm:rounded-2xl cursor-pointer select-none group"
                    >
                      <motion.div
                        animate={{ rotateY: isRevealed ? 180 : 0 }}
                        transition={{ duration: 0.55, ease: [0.34, 1.25, 0.64, 1] }}
                        style={{ transformStyle: 'preserve-3d' }}
                        className="relative w-full h-full"
                      >
                        {/* Front: Mystery ? Card */}
                        <div
                          style={{ backfaceVisibility: 'hidden' }}
                          className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 sm:border-3 border-amber-300 bg-gradient-to-b from-amber-500 via-yellow-600 to-amber-700 shadow-xl overflow-hidden flex flex-col items-center justify-between p-2 transition-transform group-hover:scale-[1.02] group-hover:brightness-110"
                        >
                          <div className="absolute inset-1 rounded-lg sm:rounded-xl border border-yellow-200/50 pointer-events-none" />

                          {/* Card Number Badge */}
                          <span className="font-mario text-[clamp(10px,1.3vh,12px)] text-yellow-100 bg-black/55 px-2.5 py-0.5 rounded-full border border-white/20 shadow leading-none font-bold">
                            Card #{idx + 1}
                          </span>

                          {/* Big Glowing Question Mark */}
                          <div className="flex flex-col items-center justify-center my-auto">
                            <span className="font-mario text-[clamp(1.85rem,4.4vh,3.2rem)] text-white text-shadow-mario drop-shadow-[0_0_12px_rgba(255,255,255,0.7)] animate-pulse leading-none">
                              ?
                            </span>
                          </div>

                          <span className="text-[clamp(8px,1.1vh,10px)] font-black uppercase tracking-wider text-amber-950 bg-yellow-200/95 px-2 py-0.5 rounded-full shadow leading-none">
                            {nextTeamToPick ? `Pick for Team ${nextTeamToPick}` : 'Tap to Reveal'}
                          </span>
                        </div>

                        {/* Back: Revealed Character Card */}
                        <div
                          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                          className={`absolute inset-0 rounded-xl sm:rounded-2xl border-2 sm:border-3 border-yellow-300 ${char.bgColor} bg-opacity-95 shadow-2xl overflow-hidden flex flex-col items-center justify-between p-1.5 sm:p-2 text-center`}
                        >
                          <div className="absolute inset-1 rounded-lg sm:rounded-xl border border-white/30 pointer-events-none" />

                          <div className="w-full flex items-center justify-between z-10 px-0.5">
                            <span className="font-mario text-[clamp(9px,1.1vh,11px)] text-yellow-200 bg-black/60 px-2 py-0.5 rounded-full border border-yellow-300/60 leading-none font-bold">
                              TEAM {assignedTeam}
                            </span>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (assignedTeam) setEditingTeamNum(assignedTeam);
                              }}
                              className="w-4 h-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold shadow cursor-pointer transition-transform hover:scale-110"
                              title="Click to rename this team"
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                            </div>
                          </div>

                          {/* Avatar & Names */}
                          <div className="my-auto flex flex-col items-center gap-0.5 z-10 min-w-0 max-w-full">
                            <TeamAvatar
                              characterId={char.id}
                              size="sm"
                              className="w-[clamp(2.1rem,5.2vh,3.4rem)] h-[clamp(2.1rem,5.2vh,3.4rem)] shadow-lg ring-2 ring-white/80 shrink-0"
                            />
                            <h4 className="font-mario text-[clamp(0.72rem,1.6vh,0.95rem)] text-white text-shadow-mario leading-tight mt-0.5 truncate max-w-full px-1">
                              {teamDisplayName}
                            </h4>
                          </div>

                          <div className="w-full flex items-center justify-between z-10 px-1 gap-1">
                            <span className="text-[clamp(7.5px,1vh,9px)] text-white/90 bg-black/40 px-1.5 py-0.5 rounded-full truncate leading-none">
                              {char.name}
                            </span>
                            <span className="text-[0.5rem] text-amber-200 underline font-semibold cursor-pointer hover:text-white">
                              Rename ✎
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Starting Coins, Deck Size, and Calculator Row */}
            <div className="shrink-0 flex flex-col gap-2">
              <div className="flex flex-col md:flex-row gap-2">
                {/* Starting Coins */}
                <div className="flex-1 px-3 py-[clamp(0.35rem,0.8vh,0.6rem)] sm:px-4 bg-slate-800/60 rounded-xl sm:rounded-2xl border border-white/10 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mario text-xs sm:text-sm text-yellow-300 block">
                      STARTING COINS
                    </span>
                    <span className="text-[0.625rem] sm:text-[0.6875rem] text-indigo-200 hidden sm:block">
                      Coins per team at kickoff
                    </span>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {[0, 5, 10, 15, 20].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          if (amt === 0) sounds.playPop();
                          else if (amt >= 10) sounds.playStarCoin();
                          else sounds.playCoin();
                          setStartingCoins(amt);
                        }}
                        className={`px-2 py-1 rounded-xl font-mario text-xs transition-all border cursor-pointer flex items-center gap-1 ${
                          startingCoins === amt
                            ? 'bg-amber-500 text-slate-950 border-yellow-200 shadow-md scale-105 glass-glow-gold'
                            : 'bg-slate-700/80 hover:bg-slate-650 text-slate-200 border-white/20'
                        }`}
                      >
                        <span className="font-bold">{amt}</span>
                        <MarioCoin size="sm" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deck Size Selector & Shuffle Toggle */}
                <div className="flex-1 px-3 py-[clamp(0.35rem,0.8vh,0.6rem)] sm:px-4 bg-slate-800/60 rounded-xl sm:rounded-2xl border border-white/10 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mario text-xs sm:text-sm text-yellow-300 block">
                      DECK SIZE ({playableCount} Qs)
                    </span>
                    <span className="text-[0.625rem] sm:text-[0.6875rem] text-indigo-200 hidden sm:block">
                      Number of blocks on the board
                    </span>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                    {deckCountOptions.map(({ count, label }) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => handleUpdateDeckSize(count)}
                        className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg sm:rounded-xl font-mario text-xs transition-all border cursor-pointer ${
                          (deckLength ? Math.min(count, deckLength) : count) === playableCount
                            ? 'bg-indigo-600 text-white border-indigo-300 shadow font-black'
                            : 'bg-slate-700/80 hover:bg-slate-650 text-slate-300 border-white/15'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleToggleShuffle}
                      className={`px-2 py-1 rounded-xl text-[0.6875rem] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                        isShuffleEnabled
                          ? 'bg-emerald-600/80 text-white border-emerald-400'
                          : 'bg-slate-700/80 text-amber-300 border-white/15'
                      }`}
                      title={isShuffleEnabled ? 'Prompts randomized on start' : 'Prompts played in order 1..N'}
                    >
                      <Shuffle className="w-3 h-3" />
                      <span>{isShuffleEnabled ? 'Shuffle' : 'In-Order'}</span>
                    </button>
                  </div>
                </div>

                {/* Class Calculator */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setCalculatorOpen(true);
                  }}
                  className="px-3 py-[clamp(0.35rem,0.8vh,0.6rem)] rounded-xl sm:rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-white/10 hover:border-amber-300/50 text-left cursor-pointer transition-all flex md:flex-col justify-between items-center md:items-start shrink-0"
                >
                  <span className="font-mario text-xs sm:text-sm text-yellow-300 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-amber-300" />
                    Team size
                  </span>
                  <span className="text-[0.625rem] sm:text-[0.6875rem] text-indigo-200">Class → groups</span>
                </button>
              </div>
            </div>

            {/* Launch Button */}
            <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
              <button
                disabled={!isStartReady}
                onClick={handleStart}
                className={`w-full sm:w-auto px-8 sm:px-10 py-[clamp(0.45rem,1.1vh,0.75rem)] font-mario text-sm sm:text-lg md:text-xl rounded-xl sm:rounded-2xl shadow-xl border flex items-center justify-center gap-2 transition-all ${
                  isStartReady
                    ? 'bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-400 text-white border-emerald-300/80 hover:scale-102 active:scale-97 cursor-pointer shadow-emerald-950/50 font-black'
                    : 'bg-white/10 text-slate-400 border-white/15 cursor-not-allowed opacity-50'
                }`}
              >
                <Play className={`w-4 h-4 sm:w-5 sm:h-5 ${isStartReady ? 'fill-current text-white' : 'text-slate-500'}`} />
                {isStartReady
                  ? `START ${THEME_UI[theme].startParty} PARTY! (${teamCount} TEAMS)`
                  : 'CHOOSE TEAMS TO START'}
              </button>

              <div className="flex items-center gap-1 text-[0.5938rem] sm:text-[0.6875rem] text-amber-300/80 font-medium text-center">
                <Shuffle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>
                  {theme === 'classic'
                    ? `${playableCount} questions configured (${isShuffleEnabled ? 'shuffled' : 'in order'}). Any team can answer!`
                    : `All ${playableCount} question & mystery card locations ready (${isShuffleEnabled ? 'randomized' : 'in order'})!`}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Character Celebration Fanfare Popup Card with Inline Team Name Input */}
      <AnimatePresence>
        {celebrationChar && (
          <div
            onClick={() => setCelebrationChar(null)}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 16 }}
              className={`relative w-full max-w-sm rounded-3xl border-4 border-yellow-300 ${celebrationChar.char.bgColor} p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-[0_0_60px_rgba(250,204,21,0.65)]`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-3 inset-x-0 flex justify-center">
                <span className="font-mario text-xs sm:text-sm text-yellow-200 bg-black/60 px-4 py-1 rounded-full border border-yellow-300/80 shadow font-bold">
                  ★ TEAM {celebrationChar.teamNum} REVEALED! ★
                </span>
              </div>

              <div className="mt-6 relative">
                <div className="absolute inset-0 rounded-full bg-white/20 blur-xl scale-125" />
                <TeamAvatar
                  characterId={celebrationChar.char.id}
                  size="xl"
                  className="w-28 h-28 sm:w-36 sm:h-36 shadow-2xl ring-4 ring-yellow-300 border-4 border-white"
                />
              </div>

              <motion.h2
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="mt-4 font-mario text-3xl sm:text-5xl text-white text-shadow-mario tracking-wide"
              >
                {celebrationChar.char.name.toUpperCase()}!
              </motion.h2>

              <p className="mt-2 text-sm sm:text-base font-bold text-yellow-100 italic bg-black/40 px-4 py-1.5 rounded-2xl border border-white/20">
                "{celebrationChar.char.catchphrase}"
              </p>

              {/* Optional inline custom team name editor */}
              <div className="mt-3 w-full bg-black/40 p-2.5 rounded-2xl border border-white/20">
                <label className="text-[0.625rem] font-bold text-yellow-200 block mb-1 uppercase tracking-wider">
                  Custom Team Name (optional):
                </label>
                <input
                  type="text"
                  value={customTeamNames[celebrationChar.teamNum] ?? celebrationChar.char.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomTeamNames(prev => ({ ...prev, [celebrationChar.teamNum]: val }));
                  }}
                  placeholder={celebrationChar.char.name}
                  className="w-full bg-slate-900 border border-white/30 rounded-xl px-3 py-1.5 text-xs text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <button
                type="button"
                onClick={() => setCelebrationChar(null)}
                className="mt-4 px-6 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-mario text-sm border-2 border-white cursor-pointer shadow-lg active:scale-95 transition-transform font-bold"
              >
                AWESOME!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Standalone Team Name Editor Modal */}
      <AnimatePresence>
        {editingTeamNum !== null && (
          <div
            onClick={() => setEditingTeamNum(null)}
            className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border-2 border-yellow-400 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-mario text-lg text-yellow-300">
                Rename Team #{editingTeamNum}
              </h3>
              <p className="text-xs text-indigo-200 -mt-2">
                Enter a custom name for this group to appear on the scoreboard:
              </p>
              <input
                type="text"
                autoFocus
                value={customTeamNames[editingTeamNum] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomTeamNames(prev => ({ ...prev, [editingTeamNum]: val }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setEditingTeamNum(null);
                  }
                }}
                placeholder={`e.g. Super Stars, Team ${editingTeamNum}`}
                className="w-full bg-black/60 border border-white/30 rounded-2xl px-4 py-2.5 text-sm text-white font-bold text-center focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <div className="flex items-center gap-2 w-full justify-end">
                <button
                  type="button"
                  onClick={() => setEditingTeamNum(null)}
                  className="flex-1 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-mario text-xs border border-white cursor-pointer font-bold shadow"
                >
                  SAVE NAME
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {calculatorOpen && (
          <TeamCalculatorModal
            theme={theme}
            suggestedGroups={teamCount}
            onClose={() => setCalculatorOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
});
