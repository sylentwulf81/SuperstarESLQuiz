import { EngineEffect } from '@/shared/engineFx';
import {
  drawClassicCard,
  fillClassicTestSlots,
  shuffleMysteryBlockOutcomes,
  shuffleSuperMushroomOffers,
} from '../data/classicRewards';
import { applyClassicReward, applyPayoutToTeam } from './cards';
import {
  ClassicEvent,
  ClassicResult,
  ClassicState,
  RoundOverReason,
  classicActiveTeam,
  emptyClassicSlots,
  resetClassicRound,
} from './types';

function advancePick(state: ClassicState, roster = state.teams): { state: ClassicState; effects: EngineEffect[] } {
  if (roster.length === 0) return { state, effects: [] };
  const nextIndex = (state.currentTeamIndex + 1) % roster.length;
  return {
    state: { ...state, teams: roster, currentTeamIndex: nextIndex },
    effects: [{ kind: 'toast', message: `🎯 ${roster[nextIndex].name} picks the next block!` }],
  };
}

function finishRound(state: ClassicState, roster: ClassicState['teams']): ClassicResult {
  if (state.selectedBlockId === null) return { state, effects: [] };
  const picker = classicActiveTeam(state);
  const nextBlocks = state.blocks.map(b =>
    b.id === state.selectedBlockId
      ? { ...b, isOpened: true, openedByTeamId: picker?.id }
      : b
  );
  const cleared = nextBlocks.length > 0 && nextBlocks.every(b => b.isOpened);
  const reset = resetClassicRound({
    ...state,
    blocks: nextBlocks,
    selectedBlockId: null,
    teams: roster,
  });
  if (cleared) {
    return {
      state: reset,
      effects: [
        { kind: 'sound', sound: 'superstar' },
        { kind: 'toast', message: `🏁 ALL ${nextBlocks.length} QUESTIONS ANSWERED! BOARD CLEAR! 🏆` },
        { kind: 'scheduleSuperstar', ms: 900 },
      ],
    };
  }
  const turned = advancePick(reset, roster);
  return turned;
}

function commitSlot(state: ClassicState, card: import('@/shared/types').RewardCard, slotIndex: number, teamId: string): ClassicState {
  return {
    ...state,
    slots: state.slots.map((slot, i) => (i === slotIndex ? { claimedByTeamId: teamId, card } : slot)),
    drawnTeamIds: state.drawnTeamIds.includes(teamId) ? state.drawnTeamIds : [...state.drawnTeamIds, teamId],
  };
}

export function reduceClassic(state: ClassicState, event: ClassicEvent): ClassicResult {
  const effects: EngineEffect[] = [];

  switch (event.type) {
    case 'START': {
      const first = event.teams[0];
      effects.push({
        kind: 'toast',
        message: `🎲 Questions shuffled! ${first?.name} picks the first block — anyone can answer!`,
      });
      return {
        state: resetClassicRound({
          ...state,
          teams: event.teams.map(t => ({
            ...t,
            doubleNextCoinReward: false,
            skipNextCoinReward: false,
            blooperNextCoin: false,
          })),
          currentTeamIndex: 0,
          blocks: event.blocks,
          selectedBlockId: null,
          view: 'board',
        }),
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
      if (!block || block.isOpened) {
        effects.push({ kind: 'sound', sound: 'wrong' });
        return { state, effects };
      }
      effects.push({ kind: 'sound', sound: 'blockHit' });
      let next = resetClassicRound({ ...state, selectedBlockId: event.blockId });
      if (state.testMode) {
        next = { ...next, slots: fillClassicTestSlots(emptyClassicSlots()) };
      }
      return { state: next, effects };
    }
    case 'SELECT_ANSWERING_TEAM':
      return { state: { ...state, selectedAnsweringTeamId: event.teamId }, effects };
    case 'PICK_SLOT': {
      if (!state.selectedAnsweringTeamId || state.slots[event.slotIndex]?.claimedByTeamId) {
        return { state, effects };
      }
      const card = state.slots[event.slotIndex]?.card
        ?? drawClassicCard(state.teams, state.selectedAnsweringTeamId);
      effects.push({ kind: 'sound', sound: 'specialCard' });
      return {
        state: { ...state, pendingSlotIndex: event.slotIndex, pendingCard: card },
        effects,
      };
    }
    case 'RESOLVE_CARD': {
      const drawingTeam = state.teams.find(t => t.id === state.selectedAnsweringTeamId);
      if (!drawingTeam || state.pendingSlotIndex === null) return { state, effects };
      if (event.card.type === 'mystery_blocks') {
        return {
          state: {
            ...commitSlot(state, event.card, state.pendingSlotIndex, drawingTeam.id),
            pendingCard: null,
            mysteryOutcomes: shuffleMysteryBlockOutcomes(),
            mushroomOffers: null,
          },
          effects,
        };
      }
      if (event.card.type === 'super_star_x2' || event.card.type === 'mushroom_x2') {
        return {
          state: {
            ...commitSlot(state, event.card, state.pendingSlotIndex, drawingTeam.id),
            pendingCard: null,
            mysteryOutcomes: null,
            mushroomOffers: shuffleSuperMushroomOffers(),
          },
          effects,
        };
      }
      const applied = applyClassicReward(event.card, drawingTeam, state.teams, event.options);
      const committed = commitSlot(
        { ...state, teams: applied.teams, pendingCard: null, pendingSlotIndex: null, selectedAnsweringTeamId: null },
        event.card,
        state.pendingSlotIndex,
        drawingTeam.id
      );
      const remainingAfter = committed.slots.filter((s, i) => i !== state.pendingSlotIndex && !s.claimedByTeamId).length;
      let reason: RoundOverReason | null = committed.roundOverReason;
      if (applied.endsRound) {
        reason = event.card.type === 'gold_star'
          ? 'gold_star'
          : event.card.type === 'bowser_fury'
            ? 'bowser_fury'
            : 'bowser_revolution';
      } else if (remainingAfter <= 0) {
        reason = 'cards';
      }
      return { state: { ...committed, roundOverReason: reason }, effects: applied.effects };
    }
    case 'SKIP_CARD_ACTION': {
      const drawingTeam = state.teams.find(t => t.id === state.selectedAnsweringTeamId);
      if (!drawingTeam || state.pendingSlotIndex === null || !state.pendingCard) return { state, effects };
      const committed = commitSlot(state, state.pendingCard, state.pendingSlotIndex, drawingTeam.id);
      const remainingAfter = committed.slots.filter((s, i) => i !== state.pendingSlotIndex && !s.claimedByTeamId).length;
      return {
        state: {
          ...committed,
          pendingCard: null,
          pendingSlotIndex: null,
          selectedAnsweringTeamId: null,
          mysteryOutcomes: null,
          mushroomOffers: null,
          roundOverReason: remainingAfter <= 0 ? 'cards' : committed.roundOverReason,
        },
        effects,
      };
    }
    case 'RESOLVE_MYSTERY': {
      const drawingTeam = state.teams.find(t => t.id === state.selectedAnsweringTeamId);
      const clearedMystery = { ...state, mysteryOutcomes: null, mushroomOffers: null };
      if (!drawingTeam) {
        return {
          state: { ...clearedMystery, selectedAnsweringTeamId: null, pendingSlotIndex: null },
          effects,
        };
      }
      let nextTeams = [...state.teams];
      if (event.outcome.kind === 'treasure') {
        const payout = applyPayoutToTeam(nextTeams, drawingTeam.id, event.outcome.coins);
        nextTeams = payout.teams;
        if (payout.skipped) {
          effects.push({ kind: 'sound', sound: 'blueShell' });
          effects.push({ kind: 'toast', message: '🐢 Treasure skipped by Blue Shell!' });
        } else if (payout.bloopered) {
          effects.push({ kind: 'toast', message: `🦑 INKED! Treasure became +1 for ${drawingTeam.name}!` });
        } else {
          if (payout.doubled) effects.push({ kind: 'sound', sound: 'powerUp' });
          effects.push({
            kind: 'toast',
            message: `${payout.doubled ? '🍄 2x! ' : ''}💎 Treasure Block! ${drawingTeam.name} +${payout.awarded} coins!`,
          });
        }
      } else if (event.outcome.kind === 'bust') {
        effects.push({ kind: 'toast', message: `💨 Empty block… ${drawingTeam.name} got 0 coins.` });
      }
      nextTeams = nextTeams.map(t =>
        t.id === drawingTeam.id ? { ...t, streak: t.streak + 1 } : t
      );
      let reason = state.roundOverReason;
      if (event.outcome.kind === 'piranha') reason = 'piranha';
      else if (state.slots.every(s => s.claimedByTeamId)) reason = 'cards';
      return {
        state: {
          ...clearedMystery,
          teams: nextTeams,
          selectedAnsweringTeamId: null,
          pendingSlotIndex: null,
          roundOverReason: reason,
        },
        effects,
      };
    }
    case 'RESOLVE_MUSHROOM': {
      const drawingTeam = state.teams.find(t => t.id === state.selectedAnsweringTeamId);
      const cleared = { ...state, mushroomOffers: null, mysteryOutcomes: null };
      if (!drawingTeam) {
        return {
          state: { ...cleared, selectedAnsweringTeamId: null, pendingSlotIndex: null },
          effects,
        };
      }
      const doubled = event.coins * 2;
      const payout = applyPayoutToTeam(state.teams, drawingTeam.id, doubled);
      let nextTeams = payout.teams.map(t =>
        t.id === drawingTeam.id ? { ...t, streak: t.streak + 1 } : t
      );
      if (payout.skipped) {
        effects.push({ kind: 'sound', sound: 'blueShell' });
        effects.push({ kind: 'toast', message: '🐢 Super Mushroom skipped by Blue Shell!' });
      } else if (payout.bloopered) {
        effects.push({ kind: 'toast', message: `🦑 INKED! Super Mushroom became +1 for ${drawingTeam.name}!` });
      } else {
        effects.push({ kind: 'sound', sound: 'powerUp' });
        effects.push({
          kind: 'toast',
          message: `🍄 ×2! ${drawingTeam.name} +${payout.awarded} coins!`,
        });
      }
      const reason = state.slots.every(s => s.claimedByTeamId) ? 'cards' : state.roundOverReason;
      return {
        state: {
          ...cleared,
          teams: nextTeams,
          selectedAnsweringTeamId: null,
          pendingSlotIndex: null,
          roundOverReason: reason,
        },
        effects,
      };
    }
    case 'END_ROUND':
      return { state: { ...state, roundOverReason: event.reason ?? 'host' }, effects };
    case 'CANCEL_EMPTY_ROUND':
      return { state: resetClassicRound({ ...state, selectedBlockId: null }), effects };
    case 'CONTINUE_ROUND_OVER':
      return finishRound(state, state.teams);
    case 'PASS_TURN':
      return advancePick(state);
    case 'SELECT_TEAM_TURN': {
      if (!state.teams[event.teamIndex]) return { state, effects };
      effects.push({ kind: 'sound', sound: 'pop' });
      return { state: { ...state, currentTeamIndex: event.teamIndex }, effects };
    }
    case 'ADJUST_COINS':
      return {
        state: {
          ...state,
          teams: state.teams.map(t => t.id === event.teamId ? { ...t, coins: t.coins + event.delta } : t),
        },
        effects,
      };
    case 'DECLARE_SUPERSTAR':
      return { state: { ...state, view: 'superstar' }, effects };
    case 'CLOSE_SUPERSTAR':
      return { state: { ...state, view: 'board' }, effects };
    case 'RESTART_SETUP':
      return { state: { ...state, view: 'setup' }, effects };
    case 'SET_TEST_MODE': {
      const on = event.on;
      let slots = state.slots;
      if (state.selectedBlockId) {
        slots = on
          ? fillClassicTestSlots(state.slots)
          : state.slots.map(slot => (slot.claimedByTeamId ? slot : { ...slot, card: undefined }));
      }
      return { state: { ...state, testMode: on, slots }, effects };
    }
    case 'UPDATE_QUESTION': {
      const sanitized = {
        ...event.question,
        rewardCoins: event.question.type === 'mystery_card' ? 0 : Math.max(0, Number(event.question.rewardCoins) || 0),
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
