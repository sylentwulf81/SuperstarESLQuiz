import { RewardCard, RewardCardActionOptions, Team } from '@/shared/types';
import { EngineEffect, EngineSound } from '@/shared/engineFx';

export function applyTurnBasedCard(
  teams: Team[],
  activeTeam: Team,
  card: RewardCard,
  options: RewardCardActionOptions
): { teams: Team[]; keepTurn: boolean; effects: EngineEffect[] } {
  const effects: EngineEffect[] = [];
  let keepTurn = false;
  let nextTeams = [...teams];

  const coinToast = (sound: EngineSound, message: string, amount: number) => {
    effects.push({ kind: 'sound', sound });
    nextTeams = nextTeams.map(t => t.id === activeTeam.id ? { ...t, coins: t.coins + amount } : t);
    effects.push({ kind: 'toast', message });
  };

  switch (card.type) {
    case 'great_coins_3':
    case 'coins_3':
      coinToast('coin', `🪙 Great! +3 Coins awarded to ${activeTeam.name}!`, 3);
      break;
    case 'wonderful_coins_5':
    case 'coins_5':
      coinToast('coin', `⭐ Wonderful! +5 Coins awarded to ${activeTeam.name}!`, 5);
      break;
    case 'super_coins_10':
    case 'coins_10':
      coinToast('starCoin', `🏆 SUPER! Massive Jackpot: +10 Coins to ${activeTeam.name}!`, 10);
      break;
    case 'coins_1':
      coinToast('coin', `🪙 ${activeTeam.name} gained +1 Coin!`, 1);
      break;
    case 'pow_block':
    case 'hidden_block': {
      effects.push({ kind: 'sound', sound: 'powBlock' });
      const choice = options.powChoice || 'highest';
      const allCoins = nextTeams.map(t => t.coins);
      const targetEqualized = choice === 'highest' ? Math.max(...allCoins) : Math.min(...allCoins);
      nextTeams = nextTeams.map(t => ({ ...t, coins: targetEqualized }));
      effects.push({
        kind: 'toast',
        message: `💥 POW BLOCK! All teams' coins equalized to the ${choice.toUpperCase()} score (${targetEqualized} Coins)!`,
      });
      break;
    }
    case 'super_star_x2':
    case 'mushroom_x2':
      effects.push({ kind: 'sound', sound: 'powerUp' });
      nextTeams = nextTeams.map(t => t.id === activeTeam.id ? { ...t, hasDoubleTurn: true } : t);
      effects.push({ kind: 'toast', message: `🍄 SUPER MUSHROOM! ${activeTeam.name} takes another turn!` });
      keepTurn = true;
      break;
    case 'ghost_steal_5':
    case 'boo_steal_5': {
      effects.push({ kind: 'sound', sound: 'boo' });
      const stolenCoins = options.dieRoll || 5;
      const target = options.targetTeamId
        ? nextTeams.find(t => t.id === options.targetTeamId)
        : [...nextTeams.filter(t => t.id !== activeTeam.id)].sort((a, b) => b.coins - a.coins)[0];

      if (target) {
        nextTeams = nextTeams.map(t => {
          if (t.id === activeTeam.id) {
            return { ...t, coins: t.coins + stolenCoins, coinsStolen: (t.coinsStolen || 0) + stolenCoins };
          }
          if (t.id === target.id) {
            return { ...t, coins: t.coins - stolenCoins };
          }
          return t;
        });
        const targetCoinsAfter = target.coins - stolenCoins;
        effects.push({
          kind: 'toast',
          message: targetCoinsAfter < 0
            ? `👻 BOO STEAL! Rolled a ${stolenCoins}! ${activeTeam.name} stole ${stolenCoins} coins from ${target.name} (now at ${targetCoinsAfter} in red)!`
            : `👻 BOO STEAL! Rolled a ${stolenCoins}! ${activeTeam.name} stole ${stolenCoins} coins from ${target.name}!`,
        });
      } else {
        nextTeams = nextTeams.map(t => t.id === activeTeam.id ? { ...t, coins: t.coins + stolenCoins } : t);
        effects.push({ kind: 'toast', message: `👻 Boo awarded +${stolenCoins} coins to ${activeTeam.name}!` });
      }
      break;
    }
    case 'king_boo':
    case 'boo_steal_10': {
      effects.push({ kind: 'sound', sound: 'boo' });
      const dieValue = options.dieRoll || 5;
      const rivals = nextTeams.filter(t => t.id !== activeTeam.id);
      const totalStolen = dieValue * rivals.length;
      nextTeams = nextTeams.map(t => {
        if (t.id === activeTeam.id) {
          return { ...t, coins: t.coins + totalStolen, coinsStolen: (t.coinsStolen || 0) + totalStolen };
        }
        return { ...t, coins: t.coins - dieValue };
      });
      effects.push({
        kind: 'toast',
        message: `👑 KING BOO! Rolled a ${dieValue}! Stole ${dieValue} coins from EACH rival team (+${totalStolen} coins total)!`,
      });
      break;
    }
    case 'blue_shell': {
      effects.push({ kind: 'sound', sound: 'blueShell' });
      const rivals = nextTeams.filter(t => t.id !== activeTeam.id);
      const targetLeader = rivals.length > 0
        ? [...rivals].sort((a, b) => b.coins - a.coins)[0]
        : null;
      if (targetLeader) {
        nextTeams = nextTeams.map(t => t.id === targetLeader.id ? { ...t, skipTurns: (t.skipTurns || 0) + 1 } : t);
        effects.push({
          kind: 'toast',
          message: `🐢💥 BLUE SHELL! The leading team (${targetLeader.name}) was hit and will skip 1 round!`,
        });
      } else {
        effects.push({ kind: 'toast', message: '🐢 Blue Shell launched! No rival team to target.' });
      }
      break;
    }
    case 'bowser_revolution': {
      effects.push({ kind: 'sound', sound: 'bowser' });
      const targetId = options.targetTeamId;
      const target = targetId ? nextTeams.find(t => t.id === targetId) : null;
      if (target && target.id !== activeTeam.id) {
        const activeCoins = activeTeam.coins;
        const targetCoins = target.coins;
        nextTeams = nextTeams.map(t => {
          if (t.id === activeTeam.id) return { ...t, coins: targetCoins };
          if (t.id === target.id) return { ...t, coins: activeCoins };
          return t;
        });
        effects.push({
          kind: 'toast',
          message: `💥 BOWSER'S REVOLUTION! ${activeTeam.name} swapped coins with ${target.name}! (${activeCoins} ⮂ ${targetCoins})`,
        });
      } else {
        const rivals = nextTeams.filter(t => t.id !== activeTeam.id);
        if (rivals.length > 0) {
          const randRival = rivals[0];
          const activeCoins = activeTeam.coins;
          const targetCoins = randRival.coins;
          nextTeams = nextTeams.map(t => {
            if (t.id === activeTeam.id) return { ...t, coins: targetCoins };
            if (t.id === randRival.id) return { ...t, coins: activeCoins };
            return t;
          });
          effects.push({
            kind: 'toast',
            message: `💥 BOWSER'S REVOLUTION! ${activeTeam.name} swapped coins with ${randRival.name}! (${activeCoins} ⮂ ${targetCoins})`,
          });
        }
      }
      break;
    }
    case 'bowser_fury':
      effects.push({ kind: 'sound', sound: 'bowserFury' });
      nextTeams = nextTeams.map(t => t.id !== activeTeam.id ? { ...t, coins: t.coins - 5 } : t);
      effects.push({ kind: 'toast', message: '🔥 BOWSER\'S FURY! -5 coins inflicted on all rival teams!' });
      break;
    default:
      break;
  }

  return { teams: nextTeams, keepTurn, effects };
}
