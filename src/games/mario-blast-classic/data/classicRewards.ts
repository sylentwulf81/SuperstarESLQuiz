import { RewardCard, RewardCardType, Team } from '@/shared/types';
import { REWARD_CARDS, isCatchUpRestrictedTeam } from '@/games/mario-party-quiz/data/rewards';
import { shuffleArray } from '@/shared/utils/shuffle';

export const CLASSIC_ROUND_ENDER_TYPES: RewardCardType[] = ['gold_star', 'bowser_revolution', 'bowser_fury'];

/** Face-down catch-up / chaos actions — 1st place still soft-restricted at pick time. */
export const CLASSIC_CATCH_UP_TYPES: RewardCardType[] = ['bowser_revolution', 'bowser_fury'];

/** Interactive / chaos cards (not straight coin payouts). */
export const CLASSIC_ACTION_CARD_TYPES: RewardCardType[] = [
  'blooper',
  'ghost_steal_5',
  'boo_steal_5',
  'king_boo',
  'boo_steal_10',
  'super_star_x2',
  'mushroom_x2',
  'bowser_revolution',
  'bowser_fury',
  'mystery_blocks',
];

/** King Boo + Bowser cards — odds rise with board progress and relative coin wealth. */
export const CLASSIC_ESCALATION_TYPES: RewardCardType[] = [
  'king_boo',
  'bowser_revolution',
  'bowser_fury',
];

/** @deprecated Prefer CLASSIC_ACTION_CARD_TYPES / CLASSIC_CATCH_UP_TYPES */
export const CLASSIC_ACTION_TYPES: RewardCardType[] = [
  'gold_star',
  'bowser_revolution',
  'bowser_fury',
  'mystery_blocks',
];

const CLASSIC_OVERRIDES: Partial<Record<RewardCardType, Partial<RewardCard>>> = {
  super_star_x2: {
    title: 'Super Mushroom',
    subtitle: 'Pick 1 of 3 Super Cards — then ×2!',
    description:
      'Pick 1 of 3 super-cards worth 2, 3, 5, or 7 coins. That amount is doubled immediately — it is not saved for later.',
  },
  mushroom_x2: {
    title: 'Super Mushroom',
    subtitle: 'Pick 1 of 3 Super Cards — then ×2!',
    description:
      'Pick 1 of 3 super-cards worth 2, 3, 5, or 7 coins. That amount is doubled immediately — it is not saved for later.',
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

export function dealClassicTestCards(slotCount = 6): RewardCard[] {
  const byType = new Map(CLASSIC_REWARD_CARDS.map(card => [card.type, card]));
  const types = [...CLASSIC_TEST_DECK_TYPES];
  while (types.length < slotCount) {
    types.push('great_coins_3');
  }
  return shuffleArray(
    types.slice(0, slotCount).map((type, i) => {
      const pick = byType.get(type) || CLASSIC_REWARD_CARDS[0];
      return { ...pick, id: `${pick.type}_test_${Date.now()}_${i}` };
    })
  );
}

export function fillClassicTestSlots<T extends { card?: RewardCard; claimedByTeamId?: string }>(slots: T[]): T[] {
  const deck = dealClassicTestCards(slots.length);
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

const byType = () => new Map(CLASSIC_REWARD_CARDS.map(card => [card.type, card]));

function cloneCard(type: RewardCardType, tag: string): RewardCard {
  const pick = byType().get(type) || CLASSIC_REWARD_CARDS[0];
  return { ...pick, id: `${pick.type}_${tag}_${Date.now()}_${Math.floor(Math.random() * 9999)}` };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * 0–1 “game heat” from board progress + relative coin wealth.
 * Soft targets scale with progress so 2–3 team games still heat up without huge totals.
 */
export function classicGameHeat(
  teams: Team[],
  openedCount: number,
  totalBlocks: number
): number {
  const board = totalBlocks > 0 ? openedCount / totalBlocks : 0;
  const n = Math.max(1, teams.length);
  const totalCoins = teams.reduce((sum, t) => sum + Math.max(0, t.coins), 0);
  const avgCoins = totalCoins / n;
  const maxCoins = Math.max(0, ...teams.map(t => t.coins));
  // Soft “busy game” average: ~3 early → ~25 late
  const expectedAvg = 3 + board * 22;
  const coinByLevel = clamp01(avgCoins / Math.max(1, expectedAvg));
  const leadByLevel = clamp01(maxCoins / Math.max(1, expectedAvg * 1.35));
  const coinHeat = 0.65 * coinByLevel + 0.35 * leadByLevel;
  return clamp01(0.5 * board + 0.5 * coinHeat);
}

/** Plain coin payouts — the bulk of every round (~70% of slots). */
const COIN_DEAL_WEIGHTS: Partial<Record<RewardCardType, number>> = {
  great_coins_3: 38,
  wonderful_coins_5: 32,
  super_coins_10: 18,
  // Rare round-ender treated as a coin haul, not an “action”
  gold_star: 2,
};

const REGULAR_ACTION_WEIGHTS: Partial<Record<RewardCardType, number>> = {
  super_star_x2: 28,
  ghost_steal_5: 24,
  blooper: 24,
  mystery_blocks: 16,
};

function pickWeightedType(
  weights: Partial<Record<RewardCardType, number>>,
  exclude: Set<RewardCardType> = new Set()
): RewardCardType {
  const entries = Object.entries(weights).filter(
    ([type, w]) => (w ?? 0) > 0 && !exclude.has(type as RewardCardType)
  ) as [RewardCardType, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  if (total <= 0) return 'great_coins_3';
  let roll = Math.random() * total;
  for (const [type, w] of entries) {
    roll -= w;
    if (roll <= 0) return type;
  }
  return entries[0][0];
}

/** ~70% coin / ~30% action across the table (usually 1–2 actions). */
function pickActionCountForRound(slotCount: number): number {
  const target = Math.round(slotCount * 0.3); // 2 for 6–7 cards, 2 for 8
  const r = Math.random();
  if (r < 0.1) return Math.max(0, target - 1); // sometimes lean coin-heavier
  if (r < 0.85) return Math.min(2, Math.max(1, target));
  return Math.min(2, target + 1);
}

function pickEscalationType(heat: number): RewardCardType {
  const weights: Partial<Record<RewardCardType, number>> = {
    king_boo: 40,
    bowser_fury: Math.round(12 + heat * 28),
    bowser_revolution: Math.round(8 + heat * 32),
  };
  return pickWeightedType(weights);
}

/**
 * Pre-deal a round’s face-down cards: mostly coins, about 1–2 actions.
 * King Boo / Bowser odds rise with game heat — never guaranteed.
 */
export function dealClassicRoundCards(opts: {
  slotCount: number;
  teams: Team[];
  openedCount: number;
  totalBlocks: number;
}): RewardCard[] {
  const { slotCount, teams, openedCount, totalBlocks } = opts;
  const heat = classicGameHeat(teams, openedCount, totalBlocks);
  const actionTarget = Math.min(pickActionCountForRound(slotCount), slotCount);
  const used = new Set<RewardCardType>();
  const types: RewardCardType[] = [];

  // Chance an action slot is an escalation card: ~6% cold → ~48% hot (never 100%).
  const escalationChance = 0.06 + heat * 0.42;

  for (let i = 0; i < actionTarget; i++) {
    let type: RewardCardType;
    if (Math.random() < escalationChance) {
      type = pickEscalationType(heat);
    } else {
      type = pickWeightedType(REGULAR_ACTION_WEIGHTS, used);
    }
    // Prefer unique actions in the same round when possible
    if (used.has(type) && CLASSIC_ACTION_CARD_TYPES.includes(type)) {
      type = pickWeightedType(REGULAR_ACTION_WEIGHTS, used);
    }
    used.add(type);
    types.push(type);
  }

  while (types.length < slotCount) {
    types.push(pickWeightedType(COIN_DEAL_WEIGHTS));
  }

  return shuffleArray(types.map((type, i) => cloneCard(type, `round_${i}`)));
}

export function fillClassicRoundSlots<T extends { card?: RewardCard; claimedByTeamId?: string }>(
  slots: T[],
  teams: Team[],
  openedCount: number,
  totalBlocks: number
): T[] {
  const deck = dealClassicRoundCards({
    slotCount: slots.length,
    teams,
    openedCount,
    totalBlocks,
  });
  let i = 0;
  return slots.map(slot => {
    if (slot.claimedByTeamId) return slot;
    const next = deck[i++];
    return next ? { ...slot, card: next } : slot;
  });
}

const BASE_WEIGHTS: Partial<Record<RewardCardType, number>> = {
  great_coins_3: 38,
  coins_3: 38,
  wonderful_coins_5: 32,
  coins_5: 32,
  super_coins_10: 18,
  coins_10: 18,
  blooper: 5,
  ghost_steal_5: 5,
  boo_steal_5: 5,
  king_boo: 3,
  boo_steal_10: 3,
  super_star_x2: 6,
  mushroom_x2: 6,
  bowser_fury: 2,
  bowser_revolution: 2,
  mystery_blocks: 4,
  gold_star: 3,
};

function weightFor(type: RewardCardType, isFirstPlace: boolean): number {
  if (CLASSIC_DISABLED_TYPES.includes(type)) return 0;
  const base = BASE_WEIGHTS[type] ?? 8;
  if (!isFirstPlace) return base;

  if (CLASSIC_CATCH_UP_TYPES.includes(type)) return 0;
  if (CLASSIC_ACTION_CARD_TYPES.includes(type)) {
    return Math.max(1, Math.round(base * 0.35));
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

/** If 1st place opens a pre-dealt catch-up card, swap it for a coin card. */
export function resolveClassicSlotCard(
  card: RewardCard,
  teams: Team[],
  drawingTeamId: string
): RewardCard {
  if (!isCatchUpRestrictedTeam(teams, drawingTeamId)) return card;
  if (!CLASSIC_CATCH_UP_TYPES.includes(card.type)) return card;
  return cloneCard(pickWeightedType(COIN_DEAL_WEIGHTS), 'catchup_swap');
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

export const SUPER_MUSHROOM_AMOUNTS = [2, 3, 5, 7] as const;
export type SuperMushroomOffer = (typeof SUPER_MUSHROOM_AMOUNTS)[number];

/** Three distinct super-cards from 2 / 3 / 5 / 7. Payout is that amount ×2. */
export function shuffleSuperMushroomOffers(): SuperMushroomOffer[] {
  return shuffleArray([...SUPER_MUSHROOM_AMOUNTS]).slice(0, 3);
}
