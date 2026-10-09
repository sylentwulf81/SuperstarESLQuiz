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
}

const AVAILABLE_COUNTS = [2, 3, 4, 5, 6, 7, 8] as const;

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
 * Manages team counts, mystery character draw, and starting coins.
 */
export const SetupScreen: React.FC<SetupScreenProps> = React.memo(function SetupScreen({
  theme,
  lessonGoal,
  onStartGame,
  onOpenRules,
  onOpenStudio,
  onBackToLauncher,
}) {
  const [teamCount, setTeamCount] = useState<number>(4);
  const [shuffledChars, setShuffledChars] = useState<CharacterInfo[]>(() => shuffleArray(CHARACTER_LIST));
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [celebrationChar, setCelebrationChar] = useState<{ char: CharacterInfo; slotNumber: number } | null>(null);

  const [startingCoins, setStartingCoins] = useState<number>(0);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const activeRoster = useMemo(() => {
    return shuffledChars.slice(0, teamCount);
  }, [shuffledChars, teamCount]);

  const handleReshuffle = useCallback(() => {
    sounds.playShuffle();
    setShuffledChars(shuffleArray(CHARACTER_LIST));
    setRevealedIndices(new Set());
    setCelebrationChar(null);
  }, []);

  const handleSelectCount = useCallback((count: number) => {
    sounds.playPop();
    setTeamCount(count);
    // Keep revealed indices that are within the new count
    setRevealedIndices(prev => {
      const next = new Set<number>();
      prev.forEach(idx => {
        if (idx < count) next.add(idx);
      });
      return next;
    });
  }, []);

  const handleRevealSlot = useCallback((idx: number) => {
    setRevealedIndices(prev => {
      if (prev.has(idx)) return prev;
      const char = activeRoster[idx];
      if (char) {
        sounds.playSpecialCardFanfare();
        setTimeout(() => {
          sounds.playCharacterSelect();
        }, 180);
        setCelebrationChar({ char, slotNumber: idx + 1 });
      }
      return new Set(prev).add(idx);
    });
  }, [activeRoster]);

  const handleRevealAll = useCallback(() => {
    sounds.playSpecialCardFanfare();
    const all = new Set<number>();
    for (let i = 0; i < teamCount; i++) {
      all.add(i);
    }
    setRevealedIndices(all);
  }, [teamCount]);

  // Auto-dismiss celebration card after 1.8s
  useEffect(() => {
    if (!celebrationChar) return;
    const t = window.setTimeout(() => {
      setCelebrationChar(null);
    }, 1800);
    return () => window.clearTimeout(t);
  }, [celebrationChar]);

  const isStartReady = teamCount >= 2;

  const handleStart = useCallback(() => {
    if (teamCount < 2) return;
    sounds.playGameStart();
    const teams: Team[] = activeRoster.map(char => ({
      id: `team_${char.id}`,
      characterId: char.id,
      name: char.name, // Pure character name, no 'Team' prefix and no editable input
      coins: startingCoins,
      stars: 0,
      streak: 0,
      blocksOpened: 0,
      coinsStolen: 0,
      hasDoubleTurn: false,
      skipTurns: 0,
      customImageUrl: readStoredAvatar(char.id),
    }));
    onStartGame(teams, startingCoins);
  }, [teamCount, activeRoster, startingCoins, onStartGame]);

  return (
    <div className="w-full flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col items-center justify-start sm:justify-center">
      <div className="w-full max-w-4xl bg-slate-900 rounded-3xl border border-white/20 shadow-2xl overflow-hidden relative my-auto shrink-0">
        <div
          className={`absolute top-0 inset-x-0 h-1.5 transition-colors duration-500 ${THEME_UI[theme].barClass} opacity-90`}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col"
        >
          {/* Header Bar */}
          <div className="bg-slate-800/90 p-4 sm:p-5 text-white border-b border-white/15 space-y-3">
            <div className="flex items-center justify-between gap-3">
              {onBackToLauncher ? (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onBackToLauncher();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-slate-200 hover:text-white border border-white/20 text-xs font-bold transition-all shadow-md cursor-pointer group whitespace-nowrap shrink-0"
                  title="Return to the activity library"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-amber-300" />
                  Activity Library
                </button>
              ) : (
                <span />
              )}
              <AccountMenu />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="font-mario text-2xl sm:text-3xl text-white text-shadow-mario tracking-wider">
                  {THEME_UI[theme].gameTitle.toUpperCase()}
                </h1>
                <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-black uppercase border ${THEME_UI[theme].badgeClass}`}>
                  {theme === 'summer' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 fill-current" />
                      <span>Summer Edition (60 ESL)</span>
                    </>
                  ) : theme === 'classic' ? (
                    <>
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>Classic Edition</span>
                    </>
                  ) : theme === 'halloween' ? (
                    <>
                      <span className="text-sm">🎃</span>
                      <span>Halloween Edition (60 Spooky ESL)</span>
                    </>
                  ) : (
                    <>
                      <Snowflake className="w-3.5 h-3.5" />
                      <span>Winter Edition (60 Holiday)</span>
                    </>
                  )}
                </div>
                {theme === 'classic' && lessonGoal && (
                  <p className="mt-2 text-xs sm:text-sm font-bold text-rose-100/90 max-w-xl">
                    {lessonGoal}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  id="setup-open-guide-btn"
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onOpenRules();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer hover:scale-102 active:scale-97 border border-indigo-300/40"
                >
                  <BookOpen className="w-4 h-4 text-yellow-300" />
                  <span>VIEW RULES & GUIDE</span>
                </button>
                <button
                  id="setup-open-studio-btn"
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onOpenStudio();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-yellow-300 font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer hover:scale-102 active:scale-97 border border-yellow-400/40"
                  title={`Edit this ${THEME_UI[theme].deckLabel} question deck`}
                >
                  <Settings2 className="w-4 h-4 text-yellow-300" />
                  <span>QUESTION STUDIO</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:py-5 lg:px-6 space-y-4 sm:space-y-5">
            {/* Team Count Picker Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-white/10">
              <div>
                <h3 className="font-mario text-base sm:text-lg text-yellow-300 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  NUMBER OF TEAMS
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Select how many teams are playing in today's class:
                </p>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {AVAILABLE_COUNTS.map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleSelectCount(count)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-mario text-base sm:text-lg transition-all border cursor-pointer flex items-center justify-center ${
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
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mario text-base sm:text-lg text-white text-shadow-mario flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    MYSTERY CHARACTER DRAW
                  </span>
                  <span className="text-xs text-amber-200/90 font-semibold bg-amber-950/60 border border-amber-400/40 px-2.5 py-0.5 rounded-full">
                    {revealedIndices.size} / {teamCount} Revealed
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReshuffle}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/20 text-xs font-bold text-amber-300 cursor-pointer transition-all active:scale-95 shadow"
                    title="Reshuffle characters behind the ? blocks"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reshuffle</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRevealAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-700/80 hover:bg-indigo-600 border border-indigo-400/50 text-xs font-bold text-white cursor-pointer transition-all active:scale-95 shadow"
                    title="Reveal all teams instantly"
                  >
                    <Eye className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Reveal All</span>
                  </button>
                </div>
              </div>

              {/* Mystery Cards Grid - Always exactly 8 slots in fixed 2x4 grid to preserve modal dimensions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {shuffledChars.map((char, idx) => {
                  const isActiveTeam = idx < teamCount;
                  const isRevealed = isActiveTeam && revealedIndices.has(idx);

                  if (!isActiveTeam) {
                    return (
                      <div
                        key={char.id}
                        onClick={() => handleSelectCount(idx + 1)}
                        className="relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl border-2 border-dashed border-white/10 bg-slate-950/40 select-none flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:border-white/30 hover:bg-slate-900/40 transition-all group opacity-40 hover:opacity-75"
                        title={`Click to set team count to ${idx + 1}`}
                      >
                        <div className="w-10 h-10 rounded-full border border-white/15 bg-slate-800/60 flex items-center justify-center text-slate-400 group-hover:text-yellow-300 group-hover:border-yellow-400/50 transition-colors">
                          <span className="font-mario text-sm font-bold">#{idx + 1}</span>
                        </div>
                        <span className="font-mario text-xs text-slate-400 mt-2 group-hover:text-slate-200">
                          Inactive
                        </span>
                        <span className="text-[10px] text-slate-500 group-hover:text-amber-300/80 font-bold mt-1">
                          + Add Team
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={char.id}
                      onClick={() => handleRevealSlot(idx)}
                      style={{ perspective: '1000px' }}
                      className="relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl cursor-pointer select-none group"
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
                          className="absolute inset-0 rounded-2xl border-2 sm:border-3 border-amber-300 bg-gradient-to-b from-amber-500 via-yellow-600 to-amber-700 shadow-xl overflow-hidden flex flex-col items-center justify-between p-3 transition-transform group-hover:scale-[1.02] group-hover:brightness-110"
                        >
                          {/* Inner Bevel */}
                          <div className="absolute inset-1 rounded-xl border border-yellow-200/50 pointer-events-none" />

                          {/* Slot Badge (Pure number, no 'Team' prefix) */}
                          <span className="font-mario text-xs sm:text-sm text-yellow-100 bg-black/50 px-2.5 py-0.5 rounded-full border border-white/20 shadow">
                            #{idx + 1}
                          </span>

                          {/* Big Glowing Question Mark */}
                          <div className="flex flex-col items-center justify-center my-auto">
                            <span className="font-mario text-5xl sm:text-6xl text-white text-shadow-mario drop-shadow-[0_0_16px_rgba(255,255,255,0.7)] animate-pulse">
                              ?
                            </span>
                          </div>

                          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-950 bg-yellow-200/95 px-2.5 py-0.5 rounded-full shadow">
                            Tap to Reveal
                          </span>
                        </div>

                        {/* Back: Revealed Character Card */}
                        <div
                          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                          className={`absolute inset-0 rounded-2xl border-2 sm:border-3 border-yellow-300 ${char.bgColor} bg-opacity-95 shadow-2xl overflow-hidden flex flex-col items-center justify-between p-3 text-center`}
                        >
                          <div className="absolute inset-1 rounded-xl border border-white/30 pointer-events-none" />

                          <div className="w-full flex items-center justify-between z-10">
                            <span className="font-mario text-[10px] sm:text-xs text-yellow-200 bg-black/55 px-2 py-0.5 rounded-full border border-white/20">
                              #{idx + 1}
                            </span>
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow">
                              <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                            </div>
                          </div>

                          {/* Avatar */}
                          <div className="my-auto flex flex-col items-center gap-1 z-10">
                            <TeamAvatar
                              characterId={char.id}
                              size="lg"
                              className="w-16 h-16 sm:w-20 sm:h-20 shadow-2xl ring-2 ring-white/80"
                            />
                            <h4 className="font-mario text-base sm:text-xl text-white text-shadow-mario leading-tight mt-1">
                              {char.name}
                            </h4>
                          </div>

                          <span className="text-[9px] sm:text-[10px] font-bold text-white/90 bg-black/40 px-2 py-0.5 rounded-full truncate max-w-full z-10">
                            {char.catchphrase}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Starting Coins and Calculator Row */}
            <div className="flex flex-col lg:flex-row gap-2.5">
              <div className="flex-1 p-3 bg-slate-800/60 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="font-mario text-sm sm:text-base text-yellow-300 block">
                    STARTING COINS PER TEAM
                  </span>
                  <span className="text-xs text-indigo-200">
                    Starting with 5 or 10 coins enables exciting Boo steal & Bowser cards immediately!
                  </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {[0, 5, 10, 15, 20].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        if (amt === 0) {
                          sounds.playPop();
                        } else if (amt >= 10) {
                          sounds.playStarCoin();
                        } else {
                          sounds.playCoin();
                        }
                        setStartingCoins(amt);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-mario text-sm sm:text-base transition-all border cursor-pointer flex items-center gap-1.5 ${
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

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setCalculatorOpen(true);
                }}
                className="lg:w-[11.5rem] shrink-0 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-white/10 hover:border-amber-300/50 text-left cursor-pointer transition-all"
              >
                <span className="font-mario text-sm sm:text-base text-yellow-300 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-300" />
                  Team size
                </span>
                <span className="text-xs text-indigo-200 mt-1 block">Class → groups</span>
              </button>
            </div>

            {/* Launch Button */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                disabled={!isStartReady}
                onClick={handleStart}
                className={`w-full sm:w-auto px-10 py-3.5 font-mario text-lg sm:text-2xl rounded-2xl shadow-xl border flex items-center justify-center gap-2.5 transition-all ${
                  isStartReady
                    ? 'bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-400 text-white border-emerald-300/80 hover:scale-102 active:scale-97 cursor-pointer shadow-emerald-950/50 font-black'
                    : 'bg-white/10 text-slate-400 border-white/15 cursor-not-allowed opacity-50'
                }`}
              >
                <Play className={`w-5 h-5 ${isStartReady ? 'fill-current text-white' : 'text-slate-500'}`} />
                {isStartReady
                  ? `START ${THEME_UI[theme].startParty} PARTY! (${teamCount} TEAMS)`
                  : 'CHOOSE TEAMS TO START'}
              </button>

              <div className="flex items-center gap-1.5 text-xs text-amber-300/80 font-medium">
                <Shuffle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {theme === 'classic'
                    ? 'All 60 prompts shuffle at the start. Any team can answer!'
                    : 'All 60 question & mystery card locations are automatically randomized at the start!'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Character Celebration Fanfare Popup Card */}
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
                <span className="font-mario text-xs sm:text-sm text-yellow-200 bg-black/60 px-4 py-1 rounded-full border border-yellow-300/80 shadow">
                  ★ TEAM {celebrationChar.slotNumber} REVEALED! ★
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

              <button
                type="button"
                onClick={() => setCelebrationChar(null)}
                className="mt-5 px-6 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-mario text-sm border-2 border-white cursor-pointer shadow-lg active:scale-95 transition-transform"
              >
                AWESOME!
              </button>
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
