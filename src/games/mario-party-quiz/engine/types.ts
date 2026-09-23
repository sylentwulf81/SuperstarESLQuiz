import { BlockState, GameQuestion, GameView, RewardCard, Team } from '@/shared/types';
import { EngineEffect } from '@/shared/engineFx';

export interface BlueShellNotice {
  skippedTeam: Team;
  nextTeam: Team;
}

export interface TurnBasedState {
  view: GameView;
  teams: Team[];
  currentTeamIndex: number;
  blocks: BlockState[];
  selectedBlockId: number | null;
  rouletteCards: RewardCard[] | null;
  blueShellNotice: BlueShellNotice | null;
}

export type TurnBasedEvent =
  | { type: 'START'; teams: Team[]; blocks: BlockState[] }
  | { type: 'SET_BLOCKS'; blocks: BlockState[]; toast?: string; playShuffle?: boolean }
  | { type: 'SELECT_BLOCK'; blockId: number }
  | { type: 'CLOSE_QUESTION' }
  | { type: 'ANSWER_CORRECT'; coins: number }
  | { type: 'ANSWER_INCORRECT' }
  | { type: 'TRIGGER_ROULETTE' }
  | { type: 'RESOLVE_CARD'; card: RewardCard; options?: import('@/shared/types').RewardCardActionOptions; shouldAdvanceTurn?: boolean }
  | { type: 'CLOSE_ROULETTE' }
  | { type: 'PASS_TURN' }
  | { type: 'SELECT_TEAM_TURN'; teamIndex: number }
  | { type: 'ADJUST_COINS'; teamId: string; delta: number }
  | { type: 'DECLARE_SUPERSTAR' }
  | { type: 'CLOSE_SUPERSTAR' }
  | { type: 'RESTART_SETUP' }
  | { type: 'DISMISS_BLUE_SHELL' }
  | { type: 'UPDATE_QUESTION'; blockId: number; question: GameQuestion };

export interface TurnBasedResult {
  state: TurnBasedState;
  effects: EngineEffect[];
}

export const DEFAULT_TURN_BASED_TEAMS: Team[] = [
  { id: 'team_yoshi', characterId: 'yoshi', name: 'Yoshi', coins: 0, stars: 0, streak: 0, blocksOpened: 0, coinsStolen: 0, hasDoubleTurn: false },
  { id: 'team_mario', characterId: 'mario', name: 'Mario', coins: 0, stars: 0, streak: 0, blocksOpened: 0, coinsStolen: 0, hasDoubleTurn: false },
  { id: 'team_peach', characterId: 'peach', name: 'Peach', coins: 0, stars: 0, streak: 0, blocksOpened: 0, coinsStolen: 0, hasDoubleTurn: false },
  { id: 'team_daisy', characterId: 'daisy', name: 'Daisy', coins: 0, stars: 0, streak: 0, blocksOpened: 0, coinsStolen: 0, hasDoubleTurn: false },
  { id: 'team_donkey_kong', characterId: 'donkey_kong', name: 'Donkey Kong', coins: 0, stars: 0, streak: 0, blocksOpened: 0, coinsStolen: 0, hasDoubleTurn: false },
  { id: 'team_luigi', characterId: 'luigi', name: 'Luigi', coins: 0, stars: 0, streak: 0, blocksOpened: 0, coinsStolen: 0, hasDoubleTurn: false },
];

export function createTurnBasedState(blocks: BlockState[]): TurnBasedState {
  return {
    view: 'setup',
    teams: DEFAULT_TURN_BASED_TEAMS,
    currentTeamIndex: 0,
    blocks,
    selectedBlockId: null,
    rouletteCards: null,
    blueShellNotice: null,
  };
}

export function activeTeamOf(state: TurnBasedState): Team {
  return state.teams[state.currentTeamIndex] || state.teams[0];
}

export function openedBlockCount(state: TurnBasedState): number {
  return state.blocks.filter(b => b.isOpened).length;
}

export function isBoardCleared(state: TurnBasedState): boolean {
  return state.blocks.length > 0 && state.blocks.every(b => b.isOpened);
}
