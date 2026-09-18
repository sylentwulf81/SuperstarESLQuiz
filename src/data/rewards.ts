import { RewardCard } from '../types';
import { shuffleArray } from '../utils/shuffle';

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
    description: 'Fires the dreaded Blue Shell at the leading team! The #1 team skips their next turn!',
    iconName: 'ShieldAlert',
    badgeColor: 'from-sky-500 via-blue-600 to-indigo-700 text-white',
  },
  {
    id: 'bowser_revolution',
    type: 'bowser_revolution',
    title: "Bowser's Revolution",
    subtitle: 'Swap Coin Totals with a Rival!',
    coins: 0,
    description: 'Bowser causes chaos! Choose any rival team and swap your total coins with theirs!',
    iconName: 'Flame',
    badgeColor: 'from-red-600 via-orange-600 to-amber-700 text-white',
  },
  {
    id: 'bowser_fury',
    type: 'bowser_fury',
    title: "Bowser's Fury",
    subtitle: '-5 Coins to All Rivals!',
    coins: 0,
    description: 'Bowser unleashes raging fireballs across the board! -5 coins to each and every other team!',
    iconName: 'Flame',
    badgeColor: 'from-amber-600 via-red-700 to-red-950 text-amber-200',
  },
];

/**
 * Generate 6 randomized mystery cards for the reward roulette from the full 10-card pool
 */
export function generateRouletteCards(): RewardCard[] {
  return shuffleArray(REWARD_CARDS).slice(0, 6);
}
