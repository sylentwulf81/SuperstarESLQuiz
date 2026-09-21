import { EngineEffect } from '@/shared/engineFx';
import {
  MapTakeoverEvent,
  MapTakeoverResult,
  MapTakeoverState,
  emptyOwners,
} from './types';

export function reduceMapTakeover(state: MapTakeoverState, event: MapTakeoverEvent): MapTakeoverResult {
  const effects: EngineEffect[] = [];

  switch (event.type) {
    case 'START':
      return {
        state: {
          ...state,
          teams: event.teams,
          owners: emptyOwners(),
          selectedStateId: null,
          pulseId: null,
          isVictoryOpen: false,
          isEndingOpen: false,
          view: 'intro',
        },
        effects,
      };
    case 'INTRO_DONE':
      return { state: { ...state, view: 'board' }, effects };
    case 'SELECT_STATE':
      effects.push({ kind: 'sound', sound: 'blockHit' });
      return { state: { ...state, selectedStateId: event.stateId }, effects };
    case 'CLOSE_QUESTION':
      return { state: { ...state, selectedStateId: null }, effects };
    case 'CAPTURE': {
      if (!state.selectedStateId) return { state, effects };
      const previous = state.owners[state.selectedStateId];
      const isSteal = Boolean(previous && previous !== event.teamId);
      effects.push({ kind: 'sound', sound: isSteal ? 'starCoin' : 'correct' });
      effects.push({ kind: 'clearPulse', ms: 900, stateId: state.selectedStateId });
      return {
        state: {
          ...state,
          owners: { ...state.owners, [state.selectedStateId]: event.teamId },
          pulseId: state.selectedStateId,
          selectedStateId: null,
        },
        effects,
      };
    }
    case 'CLEAR_PULSE':
      return {
        state: {
          ...state,
          pulseId: state.pulseId === event.stateId ? null : state.pulseId,
        },
        effects,
      };
    case 'DECLARE_WINNER':
      return { state: { ...state, isEndingOpen: true }, effects };
    case 'ENDING_DONE':
      return { state: { ...state, isEndingOpen: false, isVictoryOpen: true }, effects };
    case 'CLOSE_VICTORY':
      return { state: { ...state, isVictoryOpen: false }, effects };
    case 'RESTART':
      return {
        state: {
          ...state,
          owners: emptyOwners(),
          selectedStateId: null,
          pulseId: null,
          isVictoryOpen: false,
          isEndingOpen: false,
          view: 'setup',
        },
        effects,
      };
    default:
      return { state, effects };
  }
}
