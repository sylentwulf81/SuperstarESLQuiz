import { GameTheme } from '@/shared/types';

export const THEME_UI: Record<
  GameTheme,
  {
    short: string;
    edition: string;
    gameTitle: string;
    startParty: string;
    badgeClass: string;
    barClass: string;
    deckLabel: string;
    firebaseTitle: string;
  }
> = {
  summer: {
    short: 'Summer',
    edition: 'Summer Edition',
    gameTitle: 'Super Summer Blast',
    startParty: 'SUMMER BLAST',
    badgeClass: 'bg-amber-400/20 text-amber-300 border-amber-400/50',
    barClass: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]',
    deckLabel: 'Summer',
    firebaseTitle: 'Summer Custom Questions',
  },
  christmas: {
    short: 'Winter',
    edition: 'Winter Edition',
    gameTitle: 'Super Winter Blast',
    startParty: 'WINTER BLAST',
    badgeClass: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/50',
    barClass: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]',
    deckLabel: 'Winter',
    firebaseTitle: 'Winter Custom Questions',
  },
  classic: {
    short: 'Classic',
    edition: 'Classic Edition',
    gameTitle: 'Super Blast Classic',
    startParty: 'SUPER BLAST',
    badgeClass: 'bg-rose-400/20 text-rose-200 border-rose-400/50',
    barClass: 'bg-gradient-to-r from-rose-500 via-amber-400 to-yellow-300 shadow-[0_0_15px_rgba(244,63,94,0.45)]',
    deckLabel: 'Classic',
    firebaseTitle: 'Classic Custom Questions',
  },
  halloween: {
    short: 'Halloween',
    edition: 'Halloween Edition',
    gameTitle: 'Super Halloween Blast',
    startParty: 'HALLOWEEN BLAST',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    barClass: 'bg-gradient-to-r from-orange-500 via-purple-600 to-amber-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]',
    deckLabel: 'Halloween',
    firebaseTitle: 'Halloween Custom Questions',
  },
};
