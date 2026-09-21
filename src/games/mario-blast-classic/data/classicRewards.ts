import { RewardCard, RewardCardType, Team } from '@/shared/types';
import { REWARD_CARDS, isCatchUpRestrictedTeam } from '@/games/mario-party-quiz/data/rewards';
import { shuffleArray } from '@/shared/utils/shuffle';

export const CLASSIC_ROUND_ENDER_TYPES: RewardCardType[] = ['gold_star', 'bowser_revolution', 'bowser_fury'];
export const CLASSIC_ACTION_TYPES: RewardCardType[] = ['gold_star', 'bowser_revolution', 'bowser_fury', 'mystery_blocks'];

const CLASSIC_OVERRIDES: Partial<Record<RewardCardType, Partial<RewardCard>>> = {
  super_star_x2: {
    title: 'Super Mushroom',
    subtitle: 'Double Your Next Coin Card!',
    description:
      'Queue a Mega Mushroom! The next coin card this team claims is doubled — even if they did not pick the question — then the boost is used up.',
  },
  mushroom_x2: {
    title: 'Super Mushroom',
    subtitle: 'Double Your Next Coin Card!',
    description:
      'Queue a Mega Mushroom! The next coin card this team claims is doubled — even if they did not pick the question — then the boost is used up.',
  },
  blue_shell: {
    title: 'Blue Shell',
    subtitle: '1st Place Skips Next Coin Reward!',
    description:
      'Catch-up item (rare for 1st place). Launch a Blue Shell at the leading team! They skip their next coin payout.',
  }, // parked copy — Classic pool currently excludes this type
  bowser_revolution: {
    subtitle: 'Swap Coins — Then Round Over!',
    description:
      'Catch-up Action Card. Choose any rival and swap your total coins with theirs. After the swap, the round ends!',
  },
  bowser_fury: {
    subtitle: '-5 to Rivals — Then Round Over!',
    description:
      "Catch-up Action Card. Bowser scorches every rival for -5 coins. After the blast, the round ends!",
  },
  king_boo: {
    subtitle: 'Shuffle the Other Teams’ Coins!',
    description:
      'King Boo scrambles every rival’s coin total. Your coins stay put!',
  },
  boo_steal_10: {
    subtitle: 'Shuffle the Other Teams’ Coins!',
    description:
      'King Boo scrambles every rival’s coin total. Your coins stay put!',
  },
};

const GOLD_STAR: RewardCard = {
  id: 'gold_star',
  type: 'gold_star',
  title: 'Gold Star',
  subtitle: '+15 Coins — Round Over!',
  coins: 15,
  description: 'A rare Super Star! Bank +15 coins immediately, then this question round ends.',
  iconName: 'Star',
  badgeColor: 'from-yellow-300 via-amber-400 to-orange-500 text-amber-950',
};

const MYSTERY_BLOCKS: RewardCard = {
  id: 'mystery_blocks',
  type: 'mystery_blocks',
  title: 'Mystery Blocks',
  subtitle: 'Hit 1 of 3 ? Blocks!',
  coins: 0,
  description:
    'Action Card! Choose 1 of 3 mystery blocks: Treasure (10–15 coins), 0 coins, or a Piranha Plant that ends the round!',
  iconName: 'BoxSelect',
  badgeColor: 'from-amber-500 via-yellow-600 to-orange-800 text-amber-50',
};

const BLOOPER: RewardCard = {
  id: 'blooper',
  type: 'blooper',
  title: 'Blooper',
  subtitle: 'Ink a Team — Next Coins = 1!',
  coins: 0,
  description:
    'Squirt ink on a rival! Their next coin card pays only 1 coin — even a Gold Star or Treasure haul.',
  iconName: 'Droplets',
  badgeColor: 'from-indigo-800 via-blue-950 to-slate-950 text-indigo-100',
};

/** Classic pool only — Party Quiz still draws Blue Shell and POW. */
const CLASSIC_DISABLED_TYPES: RewardCardType[] = ['blue_shell', 'pow_block', 'hidden_block'];

const CLASSIC_TEST_DECK_TYPES: RewardCardType[] = [
  'blooper',
  'king_boo',
  'super_star_x2',
  'bowser_revolution',
  'mystery_blocks',
  'gold_star',
];

const TEST_GAME_STORAGE_KEY = 'mp_classic_test_game_v1';

export function loadClassicTestGame(): boolean {
  try {
    return localStorage.getItem(TEST_GAME_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function persistClassicTestGame(on: boolean) {
  try {
    localStorage.setItem(TEST_GAME_STORAGE_KEY, String(on));
  } catch {
    // LocalStorage full or blocked
  }
}

export function dealClassicTestCards(): RewardCard[] {
  const byType = new Map(CLASSIC_REWARD_CARDS.map(card => [card.type, card]));
  return shuffleArray(
    CLASSIC_TEST_DECK_TYPES.map((type, i) => {
      const pick = byType.get(type) || CLASSIC_REWARD_CARDS[0];
      return { ...pick, id: `${pick.type}_test_${Date.now()}_${i}` };
    })
  );
}

export function fillClassicTestSlots<T extends { card?: RewardCard; claimedByTeamId?: string }>(slots: T[]): T[] {
  const deck = dealClassicTestCards();
  let i = 0;
  return slots.map(slot => {
    if (slot.claimedByTeamId || slot.card) return slot;
    const next = deck[i++];
    return next ? { ...slot, card: next } : slot;
  });
}

export const CLASSIC_REWARD_CARDS: RewardCard[] = [
  ...REWARD_CARDS.filter(card => !CLASSIC_DISABLED_TYPES.includes(card.type)).map(card => {
    const override = CLASSIC_OVERRIDES[card.type];
    return override ? { ...card, ...override } : card;
  }),
  GOLD_STAR,
  MYSTERY_BLOCKS,
  BLOOPER,
];

const BASE_WEIGHTS: Partial<Record<RewardCardType, number>> = {
  great_coins_3: 22,
  coins_3: 22,
  wonderful_coins_5: 20,
  coins_5: 20,
  super_coins_10: 12,
  coins_10: 12,
  blooper: 10,
  ghost_steal_5: 10,
  boo_steal_5: 10,
  king_boo: 6,
  boo_steal_10: 6,
  super_star_x2: 12,
  mushroom_x2: 12,
  bowser_fury: 6,
  bowser_revolution: 4,
  mystery_blocks: 4,
  gold_star: 3,
};

function weightFor(type: RewardCardType, isFirstPlace: boolean): number {
  if (CLASSIC_DISABLED_TYPES.includes(type)) return 0;
  const base = BASE_WEIGHTS[type] ?? 8;
  if (!isFirstPlace) return base;

  if (type === 'bowser_fury') return 0;
  if (CLASSIC_ACTION_TYPES.includes(type)) {
    return Math.max(1, Math.round(base * 0.25));
  }
  return base;
}

export function isClassicRoundEnder(type: RewardCardType): boolean {
  return CLASSIC_ROUND_ENDER_TYPES.includes(type);
}

export function drawClassicCard(teams: Team[], drawingTeamId: string): RewardCard {
  const isFirstPlace = isCatchUpRestrictedTeam(teams, drawingTeamId);
  const weighted = CLASSIC_REWARD_CARDS.flatMap(card => {
    const w = weightFor(card.type, isFirstPlace);
    return w > 0 ? Array.from({ length: w }, () => card) : [];
  });
  const pick = weighted[Math.floor(Math.random() * weighted.length)] || CLASSIC_REWARD_CARDS[0];
  return { ...pick, id: `${pick.type}_${Date.now()}_${Math.floor(Math.random() * 9999)}` };
}

export function applyCoinPayout(team: Team, amount: number): {
  team: Team;
  awarded: number;
  skipped: boolean;
  doubled: boolean;
  bloopered: boolean;
} {
  if (amount <= 0) {
    return { team, awarded: 0, skipped: false, doubled: false, bloopered: false };
  }
  if (team.skipNextCoinReward) {
    return {
      team: { ...team, skipNextCoinReward: false },
      awarded: 0,
      skipped: true,
      doubled: false,
      bloopered: false,
    };
  }
  if (team.blooperNextCoin) {
    return {
      team: {
        ...team,
        coins: team.coins + 1,
        blooperNextCoin: false,
        doubleNextCoinReward: false,
      },
      awarded: 1,
      skipped: false,
      doubled: false,
      bloopered: true,
    };
  }
  const doubled = Boolean(team.doubleNextCoinReward);
  const awarded = amount * (doubled ? 2 : 1);
  return {
    team: {
      ...team,
      coins: team.coins + awarded,
      doubleNextCoinReward: false,
    },
    awarded,
    skipped: false,
    doubled,
    bloopered: false,
  };
}

/** Reassign rival coin totals among themselves. The drawing team is never included. */
export function shuffleRivalCoinTotals(teams: Team[], drawingTeamId: string): Record<string, number> {
  const rivals = teams.filter(t => t.id !== drawingTeamId);
  const amounts = rivals.map(t => t.coins);
  if (rivals.length < 2) {
    return Object.fromEntries(rivals.map(t => [t.id, t.coins]));
  }

  const allSame = amounts.every(n => n === amounts[0]);
  let shuffled = shuffleArray(amounts);
  if (!allSame) {
    for (let i = 0; i < 16; i++) {
      const moved = rivals.some((t, idx) => t.coins !== shuffled[idx]);
      if (moved) break;
      shuffled = shuffleArray(amounts);
    }
  }

  return Object.fromEntries(rivals.map((t, i) => [t.id, shuffled[i]]));
}

export function applyRivalCoinShuffle(
  teams: Team[],
  drawingTeamId: string,
  totals?: Record<string, number>
): Team[] {
  const map =
    totals && Object.keys(totals).length > 0
      ? totals
      : shuffleRivalCoinTotals(teams, drawingTeamId);
  return teams.map(t => {
    if (t.id === drawingTeamId) return t;
    if (map[t.id] === undefined) return t;
    return { ...t, coins: map[t.id] };
  });
}

export type MysteryBlockOutcome =
  | { kind: 'treasure'; coins: number }
  | { kind: 'bust' }
  | { kind: 'piranha' };

export function shuffleMysteryBlockOutcomes(): MysteryBlockOutcome[] {
  const treasureCoins = 10 + Math.floor(Math.random() * 6);
  const outcomes: MysteryBlockOutcome[] = [
    { kind: 'treasure', coins: treasureCoins },
    { kind: 'bust' },
    { kind: 'piranha' },
  ];
  for (let i = outcomes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [outcomes[i], outcomes[j]] = [outcomes[j], outcomes[i]];
  }
  return outcomes;
}
