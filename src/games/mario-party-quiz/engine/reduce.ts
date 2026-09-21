import { RewardCardActionOptions } from '@/shared/types';
import { EngineEffect } from '@/shared/engineFx';
import { generateRouletteCards } from '../data/rewards';
import { applyTurnBasedCard } from './cards';
import { advanceTurn, maybeFinishBoard, skipStunnedTeams } from './turns';
import { TurnBasedEvent, TurnBasedResult, TurnBasedState, activeTeamOf } from './types';

export function reduceTurnBased(state: TurnBasedState, event: TurnBasedEvent): TurnBasedResult {
  const effects: EngineEffect[] = [];

  switch (event.type) {
    case 'START': {
      const first = event.teams[0];
      effects.push({
        kind: 'toast',
        message: `🎲 All 60 questions & mystery blocks shuffled! ${first?.name}'s turn!`,
      });
      return {
        state: {
          ...state,
          teams: event.teams,
          currentTeamIndex: 0,
          blocks: event.blocks,
          view: 'board',
          selectedBlockId: null,
          rouletteCards: null,
          blueShellNotice: null,
        },
        effects,
      };
    }
    case 'SET_BLOCKS': {
      if (event.playShuffle) effects.push({ kind: 'sound', sound: 'shuffle' });
      if (event.toast) effects.push({ kind: 'toast', message: event.toast });
      return { state: { ...state, blocks: event.blocks }, effects };
    }
    case 'SELECT_BLOCK': {
      const block = state.blocks.find(b => b.id === event.blockId);
      if (!block) return { state, effects };
      if (block.isOpened) {
        effects.push({ kind: 'sound', sound: 'wrong' });
        return { state, effects };
      }
      effects.push({ kind: 'sound', sound: 'blockHit' });
      const active = activeTeamOf(state);
      if (block.question.type === 'mystery_card') {
        effects.push({ kind: 'sound', sound: 'specialCard' });
        return {
          state: {
            ...state,
            blocks: state.blocks.map(b =>
              b.id === event.blockId ? { ...b, isOpened: true, openedByTeamId: active.id } : b
            ),
            rouletteCards: generateRouletteCards(state.teams, active.id),
          },
          effects,
        };
      }
      return { state: { ...state, selectedBlockId: event.blockId }, effects };
    }
    case 'CLOSE_QUESTION':
      return { state: { ...state, selectedBlockId: null }, effects };
    case 'ANSWER_CORRECT': {
      if (state.selectedBlockId === null) return { state, effects };
      const active = activeTeamOf(state);
      const nextBlocks = state.blocks.map(b =>
        b.id === state.selectedBlockId
          ? { ...b, isOpened: true, openedByTeamId: active.id, rewardCoins: event.coins }
          : b
      );
      const nextTeams = state.teams.map(t =>
        t.id === active.id
          ? {
              ...t,
              coins: t.coins + event.coins,
              streak: t.streak + 1,
              blocksOpened: t.blocksOpened + 1,
              hasDoubleTurn: false,
            }
          : t
      );
      effects.push({ kind: 'toast', message: `🎉 ${active.name} answered correctly! +${event.coins} Coins!` });
      const afterAnswer = { ...state, blocks: nextBlocks, teams: nextTeams, selectedBlockId: null };
      const finished = maybeFinishBoard(state, afterAnswer, effects);
      if (finished.finished) return finished;
      const turned = advanceTurn(finished.state, { currentTeams: nextTeams });
      return { state: turned.state, effects: [...finished.effects, ...turned.effects] };
    }
    case 'ANSWER_INCORRECT': {
      if (state.selectedBlockId === null) return { state, effects };
      const active = activeTeamOf(state);
      const nextBlocks = state.blocks.map(b =>
        b.id === state.selectedBlockId ? { ...b, isOpened: true, isIncorrectCleared: true } : b
      );
      const nextTeams = state.teams.map(t =>
        t.id === active.id ? { ...t, streak: 0, hasDoubleTurn: false } : t
      );
      effects.push({ kind: 'toast', message: '❌ Oops! No coins earned. Turn passes!' });
      const afterMiss = { ...state, blocks: nextBlocks, teams: nextTeams, selectedBlockId: null };
      const missed = maybeFinishBoard(state, afterMiss, effects);
      if (missed.finished) return missed;
      const turnedMiss = advanceTurn(missed.state, { currentTeams: nextTeams });
      return { state: turnedMiss.state, effects: [...missed.effects, ...turnedMiss.effects] };
    }
    case 'TRIGGER_ROULETTE': {
      if (state.selectedBlockId === null) return { state, effects };
      const active = activeTeamOf(state);
      return {
        state: {
          ...state,
          blocks: state.blocks.map(b =>
            b.id === state.selectedBlockId ? { ...b, isOpened: true, openedByTeamId: active.id } : b
          ),
          selectedBlockId: null,
          rouletteCards: generateRouletteCards(state.teams, active.id),
        },
        effects,
      };
    }
    case 'RESOLVE_CARD': {
      const options: RewardCardActionOptions = event.options || {};
      const shouldAdvanceTurn = event.shouldAdvanceTurn ?? true;
      const active = activeTeamOf(state);
      const wasOnBonusTurn = active.hasDoubleTurn;
      const applied = applyTurnBasedCard(state.teams, active, event.card, options);
      let nextTeams = applied.teams;
      if (wasOnBonusTurn && !applied.keepTurn) {
        nextTeams = nextTeams.map(t => t.id === active.id ? { ...t, hasDoubleTurn: false } : t);
      }
      const afterCard: TurnBasedState = {
        ...state,
        teams: nextTeams,
        rouletteCards: null,
      };
      const finished = maybeFinishBoard(state, afterCard, [...effects, ...applied.effects]);
      if (finished.finished) return finished;
      if (!shouldAdvanceTurn) return finished;
      const turned = advanceTurn(finished.state, {
        keepCurrentTurn: applied.keepTurn,
        currentTeams: nextTeams,
      });
      return { state: turned.state, effects: [...finished.effects, ...turned.effects] };
    }
    case 'CLOSE_ROULETTE':
      return { state: { ...state, rouletteCards: null }, effects };
    case 'PASS_TURN':
      return advanceTurn(state);
    case 'SELECT_TEAM_TURN': {
      const targetTeam = state.teams[event.teamIndex];
      if (!targetTeam) return { state, effects };
      if (targetTeam.skipTurns && targetTeam.skipTurns > 0) {
        const skipped = skipStunnedTeams(state.teams, event.teamIndex);
        const nextTeam = skipped.teams[skipped.nextIndex];
        effects.push({ kind: 'sound', sound: 'blueShell' });
        effects.push({
          kind: 'toast',
          message: `🐢💥 BLUE SHELL FREEZE! ${targetTeam.name} is stunned and skips their turn! -> ${nextTeam.name}'s turn!`,
        });
        return {
          state: {
            ...state,
            teams: skipped.teams,
            currentTeamIndex: skipped.nextIndex,
            blueShellNotice: { skippedTeam: targetTeam, nextTeam },
          },
          effects,
        };
      }
      effects.push({ kind: 'sound', sound: 'pop' });
      return { state: { ...state, currentTeamIndex: event.teamIndex }, effects };
    }
    case 'ADJUST_COINS':
      return {
        state: {
          ...state,
          teams: state.teams.map(t =>
            t.id === event.teamId ? { ...t, coins: t.coins + event.delta } : t
          ),
        },
        effects,
      };
    case 'DECLARE_SUPERSTAR':
      return { state: { ...state, view: 'superstar' }, effects };
    case 'CLOSE_SUPERSTAR':
      return { state: { ...state, view: 'board' }, effects };
    case 'RESTART_SETUP':
      return { state: { ...state, view: 'setup' }, effects };
    case 'DISMISS_BLUE_SHELL':
      return { state: { ...state, blueShellNotice: null }, effects };
    case 'UPDATE_QUESTION': {
      const sanitized = {
        ...event.question,
        rewardCoins: event.question.type === 'mystery_card' ? 0 : Math.max(1, Number(event.question.rewardCoins) || 1),
      };
      return {
        state: {
          ...state,
          blocks: state.blocks.map(b => (b.id === event.blockId ? { ...b, question: sanitized } : b)),
        },
        effects,
      };
    }
    default:
      return { state, effects };
  }
}
