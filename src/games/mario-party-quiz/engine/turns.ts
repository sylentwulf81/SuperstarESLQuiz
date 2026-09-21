import { Team } from '@/shared/types';
import { EngineEffect } from '@/shared/engineFx';
import { BlueShellNotice, TurnBasedState } from './types';

export function skipStunnedTeams(
  teams: Team[],
  startIndex: number
): { teams: Team[]; nextIndex: number; skippedTeam: Team | null } {
  let nextIndex = startIndex;
  let updatedTeams = [...teams];
  let skippedTeam: Team | null = null;
  let loops = 0;

  while (loops < updatedTeams.length && (updatedTeams[nextIndex].skipTurns ?? 0) > 0) {
    skippedTeam = updatedTeams[nextIndex];
    updatedTeams = updatedTeams.map((t, idx) =>
      idx === nextIndex ? { ...t, skipTurns: Math.max(0, (t.skipTurns || 1) - 1) } : t
    );
    nextIndex = (nextIndex + 1) % updatedTeams.length;
    loops++;
  }

  return { teams: updatedTeams, nextIndex, skippedTeam };
}

export function advanceTurn(
  state: TurnBasedState,
  options?: {
    keepCurrentTurn?: boolean;
    currentTeams?: Team[];
    overrideIndex?: number;
  }
): { state: TurnBasedState; effects: EngineEffect[] } {
  const keepCurrentTurn = options?.keepCurrentTurn ?? false;
  let baseTeams = options?.currentTeams ? [...options.currentTeams] : [...state.teams];
  const active = baseTeams[state.currentTeamIndex] || baseTeams[0];
  const effects: EngineEffect[] = [];

  if (keepCurrentTurn) {
    effects.push({ kind: 'toast', message: `🍄 ${active.name} gets another turn! Pick another block!` });
    return { state: { ...state, teams: baseTeams }, effects };
  }

  if (active.hasDoubleTurn) {
    baseTeams = baseTeams.map(t => t.id === active.id ? { ...t, hasDoubleTurn: false } : t);
  }

  const startIndex = options?.overrideIndex !== undefined
    ? options.overrideIndex
    : (state.currentTeamIndex + 1) % baseTeams.length;

  const skipped = skipStunnedTeams(baseTeams, startIndex);
  const nextTeam = skipped.teams[skipped.nextIndex];
  const notice: BlueShellNotice | null = skipped.skippedTeam
    ? { skippedTeam: skipped.skippedTeam, nextTeam }
    : null;

  if (skipped.skippedTeam) {
    effects.push({ kind: 'sound', sound: 'blueShell' });
    effects.push({
      kind: 'toast',
      message: `🐢💥 BLUE SHELL FREEZE! ${skipped.skippedTeam.name} is stunned and skips their turn! -> ${nextTeam.name}'s turn!`,
    });
  } else {
    effects.push({ kind: 'toast', message: `🎯 Up next: ${nextTeam.name}'s turn!` });
  }

  return {
    state: {
      ...state,
      teams: skipped.teams,
      currentTeamIndex: skipped.nextIndex,
      blueShellNotice: notice ?? state.blueShellNotice,
    },
    effects,
  };
}

export function maybeFinishBoard(
  state: TurnBasedState,
  nextState: TurnBasedState,
  effects: EngineEffect[]
): { state: TurnBasedState; effects: EngineEffect[]; finished: boolean } {
  const cleared = nextState.blocks.length > 0 && nextState.blocks.every(b => b.isOpened);
  if (!cleared) return { state: nextState, effects, finished: false };
  effects.push({ kind: 'sound', sound: 'superstar' });
  effects.push({
    kind: 'toast',
    message: `🏁 ALL ${nextState.blocks.length} QUESTIONS ANSWERED! BOARD CLEAR! 🏆`,
  });
  effects.push({ kind: 'scheduleSuperstar', ms: 900 });
  return { state: nextState, effects, finished: true };
}
