import React, { useState, useEffect, useCallback } from 'react';
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
import { Team, BlockState, GameQuestion, RewardCard, GameView, GameTheme, RewardCardActionOptions } from '@/shared/types';
import { generateRouletteCards, loadShowCatchUpNote, persistShowCatchUpNote } from './data/rewards';
import { sounds } from '@/shared/utils/sound';
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

  // Theme & Flow (launcher lives in the app shell, not this game module)
  const theme = initialTheme;
  const [view, setView] = useState<GameView>('setup');
  const [showCatchUpNote, setShowCatchUpNote] = useState(loadShowCatchUpNote);

  const handleToggleCatchUpNote = useCallback(() => {
    setShowCatchUpNote(prev => {
      const next = !prev;
      persistShowCatchUpNote(next);
      return next;
    });
  }, []);

  // Teams State (Default 6 characters)
  const [teams, setTeams] = useState<Team[]>([
    {
      id: 'team_yoshi',
      characterId: 'yoshi',
      name: 'Team Yoshi',
      coins: 0,
      stars: 0,
      streak: 0,
      blocksOpened: 0,
      coinsStolen: 0,
      hasDoubleTurn: false,
    },
    {
      id: 'team_mario',
      characterId: 'mario',
      name: 'Team Mario',
      coins: 0,
      stars: 0,
      streak: 0,
      blocksOpened: 0,
      coinsStolen: 0,
      hasDoubleTurn: false,
    },
    {
      id: 'team_peach',
      characterId: 'peach',
      name: 'Team Peach',
      coins: 0,
      stars: 0,
      streak: 0,
      blocksOpened: 0,
      coinsStolen: 0,
      hasDoubleTurn: false,
    },
    {
      id: 'team_daisy',
      characterId: 'daisy',
      name: 'Team Daisy',
      coins: 0,
      stars: 0,
      streak: 0,
      blocksOpened: 0,
      coinsStolen: 0,
      hasDoubleTurn: false,
    },
    {
      id: 'team_donkey_kong',
      characterId: 'donkey_kong',
      name: 'Team DK',
      coins: 0,
      stars: 0,
      streak: 0,
      blocksOpened: 0,
      coinsStolen: 0,
      hasDoubleTurn: false,
    },
    {
      id: 'team_luigi',
      characterId: 'luigi',
      name: 'Team Luigi',
      coins: 0,
      stars: 0,
      streak: 0,
      blocksOpened: 0,
      coinsStolen: 0,
      hasDoubleTurn: false,
    },
  ]);

  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0);

  // 48 Blocks State
  const [blocks, setBlocks] = useState<BlockState[]>(() => createGameBlocks(initialTheme));

  // Active Modals & Events
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [rouletteCards, setRouletteCards] = useState<RewardCard[] | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [blueShellNotice, setBlueShellNotice] = useState<{ skippedTeam: Team; nextTeam: Team } | null>(null);

  // Event Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  // When user logs in, check if they have a saved deck in Firestore
  useEffect(() => {
    if (isLoggedIn && user) {
      loadQuestionsCloud(theme).then((cloud) => {
        if (cloud && cloud.questions.length > 0) {
          setBlocks(createGameBlocks(theme, cloud.questions));
          showToast(`☁️ Synced ${cloud.questions.length} custom questions from Firestore (${user.displayName || 'User'})!`);
        }
      }).catch((e) => {
        console.warn('Initial cloud questions fetch:', e);
      });
    }
  }, [isLoggedIn, user?.uid, theme]);

  const activeTeam = teams[currentTeamIndex] || teams[0];
  const openedBlocksCount = blocks.filter(b => b.isOpened).length;
  const isGameOver = blocks.length > 0 && openedBlocksCount === blocks.length;

  // Start Game from Setup (Automatically shuffles all questions & mystery blocks)
  const handleStartGame = (configuredTeams: Team[]) => {
    setTeams(configuredTeams);
    setCurrentTeamIndex(0);
    setBlocks(createGameBlocks(theme, undefined, true));
    setView('board');
    showToast(`🎲 All 60 questions & mystery blocks shuffled! ${configuredTeams[0].name}'s turn!`);
  };

  // Reshuffle all block questions on demand during gameplay
  const handleShuffleBoard = () => {
    sounds.playShuffle();
    setBlocks(createGameBlocks(theme, undefined, true));
    showToast(`🎲 All 60 board questions & mystery blocks reshuffled!`);
  };

  // Select a Block from the 48 Grid
  const handleSelectBlock = (blockId: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    if (block.isOpened) {
      sounds.playWrong();
      return;
    }

    sounds.playBlockHit();

    if (block.question.type === 'mystery_card') {
      sounds.playSpecialCardFanfare();
      setBlocks(prev => prev.map(b => 
        b.id === blockId ? { ...b, isOpened: true, openedByTeamId: activeTeam.id } : b
      ));
      setRouletteCards(generateRouletteCards(teams, activeTeam.id));
      return;
    }

    setSelectedBlockId(blockId);
  };

  const advanceTurn = (options?: {
    keepCurrentTurn?: boolean;
    currentTeams?: Team[];
    overrideIndex?: number;
  }) => {
    const keepCurrentTurn = options?.keepCurrentTurn ?? false;
    let baseTeams = options?.currentTeams ? [...options.currentTeams] : [...teams];
    const active = baseTeams[currentTeamIndex] || baseTeams[0];

    // Case 1: An extra turn was JUST granted (e.g. Super Mushroom drawn in roulette)
    if (keepCurrentTurn) {
      showToast(`🍄 ${active.name} gets another turn! Pick another block!`);
      return;
    }

    // Case 2: If the team was currently taking their bonus turn (hasDoubleTurn is true),
    // this action completes that bonus turn. Reset hasDoubleTurn to false and proceed to advance to the next team!
    // (This guarantees they take exactly 2 turns, NOT 3!)
    if (active.hasDoubleTurn) {
      baseTeams = baseTeams.map(t => t.id === active.id ? { ...t, hasDoubleTurn: false } : t);
    }

    let nextIndex = options?.overrideIndex !== undefined
      ? options.overrideIndex
      : (currentTeamIndex + 1) % baseTeams.length;

    let updatedTeams = [...baseTeams];
    let skippedTeam: Team | null = null;
    let loops = 0;

    // Automated Blue Shell Skip loop:
    // Skip any teams that currently have skipTurns > 0, decrement their penalty,
    // and move to the next eligible team automatically.
    while (loops < updatedTeams.length && (updatedTeams[nextIndex].skipTurns ?? 0) > 0) {
      const victim = updatedTeams[nextIndex];
      skippedTeam = victim;
      updatedTeams = updatedTeams.map((t, idx) =>
        idx === nextIndex ? { ...t, skipTurns: Math.max(0, (t.skipTurns || 1) - 1) } : t
      );
      nextIndex = (nextIndex + 1) % updatedTeams.length;
      loops++;
    }

    const nextTeam = updatedTeams[nextIndex];
    setTeams(updatedTeams);
    setCurrentTeamIndex(nextIndex);

    // If a team was skipped via Blue Shell penalty, announce it explicitly with sound and modal overlay!
    if (skippedTeam) {
      sounds.playBlueShell();
      setBlueShellNotice({ skippedTeam, nextTeam });
      showToast(`🐢💥 BLUE SHELL FREEZE! ${skippedTeam.name} is stunned and skips their turn! -> ${nextTeam.name}'s turn!`, 5000);
    } else {
      showToast(`🎯 Up next: ${nextTeam.name}'s turn!`);
    }
  };

  const handleSelectTeamTurn = (targetIdx: number) => {
    const targetTeam = teams[targetIdx];
    if (!targetTeam) return;

    // If the host clicked a team that is stunned by Blue Shell, automate their skip!
    if (targetTeam.skipTurns && targetTeam.skipTurns > 0) {
      let updatedTeams = teams.map((t, idx) =>
        idx === targetIdx ? { ...t, skipTurns: Math.max(0, (t.skipTurns || 1) - 1) } : t
      );
      let nextIdx = (targetIdx + 1) % updatedTeams.length;
      let loops = 0;
      while (loops < updatedTeams.length && (updatedTeams[nextIdx].skipTurns ?? 0) > 0) {
        updatedTeams = updatedTeams.map((t, idx) =>
          idx === nextIdx ? { ...t, skipTurns: Math.max(0, (t.skipTurns || 1) - 1) } : t
        );
        nextIdx = (nextIdx + 1) % updatedTeams.length;
        loops++;
      }
      const nextTeam = updatedTeams[nextIdx];
      setTeams(updatedTeams);
      setCurrentTeamIndex(nextIdx);
      sounds.playBlueShell();
      setBlueShellNotice({ skippedTeam: targetTeam, nextTeam });
      showToast(`🐢💥 BLUE SHELL FREEZE! ${targetTeam.name} is stunned and skips their turn! -> ${nextTeam.name}'s turn!`, 5000);
    } else {
      sounds.playPop();
      setCurrentTeamIndex(targetIdx);
    }
  };

  const handleAnswerCorrect = (earnedCoins: number) => {
    if (selectedBlockId === null) return;

    const nextBlocks = blocks.map(b => 
      b.id === selectedBlockId ? { ...b, isOpened: true, openedByTeamId: activeTeam.id, rewardCoins: earnedCoins } : b
    );
    setBlocks(nextBlocks);

    const nextTeams = teams.map(t => {
      if (t.id === activeTeam.id) {
        return {
          ...t,
          coins: t.coins + earnedCoins,
          streak: t.streak + 1,
          blocksOpened: t.blocksOpened + 1,
          hasDoubleTurn: false, // Consumes bonus turn if active
        };
      }
      return t;
    });
    setTeams(nextTeams);

    showToast(`🎉 ${activeTeam.name} answered correctly! +${earnedCoins} Coins!`);
    setSelectedBlockId(null);

    const willBeGameOver = nextBlocks.length > 0 && nextBlocks.every(b => b.isOpened);
    if (willBeGameOver) {
      sounds.playSuperstar();
      showToast(`🏁 ALL ${nextBlocks.length} QUESTIONS ANSWERED! GAME OVER! 🏆`, 5000);
      setTimeout(() => {
        setView('superstar');
      }, 900);
    } else {
      advanceTurn({ currentTeams: nextTeams });
    }
  };

  const handleAnswerIncorrect = () => {
    if (selectedBlockId === null) return;

    const nextBlocks = blocks.map(b => 
      b.id === selectedBlockId ? { ...b, isOpened: true, isIncorrectCleared: true } : b
    );
    setBlocks(nextBlocks);

    const nextTeams = teams.map(t => {
      if (t.id === activeTeam.id) {
        return { 
          ...t, 
          streak: 0,
          hasDoubleTurn: false, // Consumes bonus turn if active
        };
      }
      return t;
    });
    setTeams(nextTeams);

    showToast(`❌ Oops! No coins earned. Turn passes!`);
    setSelectedBlockId(null);

    const willBeGameOver = nextBlocks.length > 0 && nextBlocks.every(b => b.isOpened);
    if (willBeGameOver) {
      sounds.playSuperstar();
      showToast(`🏁 ALL ${nextBlocks.length} QUESTIONS ANSWERED! GAME OVER! 🏆`, 5000);
      setTimeout(() => {
        setView('superstar');
      }, 900);
    } else {
      advanceTurn({ currentTeams: nextTeams });
    }
  };

  const handleTriggerRoulette = () => {
    if (selectedBlockId === null) return;

    setBlocks(prev => prev.map(b => 
      b.id === selectedBlockId ? { ...b, isOpened: true, openedByTeamId: activeTeam.id } : b
    ));

    setSelectedBlockId(null);
    setRouletteCards(generateRouletteCards(teams, activeTeam.id));
  };

  const handleRewardCardSelected = (
    card: RewardCard, 
    targetTeamIdOrOptions?: string | RewardCardActionOptions, 
    shouldAdvanceTurn: boolean = true
  ) => {
    const options: RewardCardActionOptions = typeof targetTeamIdOrOptions === 'string'
      ? { targetTeamId: targetTeamIdOrOptions }
      : (targetTeamIdOrOptions || {});

    const wasOnBonusTurn = activeTeam.hasDoubleTurn;
    let keepTurn = false;
    let nextTeams = [...teams];

    switch (card.type) {
      case 'great_coins_3':
      case 'coins_3': {
        sounds.playCoin();
        nextTeams = nextTeams.map(t => t.id === activeTeam.id ? { ...t, coins: t.coins + 3 } : t);
        showToast(`🪙 Great! +3 Coins awarded to ${activeTeam.name}!`);
        break;
      }
      case 'wonderful_coins_5':
      case 'coins_5': {
        sounds.playCoin();
        nextTeams = nextTeams.map(t => t.id === activeTeam.id ? { ...t, coins: t.coins + 5 } : t);
        showToast(`⭐ Wonderful! +5 Coins awarded to ${activeTeam.name}!`);
        break;
      }
      case 'super_coins_10':
      case 'coins_10': {
        sounds.playStarCoin();
        nextTeams = nextTeams.map(t => t.id === activeTeam.id ? { ...t, coins: t.coins + 10 } : t);
        showToast(`🏆 SUPER! Massive Jackpot: +10 Coins to ${activeTeam.name}!`);
        break;
      }
      case 'coins_1': {
        sounds.playCoin();
        nextTeams = nextTeams.map(t => t.id === activeTeam.id ? { ...t, coins: t.coins + 1 } : t);
        showToast(`🪙 ${activeTeam.name} gained +1 Coin!`);
        break;
      }
      case 'pow_block':
      case 'hidden_block': {
        sounds.playPowBlock();
        const choice = options.powChoice || 'highest';
        const allCoins = nextTeams.map(t => t.coins);
        const targetEqualized = choice === 'highest' ? Math.max(...allCoins) : Math.min(...allCoins);
        nextTeams = nextTeams.map(t => ({ ...t, coins: targetEqualized }));
        showToast(`💥 POW BLOCK! All teams' coins equalized to the ${choice.toUpperCase()} score (${targetEqualized} Coins)!`, 5000);
        break;
      }
      case 'super_star_x2':
      case 'mushroom_x2': {
        sounds.playPowerUp();
        nextTeams = nextTeams.map(t => {
          if (t.id === activeTeam.id) {
            return { ...t, hasDoubleTurn: true };
          }
          return t;
        });
        showToast(`🍄 SUPER MUSHROOM! ${activeTeam.name} takes another turn!`);
        keepTurn = true;
        break;
      }
      case 'ghost_steal_5':
      case 'boo_steal_5': {
        sounds.playBoo();
        const stolenCoins = options.dieRoll || 5;
        const target = options.targetTeamId 
          ? nextTeams.find(t => t.id === options.targetTeamId)
          : [...nextTeams.filter(t => t.id !== activeTeam.id)].sort((a, b) => b.coins - a.coins)[0];

        if (target) {
          nextTeams = nextTeams.map(t => {
            if (t.id === activeTeam.id) {
              return { ...t, coins: t.coins + stolenCoins, coinsStolen: (t.coinsStolen || 0) + stolenCoins };
            }
            if (t.id === target.id) {
              return { ...t, coins: t.coins - stolenCoins };
            }
            return t;
          });
          const targetCoinsAfter = target.coins - stolenCoins;
          if (targetCoinsAfter < 0) {
            showToast(`👻 BOO STEAL! Rolled a ${stolenCoins}! ${activeTeam.name} stole ${stolenCoins} coins from ${target.name} (now at ${targetCoinsAfter} in red)!`, 5000);
          } else {
            showToast(`👻 BOO STEAL! Rolled a ${stolenCoins}! ${activeTeam.name} stole ${stolenCoins} coins from ${target.name}!`, 5000);
          }
        } else {
          nextTeams = nextTeams.map(t => t.id === activeTeam.id ? { ...t, coins: t.coins + stolenCoins } : t);
          showToast(`👻 Boo awarded +${stolenCoins} coins to ${activeTeam.name}!`);
        }
        break;
      }
      case 'king_boo':
      case 'boo_steal_10': {
        sounds.playBoo();
        const dieValue = options.dieRoll || 5;
        const rivals = nextTeams.filter(t => t.id !== activeTeam.id);
        const totalStolen = dieValue * rivals.length;

        nextTeams = nextTeams.map(t => {
          if (t.id === activeTeam.id) {
            return { ...t, coins: t.coins + totalStolen, coinsStolen: (t.coinsStolen || 0) + totalStolen };
          }
          return { ...t, coins: t.coins - dieValue };
        });

        showToast(`👑 KING BOO! Rolled a ${dieValue}! Stole ${dieValue} coins from EACH rival team (+${totalStolen} coins total)!`, 5000);
        break;
      }
      case 'blue_shell': {
        sounds.playBlueShell();
        const rivals = nextTeams.filter(t => t.id !== activeTeam.id);
        const targetLeader = rivals.length > 0
          ? [...rivals].sort((a, b) => b.coins - a.coins)[0]
          : null;

        if (targetLeader) {
          nextTeams = nextTeams.map(t => t.id === targetLeader.id ? { ...t, skipTurns: (t.skipTurns || 0) + 1 } : t);
          showToast(`🐢💥 BLUE SHELL! The leading team (${targetLeader.name}) was hit and will skip 1 round!`, 5000);
        } else {
          showToast(`🐢 Blue Shell launched! No rival team to target.`);
        }
        break;
      }
      case 'bowser_revolution': {
        sounds.playBowser();
        const targetId = options.targetTeamId;
        const target = targetId ? nextTeams.find(t => t.id === targetId) : null;
        if (target && target.id !== activeTeam.id) {
          const activeCoins = activeTeam.coins;
          const targetCoins = target.coins;
          nextTeams = nextTeams.map(t => {
            if (t.id === activeTeam.id) return { ...t, coins: targetCoins };
            if (t.id === target.id) return { ...t, coins: activeCoins };
            return t;
          });
          showToast(`💥 BOWSER'S REVOLUTION! ${activeTeam.name} swapped coins with ${target.name}! (${activeCoins} ⮂ ${targetCoins})`, 5000);
        } else {
          const rivals = nextTeams.filter(t => t.id !== activeTeam.id);
          if (rivals.length > 0) {
            const randRival = rivals[0];
            const activeCoins = activeTeam.coins;
            const targetCoins = randRival.coins;
            nextTeams = nextTeams.map(t => {
              if (t.id === activeTeam.id) return { ...t, coins: targetCoins };
              if (t.id === randRival.id) return { ...t, coins: activeCoins };
              return t;
            });
            showToast(`💥 BOWSER'S REVOLUTION! ${activeTeam.name} swapped coins with ${randRival.name}! (${activeCoins} ⮂ ${targetCoins})`, 5000);
          }
        }
        break;
      }
      case 'bowser_fury': {
        sounds.playBowserFury();
        nextTeams = nextTeams.map(t => {
          if (t.id !== activeTeam.id) {
            return { ...t, coins: t.coins - 5 };
          }
          return t;
        });
        showToast(`🔥 BOWSER'S FURY! -5 coins inflicted on all rival teams!`, 5000);
        break;
      }
      default:
        break;
    }

    // If active team was on a bonus turn and this card wasn't another extra turn,
    // their bonus turn is now complete!
    if (wasOnBonusTurn && !keepTurn) {
      nextTeams = nextTeams.map(t => t.id === activeTeam.id ? { ...t, hasDoubleTurn: false } : t);
    }

    setTeams(nextTeams);
    setRouletteCards(null);

    const willBeGameOver = blocks.length > 0 && blocks.every(b => b.isOpened);
    if (willBeGameOver) {
      sounds.playSuperstar();
      showToast(`🏁 ALL ${blocks.length} QUESTIONS ANSWERED! GAME OVER! 🏆`, 5000);
      setTimeout(() => {
        setView('superstar');
      }, 900);
    } else if (shouldAdvanceTurn) {
      advanceTurn({
        keepCurrentTurn: keepTurn,
        currentTeams: nextTeams,
      });
    }
  };

  const handleAdjustCoins = (teamId: string, delta: number) => {
    setTeams(prev => prev.map(t => {
      if (t.id === teamId) {
        return { ...t, coins: t.coins + delta };
      }
      return t;
    }));
  };

  // Helper to persist current block questions to localStorage & Firestore
  const persistQuestions = (updatedBlocks: BlockState[]) => {
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

  // Customizer: update question
  const handleUpdateBlockQuestion = (blockId: number, updatedQuestion: GameQuestion) => {
    const sanitizedQuestion: GameQuestion = {
      ...updatedQuestion,
      rewardCoins: updatedQuestion.type === 'mystery_card' ? 0 : Math.max(1, Number(updatedQuestion.rewardCoins) || 1),
    };
    const updated = blocks.map(b => (b.id === blockId ? { ...b, question: sanitizedQuestion } : b));
    setBlocks(updated);
    persistQuestions(updated);
    toast.success(`Block #${blockId} Question Saved!`, {
      description: updatedQuestion.title
        ? `"${updatedQuestion.title.length > 55 ? updatedQuestion.title.slice(0, 52) + '…' : updatedQuestion.title}"`
        : 'Question content updated in deck.',
      duration: 3500,
    });
    showToast(`✅ Saved changes for Block #${blockId}!`);
  };

  // Customizer: restore all defaults
  const handleResetAllQuestions = () => {
    try {
      localStorage.removeItem(`mp_custom_blocks_v5_${theme}`);
      localStorage.removeItem(`mp_custom_blocks_v4_${theme}`);
      localStorage.removeItem(`mp_custom_blocks_v3_${theme}`);
      localStorage.removeItem(`mp_custom_blocks_v2_${theme}`);
    } catch {}
    const defaultBlocks = createGameBlocks(theme);
    setBlocks(defaultBlocks);
    showToast(`🔄 Restored all ${defaultBlocks.length} block questions to default curriculum!`);
  };

  // Manual Cloud Sync
  const handleManualSync = async () => {
    if (!isLoggedIn) {
      showToast(`ℹ️ Sign in with Google to sync questions to the cloud.`);
      return;
    }
    const rawQuestions = blocks.map(b => b.question);
    const success = await saveQuestionsCloud(theme, rawQuestions);
    if (success) {
      showToast(`☁️ All ${rawQuestions.length} questions successfully backed up to Firestore!`);
    } else {
      showToast(`⚠️ Could not sync to Firestore. Check connection.`);
    }
  };

  // Manual Cloud Load
  const handleManualLoad = async () => {
    if (!isLoggedIn) {
      showToast(`ℹ️ Sign in with Google to load your cloud questions.`);
      return;
    }
    const cloud = await loadQuestionsCloud(theme);
    if (cloud && cloud.questions.length > 0) {
      setBlocks(createGameBlocks(theme, cloud.questions));
      persistQuestions(createGameBlocks(theme, cloud.questions));
      showToast(`☁️ Loaded ${cloud.questions.length} custom questions from Firestore!`);
    } else {
      showToast(`ℹ️ No custom questions found in Firestore for ${theme} theme.`);
    }
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);
  const selectedQuestion = selectedBlock?.question;

  return (
    <div className="h-dvh max-h-dvh overflow-hidden text-slate-100 flex flex-col relative selection:bg-amber-400 selection:text-slate-950 bg-slate-950">
      {/* Hand-crafted Cartoony Artistic Nintendo Themed Backdrop */}
      <ThemedBackdrop theme={theme} />

      {/* Background Animated Particles (Sun sparkles in Summer, Snow in Christmas) */}
      <AmbientParticles theme={theme} />

      {/* Floating Toast Notification (Positioned at bottom to never block the team scoreboard) */}
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

      {/* Primary Application Views */}
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
            {/* Streamlined Top Navigation Bar with nested ShadCN Avatar */}
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
              totalBlocks={blocks.length}
              isGameOver={isGameOver}
              onManualSync={handleManualSync}
              onManualLoad={handleManualLoad}
            />

            {/* Real-time Team Leaderboard */}
            <TeamLeaderboard
              teams={teams}
              currentTeamIndex={currentTeamIndex}
              onSelectTeamTurn={handleSelectTeamTurn}
              onAdjustCoins={handleAdjustCoins}
            />

            {/* Main 60 Mystery Blocks Game Board */}
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

      {/* Question Challenge Modal */}
      <AnimatePresence>
        {selectedQuestion && selectedQuestion.type !== 'mystery_card' && (
          <QuestionModal
            question={selectedQuestion}
            currentTeam={activeTeam}
            onClose={() => setSelectedBlockId(null)}
            onAnswerCorrect={handleAnswerCorrect}
            onAnswerIncorrect={handleAnswerIncorrect}
            onTriggerRoulette={handleTriggerRoulette}
            onAdjustCoins={handleAdjustCoins}
          />
        )}
      </AnimatePresence>

      {/* 6-Card Mystery Roulette Modal */}
      <AnimatePresence>
        {rouletteCards && (
          <RewardRouletteModal
            cards={rouletteCards}
            currentTeam={activeTeam}
            teams={teams}
            theme={theme}
            onCardSelected={handleRewardCardSelected}
            onClose={() => setRouletteCards(null)}
            showCatchUpNote={showCatchUpNote}
          />
        )}
      </AnimatePresence>

      {/* How to Play Rulebook Modal */}
      <AnimatePresence>
        {isRulesModalOpen && (
          <RulebookModal 
            onClose={() => setIsRulesModalOpen(false)} 
            onTestCardInGame={(card) => handleRewardCardSelected(card, undefined, false)}
            activeTeamName={activeTeam?.name}
          />
        )}
      </AnimatePresence>

      {/* Question Deck Editor Modal with Cloud Sync tools */}
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

      {/* Superstar Victory Modal */}
      <AnimatePresence>
        {view === 'superstar' && (
          <SuperstarModal
            teams={teams}
            onRestart={() => {
              setView('setup');
            }}
            onClose={() => setView('board')}
            onExitToLauncher={onExitToLauncher}
          />
        )}
      </AnimatePresence>

      {/* Blue Shell Automated Freeze Skip Overlay */}
      <AnimatePresence>
        {blueShellNotice && (
          <BlueShellSkipOverlay
            skippedTeam={blueShellNotice.skippedTeam}
            nextTeam={blueShellNotice.nextTeam}
            onClose={() => setBlueShellNotice(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
