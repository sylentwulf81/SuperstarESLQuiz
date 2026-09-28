import { RewardCard, RewardCardType, Team } from '@/shared/types';
import { shuffleArray } from '@/shared/utils/shuffle';

/**
 * Catch-up / self-serving items that 1st place cannot draw, Mario Kart-style.
 * Blue Shell and the Bowser cards only ever help the drawer at rivals' expense;
 * King Boo and POW Block are included too since the leader could otherwise use
 * them to steal from or equalize down onto everyone else and pull further ahead.
 */
export const CATCH_UP_RESTRICTED_TYPES: RewardCardType[] = [
  'blue_shell',
  'bowser_revolution',
  'bowser_fury',
  'king_boo',
  'pow_block',
];

export function isCatchUpRestrictedTeam(teams: Team[], teamId: string): boolean {
  if (teams.length < 2) return false;
  const team = teams.find(t => t.id === teamId);
  if (!team) return false;
  const maxCoins = Math.max(...teams.map(t => t.coins));
  return team.coins === maxCoins;
}

const CATCH_UP_NOTE_STORAGE_KEY = 'mp_show_catchup_note_v2';

export function loadShowCatchUpNote(): boolean {
  try {
    return localStorage.getItem(CATCH_UP_NOTE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function persistShowCatchUpNote(show: boolean) {
  try {
    localStorage.setItem(CATCH_UP_NOTE_STORAGE_KEY, String(show));
  } catch {
    // LocalStorage full or blocked
  }
}

export const REWARD_CARDS: RewardCard[] = [
  {
    id: 'great_coins_3',
    type: 'great_coins_3',
    title: '+3 Coins',
    subtitle: 'Triple Coin Bounty!',
    coins: 3,
    description: 'Great job! Add +3 shiny gold coins directly to your team score!',
    iconName: 'Coins',
    badgeColor: 'from-amber-400 to-yellow-600 text-amber-950',
  },
  {
    id: 'pow_block',
    type: 'pow_block',
    title: 'POW Block',
    subtitle: 'Equalize Highest or Lowest!',
    coins: 0,
    description: 'Trigger a board-shaking seismic earthquake! Equalize all teams\' coins to either the HIGHEST or LOWEST score — your team\'s choice!',
    iconName: 'BoxSelect',
    badgeColor: 'from-blue-600 via-indigo-700 to-slate-900 text-blue-100',
  },
  {
    id: 'ghost_steal_5',
    type: 'ghost_steal_5',
    title: 'Boo',
    subtitle: 'Roll Die & Steal Coins!',
    coins: 0,
    description: 'Send Boo to a rival team of your choice! Roll a 6-sided die to steal that exact number of coins from them!',
    iconName: 'Ghost',
    badgeColor: 'from-indigo-100 via-purple-100 to-slate-200 text-slate-800',
  },
  {
    id: 'king_boo',
    type: 'king_boo',
    title: 'King Boo',
    subtitle: 'Steal from EACH Other Team!',
    coins: 0,
    description: 'The King of Ghosts strikes! Roll a 6-sided die and steal that number of coins from EACH and every rival team!',
    iconName: 'Crown',
    badgeColor: 'from-purple-900 via-fuchsia-950 to-slate-950 text-fuchsia-200',
  },
  {
    id: 'wonderful_coins_5',
    type: 'wonderful_coins_5',
    title: '+5 Coins',
    subtitle: 'Five Golden Coins!',
    coins: 5,
    description: 'Wonderful! Add +5 gleaming star coins to your team score!',
    iconName: 'Coins',
    badgeColor: 'from-yellow-400 via-amber-400 to-yellow-600 text-amber-950',
  },
  {
    id: 'super_star_x2',
    type: 'super_star_x2',
    title: 'Super Mushroom',
    subtitle: 'Take Another Turn!',
    coins: 0,
    description: 'Super Mushroom power-up! Take another turn immediately and choose another block!',
    iconName: 'Zap',
    badgeColor: 'from-red-500 via-rose-600 to-red-700 text-white',
  },
  {
    id: 'super_coins_10',
    type: 'super_coins_10',
    title: '+10 Coins',
    subtitle: 'Super Jackpot Haul!',
    coins: 10,
    description: 'Super haul! A massive treasure chest of +10 star coins!',
    iconName: 'Trophy',
    badgeColor: 'from-yellow-300 via-amber-500 to-orange-500 text-yellow-950',
  },
  {
    id: 'blue_shell',
    type: 'blue_shell',
    title: 'Blue Shell',
    subtitle: '1st Place Skips 1 Round!',
    coins: 0,
    description: 'Catch-up item (not drawn by 1st place). Fires the dreaded Blue Shell at the leading team! The #1 team skips their next turn!',
    iconName: 'ShieldAlert',
    badgeColor: 'from-sky-500 via-blue-600 to-indigo-700 text-white',
  },
  {
    id: 'bowser_revolution',
    type: 'bowser_revolution',
    title: "Bowser's Revolution",
    subtitle: 'Swap Coin Totals with a Rival!',
    coins: 0,
    description: 'Catch-up item (not drawn by 1st place). Bowser causes chaos! Choose any rival team and swap your total coins with theirs!',
    iconName: 'Flame',
    badgeColor: 'from-red-600 via-orange-600 to-amber-700 text-white',
  },
  {
    id: 'bowser_fury',
    type: 'bowser_fury',
    title: "Bowser's Fury",
    subtitle: '-5 Coins to All Rivals!',
    coins: 0,
    description: 'Catch-up item (not drawn by 1st place). Bowser unleashes raging fireballs across the board! -5 coins to each and every other team!',
    iconName: 'Flame',
    badgeColor: 'from-amber-600 via-red-700 to-red-950 text-amber-200',
  },
];

/**
 * Rarity weights for the roulette pool — higher weight means more likely to land
 * among the 6 revealed cards, but nothing is guaranteed. Plain coin payouts are
 * weighted as the common/primary draw; steal, swap, and equalize cards are
 * progressively rarer so a full round of them is possible but uncommon.
 */
const REWARD_WEIGHTS: Partial<Record<RewardCardType, number>> = {
  great_coins_3: 10,
  wonderful_coins_5: 10,
  super_coins_10: 6,
  super_star_x2: 6,
  pow_block: 3,
  ghost_steal_5: 3,
  king_boo: 1,
  blue_shell: 1,
  bowser_revolution: 1,
  bowser_fury: 1,
};

function weightOf(card: RewardCard): number {
  return REWARD_WEIGHTS[card.type] ?? 1;
}

/** Weighted sampling without replacement: each pick favors higher-weight cards,
 * but every remaining card always has some (never-zero) chance. */
function weightedSample(pool: RewardCard[], count: number): RewardCard[] {
  const remaining = [...pool];
  const picked: RewardCard[] = [];
  const n = Math.min(count, remaining.length);
  for (let i = 0; i < n; i++) {
    const total = remaining.reduce((sum, card) => sum + weightOf(card), 0);
    let roll = Math.random() * total;
    let idx = remaining.length - 1;
    for (let j = 0; j < remaining.length; j++) {
      roll -= weightOf(remaining[j]);
      if (roll <= 0) {
        idx = j;
        break;
      }
    }
    picked.push(remaining[idx]);
    remaining.splice(idx, 1);
  }
  return picked;
}

/**
 * Generate 6 weighted mystery cards for the reward roulette from the 10-card pool.
 * Plain coin cards are heavily favored as the common draw. The current 1st-place
 * team (tied or unique) cannot draw Blue Shell, Bowser's Revolution, Bowser's Fury,
 * King Boo, or POW Block — all catch-up/self-serving cards that would either hurt
 * rivals for free or let the leader pull further ahead.
 */
export function generateRouletteCards(teams?: Team[], drawingTeamId?: string): RewardCard[] {
  const restrictCatchUp = Boolean(
    teams && drawingTeamId && isCatchUpRestrictedTeam(teams, drawingTeamId)
  );
  const pool = restrictCatchUp
    ? REWARD_CARDS.filter(card => !CATCH_UP_RESTRICTED_TYPES.includes(card.type))
    : REWARD_CARDS;
  return shuffleArray(weightedSample(pool, 6));
}
