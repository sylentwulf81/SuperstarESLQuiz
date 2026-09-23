import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '@/shared/utils/sound';
import { 
  X, HelpCircle, Trophy, Sparkles, Ghost, Flame, Zap, Gift, Coins, 
  ShieldAlert, Volume2, BookOpen, Layers, Play, CheckCircle2,
  GraduationCap, Users, Gamepad2, Sliders, Settings2, Monitor, Languages, Crown, BoxSelect
} from 'lucide-react';
import { REWARD_CARDS } from '@/games/mario-party-quiz/data/rewards';
import { RewardCard } from '@/shared/types';
import { GUIDE_TRANSLATIONS, GuideLanguage } from '@/games/mario-party-quiz/data/guideContent';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';

interface RulebookModalProps {
  onClose: () => void;
  onTestCardInGame?: (card: RewardCard) => void;
  activeTeamName?: string;
  initialTab?: 'guide' | 'rules' | 'mystery_cards';
}

export const RulebookModal: React.FC<RulebookModalProps> = ({ 
  onClose,
  onTestCardInGame,
  activeTeamName,
  initialTab = 'guide'
}) => {
  useBodyScrollLock();
  const [activeTab, setActiveTab] = useState<'guide' | 'rules' | 'mystery_cards'>(initialTab);
  const [language, setLanguage] = useState<GuideLanguage>(() => {
    try {
      const saved = localStorage.getItem('mario_guide_lang');
      return saved === 'ja' ? 'ja' : 'en';
    } catch {
      return 'en';
    }
  });

  const [activeTestedCard, setActiveTestedCard] = useState<RewardCard | null>(null);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  const t = GUIDE_TRANSLATIONS[language];

  const handleLanguageToggle = (lang: GuideLanguage) => {
    sounds.playClick();
    setLanguage(lang);
    try {
      localStorage.setItem('mario_guide_lang', lang);
    } catch {
      // Ignore localstorage errors
    }
  };

  const handleCardClick = (card: RewardCard) => {
    setActiveTestedCard(card);
    setAppliedNotification(null);

    // Play authentic card sound effect
    switch (card.type) {
      case 'bowser_revolution':
        sounds.playBowser();
        break;
      case 'bowser_fury':
        sounds.playBowserFury();
        break;
      case 'ghost_steal_5':
      case 'boo_steal_5':
      case 'boo_steal_10':
      case 'king_boo':
        sounds.playBoo();
        break;
      case 'super_star_x2':
      case 'mushroom_x2':
        sounds.playPowerUp();
        break;
      case 'blue_shell':
        sounds.playBlueShell();
        break;
      case 'pow_block':
      case 'hidden_block':
        sounds.playPowBlock();
        break;
      case 'super_coins_10':
      case 'coins_10':
        sounds.playStarCoin();
        break;
      case 'great_coins_3':
      case 'wonderful_coins_5':
      case 'coins_3':
      case 'coins_5':
      case 'coins_1':
      default:
        sounds.playCoin();
        break;
    }
  };

  const handleApplyToGame = (card: RewardCard) => {
    if (!onTestCardInGame) return;
    onTestCardInGame(card);
    setAppliedNotification(
      language === 'ja'
        ? `「${t.mysteryCards.cardDescriptions[card.id]?.title || card.title}」を${activeTeamName || '手番チーム'}に適用しました！手番は継続します。`
        : `Applied "${t.mysteryCards.cardDescriptions[card.id]?.title || card.title}" to ${activeTeamName || 'the active team'}! Current turn remains active.`
    );
    setTimeout(() => setAppliedNotification(null), 3500);
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'bowser_revolution':
        return <Flame className="w-8 h-8 text-orange-400 fill-orange-400" />;
      case 'bowser_fury':
        return <Flame className="w-8 h-8 text-red-500 fill-red-500 animate-pulse" />;
      case 'ghost_steal_5':
      case 'boo_steal_5':
        return <Ghost className="w-8 h-8 text-indigo-300" />;
      case 'boo_steal_10':
      case 'king_boo':
        return <Crown className="w-8 h-8 text-purple-400" />;
      case 'super_star_x2':
      case 'mushroom_x2':
        return <Zap className="w-8 h-8 text-red-400 fill-red-400 animate-pulse" />;
      case 'blue_shell':
        return <ShieldAlert className="w-8 h-8 text-sky-400 fill-sky-500/30" />;
      case 'super_coins_10':
        return <Trophy className="w-8 h-8 text-yellow-400 fill-yellow-500/30" />;
      case 'pow_block':
        return <BoxSelect className="w-8 h-8 text-blue-400" />;
      case 'hidden_block':
        return <Gift className="w-8 h-8 text-amber-400" />;
      default:
        return <Coins className="w-8 h-8 text-yellow-300 fill-yellow-400" />;
    }
  };

  const getCardStyle = (cardId: string) => {
    switch (cardId) {
      case 'bowser_revolution':
        return 'from-red-950/90 via-slate-900 to-orange-950/80 border-orange-500/60 shadow-[0_0_20px_rgba(249,115,22,0.25)]';
      case 'bowser_fury':
        return 'from-red-950/90 via-slate-900 to-amber-950/80 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.25)]';
      case 'blue_shell':
        return 'from-sky-950/90 via-slate-900 to-blue-950/80 border-sky-400/60 shadow-[0_0_20px_rgba(56,189,248,0.25)]';
      case 'super_star_x2':
      case 'mushroom_x2':
        return 'from-rose-950/90 via-slate-900 to-red-950/80 border-red-400/60 shadow-[0_0_25px_rgba(244,63,94,0.3)]';
      case 'ghost_steal_5':
      case 'boo_steal_5':
        return 'from-purple-950/90 via-slate-900 to-indigo-950/80 border-purple-400/50 shadow-[0_0_20px_rgba(192,132,252,0.25)]';
      case 'boo_steal_10':
      case 'king_boo':
        return 'from-fuchsia-950/90 via-slate-900 to-purple-950/80 border-fuchsia-400/60 shadow-[0_0_20px_rgba(217,70,239,0.25)]';
      case 'super_coins_10':
        return 'from-yellow-950/90 via-slate-900 to-amber-950/80 border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.25)]';
      case 'pow_block':
        return 'from-blue-950/90 via-slate-900 to-indigo-950/80 border-blue-400/60 shadow-[0_0_20px_rgba(59,130,246,0.25)]';
      case 'hidden_block':
        return 'from-emerald-950/90 via-slate-900 to-amber-950/80 border-emerald-400/50 shadow-[0_0_20px_rgba(52,211,153,0.25)]';
      default:
        return 'from-indigo-950/80 via-slate-900 to-slate-950 border-amber-400/40 shadow-lg';
    }
  };

  const getSectionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users': return <Users className="w-5 h-5 text-amber-400" />;
      case 'Gamepad2': return <Gamepad2 className="w-5 h-5 text-emerald-400" />;
      case 'Sliders': return <Sliders className="w-5 h-5 text-sky-400" />;
      case 'HelpCircle': return <HelpCircle className="w-5 h-5 text-yellow-300" />;
      case 'Settings2': return <Settings2 className="w-5 h-5 text-purple-400" />;
      case 'Trophy': return <Trophy className="w-5 h-5 text-amber-300" />;
      case 'Monitor': return <Monitor className="w-5 h-5 text-cyan-400" />;
      default: return <Sparkles className="w-5 h-5 text-yellow-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/85 overflow-hidden">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="relative w-full max-w-5xl bg-slate-900 rounded-3xl border border-white/20 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]"
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 opacity-90 shadow-[0_0_15px_rgba(250,204,21,0.5)]" />

        {/* Header with Title and Language Toggle */}
        <div className="bg-slate-800/95 p-3.5 sm:p-4 text-white flex flex-wrap items-center justify-between gap-3 border-b border-white/15 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-yellow-400/20 border border-yellow-300/40 shrink-0">
              <GraduationCap className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="font-mario text-lg sm:text-2xl text-yellow-300 drop-shadow tracking-wider leading-tight">
                {t.header.title}
              </h2>
              <p className="text-xs text-indigo-200 line-clamp-1">{t.header.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Language Selector: English / Japanese */}
            <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-white/20 shadow-inner">
              <div className="flex items-center gap-1 px-2 text-indigo-300 text-xs font-semibold">
                <Languages className="w-3.5 h-3.5 text-yellow-400" />
                <span className="hidden sm:inline">Language:</span>
              </div>
              <button
                onClick={() => handleLanguageToggle('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Switch to English guide"
              >
                🇬🇧 English
              </button>
              <button
                onClick={() => handleLanguageToggle('ja')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'ja'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="日本語ガイドに切り替え"
              >
                🇯🇵 日本語
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => { sounds.playClick(); onClose(); }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 cursor-pointer shrink-0"
              aria-label={t.header.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher (3 Tabs: Teacher Guide, Rules, Mystery Cards) */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 pt-3 pb-2 bg-slate-950/70 border-b border-white/10 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { sounds.playClick(); setActiveTab('guide'); }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-mario text-xs sm:text-sm md:text-base transition-all cursor-pointer shrink-0 ${
              activeTab === 'guide'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md shadow-yellow-500/30'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            {t.tabs.guide}
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab('rules'); }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-mario text-xs sm:text-sm md:text-base transition-all cursor-pointer shrink-0 ${
              activeTab === 'rules'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md shadow-yellow-500/30'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            {t.tabs.rules}
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab('mystery_cards'); }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-mario text-xs sm:text-sm md:text-base transition-all cursor-pointer shrink-0 ${
              activeTab === 'mystery_cards'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md shadow-yellow-500/30'
                : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            {t.tabs.cards} ({REWARD_CARDS.length})
          </button>
        </div>

        {/* Tab 1: TEACHER & HOST GUIDE */}
        {activeTab === 'guide' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-slate-200 flex-1">
            {/* Guide Intro Banner */}
            <div className="p-4 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 rounded-2xl border-2 border-indigo-400/40 shadow-lg">
              <h3 className="font-mario text-lg sm:text-xl text-yellow-300 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                {t.hostGuide.title}
              </h3>
              <p className="text-xs sm:text-sm text-indigo-100 mt-1 leading-relaxed">
                {t.hostGuide.subtitle}
              </p>
            </div>

            {/* Step-by-Step Interactive Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {t.hostGuide.sections.map((sec) => (
                <div
                  key={sec.id}
                  className="p-4 bg-slate-800/85 hover:bg-slate-800 transition-all rounded-2xl border border-white/15 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-2.5 pb-2 border-b border-white/10">
                      {getSectionIcon(sec.icon)}
                      <h4 className="font-mario text-sm sm:text-base text-yellow-300 leading-snug">
                        {sec.title}
                      </h4>
                    </div>

                    <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200 leading-relaxed list-disc list-outside pl-4">
                      {sec.points.map((pt, i) => (
                        <li key={i} className="text-indigo-100">
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {sec.tip && (
                    <div className="mt-3 p-2 rounded-xl bg-amber-500/15 border border-amber-400/30 text-[11px] sm:text-xs text-amber-200 font-medium">
                      {sec.tip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: GAME RULES */}
        {activeTab === 'rules' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-200 flex-1">
            {/* Overview */}
            <div className="space-y-2 p-4 bg-slate-800/80 rounded-2xl border border-white/15 shadow-md">
              <h3 className="font-mario text-lg sm:text-xl text-yellow-300 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" /> {t.gameRules.title}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-indigo-100">
                {t.gameRules.overview}
              </p>
            </div>

            {/* Question Types */}
            <div className="space-y-3">
              <h3 className="font-mario text-base sm:text-lg text-yellow-300 flex items-center gap-2">
                ❓ {t.gameRules.questionTypesTitle}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {t.gameRules.questionTypes.map((q, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-800/80 rounded-2xl border border-white/15 shadow-md">
                    <span className="font-bold text-sm block mb-1 flex items-center gap-1.5">
                      <span>{q.icon}</span>
                      <span className={q.color}>{q.title}</span>
                    </span>
                    <span className="text-xs text-indigo-200 leading-relaxed">
                      {q.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scoring System */}
            <div className="p-4 bg-slate-800/70 rounded-2xl border border-white/15 shadow-md space-y-2">
              <h3 className="font-mario text-base sm:text-lg text-amber-300 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" /> {t.gameRules.scoringTitle}
              </h3>
              <ul className="space-y-1 text-xs sm:text-sm text-indigo-100 list-disc list-outside pl-4 leading-relaxed">
                {t.gameRules.scoringPoints.map((sp, idx) => (
                  <li key={idx}>{sp}</li>
                ))}
              </ul>
            </div>

            {/* Winning */}
            <div className="p-4 bg-amber-950/60 rounded-2xl border border-amber-400/40 flex items-center gap-3.5 shadow-xl">
              <Trophy className="w-8 h-8 text-yellow-400 shrink-0" />
              <div className="text-xs sm:text-sm">
                <strong className="text-yellow-300 block text-sm sm:text-base font-mario">
                  {t.gameRules.winningTitle}
                </strong>
                <p className="text-indigo-100 mt-0.5">{t.gameRules.winningDesc}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: MYSTERY CARDS (Interactive card showcase & test suite) */}
        {activeTab === 'mystery_cards' && (
          <div className="p-3 sm:p-5 overflow-y-auto space-y-4 text-slate-200 flex-1">
            {/* Guide banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-indigo-950/60 rounded-2xl border border-indigo-400/30 text-xs">
              <div className="flex items-center gap-2 text-indigo-200">
                <Volume2 className="w-4 h-4 text-yellow-300 shrink-0" />
                <span>
                  <strong>{t.mysteryCards.subtitle}</strong> {t.mysteryCards.instructions}
                </span>
              </div>
              <span className="font-mono text-[11px] text-amber-300 bg-black/40 px-2.5 py-0.5 rounded-md self-start sm:self-auto shrink-0 border border-amber-400/30">
                {t.mysteryCards.deckInfo}
              </span>
            </div>

            {/* Active Card Test Inspector Panel */}
            <AnimatePresence>
              {activeTestedCard && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl border-2 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.35)] relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-black/50 border border-white/20 shrink-0">
                        {getCardIcon(activeTestedCard.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mario text-base sm:text-xl text-yellow-300">
                            {t.mysteryCards.cardDescriptions[activeTestedCard.id]?.title || activeTestedCard.title}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-400/40">
                            🔊 SOUND PLAYED
                          </span>
                        </div>
                        <p className="text-xs text-indigo-100 mt-0.5">
                          {t.mysteryCards.cardDescriptions[activeTestedCard.id]?.desc || activeTestedCard.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                      <button
                        onClick={() => handleCardClick(activeTestedCard)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Play className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                        Replay Sound
                      </button>

                      {onTestCardInGame && (
                        <button
                          onClick={() => handleApplyToGame(activeTestedCard)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                        >
                          <Zap className="w-3 h-3 text-slate-950 fill-slate-950" />
                          Apply on Board
                        </button>
                      )}
                    </div>
                  </div>

                  {appliedNotification && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-xs font-bold text-emerald-300 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {appliedNotification}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grid of 8 Card Fronts in 2:3 Aspect Ratio */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 pt-1">
              {REWARD_CARDS.map((card) => {
                const isSelected = activeTestedCard?.id === card.id;
                const translatedTitle = t.mysteryCards.cardDescriptions[card.id]?.title || card.title;
                const translatedSubtitle = t.mysteryCards.cardDescriptions[card.id]?.desc || card.subtitle;

                return (
                  <motion.div
                    key={card.id}
                    whileHover={{ scale: 1.04, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleCardClick(card)}
                    className={`relative aspect-[2/3] rounded-2xl p-2.5 sm:p-3 border-2 flex flex-col justify-between text-center cursor-pointer transition-all bg-gradient-to-b ${getCardStyle(card.id)} ${
                      isSelected
                        ? 'ring-4 ring-yellow-400 border-yellow-300 shadow-[0_0_25px_rgba(250,204,21,0.6)]'
                        : 'hover:border-yellow-400/80 hover:shadow-xl'
                    }`}
                  >
                    {/* Inset Hairline Border */}
                    <div className="absolute inset-1.5 rounded-xl border border-white/15 pointer-events-none" />

                    {/* Top Pill / Badge */}
                    <div className="relative z-10 flex items-center justify-between gap-1 mb-1">
                      <span className="text-[9px] font-bold tracking-wider text-amber-300 uppercase bg-black/40 px-2 py-0.5 rounded-full border border-amber-400/30">
                        {card.coins > 0 ? `+${card.coins} COINS` : 'SPECIAL'}
                      </span>
                      <span className="text-[10px] text-yellow-300 opacity-60">★</span>
                    </div>

                    {/* Center Icon & Title */}
                    <div className="relative z-10 my-auto flex flex-col items-center">
                      <div className="p-2 sm:p-2.5 rounded-2xl bg-black/50 border border-white/20 mb-1.5 shadow-inner group-hover:scale-110 transition-transform">
                        {getCardIcon(card.type)}
                      </div>
                      <h4 className="font-mario text-xs sm:text-sm text-yellow-300 leading-tight drop-shadow">
                        {translatedTitle}
                      </h4>
                      <p className="text-[10px] sm:text-[11px] text-indigo-100 font-medium mt-1 leading-snug px-0.5">
                        {translatedSubtitle}
                      </p>
                    </div>

                    {/* Bottom Action Badge */}
                    <div className="relative z-10 mt-1">
                      <div className="w-full py-1 px-1.5 rounded-xl bg-black/40 border border-white/20 flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-bold text-yellow-300">
                        <Volume2 className="w-3 h-3 text-yellow-400 shrink-0" />
                        <span className="truncate">{t.mysteryCards.testSoundLabel}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-white/15 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 hidden sm:block">
            {t.footer.tagline}
          </div>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="px-6 sm:px-8 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-mario text-sm sm:text-base rounded-xl shadow-lg border border-emerald-300/60 cursor-pointer ml-auto hover:scale-102 active:scale-97 transition-all"
          >
            {t.footer.playButton}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
