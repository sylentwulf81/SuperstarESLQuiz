import { RewardCardType } from '@/shared/types';

const ART = {
  coins: '/assets/effects/reveal_mariocoins.jpeg',
  mushroom: '/assets/effects/reveal_mariosupermushroom.jpeg',
  bowserRevolution: '/assets/effects/reveal_bowserrevolution.jpeg',
  bowserFury: '/assets/effects/reveal_bowsersfury.jpeg',
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
  gold_star: ART.coins,
  mystery_blocks: ART.coins,
  super_star_x2: ART.mushroom,
  mushroom_x2: ART.mushroom,
  bowser_revolution: ART.bowserRevolution,
  bowser_fury: ART.bowserFury,
  king_boo: ART.kingBoo,
  boo_steal_10: ART.kingBoo,
  ghost_steal_5: ART.kingBoo,
  boo_steal_5: ART.kingBoo,
};

export function getRevealArt(type: RewardCardType): string | undefined {
  return REVEAL_ART_BY_TYPE[type];
}
