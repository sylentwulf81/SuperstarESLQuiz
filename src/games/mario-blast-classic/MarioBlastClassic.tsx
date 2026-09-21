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
import { ClassicRoundModal, ClassicCardSlot } from './components/ClassicRoundModal';
import { ClassicRulebookModal } from './components/ClassicRulebookModal';
import { MysteryBlocksMiniGame } from './components/MysteryBlocksMiniGame';
import { RoundOverOverlay, RoundOverReason } from './components/RoundOverOverlay';
import { useAuth } from '@/shared/context/AuthContext';
import {
  Team,
  BlockState,
  GameQuestion,
  RewardCard,
  GameView,
  RewardCardActionOptions,
} from '@/shared/types';
import { loadShowCatchUpNote, persistShowCatchUpNote } from '@/games/mario-party-quiz/data/rewards';
import {
  applyCoinPayout,
  applyRivalCoinShuffle,
  drawClassicCard,
  fillClassicTestSlots,
  isClassicRoundEnder,
  loadClassicTestGame,
  MysteryBlockOutcome,
  persistClassicTestGame,
  shuffleMysteryBlockOutcomes,
} from './data/classicRewards';
import {
  DEFAULT_CLASSIC_LESSON_GOAL,
  loadClassicLessonGoal,
  persistClassicLessonGoal,
  resetClassicLessonGoal,
} from './data/classicLesson';
import { sounds } from '@/shared/utils/sound';
import { createGameBlocks, TOTAL_BLOCKS } from '@/games/mario-party-quiz/createBlocks';

export const MARIO_BLAST_CLASSIC_MODULE = 'mario-blast-classic' as const;

export interface MarioBlastClassicProps {
  onExitToLauncher: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const CLASSIC_THEME = 'classic' as const;

const emptySlots = (): ClassicCardSlot[] => Array.from({ length: 6 }, () => ({}));

export function MarioBlastClassic({
  onExitToLauncher,
  soundEnabled,
  onToggleSound,
}: MarioBlastClassicProps) {
  const { user, isLoggedIn, saveQuestionsCloud, loadQuestionsCloud } = useAuth();
  const theme = CLASSIC_THEME;

  const [view, setView] = useState<GameView>('setup');
  const [showCatchUpNote, setShowCatchUpNote] = useState(loadShowCatchUpNote);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [blocks, setBlocks] = useState<BlockState[]>(() => createGameBlocks(theme));
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [slots, setSlots] = useState<ClassicCardSlot[]>(emptySlots);
  const [drawnTeamIds, setDrawnTeamIds] = useState<string[]>([]);
  const [selectedAnsweringTeamId, setSelectedAnsweringTeamId] = useState<string | null>(null);
  const [pendingCard, setPendingCard] = useState<RewardCard | null>(null);
  const [pendingSlotIndex, setPendingSlotIndex] = useState<number | null>(null);
  const [mysteryOutcomes, setMysteryOutcomes] = useState<MysteryBlockOutcome[] | null>(null);
  const [roundOverReason, setRoundOverReason] = useState<RoundOverReason | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lessonGoal, setLessonGoal] = useState(loadClassicLessonGoal);
  const [testGame, setTestGame] = useState(loadClassicTestGame);

  const handleToggleCatchUpNote = useCallback(() => {
    setShowCatchUpNote(prev => {
      const next = !prev;
      persistShowCatchUpNote(next);
      return next;
    });
  }, []);

  const handleToggleTestGame = useCallback(() => {
    setTestGame(prev => {
      const next = !prev;
      persistClassicTestGame(next);
      setSlots(current => {
        if (!selectedBlockId) return current;
        if (next) return fillClassicTestSlots(current);
        return current.map(slot => (slot.claimedByTeamId ? slot : { ...slot, card: undefined }));
      });
      return next;
    });
  }, [selectedBlockId]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  useEffect(() => {
    if (isLoggedIn && user) {
      loadQuestionsCloud(theme)
        .then(cloud => {
          if (cloud && cloud.questions.length > 0) {
            setBlocks(createGameBlocks(theme, cloud.questions));
            showToast(`☁️ Synced ${cloud.questions.length} custom questions from Firestore!`);
          }
          if (cloud?.lessonGoal?.trim()) {
            setLessonGoal(cloud.lessonGoal.trim());
            persistClassicLessonGoal(cloud.lessonGoal);
          }
        })
        .catch(() => {});
    }
  }, [isLoggedIn, user?.uid, theme]);

  const activeTeam = teams[currentTeamIndex] || teams[0];
  const openedBlocksCount = blocks.filter(b => b.isOpened).length;
  const isGameOver = blocks.length > 0 && openedBlocksCount === blocks.length;
  const answeringTeam = teams.find(t => t.id === selectedAnsweringTeamId) || activeTeam;
  const cardsRemaining = slots.filter(s => !s.claimedByTeamId).length;

  const resetRound = () => {
    setSlots(emptySlots());
    setDrawnTeamIds([]);
    setSelectedAnsweringTeamId(null);
    setPendingCard(null);
    setPendingSlotIndex(null);
    setMysteryOutcomes(null);
    setRoundOverReason(null);
  };

  const handleStartGame = (configuredTeams: Team[]) => {
    setTeams(configuredTeams.map(t => ({
      ...t,
      doubleNextCoinReward: false,
      skipNextCoinReward: false,
      blooperNextCoin: false,
    })));
    setCurrentTeamIndex(0);
    setBlocks(createGameBlocks(theme, undefined, true));
    resetRound();
    setSelectedBlockId(null);
    setView('board');
    showToast(`🎲 Questions shuffled! ${configuredTeams[0].name} picks the first block — anyone can answer!`);
  };

  const handleShuffleBoard = () => {
    sounds.playShuffle();
    setBlocks(createGameBlocks(theme, undefined, true));
    showToast('🎲 All 60 prompts reshuffled!');
  };

  const handleSelectBlock = (blockId: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block || block.isOpened) {
      sounds.playWrong();
      return;
    }
    sounds.playBlockHit();
    resetRound();
    setSelectedBlockId(blockId);
    if (testGame) {
      setSlots(fillClassicTestSlots(emptySlots()));
    }
  };

  const advanceTurn = (currentTeams?: Team[]) => {
    const roster = currentTeams ?? teams;
    if (roster.length === 0) return;
    const nextIndex = (currentTeamIndex + 1) % roster.length;
    setCurrentTeamIndex(nextIndex);
    showToast(`🎯 ${roster[nextIndex].name} picks the next block!`);
  };

  const handleSelectTeamTurn = (targetIdx: number) => {
    if (!teams[targetIdx]) return;
    sounds.playPop();
    setCurrentTeamIndex(targetIdx);
  };

  const persistQuestions = (updatedBlocks: BlockState[]) => {
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

  const finishQuestionRound = (reason: RoundOverReason, roster: Team[]) => {
    if (selectedBlockId === null) return;
    const nextBlocks = blocks.map(b =>
      b.id === selectedBlockId
        ? { ...b, isOpened: true, openedByTeamId: activeTeam?.id }
        : b
    );
    setBlocks(nextBlocks);
    setRoundOverReason(null);
    setSelectedBlockId(null);
    resetRound();

    const willBeGameOver = nextBlocks.length > 0 && nextBlocks.every(b => b.isOpened);
    if (willBeGameOver) {
      sounds.playSuperstar();
      showToast(`🏁 ALL ${nextBlocks.length} QUESTIONS ANSWERED! GAME OVER! 🏆`);
      setTimeout(() => setView('superstar'), 900);
    } else {
      advanceTurn(roster);
    }
  };

  const applyPayoutToTeam = (roster: Team[], teamId: string, amount: number) => {
    let awarded = 0;
    let skipped = false;
    let doubled = false;
    let bloopered = false;
    const next = roster.map(t => {
      if (t.id !== teamId) return t;
      const result = applyCoinPayout(t, amount);
      awarded = result.awarded;
      skipped = result.skipped;
      doubled = result.doubled;
      bloopered = result.bloopered;
      return result.team;
    });
    return { teams: next, awarded, skipped, doubled, bloopered };
  };

  const applyReward = (
    card: RewardCard,
    drawingTeam: Team,
    roster: Team[],
    options?: RewardCardActionOptions
  ): { teams: Team[]; endsRound: boolean } => {
    let nextTeams = [...roster];
    let endsRound = isClassicRoundEnder(card.type);

    switch (card.type) {
      case 'great_coins_3':
      case 'coins_3':
      case 'wonderful_coins_5':
      case 'coins_5':
      case 'super_coins_10':
      case 'coins_10':
      case 'coins_1':
      case 'gold_star': {
        const amount = card.coins || (card.type === 'gold_star' ? 15 : 0);
        const payout = applyPayoutToTeam(nextTeams, drawingTeam.id, amount);
        nextTeams = payout.teams;
        if (payout.skipped) {
          sounds.playBlueShell();
          showToast(`🐢 ${drawingTeam.name}'s coin reward was skipped by Blue Shell!`);
        } else if (payout.bloopered) {
          sounds.playBlooper();
          showToast(`🦑 INKED! ${drawingTeam.name} got +1 coin!`);
        } else {
          if (payout.doubled) sounds.playPowerUp();
          else sounds.playCoin();
          showToast(
            `${payout.doubled ? '🍄 2x! ' : ''}🪙 ${drawingTeam.name} gained +${payout.awarded} coins!`
          );
        }
        break;
      }
      case 'blooper': {
        sounds.playBlooper();
        const target = options?.targetTeamId
          ? nextTeams.find(t => t.id === options.targetTeamId)
          : nextTeams.find(t => t.id !== drawingTeam.id);
        if (target) {
          nextTeams = nextTeams.map(t =>
            t.id === target.id ? { ...t, blooperNextCoin: true } : t
          );
          showToast(`🦑 BLOOPER! ${target.name}'s next coin card pays only 1!`);
        }
        break;
      }
      case 'pow_block':
      case 'hidden_block': {
        sounds.playPowBlock();
        const choice = options?.powChoice || 'highest';
        const allCoins = nextTeams.map(t => t.coins);
        const target = choice === 'highest' ? Math.max(...allCoins) : Math.min(...allCoins);
        nextTeams = nextTeams.map(t => ({ ...t, coins: target }));
        showToast(`💥 POW BLOCK! All teams equalized to ${choice.toUpperCase()} (${target})!`);
        break;
      }
      case 'super_star_x2':
      case 'mushroom_x2': {
        sounds.playPowerUp();
        nextTeams = nextTeams.map(t =>
          t.id === drawingTeam.id ? { ...t, doubleNextCoinReward: true } : t
        );
        showToast(`🍄 SUPER MUSHROOM! ${drawingTeam.name}'s next coin reward is doubled!`);
        break;
      }
      case 'ghost_steal_5':
      case 'boo_steal_5': {
        sounds.playBoo();
        const stolenCoins = options?.dieRoll || 5;
        const target = options?.targetTeamId
          ? nextTeams.find(t => t.id === options.targetTeamId)
          : null;
        if (target) {
          nextTeams = nextTeams.map(t => {
            if (t.id === drawingTeam.id) {
              return { ...t, coins: t.coins + stolenCoins, coinsStolen: (t.coinsStolen || 0) + stolenCoins };
            }
            if (t.id === target.id) return { ...t, coins: t.coins - stolenCoins };
            return t;
          });
          showToast(`👻 Boo stole ${stolenCoins} coins from ${target.name}!`);
        }
        break;
      }
      case 'king_boo':
      case 'boo_steal_10': {
        sounds.playBoo();
        nextTeams = applyRivalCoinShuffle(nextTeams, drawingTeam.id, options?.coinTotals);
        showToast('👑 KING BOO — SHUFFLE!');
        break;
      }
      case 'blue_shell': {
        sounds.playBlueShell();
        const maxCoins = Math.max(...nextTeams.map(t => t.coins));
        const leaders = nextTeams.filter(t => t.coins === maxCoins && t.coins > 0);
        nextTeams = nextTeams.map(t =>
          leaders.some(l => l.id === t.id) ? { ...t, skipNextCoinReward: true } : t
        );
        const names = leaders.map(l => l.name).join(', ') || '1st place';
        showToast(`🐢 BLUE SHELL! ${names} will skip their next coin reward!`);
        break;
      }
      case 'bowser_revolution': {
        sounds.playBowser();
        const target = options?.targetTeamId
          ? nextTeams.find(t => t.id === options.targetTeamId)
          : nextTeams.find(t => t.id !== drawingTeam.id);
        if (target && target.id !== drawingTeam.id) {
          const activeCoins = drawingTeam.coins;
          const targetCoins = target.coins;
          nextTeams = nextTeams.map(t => {
            if (t.id === drawingTeam.id) return { ...t, coins: targetCoins };
            if (t.id === target.id) return { ...t, coins: activeCoins };
            return t;
          });
          showToast(`💥 BOWSER'S REVOLUTION! ${drawingTeam.name} swapped with ${target.name}!`);
        }
        break;
      }
      case 'bowser_fury': {
        sounds.playBowserFury();
        nextTeams = nextTeams.map(t => (t.id !== drawingTeam.id ? { ...t, coins: t.coins - 5 } : t));
        showToast(`🔥 BOWSER'S FURY! -5 coins to every rival!`);
        break;
      }
      default:
        break;
    }

    nextTeams = nextTeams.map(t =>
      t.id === drawingTeam.id ? { ...t, streak: t.streak + 1 } : t
    );

    return { teams: nextTeams, endsRound };
  };

  const commitCardToSlot = (card: RewardCard, slotIndex: number, teamId: string) => {
    setSlots(prev =>
      prev.map((slot, i) => (i === slotIndex ? { claimedByTeamId: teamId, card } : slot))
    );
    setDrawnTeamIds(prev => (prev.includes(teamId) ? prev : [...prev, teamId]));
  };

  const handleSkipCardAction = () => {
    const drawingTeam = teams.find(t => t.id === selectedAnsweringTeamId);
    if (!drawingTeam || pendingSlotIndex === null || !pendingCard) return;

    commitCardToSlot(pendingCard, pendingSlotIndex, drawingTeam.id);
    setPendingCard(null);
    setPendingSlotIndex(null);
    setSelectedAnsweringTeamId(null);

    const remainingAfter = slots.filter((s, i) => i !== pendingSlotIndex && !s.claimedByTeamId).length;
    if (remainingAfter <= 0) {
      setRoundOverReason('cards');
    }
  };

  const handleRewardResolved = (card: RewardCard, options?: RewardCardActionOptions) => {
    const drawingTeam = teams.find(t => t.id === selectedAnsweringTeamId);
    if (!drawingTeam || pendingSlotIndex === null) return;

    if (card.type === 'mystery_blocks') {
      commitCardToSlot(card, pendingSlotIndex, drawingTeam.id);
      setPendingCard(null);
      setMysteryOutcomes(shuffleMysteryBlockOutcomes());
      return;
    }

    const { teams: nextTeams, endsRound } = applyReward(card, drawingTeam, teams, options);
    setTeams(nextTeams);
    commitCardToSlot(card, pendingSlotIndex, drawingTeam.id);
    setPendingCard(null);
    setPendingSlotIndex(null);
    setSelectedAnsweringTeamId(null);

    const remainingAfter = slots.filter((s, i) => i !== pendingSlotIndex && !s.claimedByTeamId).length;
    if (endsRound) {
      const reason: RoundOverReason =
        card.type === 'gold_star'
          ? 'gold_star'
          : card.type === 'bowser_fury'
            ? 'bowser_fury'
            : 'bowser_revolution';
      setRoundOverReason(reason);
    } else if (remainingAfter <= 0) {
      setRoundOverReason('cards');
    }
  };

  const handleMysteryResolved = (outcome: MysteryBlockOutcome) => {
    const drawingTeam = teams.find(t => t.id === selectedAnsweringTeamId);
    setMysteryOutcomes(null);
    if (!drawingTeam) {
      setSelectedAnsweringTeamId(null);
      setPendingSlotIndex(null);
      return;
    }

    let nextTeams = [...teams];
    if (outcome.kind === 'treasure') {
      const payout = applyPayoutToTeam(nextTeams, drawingTeam.id, outcome.coins);
      nextTeams = payout.teams;
      if (payout.skipped) {
        sounds.playBlueShell();
        showToast(`🐢 Treasure skipped by Blue Shell!`);
      } else if (payout.bloopered) {
        sounds.playBlooper();
        showToast(`🦑 INKED! Treasure became +1 for ${drawingTeam.name}!`);
      } else {
        if (payout.doubled) sounds.playPowerUp();
        showToast(`${payout.doubled ? '🍄 2x! ' : ''}💎 Treasure Block! ${drawingTeam.name} +${payout.awarded} coins!`);
      }
    } else if (outcome.kind === 'bust') {
      showToast(`💨 Empty block… ${drawingTeam.name} got 0 coins.`);
    }

    nextTeams = nextTeams.map(t =>
      t.id === drawingTeam.id ? { ...t, streak: t.streak + 1 } : t
    );
    setTeams(nextTeams);
    setSelectedAnsweringTeamId(null);
    setPendingSlotIndex(null);

    if (outcome.kind === 'piranha') {
      setRoundOverReason('piranha');
    } else if (slots.every(s => s.claimedByTeamId)) {
      setRoundOverReason('cards');
    }
  };

  const handlePickSlot = (slotIndex: number) => {
    if (!selectedAnsweringTeamId || slots[slotIndex]?.claimedByTeamId) return;
    const card = slots[slotIndex]?.card ?? drawClassicCard(teams, selectedAnsweringTeamId);
    sounds.playSpecialCardFanfare();
    setPendingSlotIndex(slotIndex);
    setPendingCard(card);
  };

  const handleAdjustCoins = (teamId: string, delta: number) => {
    setTeams(prev => prev.map(t => (t.id === teamId ? { ...t, coins: t.coins + delta } : t)));
  };

  const handleUpdateBlockQuestion = (blockId: number, updatedQuestion: GameQuestion) => {
    const sanitizedQuestion: GameQuestion = {
      ...updatedQuestion,
      rewardCoins: updatedQuestion.type === 'mystery_card' ? 0 : Math.max(0, Number(updatedQuestion.rewardCoins) || 0),
    };
    const updated = blocks.map(b => (b.id === blockId ? { ...b, question: sanitizedQuestion } : b));
    setBlocks(updated);
    persistQuestions(updated);
    toast.success(`Block #${blockId} Question Saved!`);
  };

  const handleResetAllQuestions = () => {
    try {
      localStorage.removeItem(`mp_custom_blocks_v5_${theme}`);
    } catch {
      // ignore
    }
    const defaultBlocks = createGameBlocks(theme);
    setBlocks(defaultBlocks);
    setLessonGoal(resetClassicLessonGoal());
    showToast(`🔄 Restored the default Have You Ever lesson (${defaultBlocks.length} prompts)!`);
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
      setBlocks(next);
      persistQuestions(next);
      if (cloud.lessonGoal?.trim()) {
        setLessonGoal(cloud.lessonGoal.trim());
        persistClassicLessonGoal(cloud.lessonGoal);
      }
      showToast(`☁️ Loaded ${cloud.questions.length} custom questions!`);
      return true;
    }
    showToast('ℹ️ No custom Classic questions found in Firestore.');
    return false;
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
              onDeclareWinner={() => setView('superstar')}
              onResetGame={() => setView('setup')}
              onExitToLauncher={onExitToLauncher}
              onShuffleBoard={handleShuffleBoard}
              onNextTurn={() => advanceTurn()}
              openedCount={openedBlocksCount}
              totalBlocks={blocks.length || TOTAL_BLOCKS}
              isGameOver={isGameOver}
              onManualSync={handleManualSync}
              onManualLoad={handleManualLoad}
            />
            <TeamLeaderboard
              teams={teams}
              currentTeamIndex={currentTeamIndex}
              onSelectTeamTurn={handleSelectTeamTurn}
              onAdjustCoins={handleAdjustCoins}
            />
            <main className="flex-1 min-h-0 flex flex-col py-1">
              <GameBoard
                blocks={blocks}
                teams={teams}
                onSelectBlock={handleSelectBlock}
                isGameOver={isGameOver}
                onOpenLeaderboard={() => setView('superstar')}
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
            pickingTeam={activeTeam}
            teams={teams}
            slots={slots}
            drawnTeamIds={drawnTeamIds}
            selectedTeamId={selectedAnsweringTeamId}
            cardsRemaining={cardsRemaining}
            onSelectTeam={teamId => setSelectedAnsweringTeamId(teamId)}
            onPickSlot={handlePickSlot}
            onEndRound={() => setRoundOverReason('host')}
            onCancelIfEmpty={() => {
              setSelectedBlockId(null);
              resetRound();
            }}
            testGame={testGame}
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
            onSkipAction={handleSkipCardAction}
            showCatchUpNote={showCatchUpNote}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mysteryOutcomes && answeringTeam && (
          <MysteryBlocksMiniGame
            currentTeam={answeringTeam}
            outcomes={mysteryOutcomes}
            onResolved={handleMysteryResolved}
            testMode={testGame}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {roundOverReason && (
          <RoundOverOverlay
            reason={roundOverReason}
            onContinue={() => finishQuestionRound(roundOverReason, teams)}
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
            onSaveCloud={async () => {
              await handleManualSync();
            }}
            onLoadCloud={async () => {
              await handleManualLoad();
            }}
            onClose={() => setIsCustomizerOpen(false)}
            showCatchUpNote={showCatchUpNote}
            onToggleCatchUpNote={handleToggleCatchUpNote}
            lessonGoal={lessonGoal}
            onLessonGoalChange={handleLessonGoalChange}
            onLessonGoalCommit={commitLessonGoal}
            testGame={testGame}
            onToggleTestGame={handleToggleTestGame}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {view === 'superstar' && (
          <SuperstarModal
            teams={teams}
            onRestart={() => setView('setup')}
            onClose={() => setView('board')}
            onExitToLauncher={onExitToLauncher}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
