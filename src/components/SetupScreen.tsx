import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Users, Play, Check, Sun, Snowflake, Shuffle, 
  GraduationCap, HelpCircle, BookOpen, ArrowRight, ArrowLeft, 
  CheckCircle2, Compass, Award, Gamepad2
} from 'lucide-react';
import { CharacterId, Team, GameTheme } from '../types';
import { CHARACTERS, CHARACTER_LIST } from '../data/characters';
import { sounds } from '../utils/sound';
import { MarioCoin } from './MarioCoin';
import { AccountMenu } from './AccountMenu';
import { TeamAvatar } from './TeamAvatar';

interface SetupScreenProps {
  theme: GameTheme;
  onToggleTheme: () => void;
  onSelectTheme?: (theme: GameTheme) => void;
  onStartGame: (teams: Team[], startingCoins: number) => void;
  onOpenRules: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  theme,
  onToggleTheme,
  onSelectTheme,
  onStartGame,
  onOpenRules,
}) => {
  // Step 1: 'welcome' (Theme selection & Rules/Guide)
  // Step 2: 'teams' (Team selection, Starting Coins & Start Game)
  const [step, setStep] = useState<'welcome' | 'teams'>('welcome');

  // Enabled characters (starts with 0 selected per user request)
  const [selectedChars, setSelectedChars] = useState<CharacterId[]>([]);

  const [teamNames, setTeamNames] = useState<Record<CharacterId, string>>({
    yoshi: 'Team Yoshi',
    mario: 'Team Mario',
    peach: 'Team Peach',
    daisy: 'Team Daisy',
    donkey_kong: 'Team DK',
    luigi: 'Team Luigi',
  });

  const [startingCoins, setStartingCoins] = useState<number>(0);

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

  const handleThemeChange = (newTheme: GameTheme) => {
    if (newTheme === theme) return;
    if (onSelectTheme) {
      onSelectTheme(newTheme);
    } else {
      onToggleTheme();
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
    }));
    onStartGame(teams, startingCoins);
  };

  return (
    <div className="min-h-[85vh] lg:min-h-0 flex-1 flex items-center justify-center p-3 sm:p-4 lg:p-3">
      <div className="w-full max-w-4xl bg-slate-900 rounded-3xl border border-white/20 shadow-2xl overflow-hidden relative">
        {/* Luminous Top Glow Line */}
        <div
          className={`absolute top-0 inset-x-0 h-1.5 transition-colors duration-500 ${
            theme === 'summer'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]'
          } opacity-90`}
        />

        {/* Global Account Menu in Top-Right */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
          <AccountMenu />
        </div>

        <AnimatePresence mode="wait">
          {/* ========================================================================= */}
          {/* STEP 1: MAIN WELCOME SCREEN (Theme Selector + Rules / Guide)             */}
          {/* ========================================================================= */}
          {step === 'welcome' && (
            <motion.div
              key="welcome-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              {/* Header Hero */}
              <div className="bg-slate-800/90 p-5 sm:p-7 text-center text-white border-b border-white/15">
                <div className="flex items-center justify-center gap-2 mb-2 pr-12 sm:pr-14">
                  <div className="inline-flex items-center gap-2 bg-slate-700/80 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/20 text-amber-200">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Interactive Party & Classroom Game</span>
                  </div>
                </div>

                <h1 className="font-mario text-3xl sm:text-5xl text-white text-shadow-mario tracking-wider">
                  SUPER MARIO PARTY
                </h1>
              </div>

              {/* Main Content: Theme Selection & Rules */}
              <div className="p-5 sm:p-7 space-y-6">
                {/* 1. Theme Selection Cards */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-mario text-base sm:text-lg text-yellow-300 flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5 text-indigo-400" />
                      1. SELECT GAME THEME (エディション選択)
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Summer Edition Card */}
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        handleThemeChange('summer');
                      }}
                      className={`relative text-left p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        theme === 'summer'
                          ? 'bg-gradient-to-br from-amber-500/20 via-yellow-500/15 to-slate-900 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.25)] scale-101'
                          : 'bg-slate-800/40 border-white/10 hover:border-white/30 opacity-75 hover:opacity-100'
                      }`}
                    >
                      {theme === 'summer' && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <div className="flex items-start gap-3.5 pr-7">
                        <div className={`p-3 rounded-2xl ${
                          theme === 'summer' ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-700 text-amber-300'
                        }`}>
                          <Sun className="w-7 h-7 fill-current" />
                        </div>
                        <div>
                          <h3 className="font-mario text-lg sm:text-xl text-yellow-300">
                            SUMMER EDITION
                          </h3>
                          <span className="text-xs font-black uppercase text-amber-200 tracking-wide block mt-0.5">
                            60 ESL Trivia Questions
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        Features 60 ESL summer-themed questions and challenges.
                      </p>
                    </button>

                    {/* Christmas Edition Card */}
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        handleThemeChange('christmas');
                      }}
                      className={`relative text-left p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        theme === 'christmas'
                          ? 'bg-gradient-to-br from-indigo-500/20 via-cyan-500/15 to-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.25)] scale-101'
                          : 'bg-slate-800/40 border-white/10 hover:border-white/30 opacity-75 hover:opacity-100'
                      }`}
                    >
                      {theme === 'christmas' && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      <div className="flex items-start gap-3.5 pr-7">
                        <div className={`p-3 rounded-2xl ${
                          theme === 'christmas' ? 'bg-cyan-400 text-slate-950 shadow-md' : 'bg-slate-700 text-cyan-300'
                        }`}>
                          <Snowflake className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="font-mario text-lg sm:text-xl text-cyan-200">
                            CHRISTMAS EDITION
                          </h3>
                          <span className="text-xs font-black uppercase text-cyan-300 tracking-wide block mt-0.5">
                            60 Holiday Trivia & Traditions
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        Festive winter celebration questions covering holiday carols, Christmas movies, global winter traditions, festive food, and holiday lore.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. Rules & Host Guide Showcase Card */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950/60 via-slate-800/80 to-indigo-950/60 rounded-2xl border border-indigo-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 shrink-0 text-yellow-300">
                      <GraduationCap className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-mario text-sm sm:text-base text-yellow-300">
                          HOW TO PLAY & HOST GUIDE (遊び方・ガイド)
                        </h3>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-500/30 text-cyan-200 border border-indigo-400/30">
                          🇬🇧 English / 🇯🇵 日本語
                        </span>
                      </div>
                      <p className="text-xs text-indigo-100 mt-1 leading-relaxed max-w-xl">
                        Teams take turns picking any of 60 mystery blocks. Includes full teacher instructions, live coin controls (+/- anytime), 8 mystery card roulettes, and smartboard tips.
                      </p>
                    </div>
                  </div>

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
                </div>

                {/* 3. Next: Proceed to Team Selection CTA Button */}
                <div className="pt-2 flex flex-col items-center gap-2">
                  <button
                    id="setup-proceed-btn"
                    type="button"
                    onClick={() => {
                      sounds.playPowerUp();
                      setStep('teams');
                    }}
                    className="w-full sm:w-auto px-10 py-3.5 font-mario text-lg sm:text-xl rounded-2xl shadow-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 border-2 border-yellow-200 hover:scale-102 active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-3 font-black glass-glow-gold"
                  >
                    <span>CHOOSE TEAMS & PLAY</span>
                    <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  <span className="text-xs text-slate-400">
                    Next: Select between 2 and 6 character teams and starting coins
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: TEAM SELECTION & GAME START                                      */}
          {/* ========================================================================= */}
          {step === 'teams' && (
            <motion.div
              key="teams-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              {/* Header with Back Navigation */}
              <div className="bg-slate-800/90 p-4 sm:p-5 text-white border-b border-white/15 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setStep('welcome');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-xs font-bold text-slate-200 border border-white/15 transition-all cursor-pointer hover:scale-102 active:scale-97"
                >
                  <ArrowLeft className="w-4 h-4 text-yellow-400" />
                  <span>Back to Theme & Rules</span>
                </button>

                {/* Active Theme Pill */}
                <div className="flex items-center gap-2 pr-12 sm:pr-14">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase border ${
                    theme === 'summer'
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                      : 'bg-cyan-400/20 text-cyan-300 border-cyan-400/50'
                  }`}>
                    {theme === 'summer' ? (
                      <>
                        <Sun className="w-3.5 h-3.5 fill-current" />
                        <span>Summer Edition (60 ESL)</span>
                      </>
                    ) : (
                      <>
                        <Snowflake className="w-3.5 h-3.5" />
                        <span>Christmas Edition (60 Holiday)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Selection Options */}
              <div className="p-4 sm:p-6 lg:py-5 lg:px-6 space-y-4 sm:space-y-5">
                {/* Character / Team Selection Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="font-mario text-base sm:text-lg text-yellow-300 flex items-center gap-2">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                      CHOOSE ACTIVE TEAMS ({selectedChars.length}/6)
                    </h3>
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

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
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
                          {/* Selected Checkmark Badge */}
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

                {/* Starting Coins Selection */}
                <div className="p-3 bg-slate-800/60 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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

                {/* Launch Button & Randomization Indicator */}
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
                      ? `START ${theme === 'summer' ? 'SUMMER' : 'CHRISTMAS'} PARTY! (${selectedChars.length} TEAMS)`
                      : `SELECT AT LEAST 2 TEAMS TO START (${selectedChars.length}/2)`}
                  </button>

                  <div className="flex items-center gap-1.5 text-xs text-amber-300/80 font-medium">
                    <Shuffle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>All 60 question & mystery card locations are automatically randomized on game start!</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
