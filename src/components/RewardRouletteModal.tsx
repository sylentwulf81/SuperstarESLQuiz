import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Ghost, Crown, Flame, Gift, Coins, Star, Award, ShieldAlert, Trophy } from 'lucide-react';
import { RewardCard, Team } from '../types';
import { CHARACTERS } from '../data/characters';
import { sounds } from '../utils/sound';
import { MarioCoin } from './MarioCoin';
import { TeamAvatar } from './TeamAvatar';

interface RewardRouletteModalProps {
  cards: RewardCard[];
  currentTeam: Team;
  teams: Team[];
  theme?: 'summer' | 'christmas';
  onCardSelected: (card: RewardCard, targetTeamId?: string) => void;
  onClose: () => void;
}

export const RewardRouletteModal: React.FC<RewardRouletteModalProps> = ({
  cards,
  currentTeam,
  teams,
  theme = 'summer',
  onCardSelected,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedCard, setSelectedCard] = useState<RewardCard | null>(null);
  const [showSpecialBanner, setShowSpecialBanner] = useState(false);

  // Boo steal target selection state
  const [showStealPrompt, setShowStealPrompt] = useState(false);

  const charInfo = CHARACTERS[currentTeam.characterId];
  const eligibleOpponents = teams.filter(t => t.id !== currentTeam.id);

  const handlePickCard = (card: RewardCard, index: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    setSelectedCard(card);
    // Reveal the picked card immediately
    setRevealedIndices([index]);

    // Play triumphant ascending item fanfare
    sounds.playSpecialCardFanfare();

    // After 400ms, reveal all remaining cards so the group can see the full deck
    setTimeout(() => {
      setRevealedIndices([0, 1, 2, 3, 4, 5]);
      setIsRevealed(true);
      setShowSpecialBanner(true);
    }, 450);

    // Auto-dismiss the floating banner effect after 3.2s so user can interact cleanly
    setTimeout(() => {
      setShowSpecialBanner(false);
    }, 3600);

    // Trigger complementary sound after short delay based on card type
    setTimeout(() => {
      if (card.type === 'bowser_revolution') {
        sounds.playBowser();
      } else if (card.type === 'ghost_steal_5' || card.type === 'boo_steal_5' || card.type === 'boo_steal_10') {
        sounds.playBoo();
        setShowStealPrompt(true);
      } else if (card.type === 'super_star_x2' || card.type === 'mushroom_x2') {
        sounds.playSuperstar();
      } else if (card.type === 'blue_shell') {
        sounds.playBlueShell();
      } else if (card.type === 'hidden_block') {
        sounds.playPowerUp();
      } else if (card.type === 'super_coins_10' || card.type === 'coins_10') {
        sounds.playStarCoin();
      } else {
        sounds.playCoin();
      }
    }, 900);
  };

  const handleConfirmSteal = (targetTeamId: string) => {
    if (!selectedCard) return;
    sounds.playStealConfirmed();
    onCardSelected(selectedCard, targetTeamId);
  };

  const handleFinish = () => {
    if (!selectedCard) return;
    if (selectedCard.coins > 0 || selectedCard.stars > 0) {
      sounds.playClaimReward();
    } else {
      sounds.playPowerUp();
    }
    onCardSelected(selectedCard);
  };

  const getCardIcon = (type: string) => {
    const iconClass = "w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11";
    switch (type) {
      case 'bowser_revolution': return <Flame className={`${iconClass} text-orange-400 fill-orange-400`} />;
      case 'ghost_steal_5':
      case 'boo_steal_5': return <Ghost className={`${iconClass} text-indigo-300`} />;
      case 'boo_steal_10': return <Crown className={`${iconClass} text-purple-400`} />;
      case 'super_star_x2': return <Star className={`${iconClass} text-yellow-300 fill-yellow-400 animate-pulse`} />;
      case 'blue_shell': return <ShieldAlert className={`${iconClass} text-sky-400 fill-sky-500/30`} />;
      case 'super_coins_10': return <Trophy className={`${iconClass} text-yellow-400 fill-yellow-500/30`} />;
      case 'mushroom_x2': return <Zap className={`${iconClass} text-red-400 fill-red-400`} />;
      case 'hidden_block': return <Gift className={`${iconClass} text-amber-400`} />;
      default: return <Coins className={`${iconClass} text-yellow-300 fill-yellow-400`} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="relative w-full max-w-[96vw] xl:max-w-7xl 2xl:max-w-[1520px] bg-slate-900 rounded-3xl border border-white/20 shadow-2xl overflow-hidden my-auto"
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-yellow-400 to-indigo-500 opacity-90 shadow-[0_0_15px_rgba(234,179,8,0.5)]" />

        {/* Banner */}
        <div className="bg-slate-800/90 px-3 sm:px-6 py-3 sm:py-4 border-b border-white/15 relative flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Top Left: Current Picking Team Emblem & Name */}
          <div className="sm:absolute sm:left-4 sm:top-1/2 sm:-translate-y-1/2 flex items-center gap-2 sm:gap-2.5 bg-slate-950/80 border border-yellow-400/60 rounded-2xl px-2.5 sm:px-3 py-1.5 shadow-lg backdrop-blur-sm z-10 self-start sm:self-auto">
            <TeamAvatar 
              characterId={currentTeam.characterId} 
              size="md" 
              customUrl={currentTeam.customImageUrl} 
              className="ring-2 ring-yellow-400 shadow-md"
            />
            <div className="text-left leading-tight">
              <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300 block">
                Current Team
              </span>
              <span className="text-xs sm:text-sm font-bold text-white block max-w-[120px] sm:max-w-[170px] truncate">
                {currentTeam.name}
              </span>
            </div>
          </div>

          {/* Center Title */}
          <div className="w-full text-center sm:px-36">
            <h2 className="font-mario text-2xl sm:text-3xl lg:text-4xl text-white text-shadow-mario tracking-wider">
              {isRevealed ? 'CARD REVEALED!' : 'PLEASE PICK ONE CARD...'}
            </h2>
            <p className="text-xs sm:text-sm font-bold text-indigo-200 mt-0.5">
              Choose 1 of the 6 Mystery Cards for {currentTeam.name}!
            </p>
          </div>
        </div>

        {/* SPECIAL CARD GET POPUP OVERLAY */}
        <AnimatePresence>
          {showSpecialBanner && selectedCard && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -20 }}
              transition={{ type: "spring", damping: 14, stiffness: 240 }}
              className="absolute inset-0 z-30 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="relative max-w-lg w-full bg-slate-950 rounded-3xl p-6 sm:p-8 border-2 border-yellow-400 text-center shadow-[0_0_60px_rgba(250,204,21,0.6)] overflow-hidden">
                {/* Radial Glow Rays Background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/30 via-indigo-600/20 to-transparent pointer-events-none animate-pulse" />

                {/* Top decorative sparkle badges */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
                  <span className="font-bold text-xs uppercase tracking-widest text-yellow-300 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-400/40">
                    ★ LUCKY REVEAL ★
                  </span>
                  <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
                </div>

                {/* Main Stylized POPUP TEXT */}
                <motion.h1
                  animate={{ scale: [1, 1.05, 1], rotate: [-1, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="font-mario text-3xl sm:text-5xl text-yellow-300 text-shadow-gold tracking-wider leading-tight"
                >
                  SPECIAL CARD GET!
                </motion.h1>

                {/* Card Specific Callout */}
                <div className="mt-4 flex items-center justify-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/20 shrink-0">
                    {getCardIcon(selectedCard.type)}
                  </div>
                  <div className="text-left min-w-0">
                    <span className="font-mario text-lg sm:text-xl text-yellow-300 block truncate drop-shadow">
                      {selectedCard.title}
                    </span>
                    <span className="text-xs text-indigo-100 font-semibold block">
                      {selectedCard.subtitle}
                    </span>
                  </div>
                </div>

                {selectedCard.coins > 0 && (
                  <div className="mt-3 inline-block bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-mario text-base sm:text-lg px-5 py-1 rounded-full shadow-lg border border-yellow-100">
                    +{selectedCard.coins} COINS!
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6 Mystery Cards Layout (2:3 Aspect Ratio) */}
        <div className="p-3 sm:p-5 lg:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
            {cards.map((card, idx) => {
              const isThisPicked = selectedIndex === idx;
              const isCardFlipped = revealedIndices.includes(idx);

              return (
                <div key={idx} className="flex flex-col items-center gap-2 sm:gap-2.5">
                  <div
                    className="relative w-full aspect-[2/3] [perspective:1000px] select-none cursor-pointer"
                    onClick={() => !isRevealed && handlePickCard(card, idx)}
                  >
                    <motion.div
                      whileHover={!isCardFlipped ? { scale: 1.05, y: -4 } : undefined}
                      whileTap={!isCardFlipped ? { scale: 0.96 } : undefined}
                      animate={{
                        rotateY: isCardFlipped ? 180 : 0,
                        scale: isThisPicked ? 1.04 : 1,
                      }}
                      transition={{
                        rotateY: { duration: 0.65, ease: [0.34, 1.56, 0.64, 1] },
                        scale: { duration: 0.2 },
                      }}
                      style={{ transformStyle: 'preserve-3d' }}
                      className="relative w-full h-full"
                    >
                      {/* ================= CARD BACK ================= */}
                      <div
                        style={{ backfaceVisibility: 'hidden' }}
                        className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/90 bg-gradient-to-br from-red-700 via-rose-900 to-red-950 flex flex-col items-center justify-between p-2.5 sm:p-3 transition-shadow ${
                          !isCardFlipped ? 'hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]' : ''
                        }`}
                      >
                        {/* Repeating Argyle / Diamond Lattice SVG Pattern */}
                        <svg
                          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <defs>
                            <pattern
                              id={`argyle-${idx}`}
                              width="28"
                              height="28"
                              patternUnits="userSpaceOnUse"
                            >
                              <path
                                d="M14 0 L28 14 L14 28 L0 14 Z"
                                fill="none"
                                stroke="#fbbf24"
                                strokeWidth="1"
                              />
                              <circle cx="14" cy="14" r="1.5" fill="#fde047" />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill={`url(#argyle-${idx})`} />
                        </svg>

                        {/* Inset Gold Filigree Border */}
                        <div className="absolute inset-1.5 sm:inset-2 rounded-xl border border-amber-300/40 pointer-events-none" />

                        {/* 4 Corner Ornate Stars */}
                        <div className="absolute top-2 left-2 pointer-events-none text-amber-300 text-[9px] sm:text-[11px] leading-none">★</div>
                        <div className="absolute top-2 right-2 pointer-events-none text-amber-300 text-[9px] sm:text-[11px] leading-none">★</div>
                        <div className="absolute bottom-2 left-2 pointer-events-none text-amber-300 text-[9px] sm:text-[11px] leading-none">★</div>
                        <div className="absolute bottom-2 right-2 pointer-events-none text-amber-300 text-[9px] sm:text-[11px] leading-none">★</div>

                        {/* Top Banner Ribbon */}
                        <div className="relative z-10 pt-0.5 sm:pt-1 text-center">
                          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-black/60 border border-amber-400/50 shadow-sm">
                            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-300 shrink-0" />
                            <span className="font-mario text-[10px] sm:text-xs text-yellow-300 tracking-wider drop-shadow whitespace-nowrap">
                              SUPER MARIO
                            </span>
                            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-300 shrink-0" />
                          </div>
                        </div>

                        {/* Center Medallion / Question Mark Seal */}
                        <div className="relative z-10 my-auto flex flex-col items-center">
                          {/* Outer concentric golden ring */}
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full p-1 sm:p-1.5 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 shadow-[0_0_20px_rgba(250,204,21,0.5)] flex items-center justify-center">
                            {/* Inner red seal ring */}
                            <div className="w-full h-full rounded-full bg-gradient-to-b from-red-900 to-red-950 border border-yellow-200/60 flex items-center justify-center shadow-inner relative overflow-hidden">
                              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400/30 via-transparent to-transparent pointer-events-none" />
                              {/* Iconic 3D Question Mark */}
                              <span className="font-mario text-3xl sm:text-4xl md:text-5xl text-yellow-300 text-shadow-mario relative z-10 leading-none">
                                ?
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Prompt */}
                        <div className="relative z-10 pb-0.5 sm:pb-1 text-center">
                          <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-amber-200 uppercase tracking-wider bg-black/50 px-2 sm:px-2.5 py-0.5 rounded-full border border-amber-400/40 inline-block animate-pulse whitespace-nowrap">
                            TAP TO PICK
                          </span>
                        </div>

                        {/* Specular Diagonal Holographic Sheen */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -skew-x-12 pointer-events-none" />
                      </div>

                      {/* ================= CARD FRONT (Face side) ================= */}
                      <div
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                        className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl border-2 p-2 sm:p-2.5 md:p-3 flex flex-col justify-between text-center transition-all ${
                          isThisPicked
                            ? 'border-yellow-300 ring-4 ring-yellow-400/90 bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-900 shadow-[0_0_35px_rgba(250,204,21,0.6)] z-20'
                            : 'border-white/20 bg-slate-900/95 opacity-80'
                        }`}
                      >
                        {/* Inset Hairline Border */}
                        <div className="absolute inset-1.5 sm:inset-2 rounded-xl border border-white/15 pointer-events-none" />

                        {/* Top Badge: Only show YOUR PICK if this card was picked */}
                        <div className="relative z-10 min-h-[20px] sm:min-h-[22px] flex items-center justify-center">
                          {isThisPicked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 font-black text-[9px] sm:text-[10px] rounded-full uppercase tracking-wider shadow-lg border border-yellow-200">
                              ★ YOUR PICK! ★
                            </span>
                          )}
                        </div>

                        {/* Center Artwork & Description */}
                        <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full px-0.5">
                          <div className="p-2 sm:p-2.5 rounded-2xl bg-black/50 border border-white/20 mb-1.5 shadow-inner shrink-0">
                            {getCardIcon(card.type)}
                          </div>
                          <h4 className="font-mario text-xs sm:text-sm md:text-base text-yellow-300 leading-snug drop-shadow text-center w-full px-0.5 line-clamp-2">
                            {card.title}
                          </h4>
                          <p className="text-[10px] sm:text-xs text-slate-100 mt-1 leading-snug font-semibold text-center w-full px-0.5 line-clamp-3">
                            {card.subtitle}
                          </p>
                        </div>

                        {/* Coin reward bar: only shown if coins > 0 */}
                        <div className="relative z-10 min-h-[26px] sm:min-h-[30px] flex items-center justify-center w-full">
                          {card.coins > 0 && (
                            <div className="w-full bg-amber-500/25 border border-amber-400/50 rounded-xl py-0.5 px-2 flex items-center justify-center gap-1.5 shadow-sm">
                              <span className="font-mario text-amber-300 text-xs sm:text-sm">
                                +{card.coins}
                              </span>
                              <MarioCoin size="xs" />
                            </div>
                          )}
                        </div>

                        {/* Specular Diagonal Sheen */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -skew-x-12 pointer-events-none" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Large Fun Classroom Number Badge Under Card */}
                  <motion.button
                    type="button"
                    onClick={() => !isRevealed && handlePickCard(card, idx)}
                    disabled={isRevealed}
                    whileHover={!isRevealed ? { scale: 1.1, y: -2 } : undefined}
                    whileTap={!isRevealed ? { scale: 0.94 } : undefined}
                    title={`Pick Card #${idx + 1}`}
                    className={`w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl cursor-pointer select-none border-2 relative overflow-hidden ${
                      isThisPicked
                        ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 border-white ring-4 ring-yellow-400/90 scale-105 shadow-[0_0_20px_rgba(250,204,21,0.85)]'
                        : isCardFlipped
                        ? 'bg-slate-800/80 text-slate-400 border-white/20 opacity-70'
                        : 'bg-gradient-to-b from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-yellow-300 border-amber-300/80 shadow-[0_4px_14px_rgba(0,0,0,0.5)] active:scale-95'
                    }`}
                  >
                    <span className="font-mario text-2xl sm:text-3xl md:text-4xl leading-none drop-shadow-md">
                      {idx + 1}
                    </span>
                  </motion.button>
                </div>
              );
            })}
          </div>

          {/* Steal Target Selection (If Boo was drawn) */}
          {showStealPrompt && selectedCard && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 sm:p-6 bg-purple-950/90 rounded-2xl border border-purple-400/50 text-center space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-center gap-2 text-purple-300">
                <Ghost className="w-6 h-6 animate-bounce" />
                <h3 className="font-mario text-xl sm:text-2xl text-white">
                  WHO WILL BOO STEAL {selectedCard.coins} COINS FROM?
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-2xl mx-auto">
                {eligibleOpponents.map(opp => {
                  const oppChar = CHARACTERS[opp.characterId];
                  return (
                    <button
                      key={opp.id}
                      onClick={() => handleConfirmSteal(opp.id)}
                      className={`p-3 rounded-xl border ${oppChar.bgColor} bg-opacity-60 border-white/30 text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-md flex flex-col items-center gap-1 cursor-pointer`}
                    >
                      <TeamAvatar characterId={opp.characterId} size="md" customUrl={opp.customImageUrl} />
                      <span className="text-xs truncate w-full text-center">{opp.name}</span>
                      <span className={`text-xs font-mario flex items-center justify-center gap-1 ${opp.coins < 0 ? 'text-red-400 font-black' : 'text-yellow-300'}`}>
                        {opp.coins}
                        <MarioCoin size="xs" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Normal Finish Action */}
          {isRevealed && !showStealPrompt && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleFinish}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-mario text-xl rounded-2xl shadow-xl border border-emerald-300/60 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                CLAIM REWARD & CONTINUE
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
