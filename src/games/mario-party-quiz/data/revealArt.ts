import { CHARACTERS } from '@/games/mario-party-quiz/data/characters';
import { RewardCardType } from '@/shared/types';

const ART = {
  coins: '/assets/effects/reveal_supercoins.jpg',
  mushroom: '/assets/effects/reveal_mariopblock.jpg',
  goldStar: '/assets/effects/reveal_supercoins.jpg',
  blooper: '/assets/effects/reveal_blooperink.jpg',
  piranha: '/assets/effects/reveal_piranhaplant.jpg',
  nabbit: '/assets/effects/reveal_nabbit.jpg',
  bowserRevolution: '/assets/effects/reveal_bowserrevolution.jpg',
  bowserFury: '/assets/effects/reveal_bowsersfury.jpg',
  boo: '/assets/effects/reveal_boo.jpg',
  kingBoo: '/assets/effects/reveal_kingboo.jpeg',
} as const;

const REVEAL_ART_BY_TYPE: Partial<Record<RewardCardType, string>> = {
  great_coins_3: ART.coins,
  coins_1: ART.coins,
  coins_3: ART.coins,
  wonderful_coins_5: ART.coins,
  coins_5: ART.coins,
  super_coins_10: ART.coins,
  coins_10: ART.coins,
  gold_star: ART.goldStar,
  mystery_blocks: ART.coins,
  blooper: ART.blooper,
  super_star_x2: ART.mushroom,
  mushroom_x2: ART.mushroom,
  bowser_revolution: ART.bowserRevolution,
  bowser_fury: ART.bowserFury,
  king_boo: ART.kingBoo,
  boo_steal_10: ART.kingBoo,
  ghost_steal_5: ART.boo,
  boo_steal_5: ART.boo,
};

export const PIRANHA_REVEAL_ART = ART.piranha;
export const NABBIT_REVEAL_ART = ART.nabbit;

export const TREASURE_BLOCK_BACKS = [
  '/assets/effects/treasureblock_red.jpeg',
  '/assets/effects/treasureblock_yellow.jpeg',
  '/assets/effects/treasureblock_green.jpeg',
  '/assets/effects/treasureblock_blue.jpeg',
] as const;

export function pickMysteryBlockBacks(count: number): string[] {
  const deck = [...TREASURE_BLOCK_BACKS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return Array.from({ length: count }, (_, i) => deck[i % deck.length]);
}

export function getRevealArt(type: RewardCardType): string | undefined {
  return REVEAL_ART_BY_TYPE[type];
}

const ALL_REVEAL_URLS: readonly string[] = [
  ...Object.values(ART),
  ...TREASURE_BLOCK_BACKS,
  ...Object.values(CHARACTERS).map(c => c.imageUrl).filter(Boolean),
];

const preloadedArt = new Map<string, HTMLImageElement>();

/** Decode card art and team avatars once so flips do not wait on the network. */
export function preloadRevealArt() {
  if (typeof window === 'undefined') return;
  for (const src of ALL_REVEAL_URLS) {
    if (preloadedArt.has(src)) continue;
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    img.decode?.().catch(() => {});
    preloadedArt.set(src, img);
  }
}
