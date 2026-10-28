import { BlockState, GameQuestion, GameTheme, Question, QuestionType } from '@/shared/types';
import { legacySlashesToMarks } from '@/shared/markedPrompt';
import { DEFAULT_QUESTIONS } from './data/questions';
import { SUMMER_QUESTIONS } from './data/summerQuestions';
import { HALLOWEEN_QUESTIONS } from './data/halloweenQuestions';
import { CLASSIC_QUESTIONS } from '@/games/mario-blast-classic/data/classicQuestions';

export const TOTAL_BLOCKS = 60;

/** Empty question used when a deck grows (Studio resize / insert). Never default curriculum. */
export function makeBlankQuestion(index: number, type: QuestionType = 'open_trivia'): GameQuestion {
  const base = { id: index + 1, blockNumber: index + 1, title: '', category: 'grammar', rewardCoins: 1 };
  if (type === 'multiple_choice') return { ...base, type, options: ['', '', '', ''], correctIndex: 0 };
  if (type === 'true_false') return { ...base, type, isTrue: true, explanation: '' };
  if (type === 'unscramble') return { ...base, type, targetWord: '', scrambledLetters: [] };
  if (type === 'mystery_card') return { ...base, type, description: '', rewardCoins: 0 };
  return { ...base, type: 'open_trivia', answer: '' };
}

/** Setup-screen "Deck size": how many blocks to play from the deck this game. */
function readSavedPlayCount(theme: GameTheme): number | undefined {
  try {
    const savedCount = localStorage.getItem(`mp_block_count_${theme}`);
    if (savedCount) {
      const parsed = parseInt(savedCount, 10);
      if (!isNaN(parsed) && parsed >= 10 && parsed <= 60) return parsed;
    }
  } catch {}
  return undefined;
}

const ALL_DEFAULT_QUESTIONS: Question[] = [
  ...DEFAULT_QUESTIONS,
  ...SUMMER_QUESTIONS,
  ...HALLOWEEN_QUESTIONS,
  ...CLASSIC_QUESTIONS,
];

function questionFingerprint(q: Question): string {
  const title = legacySlashesToMarks(q.title || '').trim().toLowerCase();
  let key = '';
  if (q.type === 'multiple_choice') {
    key = `${[...q.options].map(o => o.trim().toLowerCase()).sort().join('|')}=${(q.options[q.correctIndex] || '').trim().toLowerCase()}`;
  } else if (q.type === 'true_false') {
    key = String(q.isTrue);
  } else if (q.type === 'open_trivia') {
    key = (q.answer || '').trim().toLowerCase();
  } else if (q.type === 'unscramble') {
    key = (q.targetWord || '').trim().toLowerCase();
  } else {
    key = (q.description || '').trim().toLowerCase();
  }
  return `${q.type}::${title}::${key}`;
}

let defaultFingerprints: Set<string> | null = null;

/**
 * Older builds padded short decks with built-in curriculum questions, and saving
 * wrote that padding into the user's library deck. Returns how many questions at
 * the end of the deck exactly match built-in questions (0 if the whole deck does,
 * since then it is a deliberately loaded starter deck).
 */
export function countTrailingDefaultFiller(questions: Question[]): number {
  if (!defaultFingerprints) {
    defaultFingerprints = new Set(ALL_DEFAULT_QUESTIONS.map(questionFingerprint));
  }
  let count = 0;
  for (let i = questions.length - 1; i >= 0; i--) {
    if (!defaultFingerprints.has(questionFingerprint(questions[i]))) break;
    count += 1;
  }
  return count === questions.length ? 0 : count;
}

/** Full length of the deck a game would play: the saved working deck, else the built-in curriculum. */
export function getDeckLength(theme: GameTheme): number {
  try {
    const cached = localStorage.getItem(`mp_custom_blocks_v5_${theme}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.length;
    }
  } catch {}
  return defaultSourceFor(theme).length;
}

function defaultSourceFor(theme: GameTheme): Question[] {
  return theme === 'halloween'
    ? HALLOWEEN_QUESTIONS
    : theme === 'summer'
    ? SUMMER_QUESTIONS
    : theme === 'classic'
    ? CLASSIC_QUESTIONS
    : DEFAULT_QUESTIONS;
}

/**
 * Builds board blocks for a theme.
 * A custom deck (passed in, or the saved working deck) keeps its own length; it is
 * only resized when targetCount is given, and grows with blank questions.
 * The built-in curriculum is used only when there is no custom deck.
 * If shouldShuffle is true (game start), the setup screen's deck size limits how many
 * blocks are played, then question locations and multiple choice answers are shuffled.
 */
export function createGameBlocks(
  theme: GameTheme,
  customQuestions?: Question[],
  shouldShuffle: boolean = false,
  targetCount?: number
): BlockState[] {
  let rawDeck: Question[] = [];
  const defaultSource = defaultSourceFor(theme);

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

  const isCustomDeck = rawDeck.length > 0;
  if (!isCustomDeck) {
    rawDeck = defaultSource.map(q => ({ ...q }));
  }

  // Explicit resize, else the default curriculum follows the saved size, else a
  // custom deck plays in full unless the setup screen asks for fewer at game start.
  const effectiveCount =
    targetCount ??
    (!isCustomDeck || shouldShuffle ? readSavedPlayCount(theme) : undefined) ??
    (isCustomDeck ? rawDeck.length : TOTAL_BLOCKS);

  if (rawDeck.length > effectiveCount) {
    rawDeck = rawDeck.slice(0, effectiveCount);
  } else if (targetCount !== undefined && rawDeck.length < targetCount) {
    const startLength = rawDeck.length;
    rawDeck = [
      ...rawDeck,
      ...Array.from({ length: targetCount - startLength }, (_, i) => makeBlankQuestion(startLength + i)),
    ];
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
