import { RewardCard } from '../types';

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
    id: 'hidden_block',
    type: 'hidden_block',
    title: 'Hidden Block',
    subtitle: '+7 Bonus Coins!',
    coins: 7,
    description: 'You uncovered an invisible hidden block with +7 secret bonus coins!',
    iconName: 'Gift',
    badgeColor: 'from-amber-700 via-amber-600 to-yellow-700 text-amber-100',
  },
  {
    id: 'ghost_steal_5',
    type: 'ghost_steal_5',
    title: 'Boo Steal',
    subtitle: 'Steal 5 Coins from a Team!',
    coins: 5,
    description: 'Send Boo to haunt an opponent team and steal 5 coins for your squad!',
    iconName: 'Ghost',
    badgeColor: 'from-indigo-100 via-purple-100 to-slate-200 text-slate-800',
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
    title: 'Super Star',
    subtitle: 'Extra Turn & Double Coins!',
    coins: 0,
    description: 'Superstar invincibility! Take another turn immediately AND your coins or next bounty are doubled (x2)!',
    iconName: 'Sparkles',
    badgeColor: 'from-yellow-300 via-amber-400 to-yellow-500 text-yellow-950',
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
    description: 'Fires the dreaded Spiny Shell at the leading team! The #1 team skips their next turn!',
    iconName: 'ShieldAlert',
    badgeColor: 'from-sky-500 via-blue-600 to-indigo-700 text-white',
  },
  {
    id: 'bowser_revolution',
    type: 'bowser_revolution',
    title: 'Bowser Revolution',
    subtitle: 'Equalize All Coins!',
    coins: 0,
    description: 'Bowser appears! He pools all team coins together and redistributes them equally!',
    iconName: 'Flame',
    badgeColor: 'from-red-600 via-orange-600 to-amber-700 text-white',
  },
];

/**
 * Generate 6 randomized mystery cards for the reward roulette from the 8-card pool
 */
export function generateRouletteCards(): RewardCard[] {
  // Shuffle all 8 cards and pick 6
  const shuffled = [...REWARD_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6);
}
