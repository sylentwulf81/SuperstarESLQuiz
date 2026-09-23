import { InvasionTeam } from '../data/factions';
import { US_STATE_PATHS } from '../data/usStatePaths';
import { EngineEffect } from '@/shared/engineFx';

export type MapTakeoverView = 'setup' | 'intro' | 'board';

export interface MapTakeoverState {
  view: MapTakeoverView;
  teams: InvasionTeam[];
  owners: Record<string, string | null>;
  selectedStateId: string | null;
  pulseId: string | null;
  isVictoryOpen: boolean;
  isEndingOpen: boolean;
}

export type MapTakeoverEvent =
  | { type: 'START'; teams: InvasionTeam[] }
  | { type: 'INTRO_DONE' }
  | { type: 'SELECT_STATE'; stateId: string }
  | { type: 'CLOSE_QUESTION' }
  | { type: 'CAPTURE'; teamId: string }
  | { type: 'CLEAR_PULSE'; stateId: string }
  | { type: 'DECLARE_WINNER' }
  | { type: 'ENDING_DONE' }
  | { type: 'CLOSE_VICTORY' }
  | { type: 'RESTART' };

export interface MapTakeoverResult {
  state: MapTakeoverState;
  effects: EngineEffect[];
}

export function emptyOwners(): Record<string, string | null> {
  const next: Record<string, string | null> = {};
  for (const state of US_STATE_PATHS) next[state.id] = null;
  return next;
}

export function createMapTakeoverState(): MapTakeoverState {
  return {
    view: 'setup',
    teams: [],
    owners: emptyOwners(),
    selectedStateId: null,
    pulseId: null,
    isVictoryOpen: false,
    isEndingOpen: false,
  };
}

export function stateCounts(state: MapTakeoverState): Record<string, number> {
  const next: Record<string, number> = {};
  for (const team of state.teams) next[team.id] = 0;
  for (const place of US_STATE_PATHS) {
    const teamId = state.owners[place.id];
    if (typeof teamId === 'string' && teamId in next) next[teamId] += 1;
  }
  return next;
}

export function capturedCount(state: MapTakeoverState): number {
  return US_STATE_PATHS.filter(place => Boolean(state.owners[place.id])).length;
}
