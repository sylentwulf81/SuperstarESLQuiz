import { describe, expect, it } from 'vitest';
import { BlockState, GameQuestion, Team } from '@/shared/types';
import { reduceClassic } from './reduce';
import { ClassicState, createClassicState } from './types';

const team = (id: string): Team => ({
  id,
  characterId: 'mario',
  name: `Team ${id}`,
  coins: 0,
  stars: 0,
  streak: 0,
  blocksOpened: 0,
  coinsStolen: 0,
  hasDoubleTurn: false,
});

const block = (id: number, question: Partial<GameQuestion> = {}): BlockState => ({
  id,
  isOpened: false,
  question: {
    id,
    blockNumber: id,
    type: 'open_trivia',
    title: `Question ${id}`,
    answer: 'A',
    category: 'grammar',
    rewardCoins: 1,
    ...question,
  } as GameQuestion,
});

function startedGame(blocks: BlockState[] = [block(1), block(2)]): ClassicState {
  const { state } = reduceClassic(createClassicState(blocks), {
    type: 'START',
    teams: [team('a'), team('b'), team('c')],
    blocks,
  });
  return state;
}

describe('Mystery Card blocks', () => {
  it('preselect the picking team to draw', () => {
    const state = startedGame([block(1, { type: 'mystery_card', title: '', description: '' } as Partial<GameQuestion>)]);
    const { state: opened } = reduceClassic(state, { type: 'SELECT_BLOCK', blockId: 1 });
    expect(opened.selectedAnsweringTeamId).toBe('a');
  });

  it('leave regular questions waiting for the host to choose a team', () => {
    const { state: opened } = reduceClassic(startedGame(), { type: 'SELECT_BLOCK', blockId: 1 });
    expect(opened.selectedAnsweringTeamId).toBeNull();
  });
});

describe('skipping a team', () => {
  it('marks and unmarks a team, and stops it being selected to draw', () => {
    let { state } = reduceClassic(startedGame(), { type: 'SELECT_BLOCK', blockId: 1 });
    ({ state } = reduceClassic(state, { type: 'TOGGLE_PASS_TEAM', teamId: 'b' }));
    expect(state.passedTeamIds).toEqual(['b']);

    ({ state } = reduceClassic(state, { type: 'SELECT_ANSWERING_TEAM', teamId: 'b' }));
    expect(state.selectedAnsweringTeamId).toBeNull();

    ({ state } = reduceClassic(state, { type: 'TOGGLE_PASS_TEAM', teamId: 'b' }));
    expect(state.passedTeamIds).toEqual([]);
  });

  it('clears the selection when the selected team is skipped', () => {
    let { state } = reduceClassic(startedGame(), { type: 'SELECT_BLOCK', blockId: 1 });
    ({ state } = reduceClassic(state, { type: 'SELECT_ANSWERING_TEAM', teamId: 'c' }));
    ({ state } = reduceClassic(state, { type: 'TOGGLE_PASS_TEAM', teamId: 'c' }));
    expect(state.selectedAnsweringTeamId).toBeNull();
  });

  it('resets skips when the next block opens', () => {
    let { state } = reduceClassic(startedGame(), { type: 'SELECT_BLOCK', blockId: 1 });
    ({ state } = reduceClassic(state, { type: 'TOGGLE_PASS_TEAM', teamId: 'b' }));
    ({ state } = reduceClassic(state, { type: 'END_ROUND' }));
    ({ state } = reduceClassic(state, { type: 'CONTINUE_ROUND_OVER' }));
    ({ state } = reduceClassic(state, { type: 'SELECT_BLOCK', blockId: 2 }));
    expect(state.passedTeamIds).toEqual([]);
  });
});
