import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { AmbientParticles } from '@/games/mario-party-quiz/components/AmbientParticles';
import { HeaderNav } from '@/games/mario-party-quiz/components/HeaderNav';
import { TeamLeaderboard } from '@/games/mario-party-quiz/components/TeamLeaderboard';
import { GameBoard } from '@/games/mario-party-quiz/components/GameBoard';
import { RewardRouletteModal } from '@/games/mario-party-quiz/components/RewardRouletteModal';
import { SuperstarModal } from '@/games/mario-party-quiz/components/SuperstarModal';
import { SetupScreen } from '@/games/mario-party-quiz/components/SetupScreen';
import { ThemedBackdrop } from '@/games/mario-party-quiz/components/ThemedBackdrop';
import { CustomizerModal } from '@/games/mario-party-quiz/components/CustomizerModal';
import { ClassicRoundModal } from './components/ClassicRoundModal';
import { ClassicRulebookModal } from './components/ClassicRulebookModal';
import { MysteryBlocksMiniGame } from './components/MysteryBlocksMiniGame';
import { RoundOverOverlay } from './components/RoundOverOverlay';
import { useAuth } from '@/shared/context/AuthContext';
import { GameQuestion, RewardCard, RewardCardActionOptions, Team } from '@/shared/types';
import { loadShowCatchUpNote, persistShowCatchUpNote } from '@/games/mario-party-quiz/data/rewards';
import { loadClassicTestGame, persistClassicTestGame } from './data/classicRewards';
import {
  DEFAULT_CLASSIC_LESSON_GOAL,
  loadClassicLessonGoal,
  persistClassicLessonGoal,
  resetClassicLessonGoal,
} from './data/classicLesson';
import { EngineEffect, playEngineSound } from '@/shared/engineFx';
import {
  createClassicState,
  reduceClassic,
  classicActiveTeam,
  classicOpenedCount,
  classicBoardCleared,
  ClassicEvent,
} from './engine';
import { createGameBlocks, TOTAL_BLOCKS } from '@/games/mario-party-quiz/createBlocks';

export const MARIO_BLAST_CLASSIC_MODULE = 'mario-blast-classic' as const;

export interface MarioBlastClassicProps {
  onExitToLauncher: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const CLASSIC_THEME = 'classic' as const;

export function MarioBlastClassic({
  onExitToLauncher,
  soundEnabled,
  onToggleSound,
}: MarioBlastClassicProps) {
  const { user, isLoggedIn, saveQuestionsCloud, loadQuestionsCloud } = useAuth();
  const theme = CLASSIC_THEME;
  const [state, setState] = useState(() => createClassicState(createGameBlocks(theme), loadClassicTestGame()));
  const [showCatchUpNote, setShowCatchUpNote] = useState(loadShowCatchUpNote);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lessonGoal, setLessonGoal] = useState(loadClassicLessonGoal);

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
          setState(prev => reduceClassic(prev, { type: 'DECLARE_SUPERSTAR' }).state);
        }, effect.ms);
      }
    }
  }, [showToast]);

  const dispatch = useCallback((event: ClassicEvent) => {
    setState(prev => {
      const result = reduceClassic(prev, event);
      queueMicrotask(() => runEffects(result.effects));
      return result.state;
    });
  }, [runEffects]);

  useEffect(() => {
    if (isLoggedIn && user) {
      loadQuestionsCloud(theme)
        .then(cloud => {
          if (cloud && cloud.questions.length > 0) {
            dispatch({
              type: 'SET_BLOCKS',
              blocks: createGameBlocks(theme, cloud.questions),
              toast: `☁️ Synced ${cloud.questions.length} custom questions from Firestore!`,
            });
          }
          if (cloud?.lessonGoal?.trim()) {
            setLessonGoal(cloud.lessonGoal.trim());
            persistClassicLessonGoal(cloud.lessonGoal);
          }
        })
        .catch(() => {});
    }
  }, [isLoggedIn, user?.uid, theme, dispatch]);

  const {
    view, teams, currentTeamIndex, blocks, selectedBlockId, slots, drawnTeamIds,
    selectedAnsweringTeamId, pendingCard, mysteryOutcomes, roundOverReason, testMode,
  } = state;
  const activeTeam = classicActiveTeam(state);
  const openedBlocksCount = classicOpenedCount(state);
  const boardCleared = classicBoardCleared(state);
  const answeringTeam = teams.find(t => t.id === selectedAnsweringTeamId) || activeTeam;
  const cardsRemaining = slots.filter(s => !s.claimedByTeamId).length;
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);
  const selectedQuestion = selectedBlock?.question;

  const persistQuestions = (updatedBlocks: typeof blocks) => {
    const rawQuestions = updatedBlocks.map(b => b.question);
    try {
      localStorage.setItem(`mp_custom_blocks_v5_${theme}`, JSON.stringify(rawQuestions));
    } catch {
      // ignore
    }
    if (isLoggedIn && user) {
      saveQuestionsCloud(theme, rawQuestions, { lessonGoal }).catch(() => {});
    }
  };

  const handleStartGame = (configuredTeams: Team[]) => {
    dispatch({ type: 'START', teams: configuredTeams, blocks: createGameBlocks(theme, undefined, true) });
  };

  const handleToggleTestGame = useCallback(() => {
    const next = !testMode;
    persistClassicTestGame(next);
    dispatch({ type: 'SET_TEST_MODE', on: next });
  }, [dispatch, testMode]);

  const handleLessonGoalChange = (goal: string) => {
    setLessonGoal(goal);
    persistClassicLessonGoal(goal);
  };

  const commitLessonGoal = (goal: string) => {
    const next = goal.trim() || DEFAULT_CLASSIC_LESSON_GOAL;
    setLessonGoal(next);
    persistClassicLessonGoal(next);
    if (isLoggedIn && user) {
      saveQuestionsCloud(theme, blocks.map(b => b.question), { lessonGoal: next }).catch(() => {});
    }
  };

  const handleUpdateBlockQuestion = (blockId: number, updatedQuestion: GameQuestion) => {
    dispatch({ type: 'UPDATE_QUESTION', blockId, question: updatedQuestion });
    const sanitized: GameQuestion = {
      ...updatedQuestion,
      rewardCoins: updatedQuestion.type === 'mystery_card' ? 0 : Math.max(0, Number(updatedQuestion.rewardCoins) || 0),
    };
    persistQuestions(blocks.map(b => (b.id === blockId ? { ...b, question: sanitized } : b)));
    toast.success(`Block #${blockId} Question Saved!`);
  };

  const handleResetAllQuestions = () => {
    try {
      localStorage.removeItem(`mp_custom_blocks_v5_${theme}`);
    } catch {
      // ignore
    }
    const defaultBlocks = createGameBlocks(theme);
    dispatch({
      type: 'SET_BLOCKS',
      blocks: defaultBlocks,
      toast: `🔄 Restored the default Have You Ever lesson (${defaultBlocks.length} prompts)!`,
    });
    setLessonGoal(resetClassicLessonGoal());
  };

  const handleManualSync = async () => {
    if (!isLoggedIn) {
      showToast('ℹ️ Sign in with Google to sync questions to the cloud.');
      return false;
    }
    const success = await saveQuestionsCloud(theme, blocks.map(b => b.question), { lessonGoal });
    showToast(success ? '☁️ Questions backed up to Firestore!' : '⚠️ Could not sync to Firestore.');
    return success;
  };

  const handleManualLoad = async () => {
    if (!isLoggedIn) {
      showToast('ℹ️ Sign in with Google to load your cloud questions.');
      return false;
    }
    const cloud = await loadQuestionsCloud(theme);
    if (cloud && cloud.questions.length > 0) {
      const next = createGameBlocks(theme, cloud.questions);
      dispatch({ type: 'SET_BLOCKS', blocks: next, toast: `☁️ Loaded ${cloud.questions.length} custom questions!` });
      persistQuestions(next);
      if (cloud.lessonGoal?.trim()) {
        setLessonGoal(cloud.lessonGoal.trim());
        persistClassicLessonGoal(cloud.lessonGoal);
      }
      return true;
    }
    showToast('ℹ️ No custom Classic questions found in Firestore.');
    return false;
  };

  const handleRewardResolved = (card: RewardCard, options?: RewardCardActionOptions) => {
    dispatch({ type: 'RESOLVE_CARD', card, options });
  };

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
            className="fixed bottom-6 sm:bottom-8 inset-x-0 mx-auto w-fit max-w-lg z-50 px-5 py-3 rounded-2xl bg-slate-900/95 border-2 border-yellow-400/80 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-yellow-300 font-bold text-xs sm:text-sm pointer-events-none"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        {view === 'setup' && (
          <SetupScreen
            theme={theme}
            lessonGoal={lessonGoal}
            onStartGame={handleStartGame}
            onOpenRules={() => setIsRulesModalOpen(true)}
            onOpenStudio={() => setIsCustomizerOpen(true)}
            onBackToLauncher={onExitToLauncher}
          />
        )}

        {view === 'board' && activeTeam && (
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
                toast: '🎲 All 60 prompts reshuffled!',
              })}
              onNextTurn={() => dispatch({ type: 'PASS_TURN' })}
              openedCount={openedBlocksCount}
              totalBlocks={blocks.length || TOTAL_BLOCKS}
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
        {selectedQuestion && !roundOverReason && (
          <ClassicRoundModal
            question={selectedQuestion}
            lessonGoal={lessonGoal.trim() || DEFAULT_CLASSIC_LESSON_GOAL}
            pickingTeam={activeTeam!}
            teams={teams}
            slots={slots}
            drawnTeamIds={drawnTeamIds}
            selectedTeamId={selectedAnsweringTeamId}
            cardsRemaining={cardsRemaining}
            onSelectTeam={teamId => dispatch({ type: 'SELECT_ANSWERING_TEAM', teamId })}
            onPickSlot={slotIndex => dispatch({ type: 'PICK_SLOT', slotIndex })}
            onEndRound={() => dispatch({ type: 'END_ROUND', reason: 'host' })}
            onCancelIfEmpty={() => dispatch({ type: 'CANCEL_EMPTY_ROUND' })}
            testGame={testMode}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingCard && answeringTeam && (
          <RewardRouletteModal
            cards={[pendingCard]}
            currentTeam={answeringTeam}
            teams={teams}
            theme="classic"
            startInReveal
            onCardSelected={handleRewardResolved}
            onClose={() => {}}
            onSkipAction={() => dispatch({ type: 'SKIP_CARD_ACTION' })}
            showCatchUpNote={showCatchUpNote}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mysteryOutcomes && answeringTeam && (
          <MysteryBlocksMiniGame
            currentTeam={answeringTeam}
            outcomes={mysteryOutcomes}
            onResolved={outcome => dispatch({ type: 'RESOLVE_MYSTERY', outcome })}
            testMode={testMode}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {roundOverReason && (
          <RoundOverOverlay
            reason={roundOverReason}
            onContinue={() => dispatch({ type: 'CONTINUE_ROUND_OVER' })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRulesModalOpen && <ClassicRulebookModal onClose={() => setIsRulesModalOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isCustomizerOpen && (
          <CustomizerModal
            theme={theme}
            blocks={blocks}
            onUpdateBlockQuestion={handleUpdateBlockQuestion}
            onResetAllQuestions={handleResetAllQuestions}
            onSaveCloud={async () => { await handleManualSync(); }}
            onLoadCloud={async () => { await handleManualLoad(); }}
            onClose={() => setIsCustomizerOpen(false)}
            showCatchUpNote={showCatchUpNote}
            onToggleCatchUpNote={handleToggleCatchUpNote}
            lessonGoal={lessonGoal}
            onLessonGoalChange={handleLessonGoalChange}
            onLessonGoalCommit={commitLessonGoal}
            testGame={testMode}
            onToggleTestGame={handleToggleTestGame}
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
    </div>
  );
}
