import { RewardCard, RewardCardType, Team } from '@/shared/types';
import { REWARD_CARDS, isCatchUpRestrictedTeam } from '@/games/mario-party-quiz/data/rewards';

export const CLASSIC_ROUND_ENDER_TYPES: RewardCardType[] = ['gold_star', 'bowser_revolution', 'bowser_fury'];
export const CLASSIC_ACTION_TYPES: RewardCardType[] = ['gold_star', 'bowser_revolution', 'bowser_fury', 'mystery_blocks'];

const CLASSIC_OVERRIDES: Partial<Record<RewardCardType, Partial<RewardCard>>> = {
  super_star_x2: {
    title: 'Super Mushroom',
    subtitle: 'Double Your Next Coin Reward!',
    description:
      'Queue a Mega Mushroom! The next time this team earns coins from a card, that payout is doubled — then the boost is used up.',
  },
  mushroom_x2: {
    title: 'Super Mushroom',
    subtitle: 'Double Your Next Coin Reward!',
    description:
      'Queue a Mega Mushroom! The next time this team earns coins from a card, that payout is doubled — then the boost is used up.',
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

/** Classic pool only — Party Quiz still draws Blue Shell. */
const CLASSIC_DISABLED_TYPES: RewardCardType[] = ['blue_shell'];

export const CLASSIC_REWARD_CARDS: RewardCard[] = [
  ...REWARD_CARDS.filter(card => !CLASSIC_DISABLED_TYPES.includes(card.type)).map(card => {
    const override = CLASSIC_OVERRIDES[card.type];
    return override ? { ...card, ...override } : card;
  }),
  GOLD_STAR,
  MYSTERY_BLOCKS,
];

const BASE_WEIGHTS: Partial<Record<RewardCardType, number>> = {
  great_coins_3: 22,
  coins_3: 22,
  wonderful_coins_5: 20,
  coins_5: 20,
  super_coins_10: 12,
  coins_10: 12,
  pow_block: 10,
  hidden_block: 10,
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

export function applyCoinPayout(team: Team, amount: number): { team: Team; awarded: number; skipped: boolean; doubled: boolean } {
  if (amount <= 0) {
    return { team, awarded: 0, skipped: false, doubled: false };
  }
  if (team.skipNextCoinReward) {
    return {
      team: { ...team, skipNextCoinReward: false },
      awarded: 0,
      skipped: true,
      doubled: false,
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
  };
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
