import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Play, Check, Sun, Snowflake, Shuffle,
  BookOpen, ArrowLeft, Settings2, Star, Calculator
} from 'lucide-react';
import { CharacterId, Team, GameTheme } from '@/shared/types';
import { THEME_UI } from '@/shared/themeMeta';
import { CHARACTERS, CHARACTER_LIST } from '@/games/mario-party-quiz/data/characters';
import { sounds } from '@/shared/utils/sound';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { AccountMenu } from '@/shared/components/AccountMenu';
import { TeamAvatar } from './TeamAvatar';
import { TeamCalculatorModal } from './TeamCalculatorModal';

interface SetupScreenProps {
  theme: GameTheme;
  lessonGoal?: string;
  onStartGame: (teams: Team[], startingCoins: number) => void;
  onOpenRules: () => void;
  onOpenStudio: () => void;
  onBackToLauncher?: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  theme,
  lessonGoal,
  onStartGame,
  onOpenRules,
  onOpenStudio,
  onBackToLauncher,
}) => {
  const [selectedChars, setSelectedChars] = useState<CharacterId[]>([]);

  const [teamNames, setTeamNames] = useState<Record<CharacterId, string>>(() =>
    Object.fromEntries(CHARACTER_LIST.map((char) => [char.id, char.name])) as Record<CharacterId, string>
  );

  const [startingCoins, setStartingCoins] = useState<number>(0);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  const readStoredAvatar = (charId: CharacterId) => {
    try {
      return localStorage.getItem(`avatar_${charId}`) || undefined;
    } catch {
      return undefined;
    }
  };

  const toggleCharacter = (charId: CharacterId) => {
    if (selectedChars.includes(charId)) {
      sounds.playCharacterDeselect();
      setSelectedChars(selectedChars.filter(id => id !== charId));
    } else {
      sounds.playCharacterSelect();
      setSelectedChars([...selectedChars, charId]);
    }
  };

  const handleNameChange = (charId: CharacterId, newName: string) => {
    setTeamNames(prev => ({ ...prev, [charId]: newName }));
  };

  const allSelected = selectedChars.length === CHARACTER_LIST.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      sounds.playCharacterDeselect();
      setSelectedChars([]);
    } else {
      sounds.playCharacterSelect();
      setSelectedChars(CHARACTER_LIST.map((char) => char.id));
    }
  };

  const isStartReady = selectedChars.length >= 2;

  const handleStart = () => {
    if (!isStartReady) return;
    sounds.playGameStart();
    const teams: Team[] = selectedChars.map(charId => ({
      id: `team_${charId}`,
      characterId: charId,
      name: teamNames[charId] || CHARACTERS[charId].name,
      coins: startingCoins,
      stars: 0,
      streak: 0,
      blocksOpened: 0,
      coinsStolen: 0,
      hasDoubleTurn: false,
      skipTurns: 0,
      customImageUrl: readStoredAvatar(charId),
    }));
    onStartGame(teams, startingCoins);
  };

  return (
    <div className="min-h-[85vh] lg:min-h-0 flex-1 flex items-center justify-center p-3 sm:p-4 lg:p-3">
      <div className="w-full max-w-4xl bg-slate-900 rounded-3xl border border-white/20 shadow-2xl overflow-hidden relative">
        <div
          className={`absolute top-0 inset-x-0 h-1.5 transition-colors duration-500 ${THEME_UI[theme].barClass} opacity-90`}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col"
        >
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
                  title="Return to ALT Games Launcher Library"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-amber-300" />
                  Game Library
                </button>
              ) : (
                <span />
              )}
              <AccountMenu />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
              <h1 className="font-mario text-2xl sm:text-3xl text-white text-shadow-mario tracking-wider">
                {theme === 'classic' ? 'SUPER QUIZ CLASSIC' : 'SUPER MARIO PARTY'}
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
                ) : (
                  <>
                    <Snowflake className="w-3.5 h-3.5" />
                    <span>Christmas Edition (60 Holiday)</span>
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
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-300 font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer hover:scale-102 active:scale-97 border border-yellow-400/40"
                title={`Edit this ${THEME_UI[theme].deckLabel} question deck`}
              >
                <Settings2 className="w-4 h-4 text-yellow-300" />
                <span>QUESTION STUDIO</span>
              </button>
            </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:py-5 lg:px-6 space-y-4 sm:space-y-5">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <h3 className="font-mario text-base sm:text-lg text-yellow-300 flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                  CHOOSE ACTIVE TEAMS ({selectedChars.length}/{CHARACTER_LIST.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-bold px-3 py-0.5 rounded-full border bg-slate-800 hover:bg-slate-700 text-indigo-100 border-white/20 transition-all cursor-pointer"
                  >
                    {allSelected ? 'Clear all' : 'Select all'}
                  </button>
                  <span
                    className={`text-xs font-bold px-3 py-0.5 rounded-full border transition-all ${
                      isStartReady
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                    }`}
                  >
                    {isStartReady ? 'Ready to play!' : 'Choose at least 2 teams'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {CHARACTER_LIST.map((char) => {
                  const isSelected = selectedChars.includes(char.id);
                  return (
                    <div
                      key={char.id}
                      onClick={() => toggleCharacter(char.id)}
                      className={`relative rounded-2xl p-2.5 flex flex-col items-center gap-1.5 border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-b from-indigo-900/90 to-slate-900 border-yellow-400 shadow-lg scale-102 glass-glow-gold'
                          : 'bg-slate-800/60 border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <TeamAvatar
                        characterId={char.id}
                        size="lg"
                        className="w-14 h-14 sm:w-16 sm:h-16 shadow-md"
                      />

                      <div className="w-full text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={teamNames[char.id]}
                          onChange={(e) => handleNameChange(char.id, e.target.value)}
                          placeholder={char.name}
                          className={`w-full text-center text-xs font-bold rounded-lg px-1.5 py-0.5 border transition-all ${
                            isSelected
                              ? 'bg-slate-950/80 text-yellow-300 border-yellow-400/50 focus:border-yellow-300 focus:outline-none'
                              : 'bg-slate-900/50 text-slate-400 border-white/10'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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

            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                disabled={!isStartReady}
                onClick={handleStart}
                className={`w-full sm:w-auto px-9 py-3.5 font-mario text-lg sm:text-xl rounded-2xl shadow-xl border flex items-center justify-center gap-2.5 transition-all ${
                  isStartReady
                    ? 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white border-emerald-300/80 hover:scale-102 active:scale-97 cursor-pointer shadow-emerald-950/50 font-black'
                    : 'bg-white/10 text-slate-400 border-white/15 cursor-not-allowed opacity-50'
                }`}
              >
                <Play className={`w-5 h-5 ${isStartReady ? 'fill-current text-white' : 'text-slate-500'}`} />
                {isStartReady
                  ? `START ${THEME_UI[theme].startParty} PARTY! (${selectedChars.length} TEAMS)`
                  : `SELECT AT LEAST 2 TEAMS TO START (${selectedChars.length}/2)`}
              </button>

              <div className="flex items-center gap-1.5 text-xs text-amber-300/80 font-medium">
                <Shuffle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {theme === 'classic'
                    ? 'All 60 prompts shuffle on game start. Any team can answer!'
                    : 'All 60 question & mystery card locations are automatically randomized on game start!'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {calculatorOpen && (
          <TeamCalculatorModal
            theme={theme}
            suggestedGroups={selectedChars.length >= 2 ? selectedChars.length : 4}
            onClose={() => setCalculatorOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
