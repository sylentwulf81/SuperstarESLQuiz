import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { AmbientParticles } from './components/AmbientParticles';
import { HeaderNav } from './components/HeaderNav';
import { TeamLeaderboard } from './components/TeamLeaderboard';
import { GameBoard } from './components/GameBoard';
import { QuestionModal } from './components/QuestionModal';
import { RewardRouletteModal } from './components/RewardRouletteModal';
import { SuperstarModal } from './components/SuperstarModal';
import { SetupScreen } from './components/SetupScreen';
import { ThemedBackdrop } from './components/ThemedBackdrop';
import { RulebookModal } from './components/RulebookModal';
import { CustomizerModal } from './components/CustomizerModal';
import { BlueShellSkipOverlay } from './components/BlueShellSkipOverlay';
import { useAuth } from '@/shared/context/AuthContext';
import { GameQuestion, RewardCard, GameTheme, RewardCardActionOptions, Team } from '@/shared/types';
import { loadShowCatchUpNote, persistShowCatchUpNote } from './data/rewards';
import { EngineEffect, afterPaint, playEngineSound } from '@/shared/engineFx';
import { preloadRevealArt } from '@/games/mario-party-quiz/data/revealArt';
import {
  createTurnBasedState,
  reduceTurnBased,
  activeTeamOf,
  openedBlockCount,
  isBoardCleared,
  TurnBasedEvent,
} from './engine';
import { createGameBlocks, TOTAL_BLOCKS } from './createBlocks';

export { TOTAL_BLOCKS };

export interface MarioPartyQuizProps {
  initialTheme?: GameTheme;
  onExitToLauncher: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function MarioPartyQuiz({
  initialTheme = 'summer',
  onExitToLauncher,
  soundEnabled,
  onToggleSound,
}: MarioPartyQuizProps) {
  const { user, isLoggedIn, saveQuestionsCloud, loadQuestionsCloud } = useAuth();
  const theme = initialTheme;
  const [state, setState] = useState(() => createTurnBasedState(createGameBlocks(initialTheme)));
  const [showCatchUpNote, setShowCatchUpNote] = useState(loadShowCatchUpNote);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const pendingEffectsRef = useRef<EngineEffect[]>([]);

  const handleToggleCatchUpNote = useCallback(() => {
    setShowCatchUpNote(prev => {
      const next = !prev;
      persistShowCatchUpNote(next);
      return next;
    });
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  const runEffects = useCallback((effects: EngineEffect[]) => {
    for (const effect of effects) {
      if (effect.kind === 'sound') playEngineSound(effect.sound);
      if (effect.kind === 'toast') showToast(effect.message);
      if (effect.kind === 'scheduleSuperstar') {
        window.setTimeout(() => {
          setState(prev => reduceTurnBased(prev, { type: 'DECLARE_SUPERSTAR' }).state);
        }, effect.ms);
      }
    }
  }, [showToast]);

  const dispatch = useCallback((event: TurnBasedEvent) => {
    setState(prev => {
      const result = reduceTurnBased(prev, event);
      pendingEffectsRef.current = result.effects;
      return result.state;
    });
    afterPaint(() => {
      const effects = pendingEffectsRef.current;
      if (effects.length === 0) return;
      pendingEffectsRef.current = [];
      runEffects(effects);
    });
  }, [runEffects]);

  useEffect(() => {
    preloadRevealArt();
  }, []);

  useEffect(() => {
    if (isLoggedIn && user) {
      loadQuestionsCloud(theme).then((cloud) => {
        if (cloud && cloud.questions.length > 0) {
          dispatch({
            type: 'SET_BLOCKS',
            blocks: createGameBlocks(theme, cloud.questions),
            toast: `☁️ Synced ${cloud.questions.length} custom questions from Firestore (${user.displayName || 'User'})!`,
          });
        }
      }).catch((e) => {
        console.warn('Initial cloud questions fetch:', e);
      });
    }
  }, [isLoggedIn, user?.uid, theme, dispatch]);

  const { teams, blocks, selectedBlockId, rouletteCards, blueShellNotice, view, currentTeamIndex } = state;
  const activeTeam = activeTeamOf(state);
  const openedBlocksCount = openedBlockCount(state);
  const boardCleared = isBoardCleared(state);

  const persistQuestions = (updatedBlocks: typeof blocks) => {
    const rawQuestions = updatedBlocks.map(b => b.question);
    try {
      localStorage.setItem(`mp_custom_blocks_v5_${theme}`, JSON.stringify(rawQuestions));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
    if (isLoggedIn && user) {
      saveQuestionsCloud(theme, rawQuestions).catch(() => {});
    }
  };

  const handleStartGame = (configuredTeams: Team[]) => {
    dispatch({
      type: 'START',
      teams: configuredTeams,
      blocks: createGameBlocks(theme, undefined, true),
    });
  };

  const handleUpdateBlockQuestion = (blockId: number, updatedQuestion: GameQuestion) => {
    dispatch({ type: 'UPDATE_QUESTION', blockId, question: updatedQuestion });
    const sanitized: GameQuestion = {
      ...updatedQuestion,
      rewardCoins: updatedQuestion.type === 'mystery_card' ? 0 : Math.max(1, Number(updatedQuestion.rewardCoins) || 1),
    };
    persistQuestions(blocks.map(b => (b.id === blockId ? { ...b, question: sanitized } : b)));
    toast.success(`Block #${blockId} Question Saved!`, {
      description: updatedQuestion.title
        ? `"${updatedQuestion.title.length > 55 ? updatedQuestion.title.slice(0, 52) + '…' : updatedQuestion.title}"`
        : 'Question content updated in deck.',
      duration: 3500,
    });
    showToast(`✅ Saved changes for Block #${blockId}!`);
  };

  const handleResetAllQuestions = () => {
    try {
      localStorage.removeItem(`mp_custom_blocks_v5_${theme}`);
      localStorage.removeItem(`mp_custom_blocks_v4_${theme}`);
      localStorage.removeItem(`mp_custom_blocks_v3_${theme}`);
      localStorage.removeItem(`mp_custom_blocks_v2_${theme}`);
    } catch {}
    const defaultBlocks = createGameBlocks(theme);
    dispatch({
      type: 'SET_BLOCKS',
      blocks: defaultBlocks,
      toast: `🔄 Restored all ${defaultBlocks.length} block questions to default curriculum!`,
    });
  };

  const handleManualSync = async () => {
    if (!isLoggedIn) {
      showToast('ℹ️ Sign in with Google to sync questions to the cloud.');
      return;
    }
    const rawQuestions = blocks.map(b => b.question);
    const success = await saveQuestionsCloud(theme, rawQuestions);
    showToast(success
      ? `☁️ All ${rawQuestions.length} questions successfully backed up to Firestore!`
      : '⚠️ Could not sync to Firestore. Check connection.');
  };

  const handleManualLoad = async () => {
    if (!isLoggedIn) {
      showToast('ℹ️ Sign in with Google to load your cloud questions.');
      return;
    }
    const cloud = await loadQuestionsCloud(theme);
    if (cloud && cloud.questions.length > 0) {
      const next = createGameBlocks(theme, cloud.questions);
      dispatch({ type: 'SET_BLOCKS', blocks: next, toast: `☁️ Loaded ${cloud.questions.length} custom questions from Firestore!` });
      persistQuestions(next);
    } else {
      showToast(`ℹ️ No custom questions found in Firestore for ${theme} theme.`);
    }
  };

  const handleRewardCardSelected = (
    card: RewardCard,
    targetTeamIdOrOptions?: string | RewardCardActionOptions,
    shouldAdvanceTurn: boolean = true
  ) => {
    const options: RewardCardActionOptions = typeof targetTeamIdOrOptions === 'string'
      ? { targetTeamId: targetTeamIdOrOptions }
      : (targetTeamIdOrOptions || {});
    dispatch({ type: 'RESOLVE_CARD', card, options, shouldAdvanceTurn });
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);
  const selectedQuestion = selectedBlock?.question;

  return (
    <div className="h-dvh max-h-dvh overflow-hidden text-slate-100 flex flex-col relative selection:bg-amber-400 selection:text-slate-950 bg-slate-950">
      <ThemedBackdrop theme={theme} />
      <AmbientParticles theme={theme} />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed bottom-6 sm:bottom-8 inset-x-0 mx-auto w-fit max-w-lg z-50 px-5 py-3 rounded-2xl bg-slate-900/95 border-2 border-yellow-400/80 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(250,204,21,0.3)] text-yellow-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 text-center pointer-events-none backdrop-blur-md"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        {view === 'setup' && (
          <SetupScreen
            theme={theme}
            onStartGame={handleStartGame}
            onOpenRules={() => setIsRulesModalOpen(true)}
            onOpenStudio={() => setIsCustomizerOpen(true)}
            onBackToLauncher={onExitToLauncher}
          />
        )}

        {view === 'board' && (
          <div className="flex-1 flex flex-col min-h-0">
            <HeaderNav
              theme={theme}
              currentTeam={activeTeam}
              teams={teams}
              soundEnabled={soundEnabled}
              onToggleSound={onToggleSound}
              showCatchUpNote={showCatchUpNote}
              onToggleCatchUpNote={handleToggleCatchUpNote}
              onOpenRules={() => setIsRulesModalOpen(true)}
              onOpenCustomizer={() => setIsCustomizerOpen(true)}
              onDeclareWinner={() => dispatch({ type: 'DECLARE_SUPERSTAR' })}
              onResetGame={() => dispatch({ type: 'RESTART_SETUP' })}
              onExitToLauncher={onExitToLauncher}
              onShuffleBoard={() => dispatch({
                type: 'SET_BLOCKS',
                blocks: createGameBlocks(theme, undefined, true),
                playShuffle: true,
                toast: '🎲 All 60 board questions & mystery blocks reshuffled!',
              })}
              onNextTurn={() => dispatch({ type: 'PASS_TURN' })}
              openedCount={openedBlocksCount}
              totalBlocks={blocks.length}
              isGameOver={boardCleared}
              onManualSync={handleManualSync}
              onManualLoad={handleManualLoad}
            />
            <TeamLeaderboard
              teams={teams}
              currentTeamIndex={currentTeamIndex}
              onSelectTeamTurn={idx => dispatch({ type: 'SELECT_TEAM_TURN', teamIndex: idx })}
              onAdjustCoins={(teamId, delta) => dispatch({ type: 'ADJUST_COINS', teamId, delta })}
            />
            <main className="flex-1 min-h-0 flex flex-col py-1">
              <GameBoard
                blocks={blocks}
                teams={teams}
                onSelectBlock={blockId => dispatch({ type: 'SELECT_BLOCK', blockId })}
                isGameOver={boardCleared}
                onOpenLeaderboard={() => dispatch({ type: 'DECLARE_SUPERSTAR' })}
              />
            </main>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedQuestion && selectedQuestion.type !== 'mystery_card' && (
          <QuestionModal
            question={selectedQuestion}
            currentTeam={activeTeam}
            onClose={() => dispatch({ type: 'CLOSE_QUESTION' })}
            onAnswerCorrect={coins => dispatch({ type: 'ANSWER_CORRECT', coins })}
            onAnswerIncorrect={() => dispatch({ type: 'ANSWER_INCORRECT' })}
            onTriggerRoulette={() => dispatch({ type: 'TRIGGER_ROULETTE' })}
            onAdjustCoins={(teamId, delta) => dispatch({ type: 'ADJUST_COINS', teamId, delta })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rouletteCards && (
          <RewardRouletteModal
            cards={rouletteCards}
            currentTeam={activeTeam}
            teams={teams}
            theme={theme}
            onCardSelected={handleRewardCardSelected}
            onClose={() => dispatch({ type: 'CLOSE_ROULETTE' })}
            showCatchUpNote={showCatchUpNote}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRulesModalOpen && (
          <RulebookModal
            onClose={() => setIsRulesModalOpen(false)}
            onTestCardInGame={(card) => handleRewardCardSelected(card, undefined, false)}
            activeTeamName={activeTeam?.name}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCustomizerOpen && (
          <CustomizerModal
            theme={theme}
            blocks={blocks}
            onUpdateBlockQuestion={handleUpdateBlockQuestion}
            onResetAllQuestions={handleResetAllQuestions}
            onSaveCloud={handleManualSync}
            onLoadCloud={handleManualLoad}
            onClose={() => setIsCustomizerOpen(false)}
            showCatchUpNote={showCatchUpNote}
            onToggleCatchUpNote={handleToggleCatchUpNote}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {view === 'superstar' && (
          <SuperstarModal
            teams={teams}
            onRestart={() => dispatch({ type: 'RESTART_SETUP' })}
            onClose={() => dispatch({ type: 'CLOSE_SUPERSTAR' })}
            onExitToLauncher={onExitToLauncher}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {blueShellNotice && (
          <BlueShellSkipOverlay
            skippedTeam={blueShellNotice.skippedTeam}
            nextTeam={blueShellNotice.nextTeam}
            onClose={() => dispatch({ type: 'DISMISS_BLUE_SHELL' })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
