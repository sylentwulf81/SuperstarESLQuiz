import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Trophy, 
  HelpCircle, 
  Settings2, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  SkipForward, 
  Shuffle, 
  AlertTriangle, 
  X,
  Menu,
  Music,
  GraduationCap,
  Library,
  Eye,
  EyeOff
} from 'lucide-react';
import { Team, GameTheme } from '@/shared/types';
import { THEME_UI } from '@/shared/themeMeta';
import { sounds } from '@/shared/utils/sound';
import { MusicPlayer } from './MusicPlayer';
import { AccountMenu } from '@/shared/components/AccountMenu';
import { TeamAvatar } from './TeamAvatar';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';

interface HeaderNavProps {
  theme: GameTheme;
  currentTeam: Team;
  teams: Team[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  showCatchUpNote?: boolean;
  onToggleCatchUpNote?: () => void;
  onOpenRules: () => void;
  onOpenCustomizer: () => void;
  onDeclareWinner: () => void;
  onResetGame: () => void;
  onExitToLauncher?: () => void;
  onShuffleBoard?: () => void;
  onNextTurn: () => void;
  openedCount: number;
  totalBlocks: number;
  isGameOver?: boolean;
  onManualSync?: () => Promise<boolean>;
  onManualLoad?: () => Promise<boolean>;
}

export const HeaderNav = React.memo(function HeaderNav({
  theme,
  currentTeam,
  teams,
  soundEnabled,
  onToggleSound,
  showCatchUpNote = false,
  onToggleCatchUpNote,
  onOpenRules,
  onOpenCustomizer,
  onDeclareWinner,
  onResetGame,
  onExitToLauncher,
  onShuffleBoard,
  onNextTurn,
  openedCount,
  totalBlocks,
  isGameOver = false,
  onManualSync,
  onManualLoad,
}: HeaderNavProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useBodyScrollLock(isMobileMenuOpen || showResetConfirm);

  const gameTitle = theme === 'classic' ? 'SUPER QUIZ CLASSIC' : 'MARIO PARTY';

  return (
    <header className="relative z-40 bg-slate-900 border-b border-white/15 px-2 sm:px-3 lg:px-4 py-1.5 shadow-xl shrink-0 w-full">
      <div className="w-full max-w-[1750px] mx-auto grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 min-w-0">
        {/* Brand + pass */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 justify-self-start">
          <h1 className="font-mario text-sm sm:text-base lg:text-lg text-yellow-300 drop-shadow truncate min-w-0">
            {gameTitle}
          </h1>
          {theme !== 'classic' && (
            <span
              className={`hidden xl:inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border shadow-sm shrink-0 ${
                theme === 'summer'
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
              }`}
            >
              {THEME_UI[theme].short}
            </span>
          )}
          <button
            onClick={() => {
              sounds.playClick();
              onNextTurn();
            }}
            title="Pass turn to next team"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold bg-slate-800/80 hover:bg-slate-750 active:scale-95 text-white/90 px-2 py-1 rounded-xl border border-white/15 transition-all cursor-pointer shadow-sm uppercase tracking-wider shrink-0"
          >
            <SkipForward className="w-3.5 h-3.5 text-indigo-300" />
            <span className="hidden xl:inline">Pass</span>
          </button>
        </div>

        {/* Center: cleared always; full music player only when the row is wide enough */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-xl border h-[34px] shrink-0 ${
              isGameOver
                ? 'bg-amber-950/70 border-yellow-400/60 shadow-[0_0_15px_rgba(250,204,21,0.25)]'
                : 'bg-slate-800/60 border-white/10 text-slate-300'
            }`}
          >
            <span className={isGameOver ? 'text-yellow-300 font-bold text-[11px]' : 'text-white/60 text-[11px]'}>
              {isGameOver ? '🏁' : 'Cleared'}
            </span>
            <span className={`font-bold font-pixel text-[10px] ${isGameOver ? 'text-yellow-300' : 'text-amber-300'}`}>
              {openedCount}/{totalBlocks}
            </span>
          </div>
          <div className="hidden 2xl:block shrink-0">
            <MusicPlayer />
          </div>
        </div>

        {/* Primary action + tools (tools collapse into menu below lg) */}
        <div className="flex items-center gap-1.5 justify-self-end shrink-0">
          <button
            onClick={() => {
              sounds.playSuperstar();
              onDeclareWinner();
            }}
            className={`inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 font-bold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs shadow-md border border-yellow-200/80 transition-all cursor-pointer glass-glow-gold ${
              isGameOver ? 'ring-2 ring-yellow-300 animate-pulse shadow-[0_0_20px_rgba(250,204,21,0.6)]' : ''
            }`}
            title={isGameOver ? 'Finished! View final leaderboard & champion' : 'Crown the Superstar Winner!'}
          >
            <Trophy className="w-3.5 h-3.5 fill-amber-950 text-amber-950 shrink-0" />
            <span className="hidden min-[1000px]:inline">{isGameOver ? 'Leaderboard' : 'Superstar!'}</span>
          </button>

          <div className="hidden lg:flex items-center gap-0.5 bg-slate-800/60 p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => {
                sounds.playClick();
                onToggleSound();
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                soundEnabled
                  ? 'hover:bg-slate-700 text-amber-300'
                  : 'text-slate-500 hover:text-slate-400'
              }`}
              title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onOpenRules();
              }}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-yellow-300 rounded-lg transition-all cursor-pointer"
              title="Host guide & activity rules (English & 日本語)"
            >
              <HelpCircle className="w-3.5 h-3.5 text-yellow-300" />
            </button>

            {onShuffleBoard && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onShuffleBoard();
                }}
                className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded-lg transition-all cursor-pointer"
                title="Shuffle All Board Questions & Mystery Cards"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              id="header-reset-game-btn"
              onClick={() => {
                sounds.playClick();
                setShowResetConfirm(true);
              }}
              className="p-1.5 hover:bg-red-950/60 text-slate-300 hover:text-red-300 rounded-lg transition-all cursor-pointer"
              title="Restart / Setup"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            id="header-mobile-menu-toggle-btn"
            onClick={() => {
              sounds.playClick();
              setIsMobileMenuOpen(prev => !prev);
            }}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              isMobileMenuOpen
                ? 'bg-amber-400 text-slate-950 border-yellow-300 shadow-md scale-105'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-white/20'
            }`}
            title={isMobileMenuOpen ? 'Close Menu' : 'Open menu'}
            aria-label="Toggle activity options menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Slide-over Responsive Hamburger Menu Drawer */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isMobileMenuOpen && (
              <div className="fixed inset-0 z-[100]">
                {/* Backdrop Blur */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
                  onClick={() => {
                    sounds.playClick();
                    setIsMobileMenuOpen(false);
                  }}
                />

                {/* Sliding Drawer from Right */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                  className="fixed top-0 right-0 bottom-0 w-full sm:w-[380px] max-w-[92vw] bg-slate-900 border-l border-white/20 shadow-2xl p-4 sm:p-5 flex flex-col justify-between overflow-y-auto text-white z-10"
                >
                  {/* Drawer Top / Header */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/15">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-xl bg-amber-400/20 border border-amber-300/40">
                          <Sparkles className="w-4 h-4 text-amber-300" />
                        </div>
                        <div>
                          <h3 className="font-mario text-base sm:text-lg text-yellow-300 tracking-wider">
                            HOST MENU
                          </h3>
                          <p className="text-[11px] text-indigo-200">Controls, music player & guide</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          sounds.playClick();
                          setIsMobileMenuOpen(false);
                        }}
                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
                        aria-label="Close menu"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {onExitToLauncher && (
                        <button
                          onClick={() => {
                            sounds.playClick();
                            setIsMobileMenuOpen(false);
                            setShowResetConfirm(true);
                          }}
                          className="w-full p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-97 text-left border border-white/15 shadow-sm flex items-center gap-2.5 cursor-pointer"
                        >
                          <Library className="w-4 h-4 text-amber-300" />
                          <div>
                            <div className="font-semibold text-xs sm:text-sm text-white">Library</div>
                            <div className="text-[10px] text-slate-400">Back to classroom activities</div>
                          </div>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          sounds.playClick();
                          setIsMobileMenuOpen(false);
                          onOpenCustomizer();
                        }}
                        className="w-full p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-97 text-left border border-white/15 shadow-sm flex items-center gap-2.5 cursor-pointer transition-all"
                      >
                        <Settings2 className="w-4 h-4 text-amber-300" />
                        <div>
                          <div className="font-semibold text-xs sm:text-sm text-white">Studio</div>
                          <div className="text-[10px] text-slate-400">Edit questions & answers</div>
                        </div>
                      </button>

                      <div className="p-2.5 rounded-2xl bg-slate-800 border border-white/15 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-xs sm:text-sm text-white">Account</div>
                          <div className="text-[10px] text-slate-400">Sign in for cloud backup</div>
                        </div>
                        <AccountMenu
                          onManualSync={onManualSync}
                          onManualLoad={onManualLoad}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-800/90 rounded-2xl border border-white/15 shadow-md space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <Music className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Background Music (BGM)</span>
                      </div>
                      <div className="pt-0.5">
                        <MusicPlayer />
                      </div>
                    </div>

                    {/* Section 2: Progress & Turn Status */}
                    <div className="p-3 bg-slate-800/70 rounded-2xl border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="text-indigo-200 font-semibold whitespace-nowrap shrink-0">Active Turn:</span>
                        <div className="flex items-center gap-1.5 font-mario min-w-0 truncate">
                          <TeamAvatar
                            characterId={currentTeam.characterId}
                            size="sm"
                            customUrl={currentTeam.customImageUrl}
                            className="w-5 h-5 shrink-0"
                          />
                          <span className="truncate text-yellow-300">{currentTeam.name}</span>
                          <span className={`inline-flex items-center gap-1 text-xs ml-1 font-bold ${
                            currentTeam.coins < 0 ? 'text-red-400' : 'text-yellow-300'
                          }`}>
                            <span>({currentTeam.coins}</span>
                            <MarioCoin size="xs" />
                            <span>)</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                        <span className="text-indigo-200 font-semibold">Board Progress:</span>
                        <span className="font-bold text-amber-300">{openedCount} / {totalBlocks} Blocks</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300"
                          style={{ width: `${(openedCount / totalBlocks) * 100}%` }}
                        />
                      </div>

                      {/* Pass Turn Button Inside Drawer */}
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setIsMobileMenuOpen(false);
                          onNextTurn();
                        }}
                        className="w-full mt-1 py-1.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-650 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
                      >
                        <SkipForward className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Pass Turn to Next Team</span>
                      </button>
                    </div>

                    {/* Section 3: Primary Navigation Buttons */}
                    <div className="space-y-2">
                      {/* How to Play & Host Guide */}
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setIsMobileMenuOpen(false);
                          onOpenRules();
                        }}
                        className="w-full p-3 rounded-2xl bg-gradient-to-r from-indigo-900/90 to-blue-900/90 hover:from-indigo-850 hover:to-blue-850 active:scale-97 text-left border border-indigo-400/40 shadow-md flex items-center justify-between cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-xl bg-yellow-400/20 text-yellow-300">
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-mario text-xs sm:text-sm text-yellow-300">
                              HOW TO PLAY & HOST GUIDE
                            </div>
                            <div className="text-[10px] text-indigo-200">
                              Teacher manual & rules (EN / 日本語)
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-yellow-300 font-bold">📖</span>
                      </button>

                      {onToggleCatchUpNote && (
                        <button
                          onClick={() => {
                            sounds.playClick();
                            onToggleCatchUpNote();
                          }}
                          className="w-full p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-97 text-left border border-white/15 shadow-sm flex items-center justify-between cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            {showCatchUpNote ? (
                              <Eye className="w-4 h-4 text-sky-300" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-slate-500" />
                            )}
                            <div>
                              <div className="font-semibold text-xs sm:text-sm text-white">
                                Catch-up Note: {showCatchUpNote ? 'Shown' : 'Hidden'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {showCatchUpNote
                                  ? '1st place sees why Blue Shell & Bowser cards are missing'
                                  : 'Keep mystery draws surprising — catch-up still applies'}
                              </div>
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Sound FX Toggle */}
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onToggleSound();
                        }}
                        className="w-full p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-97 text-left border border-white/15 shadow-sm flex items-center justify-between cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          {soundEnabled ? (
                            <Volume2 className="w-4 h-4 text-amber-300" />
                          ) : (
                            <VolumeX className="w-4 h-4 text-slate-500" />
                          )}
                          <div>
                            <div className="font-semibold text-xs sm:text-sm text-white">
                              Sound Effects: {soundEnabled ? 'Enabled' : 'Muted'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Coin sounds, fanfares, and character voice FX
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Shuffle Board */}
                      {onShuffleBoard && (
                        <button
                          onClick={() => {
                            sounds.playClick();
                            setIsMobileMenuOpen(false);
                            onShuffleBoard();
                          }}
                          className="w-full p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-97 text-left border border-white/15 shadow-sm flex items-center justify-between cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <Shuffle className="w-4 h-4 text-amber-300" />
                            <div>
                              <div className="font-semibold text-xs sm:text-sm text-white">
                                Shuffle Board Blocks
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Randomize question and mystery positions
                              </div>
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Restart Game */}
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setIsMobileMenuOpen(false);
                          setShowResetConfirm(true);
                        }}
                        className="w-full p-2.5 rounded-2xl bg-red-950/40 hover:bg-red-900/60 active:scale-97 text-left border border-red-500/30 shadow-sm flex items-center justify-between cursor-pointer transition-all text-red-200"
                      >
                        <div className="flex items-center gap-2.5">
                          <RotateCcw className="w-4 h-4 text-red-400" />
                          <div>
                            <div className="font-semibold text-xs sm:text-sm text-red-300">
                              Restart / New Activity
                            </div>
                            <div className="text-[10px] text-red-400/80">
                              Return to team setup screen
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Are You Sure Reset Confirmation Modal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showResetConfirm && (
              <div
                id="reset-confirm-backdrop"
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
                onClick={() => {
                  sounds.playClick();
                  setShowResetConfirm(false);
                }}
              >
                <motion.div
                  id="reset-confirm-modal"
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="reset-modal-title"
                  aria-describedby="reset-modal-desc"
                  initial={{ scale: 0.92, opacity: 0, y: 8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 8 }}
                  transition={{ duration: 0.16 }}
                  className="relative w-full max-w-md bg-slate-900 border border-red-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-red-950/40 text-white overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Subtle accent bar */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

                  {/* Close Button */}
                  <button
                    id="reset-modal-close-btn"
                    onClick={() => {
                      sounds.playClick();
                      setShowResetConfirm(false);
                    }}
                    className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400 shadow-inner">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <h3 id="reset-modal-title" className="text-lg sm:text-xl font-bold font-mario text-yellow-300 drop-shadow">
                        ARE YOU SURE?
                      </h3>
                      <p id="reset-modal-desc" className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                        This ends the live session. Choose the library or restart setup — scores and board progress will not come back.
                      </p>
                      <div className="mt-2.5 p-2.5 bg-slate-800/80 rounded-xl border border-white/10 text-xs text-indigo-200">
                        <p className="font-semibold text-amber-300 mb-0.5">The following will be lost:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                          <li>Board progress ({openedCount} of {totalBlocks} mystery blocks opened)</li>
                          <li>Current team scores, rankings, and active turn</li>
                          <li>Active power-ups and coin steal logs</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 mt-5 pt-3 border-t border-white/10">
                    <button
                      id="reset-modal-cancel-btn"
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setShowResetConfirm(false);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold border border-white/15 transition-all cursor-pointer"
                    >
                      Keep Going
                    </button>
                    {onExitToLauncher && (
                      <button
                        id="reset-modal-library-btn"
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setShowResetConfirm(false);
                          onExitToLauncher();
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 active:scale-95 text-indigo-200 hover:text-white text-xs sm:text-sm font-bold border border-indigo-400/40 transition-all cursor-pointer"
                      >
                        <Library className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Exit to Library</span>
                      </button>
                    )}
                    <button
                      id="reset-modal-confirm-btn"
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setShowResetConfirm(false);
                        onResetGame();
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-950/60 border border-red-400/30 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restart Setup</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </header>
  );
});
