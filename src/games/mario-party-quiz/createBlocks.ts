import { BlockState, GameQuestion, GameTheme, Question } from '@/shared/types';
import { DEFAULT_QUESTIONS } from './data/questions';
import { SUMMER_QUESTIONS } from './data/summerQuestions';
import { CLASSIC_QUESTIONS } from '@/games/mario-blast-classic/data/classicQuestions';

export const TOTAL_BLOCKS = 60;

/**
 * Generates the 60 blocks for a game theme.
 * Checks localStorage for saved custom questions first.
 * If shouldShuffle is true (e.g. on game start), randomizes the question
 * locations across the board and shuffles multiple choice answers.
 */
export function createGameBlocks(
  theme: GameTheme,
  customQuestions?: Question[],
  shouldShuffle: boolean = false,
  targetCount?: number
): BlockState[] {
  let rawDeck: Question[] = [];
  const defaultSource =
    theme === 'summer' ? SUMMER_QUESTIONS : theme === 'classic' ? CLASSIC_QUESTIONS : DEFAULT_QUESTIONS;

  // Read saved block count if not passed explicitly
  const effectiveCount = targetCount ?? (() => {
    try {
      const savedCount = localStorage.getItem(`mp_block_count_${theme}`);
      if (savedCount) {
        const parsed = parseInt(savedCount, 10);
        if (!isNaN(parsed) && parsed >= 10 && parsed <= 60) return parsed;
      }
    } catch {}
    return TOTAL_BLOCKS;
  })();

  // Read saved shuffle preference if shouldShuffle is requested
  const isShuffleEnabled = shouldShuffle ? (() => {
    try {
      const savedPref = localStorage.getItem(`mp_shuffle_blocks_${theme}`);
      if (savedPref !== null) return savedPref === 'true';
    } catch {}
    return true; // Default to true for backward compatibility
  })() : false;

  if (customQuestions && Array.isArray(customQuestions) && customQuestions.length > 0) {
    rawDeck = customQuestions.map(q => ({ ...q }));
  } else {
    try {
      const cached =
        localStorage.getItem(`mp_custom_blocks_v5_${theme}`) ||
        localStorage.getItem(`mp_custom_blocks_v4_${theme}`) ||
        localStorage.getItem(`mp_custom_blocks_v3_${theme}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawDeck = parsed.map((q: Question) => ({ ...q }));
        }
      }
    } catch (e) {
      console.warn('Could not read cached questions from localStorage', e);
    }
  }

  if (rawDeck.length === 0) {
    rawDeck = defaultSource.map(q => ({ ...q }));
  } else if (rawDeck.length < effectiveCount) {
    const extra = defaultSource.slice(rawDeck.length).map(q => ({ ...q }));
    rawDeck = [...rawDeck, ...extra];
  }

  if (rawDeck.length > effectiveCount) {
    rawDeck = rawDeck.slice(0, effectiveCount);
  }

  if (isShuffleEnabled) {
    for (let i = rawDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rawDeck[i], rawDeck[j]] = [rawDeck[j], rawDeck[i]];
    }
  }

  return rawDeck.map((rawQ, i) => {
    let question: GameQuestion;

    if (rawQ.type === 'multiple_choice' && shouldShuffle) {
      const correctText = rawQ.options[rawQ.correctIndex];
      const shuffledOptions = [...rawQ.options];
      for (let s = shuffledOptions.length - 1; s > 0; s--) {
        const r = Math.floor(Math.random() * (s + 1));
        [shuffledOptions[s], shuffledOptions[r]] = [shuffledOptions[r], shuffledOptions[s]];
      }
      question = {
        ...rawQ,
        id: i + 1,
        blockNumber: i + 1,
        options: shuffledOptions,
        correctIndex: shuffledOptions.indexOf(correctText),
      };
    } else {
      question = {
        ...rawQ,
        id: i + 1,
        blockNumber: i + 1,
      };
    }

    if (question.type !== 'mystery_card') {
      question.rewardCoins = Math.max(1, Number(question.rewardCoins) || 1);
    }

    return {
      id: i + 1,
      isOpened: false,
      isIncorrectCleared: false,
      question,
    };
  });
}
