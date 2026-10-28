import { RewardCard, RewardCardActionOptions, Team } from '@/shared/types';
import { EngineEffect, EngineSound } from '@/shared/engineFx';
import { applyCoinPayout, applyRivalCoinShuffle, isClassicRoundEnder } from '../data/classicRewards';

export function applyPayoutToTeam(roster: Team[], teamId: string, amount: number) {
  let awarded = 0;
  let skipped = false;
  let doubled = false;
  let bloopered = false;
  let heistDifference = 0;
  let inkerTeamId: string | undefined = undefined;

  let next = roster.map(t => {
    if (t.id !== teamId) return t;
    const result = applyCoinPayout(t, amount);
    awarded = result.awarded;
    skipped = result.skipped;
    doubled = result.doubled;
    bloopered = result.bloopered;
    heistDifference = result.heistDifference;
    inkerTeamId = result.inkerTeamId;
    return result.team;
  });

  // Blooper Heist: inker team steals the difference directly!
  if (bloopered && heistDifference > 0 && inkerTeamId) {
    next = next.map(t => {
      if (t.id === inkerTeamId) {
        return {
          ...t,
          coins: t.coins + heistDifference,
          coinsStolen: (t.coinsStolen || 0) + heistDifference,
        };
      }
      return t;
    });
  }

  return { teams: next, awarded, skipped, doubled, bloopered, heistDifference, inkerTeamId };
}

function payoutEffects(
  drawingName: string,
  payout: { awarded: number; skipped: boolean; doubled: boolean; bloopered: boolean; heistDifference?: number; inkerTeamId?: string },
  teams: Team[],
  prefix = ''
): EngineEffect[] {
  if (payout.skipped) {
    return [
      { kind: 'sound', sound: 'blueShell' },
      { kind: 'toast', message: prefix || `🐢 ${drawingName}'s coin reward was skipped by Blue Shell!` },
    ];
  }
  if (payout.bloopered) {
    const inker = payout.inkerTeamId ? teams.find(t => t.id === payout.inkerTeamId) : null;
    const diff = payout.heistDifference || 0;
    const message = inker && diff > 0
      ? `🦑 INKED! ${drawingName} got +1 coin. ${inker.name} stole the other +${diff} coins!`
      : `🦑 INKED! ${drawingName} got +1 coin!`;
    return [
      { kind: 'sound', sound: 'blooper' },
      { kind: 'toast', message: prefix || message },
    ];
  }
  const sound: EngineSound = payout.doubled ? 'powerUp' : 'coin';
  return [
    { kind: 'sound', sound },
    {
      kind: 'toast',
      message: prefix || `${payout.doubled ? '🍄 2x! ' : ''}🪙 ${drawingName} gained +${payout.awarded} coins!`,
    },
  ];
}

export function applyClassicReward(
  card: RewardCard,
  drawingTeam: Team,
  roster: Team[],
  options?: RewardCardActionOptions
): { teams: Team[]; endsRound: boolean; effects: EngineEffect[] } {
  let nextTeams = [...roster];
  let endsRound = isClassicRoundEnder(card.type);
  const effects: EngineEffect[] = [];

  switch (card.type) {
    case 'great_coins_3':
    case 'coins_3':
    case 'wonderful_coins_5':
    case 'coins_5':
    case 'super_coins_10':
    case 'coins_10':
    case 'coins_1':
    case 'gold_star': {
      const amount = card.coins || (card.type === 'gold_star' ? 15 : 0);
      const payout = applyPayoutToTeam(nextTeams, drawingTeam.id, amount);
      nextTeams = payout.teams;
      effects.push(...payoutEffects(drawingTeam.name, payout, nextTeams));
      break;
    }
    case 'blooper': {
      effects.push({ kind: 'sound', sound: 'blooper' });
      const target = options?.targetTeamId
        ? nextTeams.find(t => t.id === options.targetTeamId)
        : nextTeams.find(t => t.id !== drawingTeam.id);
      if (target) {
        nextTeams = nextTeams.map(t =>
          t.id === target.id ? { ...t, blooperNextCoin: true, blooperInkerTeamId: drawingTeam.id } : t
        );
        effects.push({
          kind: 'toast',
          message: `🦑 BLOOPER! ${drawingTeam.name} inked ${target.name}! Next payout reduced to 1 and remainder stolen!`,
        });
      }
      break;
    }
    case 'pow_block':
    case 'hidden_block': {
      effects.push({ kind: 'sound', sound: 'powBlock' });
      const choice = options?.powChoice || 'highest';
      const allCoins = nextTeams.map(t => t.coins);
      const target = choice === 'highest' ? Math.max(...allCoins) : Math.min(...allCoins);
      nextTeams = nextTeams.map(t => ({ ...t, coins: target }));
      effects.push({
        kind: 'toast',
        message: `💥 POW BLOCK! All teams equalized to ${choice.toUpperCase()} (${target})!`,
      });
      break;
    }
    case 'super_star_x2':
    case 'mushroom_x2':
      // Instant 3-card pick is opened by reduceClassic. Do not queue a later ×2 buff.
      effects.push({ kind: 'sound', sound: 'powerUp' });
      break;
    case 'ghost_steal_5':
    case 'boo_steal_5': {
      effects.push({ kind: 'sound', sound: 'boo' });
      const stolenCoins = options?.dieRoll || 5;
      const target = options?.targetTeamId
        ? nextTeams.find(t => t.id === options.targetTeamId)
        : null;
      if (target) {
        nextTeams = nextTeams.map(t => {
          if (t.id === drawingTeam.id) {
            return { ...t, coins: t.coins + stolenCoins, coinsStolen: (t.coinsStolen || 0) + stolenCoins };
          }
          if (t.id === target.id) return { ...t, coins: t.coins - stolenCoins };
          return t;
        });
        effects.push({ kind: 'toast', message: `👻 Boo stole ${stolenCoins} coins from ${target.name}!` });
      }
      break;
    }
    case 'king_boo':
    case 'boo_steal_10':
      effects.push({ kind: 'sound', sound: 'boo' });
      nextTeams = applyRivalCoinShuffle(nextTeams, drawingTeam.id, options?.coinTotals);
      effects.push({ kind: 'toast', message: '👑 KING BOO — SHUFFLE!' });
      break;
    case 'blue_shell': {
      effects.push({ kind: 'sound', sound: 'blueShell' });
      const maxCoins = Math.max(...nextTeams.map(t => t.coins));
      const leaders = nextTeams.filter(t => t.coins === maxCoins && t.coins > 0);
      nextTeams = nextTeams.map(t =>
        leaders.some(l => l.id === t.id) ? { ...t, skipNextCoinReward: true } : t
      );
      const names = leaders.map(l => l.name).join(', ') || '1st place';
      effects.push({ kind: 'toast', message: `🐢 BLUE SHELL! ${names} will skip their next coin reward!` });
      break;
    }
    case 'bowser_revolution': {
      effects.push({ kind: 'sound', sound: 'bowser' });
      const target = options?.targetTeamId
        ? nextTeams.find(t => t.id === options.targetTeamId)
        : nextTeams.find(t => t.id !== drawingTeam.id);
      if (target && target.id !== drawingTeam.id) {
        const activeCoins = drawingTeam.coins;
        const targetCoins = target.coins;
        nextTeams = nextTeams.map(t => {
          if (t.id === drawingTeam.id) return { ...t, coins: targetCoins };
          if (t.id === target.id) return { ...t, coins: activeCoins };
          return t;
        });
        effects.push({
          kind: 'toast',
          message: `💥 BOWSER'S REVOLUTION! ${drawingTeam.name} swapped with ${target.name}!`,
        });
      }
      break;
    }
    case 'bowser_fury':
      effects.push({ kind: 'sound', sound: 'bowserFury' });
      nextTeams = nextTeams.map(t => (t.id !== drawingTeam.id ? { ...t, coins: t.coins - 5 } : t));
      effects.push({ kind: 'toast', message: '🔥 BOWSER\'S FURY! -5 coins to every rival!' });
      break;
    default:
      break;
  }

  nextTeams = nextTeams.map(t =>
    t.id === drawingTeam.id ? { ...t, streak: t.streak + 1 } : t
  );

  return { teams: nextTeams, endsRound, effects };
}
