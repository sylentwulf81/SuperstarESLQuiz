import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Zap, Ghost, Crown, Flame, Gift, Coins, ShieldAlert, 
  Trophy, BoxSelect, ArrowRightLeft, Dices, TrendingUp, TrendingDown, Check 
} from 'lucide-react';
import { RewardCard, Team, RewardCardActionOptions } from '@/shared/types';
import { CHARACTERS } from '@/games/mario-party-quiz/data/characters';
import { sounds } from '@/shared/utils/sound';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { TeamAvatar } from './TeamAvatar';
import { DiceRoller } from './DiceRoller';

interface RewardRouletteModalProps {
  cards: RewardCard[];
  currentTeam: Team;
  teams: Team[];
  theme?: 'summer' | 'christmas';
  onCardSelected: (card: RewardCard, options?: RewardCardActionOptions) => void;
  onClose: () => void;
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

export const RewardRouletteModal: React.FC<RewardRouletteModalProps> = ({
  cards,
  currentTeam,
  teams,
  onCardSelected,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [phase, setPhase] = useState<'pick' | 'reveal'>('pick');
  const [selectedCard, setSelectedCard] = useState<RewardCard | null>(null);

  // Interactive card state
  // Boo: team chosen first, then roll die
  const [booTargetTeamId, setBooTargetTeamId] = useState<string | null>(null);
  const [booDieRoll, setBooDieRoll] = useState<number | null>(null);

  // King Boo: roll die to steal from each rival team
  const [kingBooDieRoll, setKingBooDieRoll] = useState<number | null>(null);

  // Bowser's Revolution: choose a rival team to swap coin totals with
  const [swapTargetTeamId, setSwapTargetTeamId] = useState<string | null>(null);

  // POW Block: equalize to highest or lowest
  const [powChoice, setPowChoice] = useState<'highest' | 'lowest' | null>(null);

  const charInfo = CHARACTERS[currentTeam.characterId];
  const eligibleOpponents = teams.filter(t => t.id !== currentTeam.id);

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
      case 'super_star_x2':
      case 'mushroom_x2':
        return <Zap className={`${className} text-red-100 fill-red-400`} />;
      case 'blue_shell':
        return <ShieldAlert className={`${className} text-sky-100 fill-sky-400/40`} />;
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
                {card.type === 'pow_block' ? 'POW' : card.type === 'bowser_revolution' ? 'SWAP' : card.type === 'bowser_fury' ? '-5 ALL' : card.type === 'ghost_steal_5' ? 'DIE STEAL' : card.type === 'king_boo' ? 'ALL STEAL' : 'SPECIAL'}
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/88">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-[96vw] xl:max-w-7xl max-h-[94dvh] bg-slate-900 rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-yellow-400 to-indigo-500" />

        <div className="bg-slate-800/90 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-white/15 flex items-center justify-between gap-3 shrink-0">
          <div className={`flex items-center gap-2 bg-slate-950/80 border rounded-2xl px-2.5 py-1.5 ${charInfo.borderColor}`}>
            <TeamAvatar
              characterId={currentTeam.characterId}
              size="md"
              customUrl={currentTeam.customImageUrl}
              className="ring-2 ring-yellow-400"
            />
            <div className="leading-tight">
              <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300 block">Drawing</span>
              <span className="text-sm font-bold text-white block max-w-[160px] truncate">{currentTeam.name}</span>
            </div>
          </div>
          <div className="text-center flex-1 min-w-0">
            <h2 className="font-mario text-xl sm:text-3xl lg:text-4xl text-white text-shadow-mario tracking-wide">
              {phase === 'reveal' ? 'CARD REVEALED!' : 'PICK A MYSTERY CARD'}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-indigo-200 mt-0.5 truncate">
              {phase === 'reveal'
                ? `${currentTeam.name} drew a special card`
                : 'Choose 1 of 6 cards'}
            </p>
          </div>
          <div className="w-[108px] hidden sm:block" />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-6">
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
                className="h-full min-h-0 flex flex-col gap-3 lg:gap-4"
              >
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(220px,34%)_1fr] gap-4 lg:gap-6 items-center">
                  <motion.div
                    initial={{ rotateY: 90, scale: 0.8 }}
                    animate={{ rotateY: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                    className={`relative mx-auto w-full max-w-[280px] lg:max-w-none h-[min(46vh,420px)] lg:h-full max-h-[460px] aspect-[2/3] lg:aspect-auto rounded-3xl overflow-hidden border-4 bg-gradient-to-b ${getCardTheme(selectedCard.type).shell} ${getCardTheme(selectedCard.type).glow} flex flex-col items-center justify-between p-5`}
                  >
                    <span className="px-3 py-1 bg-yellow-300 text-slate-950 font-black text-xs rounded-full uppercase tracking-widest">
                      ★ Your pick ★
                    </span>
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-black/40 border-2 border-white/50 flex items-center justify-center shadow-2xl">
                      {getCardIcon(selectedCard.type, 'w-16 h-16 sm:w-20 sm:h-20')}
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="font-mario text-3xl sm:text-4xl text-yellow-100 text-shadow-mario leading-tight">
                        {selectedCard.title}
                      </h3>
                      {selectedCard.coins > 0 && (
                        <div className="inline-flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded-full border border-yellow-200/50">
                          <span className="font-mario text-2xl text-yellow-200">+{selectedCard.coins}</span>
                          <MarioCoin size="md" />
                        </div>
                      )}
                    </div>
                  </motion.div>

                  <div className="min-h-0 flex flex-col justify-center gap-4 text-center lg:text-left">
                    <div>
                      <p className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-yellow-300 mb-1">
                        Mystery card get
                      </p>
                      <h3 className="font-mario text-3xl sm:text-4xl lg:text-5xl text-white text-shadow-mario leading-tight">
                        {selectedCard.title}
                      </h3>
                      <p className="mt-2 text-lg sm:text-xl lg:text-2xl font-bold text-amber-200">
                        {selectedCard.subtitle}
                      </p>
                      <p className="mt-3 text-base sm:text-lg lg:text-xl text-slate-100 leading-snug max-w-2xl mx-auto lg:mx-0">
                        {selectedCard.description}
                      </p>
                    </div>

                    {/* INTERACTIVE CARD LOGIC BRANCHES */}

                    {/* 1. BOO: Select Team First, Then Roll Die */}
                    {(selectedCard.type === 'ghost_steal_5' || selectedCard.type === 'boo_steal_5') && (
                      <div className="space-y-4">
                        {!booTargetTeamId ? (
                          <div className="p-4 bg-purple-950/80 rounded-2xl border border-purple-400/50">
                            <div className="flex items-center justify-center lg:justify-start gap-2 text-purple-200 mb-3">
                              <Ghost className="w-6 h-6 text-purple-300" />
                              <h4 className="font-mario text-xl sm:text-2xl text-white">
                                Step 1: Choose a Rival Team to Target!
                              </h4>
                            </div>
                            <p className="text-xs text-purple-200 mb-3 text-center lg:text-left">
                              Select the opponent team Boo will sneak up on. Afterwards, roll the die to steal coins!
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                              {eligibleOpponents.map(opp => {
                                const oppChar = CHARACTERS[opp.characterId];
                                return (
                                  <button
                                    key={opp.id}
                                    type="button"
                                    onClick={() => {
                                      setBooTargetTeamId(opp.id);
                                      sounds.playBoo();
                                    }}
                                    className={`p-3 rounded-xl border ${oppChar.bgColor} bg-opacity-70 border-white/30 text-white font-bold hover:scale-105 transition-all cursor-pointer flex flex-col items-center gap-1.5`}
                                  >
                                    <TeamAvatar characterId={opp.characterId} size="md" customUrl={opp.customImageUrl} />
                                    <span className="text-xs truncate w-full text-center">{opp.name}</span>
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/40 border border-white/20">
                                      <MarioCoin size="xs" />
                                      <span className={`text-sm font-mario ${opp.coins < 0 ? 'text-red-400' : 'text-yellow-300'}`}>
                                        {opp.coins}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 justify-center lg:justify-start">
                              <span className="text-sm font-bold text-slate-300">Targeting:</span>
                              <span className="px-3 py-1 rounded-full bg-purple-900 border border-purple-400 text-white text-sm font-bold flex items-center gap-2">
                                <Ghost className="w-4 h-4 text-purple-300" />
                                {targetOpponent?.name} ({targetOpponent?.coins} Coins)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setBooTargetTeamId(null);
                                  setBooDieRoll(null);
                                }}
                                className="text-xs text-amber-300 underline cursor-pointer hover:text-amber-200"
                              >
                                Change Target
                              </button>
                            </div>

                            <DiceRoller
                              title="Step 2: Roll the Steal Die!"
                              subtitle={`Roll a six-sided die to determine how many coins Boo steals from ${targetOpponent?.name}!`}
                              themeColor="purple"
                              onRollComplete={val => setBooDieRoll(val)}
                            />

                            {booDieRoll !== null && (
                              <button
                                type="button"
                                onClick={handleFinishBooSteal}
                                className="self-center lg:self-start px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mario text-xl sm:text-2xl rounded-2xl shadow-xl border-2 border-purple-300 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                              >
                                <Ghost className="w-6 h-6" />
                                STEAL {booDieRoll} COINS & CONTINUE
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. KING BOO: Roll Die to Steal from EACH Other Team */}
                    {(selectedCard.type === 'king_boo' || selectedCard.type === 'boo_steal_10') && (
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
                              className="px-8 py-3.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-mario text-xl sm:text-2xl rounded-2xl shadow-xl border-2 border-fuchsia-300 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                            >
                              <Crown className="w-6 h-6" />
                              CLAIM KING BOO HEIST (+{kingBooDieRoll * eligibleOpponents.length} COINS)
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. BOWSER'S REVOLUTION: Swap coin totals with one other team */}
                    {selectedCard.type === 'bowser_revolution' && (
                      <div className="p-4 bg-orange-950/80 rounded-2xl border border-orange-500/50 space-y-3">
                        <div className="flex items-center justify-center lg:justify-start gap-2 text-orange-200">
                          <Flame className="w-6 h-6 text-orange-400" />
                          <h4 className="font-mario text-xl sm:text-2xl text-white">
                            Choose a Rival Team to Swap Coin Totals With!
                          </h4>
                        </div>
                        <p className="text-xs text-orange-200 text-center lg:text-left">
                          {currentTeam.name} currently has <strong>{currentTeam.coins} coins</strong>. Choose an opponent below to swap bank totals!
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
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
                                className={`p-3 rounded-xl border ${oppChar.bgColor} bg-opacity-70 text-white font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                                  isSelected ? 'border-yellow-300 ring-4 ring-orange-400 scale-105' : 'border-white/30 hover:scale-102'
                                }`}
                              >
                                <TeamAvatar characterId={opp.characterId} size="md" customUrl={opp.customImageUrl} />
                                <span className="text-xs truncate w-full text-center">{opp.name}</span>
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/50 border border-white/20">
                                  <MarioCoin size="xs" />
                                  <span className={`text-sm font-mario ${opp.coins < 0 ? 'text-red-400' : 'text-yellow-300'}`}>
                                    {opp.coins}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {swapOpponent && (
                          <div className="pt-2 flex flex-col items-center lg:items-start gap-2.5">
                            <div className="p-2.5 bg-black/60 rounded-xl border border-orange-400/60 flex items-center gap-3 text-sm text-white font-bold">
                              <span>{currentTeam.name} ({currentTeam.coins})</span>
                              <ArrowRightLeft className="w-5 h-5 text-yellow-300 animate-pulse" />
                              <span>{swapOpponent.name} ({swapOpponent.coins})</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleFinishBowserRevolution}
                              className="px-8 py-3.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-mario text-xl sm:text-2xl rounded-2xl shadow-xl border-2 border-orange-300 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                            >
                              <Flame className="w-6 h-6" />
                              CONFIRM COIN SWAP & CONTINUE
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4. BOWSER'S FURY: -5 Coins to Each Other Team */}
                    {selectedCard.type === 'bowser_fury' && (
                      <div className="p-4 bg-red-950/90 rounded-2xl border border-red-500/60 space-y-3">
                        <div className="flex items-center justify-center lg:justify-start gap-2 text-amber-200">
                          <Flame className="w-6 h-6 text-red-500 animate-pulse" />
                          <h4 className="font-mario text-xl sm:text-2xl text-white">
                            Bowser's Fury Scorches All Rival Teams!
                          </h4>
                        </div>
                        <p className="text-xs sm:text-sm text-red-200 text-center lg:text-left">
                          Each of the {eligibleOpponents.length} rival teams is hit by fiery meteors and loses 5 coins!
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {eligibleOpponents.map(opp => {
                            const oppChar = CHARACTERS[opp.characterId];
                            return (
                              <div
                                key={opp.id}
                                className={`p-2 rounded-xl border ${oppChar.bgColor} bg-opacity-70 border-red-400/50 text-white flex flex-col items-center gap-1`}
                              >
                                <TeamAvatar characterId={opp.characterId} size="sm" customUrl={opp.customImageUrl} />
                                <span className="text-xs truncate w-full text-center">{opp.name}</span>
                                <span className="font-mario text-red-400 text-sm font-bold bg-black/60 px-2 py-0.5 rounded-full border border-red-500/60">
                                  -5 Coins
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="pt-2 flex justify-center lg:justify-start">
                          <button
                            type="button"
                            onClick={handleFinishBowserFury}
                            className="px-8 py-3.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mario text-xl sm:text-2xl rounded-2xl shadow-xl border-2 border-red-300 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                          >
                            <Flame className="w-6 h-6" />
                            UNLEASH BOWSER'S FURY & CONTINUE
                          </button>
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
                              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mario text-xl sm:text-2xl rounded-2xl shadow-xl border-2 border-blue-300 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                            >
                              <BoxSelect className="w-6 h-6" />
                              APPLY POW BLOCK ({powChoice.toUpperCase()}: {powChoice === 'highest' ? maxCoins : minCoins} COINS)
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Standard Cards (Coins, Super Mushroom, Blue Shell) */}
                    {selectedCard.type !== 'ghost_steal_5' &&
                      selectedCard.type !== 'boo_steal_5' &&
                      selectedCard.type !== 'king_boo' &&
                      selectedCard.type !== 'boo_steal_10' &&
                      selectedCard.type !== 'bowser_revolution' &&
                      selectedCard.type !== 'bowser_fury' &&
                      selectedCard.type !== 'pow_block' &&
                      selectedCard.type !== 'hidden_block' && (
                        <button
                          type="button"
                          onClick={handleFinishStandard}
                          className="self-center lg:self-start px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-mario text-xl sm:text-2xl rounded-2xl shadow-xl border-2 border-emerald-300/70 flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                        >
                          <Sparkles className="w-6 h-6" />
                          CLAIM & CONTINUE
                        </button>
                    )}
                  </div>
                </div>

                {/* The Other Cards Preview */}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
