export type InvasionFactionId = 'anime' | 'robots' | 'aliens' | 'zombies' | 'monsters';

export interface InvasionFaction {
  id: InvasionFactionId;
  name: string;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  /** Optional custom art. Drop files later at this path or pass customImageUrl on the team. */
  imageUrl?: string;
  tagline: string;
}

export interface InvasionTeam {
  id: string;
  factionId: InvasionFactionId;
  name: string;
  customImageUrl?: string;
}

export const INVASION_FACTIONS: Record<InvasionFactionId, InvasionFaction> = {
  anime: {
    id: 'anime',
    name: 'Anime',
    accentColor: '#f472b6',
    bgColor: 'bg-pink-600',
    borderColor: 'border-pink-300',
    tagline: 'Heroes',
  },
  robots: {
    id: 'robots',
    name: 'Robots',
    accentColor: '#22d3ee',
    bgColor: 'bg-cyan-600',
    borderColor: 'border-cyan-300',
    tagline: 'Machines',
  },
  aliens: {
    id: 'aliens',
    name: 'Aliens',
    accentColor: '#84cc16',
    bgColor: 'bg-lime-600',
    borderColor: 'border-lime-300',
    tagline: 'Invaders',
  },
  zombies: {
    id: 'zombies',
    name: 'Zombies',
    accentColor: '#c084fc',
    bgColor: 'bg-purple-700',
    borderColor: 'border-purple-300',
    tagline: 'Undead',
  },
  monsters: {
    id: 'monsters',
    name: 'Monsters',
    accentColor: '#f97316',
    bgColor: 'bg-orange-600',
    borderColor: 'border-orange-300',
    tagline: 'Beasts',
  },
};

export const INVASION_FACTION_LIST: InvasionFaction[] = [
  INVASION_FACTIONS.anime,
  INVASION_FACTIONS.robots,
  INVASION_FACTIONS.aliens,
  INVASION_FACTIONS.zombies,
  INVASION_FACTIONS.monsters,
];

export function factionOf(team: InvasionTeam): InvasionFaction {
  return INVASION_FACTIONS[team.factionId];
}
