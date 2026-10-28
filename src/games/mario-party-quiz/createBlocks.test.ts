import { beforeEach, describe, expect, it } from 'vitest';
import { Question } from '@/shared/types';
import { CLASSIC_QUESTIONS } from '@/games/mario-blast-classic/data/classicQuestions';
import { countTrailingDefaultFiller, createGameBlocks, getDeckLength, makeBlankQuestion } from './createBlocks';

const custom = (count: number, prefix = 'Q'): Question[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    blockNumber: i + 1,
    type: 'open_trivia',
    title: `${prefix} ${i + 1}`,
    answer: `A ${i + 1}`,
    category: 'grammar',
    rewardCoins: 1,
  }));

beforeEach(() => {
  localStorage.clear();
});

describe('createGameBlocks', () => {
  it('keeps a custom deck at its own length, ignoring the saved block count', () => {
    localStorage.setItem('mp_block_count_classic', '40');
    expect(createGameBlocks('classic', custom(20))).toHaveLength(20);
    localStorage.setItem('mp_block_count_classic', '10');
    expect(createGameBlocks('classic', custom(20))).toHaveLength(20);
  });

  it('never pads a short deck with built-in questions', () => {
    const blocks = createGameBlocks('classic', custom(15));
    const builtInTitles = new Set(CLASSIC_QUESTIONS.map(q => q.title));
    expect(blocks.some(b => builtInTitles.has(b.question.title))).toBe(false);
  });

  it('grows with blank questions only when a target size is given', () => {
    const blocks = createGameBlocks('classic', custom(10), false, 12);
    expect(blocks).toHaveLength(12);
    expect(blocks[10].question.title).toBe('');
    expect(blocks[11].question.title).toBe('');
  });

  it('plays the whole deck at game start, even with a deck size saved by an older build', () => {
    localStorage.setItem('mp_custom_blocks_v5_classic', JSON.stringify(custom(30)));
    localStorage.setItem('mp_block_count_classic', '20');
    localStorage.setItem('mp_shuffle_blocks_classic', 'false');
    expect(createGameBlocks('classic', undefined, true)).toHaveLength(30);
  });

  it('uses the full built-in curriculum when there is no custom deck', () => {
    localStorage.setItem('mp_block_count_classic', '25');
    expect(createGameBlocks('classic')).toHaveLength(CLASSIC_QUESTIONS.length);
  });

  it('keeps question order when shuffle is off', () => {
    localStorage.setItem('mp_custom_blocks_v5_classic', JSON.stringify(custom(12)));
    localStorage.setItem('mp_shuffle_blocks_classic', 'false');
    const titles = createGameBlocks('classic', undefined, true).map(b => b.question.title);
    expect(titles).toEqual(custom(12).map(q => q.title));
  });
});

describe('getDeckLength', () => {
  it('reports the saved working deck, else the built-in curriculum', () => {
    expect(getDeckLength('classic')).toBe(CLASSIC_QUESTIONS.length);
    localStorage.setItem('mp_custom_blocks_v5_classic', JSON.stringify(custom(17)));
    expect(getDeckLength('classic')).toBe(17);
  });
});

describe('countTrailingDefaultFiller', () => {
  it('finds built-in questions padded onto the end of a deck', () => {
    const padded = [...custom(20), ...CLASSIC_QUESTIONS.slice(20, 40)];
    expect(countTrailingDefaultFiller(padded)).toBe(20);
  });

  it('ignores decks with no filler', () => {
    expect(countTrailingDefaultFiller(custom(15))).toBe(0);
  });

  it('does not flag a deck that is entirely a starter deck', () => {
    expect(countTrailingDefaultFiller(CLASSIC_QUESTIONS.slice(0, 30))).toBe(0);
  });

  it('only counts the trailing run, not built-in questions in the middle', () => {
    const mixed = [...custom(5), ...CLASSIC_QUESTIONS.slice(0, 3), ...custom(5, 'Late')];
    expect(countTrailingDefaultFiller(mixed)).toBe(0);
  });
});

describe('makeBlankQuestion', () => {
  it('creates an empty question of the requested type', () => {
    const mc = makeBlankQuestion(4, 'multiple_choice');
    expect(mc).toMatchObject({ id: 5, blockNumber: 5, type: 'multiple_choice', title: '' });
    expect(makeBlankQuestion(0).type).toBe('open_trivia');
  });
});
