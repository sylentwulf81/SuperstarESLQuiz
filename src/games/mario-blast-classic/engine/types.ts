import { BlockState, GameQuestion, GameView, RewardCard, RewardCardActionOptions, Team } from '@/shared/types';
import type { MysteryBlockOutcome } from '../data/classicRewards';
import { EngineEffect } from '@/shared/engineFx';

export type { MysteryBlockOutcome };

export type RoundOverReason = 'cards' | 'gold_star' | 'bowser_revolution' | 'bowser_fury' | 'piranha' | 'host';

export interface ClassicCardSlot {
  claimedByTeamId?: string;
  card?: RewardCard;
}

export interface ClassicState {
  view: GameView;
  teams: Team[];
  currentTeamIndex: number;
  blocks: BlockState[];
  selectedBlockId: number | null;
  slots: ClassicCardSlot[];
  drawnTeamIds: string[];
  selectedAnsweringTeamId: string | null;
  pendingCard: RewardCard | null;
  pendingSlotIndex: number | null;
  mysteryOutcomes: MysteryBlockOutcome[] | null;
  roundOverReason: RoundOverReason | null;
  testMode: boolean;
}

export type ClassicEvent =
  | { type: 'START'; teams: Team[]; blocks: BlockState[] }
  | { type: 'SET_BLOCKS'; blocks: BlockState[]; toast?: string; playShuffle?: boolean }
  | { type: 'SELECT_BLOCK'; blockId: number }
  | { type: 'SELECT_ANSWERING_TEAM'; teamId: string }
  | { type: 'PICK_SLOT'; slotIndex: number }
  | { type: 'RESOLVE_CARD'; card: RewardCard; options?: RewardCardActionOptions }
  | { type: 'SKIP_CARD_ACTION' }
  | { type: 'RESOLVE_MYSTERY'; outcome: MysteryBlockOutcome }
  | { type: 'END_ROUND'; reason?: RoundOverReason }
  | { type: 'CANCEL_EMPTY_ROUND' }
  | { type: 'CONTINUE_ROUND_OVER' }
  | { type: 'PASS_TURN' }
  | { type: 'SELECT_TEAM_TURN'; teamIndex: number }
  | { type: 'ADJUST_COINS'; teamId: string; delta: number }
  | { type: 'DECLARE_SUPERSTAR' }
  | { type: 'CLOSE_SUPERSTAR' }
  | { type: 'RESTART_SETUP' }
  | { type: 'SET_TEST_MODE'; on: boolean }
  | { type: 'UPDATE_QUESTION'; blockId: number; question: GameQuestion };

export interface ClassicResult {
  state: ClassicState;
  effects: EngineEffect[];
}

export const emptyClassicSlots = (): ClassicCardSlot[] => Array.from({ length: 6 }, () => ({}));

export function createClassicState(blocks: BlockState[], testMode = false): ClassicState {
  return {
    view: 'setup',
    teams: [],
    currentTeamIndex: 0,
    blocks,
    selectedBlockId: null,
    slots: emptyClassicSlots(),
    drawnTeamIds: [],
    selectedAnsweringTeamId: null,
    pendingCard: null,
    pendingSlotIndex: null,
    mysteryOutcomes: null,
    roundOverReason: null,
    testMode,
  };
}

export function resetClassicRound(state: ClassicState): ClassicState {
  return {
    ...state,
    slots: emptyClassicSlots(),
    drawnTeamIds: [],
    selectedAnsweringTeamId: null,
    pendingCard: null,
    pendingSlotIndex: null,
    mysteryOutcomes: null,
    roundOverReason: null,
  };
}

export function classicActiveTeam(state: ClassicState): Team | undefined {
  return state.teams[state.currentTeamIndex] || state.teams[0];
}

export function classicOpenedCount(state: ClassicState): number {
  return state.blocks.filter(b => b.isOpened).length;
}

export function classicBoardCleared(state: ClassicState): boolean {
  return state.blocks.length > 0 && state.blocks.every(b => b.isOpened);
}
