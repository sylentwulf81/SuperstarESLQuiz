import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Zap, Ghost, Crown, Flame, Gift, Coins, ShieldAlert, 
  Trophy, BoxSelect, ArrowRightLeft, Dices, TrendingUp, TrendingDown, Check, Star, SkipForward, Droplets, Shuffle
} from 'lucide-react';
import { RewardCard, Team, RewardCardActionOptions } from '@/shared/types';
import { CHARACTERS } from '@/games/mario-party-quiz/data/characters';
import { isCatchUpRestrictedTeam } from '@/games/mario-party-quiz/data/rewards';
import { shuffleRivalCoinTotals } from '@/games/mario-blast-classic/data/classicRewards';
import { getRevealArt } from '@/games/mario-party-quiz/data/revealArt';
import { sounds } from '@/shared/utils/sound';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { TeamAvatar } from './TeamAvatar';
import { DiceRoller } from './DiceRoller';
import { GameModalShell } from '@/shared/components/GameModalShell';

interface RewardRouletteModalProps {
  cards: RewardCard[];
  currentTeam: Team;
  teams: Team[];
  theme?: 'summer' | 'christmas' | 'classic';
  onCardSelected: (card: RewardCard, options?: RewardCardActionOptions) => void;
  onClose: () => void;
  showCatchUpNote?: boolean;
  /** Skip the 6-card pick grid and open directly on this card's reveal / action UI. */
  startInReveal?: boolean;
  /** Host-only: close the reveal without applying the card effect. */
  onSkipAction?: () => void;
}

type CardTheme = {
  shell: string;
  glow: string;
  iconWrap: string;
  accent: string;
};

const CARD_THEMES: Record<string, CardTheme> = {
  bowser_revolution: {
    shell: 'from-orange-600 via-red-800 to-stone-950',
    glow: 'shadow-[0_0_40px_rgba(249,115,22,0.55)] border-orange-300',
    iconWrap: 'from-orange-500 to-red-700',
    accent: 'text-orange-200',
  },
  bowser_fury: {
    shell: 'from-amber-600 via-red-700 to-red-950',
    glow: 'shadow-[0_0_45px_rgba(239,68,68,0.7)] border-amber-400',
    iconWrap: 'from-amber-500 to-red-700',
    accent: 'text-amber-200',
  },
  pow_block: {
    shell: 'from-blue-600 via-indigo-900 to-slate-950',
    glow: 'shadow-[0_0_45px_rgba(59,130,246,0.65)] border-blue-300',
    iconWrap: 'from-blue-400 to-indigo-700',
    accent: 'text-blue-100',
  },
  blooper: {
    shell: 'from-indigo-500 via-blue-950 to-slate-950',
    glow: 'shadow-[0_0_40px_rgba(99,102,241,0.55)] border-indigo-300',
    iconWrap: 'from-indigo-400 to-blue-900',
    accent: 'text-indigo-100',
  },
  ghost_steal_5: {
    shell: 'from-violet-500 via-indigo-900 to-slate-950',
    glow: 'shadow-[0_0_40px_rgba(167,139,250,0.5)] border-violet-200',
    iconWrap: 'from-violet-300 to-indigo-700',
    accent: 'text-violet-100',
  },
  boo_steal_5: {
    shell: 'from-violet-500 via-indigo-900 to-slate-950',
    glow: 'shadow-[0_0_40px_rgba(167,139,250,0.5)] border-violet-200',
    iconWrap: 'from-violet-300 to-indigo-700',
    accent: 'text-violet-100',
  },
  king_boo: {
    shell: 'from-fuchsia-500 via-purple-900 to-slate-950',
    glow: 'shadow-[0_0_45px_rgba(217,70,239,0.6)] border-fuchsia-200',
    iconWrap: 'from-fuchsia-300 to-purple-800',
    accent: 'text-fuchsia-100',
  },
  boo_steal_10: {
    shell: 'from-fuchsia-500 via-purple-900 to-slate-950',
    glow: 'shadow-[0_0_45px_rgba(217,70,239,0.6)] border-fuchsia-200',
    iconWrap: 'from-fuchsia-300 to-purple-800',
    accent: 'text-fuchsia-100',
  },
  super_star_x2: {
    shell: 'from-red-500 via-rose-700 to-red-950',
    glow: 'shadow-[0_0_45px_rgba(244,63,94,0.7)] border-red-300',
    iconWrap: 'from-red-400 to-rose-600',
    accent: 'text-red-50',
  },
  mushroom_x2: {
    shell: 'from-red-400 via-rose-700 to-red-950',
    glow: 'shadow-[0_0_40px_rgba(248,113,113,0.5)] border-red-200',
    iconWrap: 'from-red-300 to-rose-700',
    accent: 'text-red-50',
  },
  blue_shell: {
    shell: 'from-sky-400 via-blue-700 to-indigo-950',
    glow: 'shadow-[0_0_40px_rgba(56,189,248,0.55)] border-sky-200',
    iconWrap: 'from-sky-300 to-blue-700',
    accent: 'text-sky-50',
  },
  super_coins_10: {
    shell: 'from-amber-300 via-yellow-600 to-orange-800',
    glow: 'shadow-[0_0_40px_rgba(251,191,36,0.55)] border-amber-100',
    iconWrap: 'from-amber-200 to-yellow-600',
    accent: 'text-amber-50',
  },
  wonderful_coins_5: {
    shell: 'from-yellow-300 via-amber-500 to-yellow-800',
    glow: 'shadow-[0_0_35px_rgba(250,204,21,0.45)] border-yellow-200',
    iconWrap: 'from-yellow-200 to-amber-600',
    accent: 'text-yellow-50',
  },
  great_coins_3: {
    shell: 'from-amber-200 via-amber-500 to-yellow-800',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.4)] border-amber-200',
    iconWrap: 'from-amber-200 to-yellow-600',
    accent: 'text-amber-50',
  },
  hidden_block: {
    shell: 'from-blue-600 via-indigo-900 to-slate-950',
    glow: 'shadow-[0_0_45px_rgba(59,130,246,0.65)] border-blue-300',
    iconWrap: 'from-blue-400 to-indigo-700',
    accent: 'text-blue-100',
  },
  coins_1: {
    shell: 'from-amber-200 via-amber-500 to-yellow-800',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.4)] border-amber-200',
    iconWrap: 'from-amber-200 to-yellow-600',
    accent: 'text-amber-50',
  },
  coins_3: {
    shell: 'from-amber-200 via-amber-500 to-yellow-800',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.4)] border-amber-200',
    iconWrap: 'from-amber-200 to-yellow-600',
    accent: 'text-amber-50',
  },
  coins_5: {
    shell: 'from-yellow-300 via-amber-500 to-yellow-800',
    glow: 'shadow-[0_0_35px_rgba(250,204,21,0.45)] border-yellow-200',
    iconWrap: 'from-yellow-200 to-amber-600',
    accent: 'text-yellow-50',
  },
  coins_10: {
    shell: 'from-amber-300 via-yellow-600 to-orange-800',
    glow: 'shadow-[0_0_40px_rgba(251,191,36,0.55)] border-amber-100',
    iconWrap: 'from-amber-200 to-yellow-600',
    accent: 'text-amber-50',
  },
  gold_star: {
    shell: 'from-yellow-200 via-amber-400 to-orange-700',
    glow: 'shadow-[0_0_50px_rgba(250,204,21,0.75)] border-yellow-100',
    iconWrap: 'from-yellow-200 to-amber-500',
    accent: 'text-yellow-50',
  },
  mystery_blocks: {
    shell: 'from-amber-400 via-yellow-700 to-orange-950',
    glow: 'shadow-[0_0_45px_rgba(245,158,11,0.65)] border-amber-200',
    iconWrap: 'from-yellow-300 to-orange-700',
    accent: 'text-amber-50',
  },
};

const DEFAULT_THEME: CardTheme = {
  shell: 'from-indigo-500 via-slate-800 to-slate-950',
  glow: 'shadow-[0_0_35px_rgba(129,140,248,0.45)] border-indigo-200',
  iconWrap: 'from-indigo-300 to-indigo-700',
  accent: 'text-indigo-50',
};

function getCardTheme(type: string): CardTheme {
  return CARD_THEMES[type] || DEFAULT_THEME;
}

function CoinScore({ coins, size = 'md' }: { coins: number; size?: 'md' | 'lg' }) {
  const big = size === 'lg';
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-black/60 border border-yellow-300/50 ${
        big ? 'px-3 py-1.5' : 'px-2 py-1'
      }`}
    >
      <MarioCoin size={big ? 'md' : 'sm'} />
      <span
        className={`font-mario leading-none ${big ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'} ${
          coins < 0 ? 'text-red-400' : 'text-yellow-300'
        }`}
      >
        {coins}
      </span>
    </div>
  );
}

const TeamCoinChip: React.FC<{
  team: Team;
  highlight?: boolean;
  label?: string;
}> = ({
  team,
  highlight,
  label,
}) => {
  const char = CHARACTERS[team.characterId];
  return (
    <div
      className={`flex items-center gap-1.5 rounded-xl border px-2 py-1 ${char.bgColor} ${
        highlight ? 'ring-2 ring-yellow-300 border-yellow-200' : 'border-white/25'
      }`}
    >
      <TeamAvatar characterId={team.characterId} size="sm" customUrl={team.customImageUrl} />
      <span
        className={`font-mario text-lg sm:text-2xl leading-none ${
          team.coins < 0 ? 'text-red-200' : 'text-yellow-100'
        }`}
      >
        {team.coins}
      </span>
      {label && (
        <span className="text-[9px] font-black uppercase tracking-wider text-white/90">{label}</span>
      )}
    </div>
  );
}

function TeamCoinBank({ teams, currentTeamId }: { teams: Team[]; currentTeamId: string }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5 w-full shrink-0">
      {teams.map(team => (
        <React.Fragment key={team.id}>
          <TeamCoinChip
            team={team}
            highlight={team.id === currentTeamId}
            label={team.id === currentTeamId ? 'You' : undefined}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

function RoundOverStamp({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-full bg-red-600 border-2 border-yellow-300 font-mario text-white text-shadow-mario leading-none ${className}`}
    >
      ROUND OVER
    </span>
  );
}

const INTERACTIVE_REVEAL_TYPES = new Set([
  'ghost_steal_5',
  'boo_steal_5',
  'king_boo',
  'boo_steal_10',
  'bowser_revolution',
  'bowser_fury',
  'pow_block',
  'hidden_block',
  'blooper',
  'mystery_blocks',
]);

function isStandardRevealCard(type: string): boolean {
  return !INTERACTIVE_REVEAL_TYPES.has(type);
}

function EffectHero({
  card,
  mushroomBoost,
  bloopered,
}: {
  card: RewardCard;
  mushroomBoost?: boolean;
  bloopered?: boolean;
}) {
  const markClass =
    'font-mario text-[clamp(4.25rem,22cqh,10rem)] leading-none tracking-tight text-shadow-mario drop-shadow-[0_0_42px_rgba(250,204,21,0.6)]';

  if (card.type === 'mushroom_x2' || card.type === 'super_star_x2') {
    return <span className={`${markClass} text-yellow-300`}>×2</span>;
  }
  if (card.type === 'gold_star') {
    const payout = bloopered ? 1 : mushroomBoost ? card.coins * 2 : card.coins;
    return (
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <div className="inline-flex items-center gap-4 sm:gap-6">
          <span className={`${markClass} text-yellow-300`}>+{payout}</span>
          <MarioCoin size="2xl" />
        </div>
        {bloopered && (
          <span className="font-mario text-xl sm:text-2xl text-indigo-200">🦑 INKED</span>
        )}
        <RoundOverStamp className="text-xl sm:text-3xl px-4 py-1.5 shadow-[0_0_24px_rgba(250,204,21,0.45)]" />
      </div>
    );
  }
  if (card.coins > 0) {
    const payout = bloopered ? 1 : mushroomBoost ? card.coins * 2 : card.coins;
    return (
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <div className="inline-flex items-center gap-4 sm:gap-6">
          <span className={`${markClass} text-yellow-300`}>+{payout}</span>
          <MarioCoin size="2xl" />
        </div>
        {bloopered && (
          <span className="font-mario text-xl sm:text-2xl text-indigo-200">🦑 INKED — +1</span>
        )}
        {mushroomBoost && (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-red-800/90 border-2 border-yellow-300 px-3 py-1.5 shadow-[0_0_24px_rgba(250,204,21,0.35)]">
            <img
              src={getRevealArt('mushroom_x2')}
              alt=""
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-yellow-200/80"
            />
            <span className="font-mario text-3xl sm:text-4xl text-yellow-200 text-shadow-mario leading-none">×2</span>
          </div>
        )}
      </div>
    );
  }
  if (card.type === 'blue_shell') {
    return <span className={`${markClass} text-sky-300`}>SKIP</span>;
  }
  return null;
}

export const RewardRouletteModal: React.FC<RewardRouletteModalProps> = ({
  cards,
  currentTeam,
  teams,
  theme: gameTheme,
  onCardSelected,
  showCatchUpNote = false,
  startInReveal = false,
  onSkipAction,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(startInReveal ? 0 : null);
  const [revealedIndices, setRevealedIndices] = useState<number[]>(startInReveal ? cards.map((_, i) => i) : []);
  const [phase, setPhase] = useState<'pick' | 'reveal'>(startInReveal ? 'reveal' : 'pick');
  const [selectedCard, setSelectedCard] = useState<RewardCard | null>(startInReveal ? cards[0] ?? null : null);

  // Interactive card state
  // Boo: team chosen first, then roll die
  const [booTargetTeamId, setBooTargetTeamId] = useState<string | null>(null);
  const [booDieRoll, setBooDieRoll] = useState<number | null>(null);

  // King Boo: Party Quiz steals from each rival; Classic shuffles rival totals
  const [kingBooDieRoll, setKingBooDieRoll] = useState<number | null>(null);
  const [kingBooShuffle, setKingBooShuffle] = useState<Record<string, number> | null>(null);

  // Bowser's Revolution: choose a rival team to swap coin totals with
  const [swapTargetTeamId, setSwapTargetTeamId] = useState<string | null>(null);

  // POW Block: equalize to highest or lowest
  const [powChoice, setPowChoice] = useState<'highest' | 'lowest' | null>(null);
  const [blooperTargetTeamId, setBlooperTargetTeamId] = useState<string | null>(null);

  const charInfo = CHARACTERS[currentTeam.characterId];
  const eligibleOpponents = teams.filter(t => t.id !== currentTeam.id);
  const isClassicInteractive =
    gameTheme === 'classic' &&
    phase === 'reveal' &&
    Boolean(selectedCard) &&
    !isStandardRevealCard(selectedCard!.type);
  const isClassicRoundEnderCard =
    gameTheme === 'classic' &&
    (selectedCard?.type === 'gold_star' ||
      selectedCard?.type === 'bowser_revolution' ||
      selectedCard?.type === 'bowser_fury');

  useEffect(() => {
    if (gameTheme !== 'classic' || phase !== 'reveal' || !selectedCard) return;
    if (selectedCard.type === 'gold_star') sounds.playSuperstar();
  }, [gameTheme, phase, selectedCard]);

  const getCardIcon = (type: string, className: string) => {
    switch (type) {
      case 'bowser_revolution':
        return <Flame className={`${className} text-orange-200 fill-orange-400`} />;
      case 'bowser_fury':
        return <Flame className={`${className} text-amber-200 fill-red-500 animate-pulse`} />;
      case 'ghost_steal_5':
      case 'boo_steal_5':
        return <Ghost className={`${className} text-violet-100`} />;
      case 'king_boo':
      case 'boo_steal_10':
        return <Crown className={`${className} text-fuchsia-200`} />;
      case 'pow_block':
      case 'hidden_block':
        return <BoxSelect className={`${className} text-blue-200`} />;
      case 'blooper':
        return <Droplets className={`${className} text-indigo-100 fill-indigo-400`} />;
      case 'super_star_x2':
      case 'mushroom_x2':
        return <Zap className={`${className} text-red-100 fill-red-400`} />;
      case 'blue_shell':
        return <ShieldAlert className={`${className} text-sky-100 fill-sky-400/40`} />;
      case 'gold_star':
        return <Star className={`${className} text-yellow-100 fill-yellow-300`} />;
      case 'mystery_blocks':
        return <BoxSelect className={`${className} text-amber-100`} />;
      case 'super_coins_10':
      case 'coins_10':
        return <Trophy className={`${className} text-yellow-100 fill-yellow-400/40`} />;
      default:
        return <Coins className={`${className} text-yellow-100 fill-yellow-300`} />;
    }
  };

  const handlePickCard = (card: RewardCard, index: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    setSelectedCard(card);
    setRevealedIndices([index]);
    sounds.playSpecialCardFanfare();

    window.setTimeout(() => {
      setRevealedIndices([0, 1, 2, 3, 4, 5]);
    }, 420);

    window.setTimeout(() => {
      setPhase('reveal');
    }, 1500);

    window.setTimeout(() => {
      if (card.type === 'bowser_revolution') {
        sounds.playBowser();
      } else if (card.type === 'bowser_fury') {
        sounds.playBowserFury();
      } else if (card.type === 'pow_block' || card.type === 'hidden_block') {
        sounds.playPowBlock();
      } else if (card.type === 'blooper') {
        sounds.playBlooper();
      } else if (card.type === 'ghost_steal_5' || card.type === 'boo_steal_5' || card.type === 'king_boo' || card.type === 'boo_steal_10') {
        sounds.playBoo();
      } else if (card.type === 'super_star_x2' || card.type === 'mushroom_x2') {
        sounds.playPowerUp();
      } else if (card.type === 'blue_shell') {
        sounds.playBlueShell();
      } else if (card.type === 'super_coins_10' || card.type === 'coins_10') {
        sounds.playStarCoin();
      } else {
        sounds.playCoin();
      }
    }, 1580);
  };

  // Execution triggers
  const handleFinishStandard = () => {
    if (!selectedCard) return;
    if (selectedCard.coins > 0) {
      sounds.playClaimReward();
    } else {
      sounds.playPowerUp();
    }
    onCardSelected(selectedCard);
  };

  const handleFinishBooSteal = () => {
    if (!selectedCard || !booTargetTeamId || booDieRoll === null) return;
    sounds.playStealConfirmed();
    onCardSelected(selectedCard, {
      targetTeamId: booTargetTeamId,
      dieRoll: booDieRoll,
    });
  };

  const handleFinishKingBooSteal = () => {
    if (!selectedCard || kingBooDieRoll === null) return;
    sounds.playStealConfirmed();
    onCardSelected(selectedCard, {
      dieRoll: kingBooDieRoll,
    });
  };

  const handleFinishKingBooShuffle = () => {
    if (!selectedCard || !kingBooShuffle) return;
    sounds.playStealConfirmed();
    onCardSelected(selectedCard, {
      coinTotals: kingBooShuffle,
    });
  };

  const handleFinishBowserRevolution = () => {
    if (!selectedCard || !swapTargetTeamId) return;
    sounds.playBowser();
    onCardSelected(selectedCard, {
      targetTeamId: swapTargetTeamId,
    });
  };

  const handleFinishBowserFury = () => {
    if (!selectedCard) return;
    sounds.playBowserFury();
    onCardSelected(selectedCard);
  };

  const handleFinishBlooper = () => {
    if (!selectedCard || !blooperTargetTeamId) return;
    sounds.playBlooper();
    onCardSelected(selectedCard, {
      targetTeamId: blooperTargetTeamId,
    });
  };

  const handleFinishPowBlock = () => {
    if (!selectedCard || !powChoice) return;
    sounds.playPowBlock();
    onCardSelected(selectedCard, {
      powChoice,
    });
  };

  const renderCardBack = (idx: number, flipped: boolean) => (
    <div
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(0deg) translateZ(1px)',
      }}
      className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/90 bg-gradient-to-br from-red-700 via-rose-900 to-red-950 flex flex-col items-center justify-between p-2.5 sm:p-3 transition-opacity duration-200 ${
        flipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${!flipped ? 'hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]' : ''}`}
    >
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`argyle-${idx}`} width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M14 0 L28 14 L14 28 L0 14 Z" fill="none" stroke="#fbbf24" strokeWidth="1" />
            <circle cx="14" cy="14" r="1.5" fill="#fde047" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#argyle-${idx})`} />
      </svg>
      <div className="absolute inset-1.5 rounded-xl border border-amber-300/40 pointer-events-none" />
      <div className="relative z-10 text-center pt-1">
        <span className="font-mario text-[10px] sm:text-xs text-yellow-300 tracking-wider bg-black/60 px-2.5 py-0.5 rounded-full border border-amber-400/50 shadow-sm">
          ★ MYSTERY ★
        </span>
      </div>
      <div className="relative z-10 my-auto">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1.5 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 shadow-[0_0_20px_rgba(250,204,21,0.5)] flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-gradient-to-b from-red-900 to-red-950 border border-yellow-200/60 flex items-center justify-center">
            <span className="font-mario text-4xl sm:text-5xl text-yellow-300 text-shadow-mario leading-none">?</span>
          </div>
        </div>
      </div>
      <div className="relative z-10 pb-1">
        <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider bg-black/50 px-2 py-0.5 rounded-full border border-amber-400/40 animate-pulse">
          TAP TO PICK
        </span>
      </div>
    </div>
  );

  const renderCardFront = (card: RewardCard, picked: boolean, compact = false) => {
    const theme = getCardTheme(card.type);
    return (
      <div
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg) translateZ(2px)',
        }}
        className={`absolute inset-0 rounded-2xl overflow-hidden border-2 sm:border-3 p-2.5 sm:p-3 flex flex-col justify-between text-center bg-slate-950 transition-all duration-300 ${
          picked
            ? `border-yellow-300 ${theme.glow} ring-4 ring-yellow-300/80 shadow-2xl z-20`
            : 'border-white/30 brightness-95 contrast-105 z-10'
        }`}
      >
        <div className={`absolute inset-0 bg-gradient-to-b ${theme.shell} opacity-95 pointer-events-none`} />
        <div className="absolute inset-1 rounded-xl border border-white/25 pointer-events-none" />

        {/* Top Header Badge */}
        <div className="relative z-10 min-h-[22px] flex items-center justify-center">
          {picked ? (
            <span className="px-2.5 py-0.5 bg-gradient-to-r from-yellow-300 to-amber-400 text-slate-950 font-black text-[10px] sm:text-xs rounded-full uppercase tracking-wider shadow-md border border-white/60 animate-pulse">
              ★ YOUR PICK ★
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-black/60 text-yellow-300 font-bold text-[9px] sm:text-[10px] rounded-full uppercase tracking-wider border border-white/20">
              REWARD
            </span>
          )}
        </div>

        {/* Center Graphic & Title */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-1.5 px-1 my-0.5">
          <div className={`rounded-2xl bg-black/45 border-2 border-white/30 shadow-lg ${compact ? 'p-1.5' : 'p-2 sm:p-2.5'}`}>
            {getCardIcon(card.type, compact ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12')}
          </div>
          <h4 className={`font-mario text-yellow-100 text-shadow-mario leading-tight ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>
            {card.title}
          </h4>
          {!compact && (
            <p className="text-[10px] sm:text-xs text-white/95 font-medium leading-snug line-clamp-2 px-0.5">
              {card.subtitle}
            </p>
          )}
        </div>

        {/* Bottom Reward Pill */}
        <div className="relative z-10 min-h-[26px] flex items-center justify-center">
          {card.coins > 0 ? (
            <div className="bg-black/60 border border-yellow-300/70 rounded-full py-0.5 px-2.5 flex items-center gap-1 shadow-md">
              <span className="font-mario text-amber-200 text-xs sm:text-sm">+{card.coins}</span>
              <MarioCoin size="xs" />
            </div>
          ) : (
            <div className="bg-black/50 border border-white/25 rounded-full py-0.5 px-2 flex items-center gap-1">
              <span className="font-pixel text-[8px] sm:text-[9px] uppercase tracking-wider text-amber-200">
                {card.type === 'pow_block' ? 'POW' : card.type === 'blooper' ? 'INK +1' : card.type === 'bowser_revolution' ? 'SWAP' : card.type === 'bowser_fury' ? '-5 ALL' : card.type === 'ghost_steal_5' ? 'DIE STEAL' : card.type === 'king_boo' || card.type === 'boo_steal_10' ? (gameTheme === 'classic' ? 'SHUFFLE' : 'ALL STEAL') : 'SPECIAL'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // POW Block data
  const maxCoins = Math.max(...teams.map(t => t.coins));
  const minCoins = Math.min(...teams.map(t => t.coins));

  const targetOpponent = booTargetTeamId ? teams.find(t => t.id === booTargetTeamId) : null;
  const swapOpponent = swapTargetTeamId ? teams.find(t => t.id === swapTargetTeamId) : null;
  const blooperTarget = blooperTargetTeamId ? teams.find(t => t.id === blooperTargetTeamId) : null;
  const revealArt = selectedCard ? getRevealArt(selectedCard.type) : undefined;
  const blooperedPayout =
    gameTheme === 'classic' &&
    Boolean(currentTeam.blooperNextCoin) &&
    Boolean(selectedCard && selectedCard.coins > 0) &&
    !currentTeam.skipNextCoinReward;
  const mushroomBoost =
    gameTheme === 'classic' &&
    Boolean(currentTeam.doubleNextCoinReward) &&
    Boolean(selectedCard && selectedCard.coins > 0) &&
    !currentTeam.skipNextCoinReward &&
    !blooperedPayout;

  return (
    <GameModalShell barColor={charInfo.accentColor}>
        <div className={`${charInfo.bgColor} px-3 sm:px-6 py-2.5 sm:py-3 border-b-2 ${charInfo.borderColor} flex items-center justify-between gap-3 shrink-0`}>
          <div className="flex items-center gap-2 bg-black/35 border border-white/30 rounded-2xl px-2.5 py-1.5">
            <TeamAvatar
              characterId={currentTeam.characterId}
              size="md"
              customUrl={currentTeam.customImageUrl}
              className="ring-2 ring-white/80"
            />
            <div className="leading-tight min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/90 block">Drawing</span>
              <span className="text-sm font-bold text-white block max-w-[140px] truncate">{currentTeam.name}</span>
            </div>
            <CoinScore coins={currentTeam.coins} />
          </div>
          <div className="text-center flex-1 min-w-0">
            <h2 className="font-mario text-xl sm:text-3xl lg:text-4xl text-white text-shadow-mario tracking-wide">
              {phase === 'reveal' ? (isClassicRoundEnderCard ? 'ROUND ENDER!' : 'CARD REVEALED!') : 'PICK A MYSTERY CARD'}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-white/90 mt-0.5 truncate">
              {phase === 'reveal'
                ? `${currentTeam.name} drew a special card`
                : 'Choose 1 of 6 cards'}
            </p>
            {phase === 'pick' && showCatchUpNote && isCatchUpRestrictedTeam(teams, currentTeam.id) && (
              <p className="text-[10px] sm:text-xs font-bold text-sky-300 mt-0.5">
                1st place catch-up: no Blue Shell or Bowser cards this draw
              </p>
            )}
          </div>
          {onSkipAction && phase === 'reveal' ? (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onSkipAction();
              }}
              className="shrink-0 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-bold uppercase tracking-wider border border-white/20 cursor-pointer inline-flex items-center gap-1.5"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip action
            </button>
          ) : (
            <div className="w-[108px] hidden sm:block" />
          )}
        </div>

        <div className={`flex-1 min-h-0 p-3 sm:p-5 lg:p-6 ${phase === 'pick' ? 'overflow-y-auto' : 'overflow-hidden'}`}>
          <AnimatePresence mode="wait">
            {phase === 'pick' && (
              <motion.div
                key="pick"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="h-full flex flex-col justify-center"
              >
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 items-end justify-items-center">
                  {cards.map((card, idx) => {
                    const isThisPicked = selectedIndex === idx;
                    const isCardFlipped = revealedIndices.includes(idx);
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 w-full max-w-[220px]">
                        <div
                          className="relative w-full max-h-[min(48vh,380px)] aspect-[2/3] [perspective:1200px] cursor-pointer"
                          onClick={() => selectedIndex === null && handlePickCard(card, idx)}
                        >
                          <motion.div
                            whileHover={!isCardFlipped ? { scale: 1.04, y: -6 } : undefined}
                            animate={{
                              rotateY: isCardFlipped ? 180 : 0,
                              scale: isThisPicked ? 1.06 : 1,
                            }}
                            transition={{
                              rotateY: { duration: 0.65, ease: [0.34, 1.56, 0.64, 1] },
                              scale: { duration: 0.2 },
                            }}
                            style={{ transformStyle: 'preserve-3d' }}
                            className="relative w-full h-full"
                          >
                            {renderCardBack(idx, isCardFlipped)}
                            {renderCardFront(card, isThisPicked)}
                          </motion.div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePickCard(card, idx)}
                          disabled={selectedIndex !== null}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border-2 shadow-xl cursor-pointer ${
                            isThisPicked
                              ? 'bg-yellow-400 text-slate-950 border-white ring-4 ring-yellow-300'
                              : 'bg-gradient-to-b from-red-600 to-red-800 text-yellow-300 border-amber-300/80'
                          }`}
                        >
                          <span className="font-mario text-xl sm:text-3xl leading-none">{idx + 1}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {phase === 'reveal' && selectedCard && selectedIndex !== null && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full min-h-0 flex flex-col gap-3"
              >
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(16rem,38%)_minmax(0,1fr)] gap-3 lg:gap-5">
                  <motion.div
                    initial={{ rotateY: 90, scale: 0.8 }}
                    animate={{ rotateY: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                    className={`relative min-h-[14rem] lg:min-h-0 h-full overflow-hidden rounded-3xl border-4 ${getCardTheme(selectedCard.type).glow}`}
                  >
                    {revealArt ? (
                      <img
                        src={revealArt}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-b ${getCardTheme(selectedCard.type).shell} flex items-center justify-center`}>
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-black/40 border-2 border-white/50 flex items-center justify-center shadow-2xl">
                          {getCardIcon(selectedCard.type, 'w-20 h-20 sm:w-24 sm:h-24')}
                        </div>
                      </div>
                    )}
                    {mushroomBoost && (
                      <div className="absolute top-3 right-3 flex flex-col items-center gap-1">
                        <img
                          src={getRevealArt('mushroom_x2')}
                          alt=""
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.55)]"
                        />
                        <span className="font-mario text-xl sm:text-2xl text-yellow-300 text-shadow-mario">×2</span>
                      </div>
                    )}
                    {blooperedPayout && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-indigo-900 border-2 border-indigo-200 font-mario text-sm sm:text-lg text-indigo-100">
                        🦑 +1
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-black/85 via-black/50 to-transparent">
                      <h3 className="font-mario text-2xl sm:text-3xl text-yellow-100 text-shadow-mario leading-tight">
                        {blooperedPayout
                          ? '+1 Coin'
                          : mushroomBoost && selectedCard.coins > 0
                            ? `+${selectedCard.coins * 2} Coins`
                            : selectedCard.title}
                      </h3>
                      {isClassicRoundEnderCard && (
                        <RoundOverStamp className="mt-2 text-sm sm:text-lg" />
                      )}
                    </div>
                  </motion.div>

                  <div className="@container/reveal min-h-0 h-full rounded-3xl border-2 border-white/15 bg-slate-950/50 p-3 sm:p-4 flex flex-col gap-2 overflow-x-hidden overflow-y-auto">
                    {gameTheme === 'classic' && isClassicInteractive && (
                      <TeamCoinBank teams={teams} currentTeamId={currentTeam.id} />
                    )}
                    {gameTheme !== 'classic' && (
                      <p className="font-mario text-xl sm:text-2xl text-amber-200 leading-tight">
                        {selectedCard.subtitle}
                      </p>
                    )}

                    {/* INTERACTIVE CARD LOGIC BRANCHES */}

                    {/* 1. BOO: Select Team First, Then Roll Die */}
                    {(selectedCard.type === 'ghost_steal_5' || selectedCard.type === 'boo_steal_5') && (
                      <div className="flex-1 min-h-0 flex flex-col gap-2">
                        <p className="font-mario text-lg sm:text-xl text-purple-100 text-center text-shadow-mario shrink-0">
                          Steal coins from another team!
                        </p>
                        <div className="flex items-center justify-center gap-2 text-purple-200 shrink-0">
                          <Ghost className="w-6 h-6 text-purple-300" />
                          <h4 className="font-mario text-lg sm:text-xl text-white leading-tight">Which team will you steal from?</h4>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 shrink-0">
                          {eligibleOpponents.map(opp => {
                            const oppChar = CHARACTERS[opp.characterId];
                            const isSelected = booTargetTeamId === opp.id;
                            return (
                              <button
                                key={opp.id}
                                type="button"
                                onClick={() => {
                                  setBooTargetTeamId(opp.id);
                                  setBooDieRoll(null);
                                  sounds.playBoo();
                                }}
                                className={`min-w-[5.25rem] p-2 rounded-xl border ${oppChar.bgColor} bg-opacity-70 text-white font-bold cursor-pointer flex flex-col items-center gap-1 ${
                                  isSelected ? 'border-yellow-300 ring-4 ring-purple-400' : 'border-white/30 hover:brightness-110'
                                }`}
                              >
                                <TeamAvatar characterId={opp.characterId} size="md" customUrl={opp.customImageUrl} />
                                <span className="text-xs font-black truncate w-full text-center">{opp.name}</span>
                                <CoinScore coins={opp.coins} />
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex-1 min-h-[13rem] flex flex-col items-center justify-center gap-2">
                          {booTargetTeamId ? (
                            <>
                              <DiceRoller
                                key={booTargetTeamId}
                                compact={gameTheme === 'classic'}
                                title="Roll the steal die!"
                                subtitle={`How many coins from ${targetOpponent?.name}?`}
                                themeColor="purple"
                                onRollComplete={val => setBooDieRoll(val)}
                              />
                              <div className="h-[3.25rem] flex items-center justify-center w-full">
                                {booDieRoll !== null && (
                                  <button
                                    type="button"
                                    onClick={handleFinishBooSteal}
                                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mario text-lg sm:text-xl rounded-2xl shadow-xl border-2 border-purple-300 flex items-center gap-2 cursor-pointer hover:brightness-110 active:brightness-95"
                                  >
                                    <Ghost className="w-5 h-5" />
                                    STEAL {booDieRoll}
                                  </button>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full min-h-[13rem] rounded-2xl border border-dashed border-purple-400/40 bg-purple-950/40 flex items-center justify-center px-4">
                              <p className="font-mario text-base sm:text-lg text-purple-100/80 text-center">Pick a team</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 2. KING BOO: Classic shuffles rival coins; Party Quiz steals from each */}
                    {(selectedCard.type === 'king_boo' || selectedCard.type === 'boo_steal_10') && (
                      gameTheme === 'classic' ? (
                        <div className="flex-1 w-full p-2.5 gap-2 overflow-hidden flex flex-col min-h-0 bg-fuchsia-950/80 rounded-2xl border border-fuchsia-500/50">
                          <div className="flex items-center justify-center gap-2 shrink-0 text-fuchsia-200">
                            <Crown className="w-6 h-6 text-fuchsia-300" />
                            <h4 className="font-mario text-xl sm:text-2xl text-white">SHUFFLE</h4>
                          </div>
                          <div className="flex items-center justify-center gap-2 shrink-0">
                            <TeamAvatar
                              characterId={currentTeam.characterId}
                              size="md"
                              customUrl={currentTeam.customImageUrl}
                            />
                            <CoinScore coins={currentTeam.coins} />
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest">
                              Safe
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 content-start flex-1 min-h-0">
                            {eligibleOpponents.map(opp => {
                              const oppChar = CHARACTERS[opp.characterId];
                              const shown = kingBooShuffle?.[opp.id] ?? opp.coins;
                              const changed = kingBooShuffle != null && shown !== opp.coins;
                              return (
                                <div
                                  key={opp.id}
                                  className={`rounded-xl border ${oppChar.bgColor} bg-opacity-70 text-white font-bold flex flex-col items-center p-2 gap-1 ${
                                    changed ? 'border-yellow-300 ring-2 ring-fuchsia-400' : 'border-white/30'
                                  }`}
                                >
                                  <TeamAvatar
                                    characterId={opp.characterId}
                                    size="md"
                                    customUrl={opp.customImageUrl}
                                  />
                                  <span className="text-xs font-black truncate w-full text-center">{opp.name}</span>
                                  <div className="flex items-center gap-1">
                                    {changed && (
                                      <span className="font-mario text-sm text-white/50 line-through leading-none">
                                        {opp.coins}
                                      </span>
                                    )}
                                    <motion.div
                                      key={`${opp.id}-${shown}`}
                                      initial={kingBooShuffle ? { scale: 1.35 } : false}
                                      animate={{ scale: 1 }}
                                    >
                                      <CoinScore coins={shown} />
                                    </motion.div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {kingBooShuffle == null ? (
                            <button
                              type="button"
                              onClick={() => {
                                setKingBooShuffle(shuffleRivalCoinTotals(teams, currentTeam.id));
                                sounds.playBoo();
                              }}
                              className="w-full shrink-0 px-4 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-mario text-lg sm:text-xl rounded-2xl shadow-xl border-2 border-fuchsia-300 flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:brightness-95"
                            >
                              <Shuffle className="w-6 h-6" />
                              SHUFFLE
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleFinishKingBooShuffle}
                              className="w-full shrink-0 px-4 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-mario text-lg sm:text-xl rounded-2xl shadow-xl border-2 border-fuchsia-300 flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:brightness-95"
                            >
                              <Crown className="w-6 h-6" />
                              CLAIM
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <DiceRoller
                            title="Roll King Boo's Die!"
                            subtitle={`Roll a 6-sided die to steal that exact number of coins from EACH of the ${eligibleOpponents.length} other teams!`}
                            themeColor="purple"
                            onRollComplete={val => setKingBooDieRoll(val)}
                          />

                          {kingBooDieRoll !== null && (
                            <div className="flex flex-col items-center lg:items-start gap-3">
                              <p className="text-sm font-bold text-fuchsia-300">
                                👑 King Boo will steal {kingBooDieRoll} coins from each rival team (+{kingBooDieRoll * eligibleOpponents.length} total)!
                              </p>
                              <button
                                type="button"
                                onClick={handleFinishKingBooSteal}
                                className="px-8 py-3.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-mario text-xl sm:text-2xl rounded-2xl shadow-xl border-2 border-fuchsia-300 flex items-center gap-2 cursor-pointer hover:brightness-110 active:brightness-95"
                              >
                                <Crown className="w-6 h-6" />
                                CLAIM KING BOO HEIST (+{kingBooDieRoll * eligibleOpponents.length} COINS)
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    )}

                    {/* 3. BOWSER'S REVOLUTION: Swap coin totals with one other team */}
                    {selectedCard.type === 'bowser_revolution' && (
                      <div className="bg-orange-950/80 rounded-2xl border border-orange-500/50 flex flex-col gap-2 p-2.5 min-h-0">
                        {gameTheme !== 'classic' && (
                          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                            <TeamAvatar characterId={currentTeam.characterId} size="xl" customUrl={currentTeam.customImageUrl} />
                            <CoinScore coins={currentTeam.coins} size="lg" />
                          </div>
                        )}
                        <div className="flex items-center justify-center lg:justify-start gap-2 text-orange-200 shrink-0">
                          <Flame className="w-6 h-6 text-orange-400" />
                          <h4 className="font-mario text-xl sm:text-2xl text-white">SWAP WITH?</h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {eligibleOpponents.map(opp => {
                            const oppChar = CHARACTERS[opp.characterId];
                            const isSelected = swapTargetTeamId === opp.id;
                            return (
                              <button
                                key={opp.id}
                                type="button"
                                onClick={() => {
                                  setSwapTargetTeamId(opp.id);
                                  sounds.playBowser();
                                }}
                                className={`rounded-xl border ${oppChar.bgColor} bg-opacity-70 text-white font-bold transition-all cursor-pointer flex flex-col items-center ${
                                  gameTheme === 'classic' ? 'p-2 gap-1' : 'p-3 gap-1.5'
                                } ${
                                  isSelected ? 'border-yellow-300 ring-4 ring-orange-400 scale-105' : 'border-white/30 hover:scale-102'
                                }`}
                              >
                                <TeamAvatar
                                  characterId={opp.characterId}
                                  size={gameTheme === 'classic' ? 'md' : 'lg'}
                                  customUrl={opp.customImageUrl}
                                />
                                <span className="text-xs sm:text-sm font-black truncate w-full text-center">{opp.name}</span>
                                <CoinScore coins={opp.coins} />
                              </button>
                            );
                          })}
                        </div>

                        <div className="min-h-[7.25rem] flex flex-col items-center justify-center gap-2">
                          {swapOpponent && (
                          <div className="flex flex-col items-center gap-2 w-full">
                            <div className="p-2 bg-black/60 rounded-xl border border-orange-400/60 flex items-center gap-2 sm:gap-3">
                              <TeamAvatar characterId={currentTeam.characterId} size="md" customUrl={currentTeam.customImageUrl} />
                              <CoinScore coins={currentTeam.coins} />
                              <ArrowRightLeft className="w-6 h-6 text-yellow-300 animate-pulse" />
                              <TeamAvatar characterId={swapOpponent.characterId} size="md" customUrl={swapOpponent.customImageUrl} />
                              <CoinScore coins={swapOpponent.coins} />
                            </div>
                            <button
                              type="button"
                              onClick={handleFinishBowserRevolution}
                              className={`bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-mario rounded-2xl shadow-xl border-2 border-orange-300 flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:brightness-95 ${
                                gameTheme === 'classic'
                                  ? 'w-full px-4 py-3 text-lg sm:text-xl'
                                  : 'px-8 py-3.5 text-xl sm:text-2xl'
                              }`}
                            >
                              <Flame className="w-6 h-6" />
                              {gameTheme === 'classic' ? 'SWAP — ROUND OVER' : 'SWAP!'}
                            </button>
                          </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 4. BOWSER'S FURY: -5 Coins to Each Other Team */}
                    {selectedCard.type === 'bowser_fury' && (
                      <div className="bg-red-950/90 rounded-2xl border border-red-500/60 flex flex-col gap-2 p-2.5 min-h-0">
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                          <Flame className="w-7 h-7 text-red-500 animate-pulse" />
                          <h4 className="font-mario text-3xl sm:text-4xl text-white">RIVALS −5</h4>
                          {gameTheme === 'classic' && (
                            <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest">
                              Round over
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {eligibleOpponents.map(opp => {
                            const oppChar = CHARACTERS[opp.characterId];
                            return (
                              <div
                                key={opp.id}
                                className={`p-3 rounded-xl border ${oppChar.bgColor} bg-opacity-70 border-red-400/50 text-white flex flex-col items-center gap-1.5`}
                              >
                                <TeamAvatar characterId={opp.characterId} size="lg" customUrl={opp.customImageUrl} />
                                <span className="text-sm font-black truncate w-full text-center">{opp.name}</span>
                                <span className="font-mario text-2xl text-red-400 bg-black/60 px-3 py-1 rounded-full border border-red-500/60">
                                  −5
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className={`flex justify-center ${gameTheme === 'classic' ? 'mt-auto shrink-0' : 'pt-2 lg:justify-start'}`}>
                          <button
                            type="button"
                            onClick={handleFinishBowserFury}
                            className="px-8 py-3.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mario text-xl sm:text-2xl rounded-2xl shadow-xl border-2 border-red-300 flex items-center gap-2 cursor-pointer hover:brightness-110 active:brightness-95"
                          >
                            <Flame className="w-6 h-6" />
                            {gameTheme === 'classic' ? '−5 — ROUND OVER' : '−5!'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 5b. BLOOPER: Ink a rival so their next coin card pays 1 */}
                    {selectedCard.type === 'blooper' && (
                      <div className="bg-indigo-950/85 rounded-2xl border border-indigo-400/50 flex flex-col gap-2 p-2.5 min-h-0">
                        <div className="flex items-center justify-center gap-2 text-indigo-100 shrink-0">
                          <Droplets className="w-6 h-6 text-indigo-300" />
                          <h4 className="font-mario text-lg sm:text-2xl text-white leading-tight">Which team gets inked?</h4>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-indigo-100/90 shrink-0">
                          Next coin card = <span className="font-mario text-yellow-300">+1</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {eligibleOpponents.map(opp => {
                            const oppChar = CHARACTERS[opp.characterId];
                            const isSelected = blooperTargetTeamId === opp.id;
                            return (
                              <button
                                key={opp.id}
                                type="button"
                                onClick={() => {
                                  setBlooperTargetTeamId(opp.id);
                                  sounds.playBlooper();
                                }}
                                className={`rounded-xl border ${oppChar.bgColor} bg-opacity-70 text-white font-bold transition-all cursor-pointer flex flex-col items-center ${
                                  gameTheme === 'classic' ? 'p-2 gap-1' : 'p-3 gap-1.5'
                                } ${
                                  isSelected ? 'border-yellow-300 ring-4 ring-indigo-400 scale-105' : 'border-white/30 hover:scale-102'
                                }`}
                              >
                                <TeamAvatar
                                  characterId={opp.characterId}
                                  size={gameTheme === 'classic' ? 'md' : 'lg'}
                                  customUrl={opp.customImageUrl}
                                />
                                <span className="text-xs sm:text-sm font-black truncate w-full text-center">{opp.name}</span>
                                <CoinScore coins={opp.coins} />
                                {isSelected && (
                                  <span className="font-mario text-xs text-yellow-200">🦑 +1</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <div className="h-[3.75rem] shrink-0 flex items-center justify-center">
                          {blooperTarget && (
                          <button
                            type="button"
                            onClick={handleFinishBlooper}
                            className={`bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white font-mario rounded-2xl shadow-xl border-2 border-indigo-200 flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:brightness-95 ${
                              gameTheme === 'classic' ? 'w-full px-4 py-3 text-lg sm:text-xl' : 'px-8 py-3.5 text-xl sm:text-2xl'
                            }`}
                          >
                            <Droplets className="w-6 h-6" />
                            INK {blooperTarget.name.toUpperCase()}
                          </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 5. POW BLOCK: Equalize to Highest or Lowest */}
                    {(selectedCard.type === 'pow_block' || selectedCard.type === 'hidden_block') && (
                      <div className="p-4 bg-blue-950/80 rounded-2xl border border-blue-400/60 space-y-3">
                        <div className="flex items-center justify-center lg:justify-start gap-2 text-blue-200">
                          <BoxSelect className="w-6 h-6 text-blue-300" />
                          <h4 className="font-mario text-xl sm:text-2xl text-white">
                            Seismic POW Block Equalization!
                          </h4>
                        </div>
                        <p className="text-xs sm:text-sm text-blue-100 text-center lg:text-left">
                          Choose whether to equalize all teams' coins to the <strong>HIGHEST</strong> or <strong>LOWEST</strong> score on the board:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setPowChoice('highest');
                              sounds.playPowBlock();
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                              powChoice === 'highest'
                                ? 'bg-gradient-to-r from-emerald-700 to-green-600 border-emerald-300 ring-4 ring-emerald-400 shadow-xl'
                                : 'bg-slate-900/80 border-slate-700 hover:border-emerald-400/60'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/30 border border-emerald-300 flex items-center justify-center shrink-0">
                              <TrendingUp className="w-7 h-7 text-emerald-300" />
                            </div>
                            <div>
                              <span className="font-mario text-lg sm:text-xl text-white block">Equalize to HIGHEST</span>
                              <span className="text-xs text-emerald-200">
                                Set every team to <strong>{maxCoins} Coins</strong>
                              </span>
                            </div>
                            {powChoice === 'highest' && <Check className="w-6 h-6 text-emerald-200 ml-auto" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPowChoice('lowest');
                              sounds.playPowBlock();
                            }}
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                              powChoice === 'lowest'
                                ? 'bg-gradient-to-r from-red-800 to-rose-700 border-red-300 ring-4 ring-red-400 shadow-xl'
                                : 'bg-slate-900/80 border-slate-700 hover:border-red-400/60'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-xl bg-red-500/30 border border-red-300 flex items-center justify-center shrink-0">
                              <TrendingDown className="w-7 h-7 text-red-300" />
                            </div>
                            <div>
                              <span className="font-mario text-lg sm:text-xl text-white block">Equalize to LOWEST</span>
                              <span className="text-xs text-red-200">
                                Set every team to <strong>{minCoins} Coins</strong>
                              </span>
                            </div>
                            {powChoice === 'lowest' && <Check className="w-6 h-6 text-red-200 ml-auto" />}
                          </button>
                        </div>

                        {powChoice && (
                          <div className="pt-2 flex justify-center lg:justify-start">
                            <button
                              type="button"
                              onClick={handleFinishPowBlock}
                              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mario text-xl sm:text-2xl rounded-2xl shadow-xl border-2 border-blue-300 flex items-center gap-2 cursor-pointer hover:brightness-110 active:brightness-95"
                            >
                              <BoxSelect className="w-6 h-6" />
                              APPLY POW BLOCK ({powChoice.toUpperCase()}: {powChoice === 'highest' ? maxCoins : minCoins} COINS)
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedCard.type === 'mystery_blocks' && (
                      <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleFinishStandard}
                          className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-mario text-xl sm:text-2xl rounded-2xl shadow-xl border-2 border-yellow-200 flex items-center gap-2 cursor-pointer hover:brightness-110 active:brightness-95"
                        >
                          <BoxSelect className="w-6 h-6" />
                          HIT THE MYSTERY BLOCKS
                        </button>
                      </div>
                    )}

                    {/* Standard Cards (Coins, Super Mushroom, Blue Shell, Gold Star) */}
                    {isStandardRevealCard(selectedCard.type) && (
                      gameTheme === 'classic' ? (
                        <div className="flex-1 min-h-0 w-full flex flex-col">
                          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2">
                            <EffectHero card={selectedCard} mushroomBoost={mushroomBoost} bloopered={blooperedPayout} />
                          </div>
                          <button
                            type="button"
                            onClick={handleFinishStandard}
                            className="mt-auto shrink-0 w-full px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-400 hover:to-green-300 hover:shadow-[0_0_28px_rgba(52,211,153,0.5)] text-white font-mario text-2xl sm:text-3xl rounded-2xl shadow-xl border-2 border-emerald-300/70 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Sparkles className="w-7 h-7" />
                            {selectedCard.type === 'gold_star' ? 'CLAIM — ROUND OVER' : 'CLAIM'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-5">
                          {selectedCard.coins > 0 && (
                            <div className="inline-flex items-center gap-3">
                              <span className="font-mario text-5xl sm:text-6xl text-yellow-300 leading-none">
                                +{selectedCard.coins}
                              </span>
                              <MarioCoin size="xl" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={handleFinishStandard}
                            className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-mario text-xl sm:text-2xl rounded-2xl shadow-xl border-2 border-emerald-300/70 flex items-center gap-2 cursor-pointer hover:brightness-110 active:brightness-95"
                          >
                            <Sparkles className="w-6 h-6" />
                            CLAIM
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {cards.length > 1 && (
                <div className="shrink-0">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 text-center lg:text-left">
                    The other cards
                  </p>
                  <div className="flex justify-center lg:justify-start gap-2 overflow-x-auto pb-1">
                    {cards.map((card, idx) => {
                      if (idx === selectedIndex) return null;
                      const theme = getCardTheme(card.type);
                      return (
                        <div
                          key={idx}
                          className={`w-[72px] sm:w-[92px] h-[108px] sm:h-[132px] rounded-xl border bg-gradient-to-b ${theme.shell} border-white/20 p-2 flex flex-col items-center justify-center text-center shrink-0 opacity-80`}
                        >
                          {getCardIcon(card.type, 'w-6 h-6 sm:w-7 sm:h-7')}
                          <span className="font-mario text-[10px] sm:text-xs text-yellow-100 leading-tight mt-1 line-clamp-2">
                            {card.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </GameModalShell>
  );
};
