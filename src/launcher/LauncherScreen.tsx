import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Sparkles, 
  Play, 
  BookOpen, 
  Search, 
  CheckCircle2, 
  Clock, 
  Users, 
  Flame, 
  Sun, 
  Snowflake, 
  Trophy, 
  Tv, 
  Swords, 
  Gift, 
  Compass, 
  Building2, 
  Rocket, 
  Shield, 
  Zap, 
  Gavel, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Library, 
  Star,
  Info,
  ChevronRight,
  Filter,
  Upload,
  X
} from 'lucide-react';
import { LAUNCHER_GAMES, LauncherGame, GameCategory } from '@/launcher/catalog';
import { sounds } from '@/shared/utils/sound';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { AccountMenu } from '@/shared/components/AccountMenu';
import { SnesBoxArt } from '@/launcher/SnesBoxArt';

interface LauncherScreenProps {
  onLaunchGame: (game: LauncherGame) => void;
  onOpenRulebook: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const LauncherScreen: React.FC<LauncherScreenProps> = ({
  onLaunchGame,
  onOpenRulebook,
  soundEnabled,
  onToggleSound,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [spotlightGameId, setSpotlightGameId] = useState<string>('mario_party_summer');
  const [previewGame, setPreviewGame] = useState<LauncherGame | null>(null);

  const spotlightGame = useMemo(() => {
    return LAUNCHER_GAMES.find(g => g.id === spotlightGameId) || LAUNCHER_GAMES[0];
  }, [spotlightGameId]);

  const filteredGames = useMemo(() => {
    return LAUNCHER_GAMES.filter(game => {
      const matchesCategory = 
        selectedCategory === 'all' ? true : game.category === selectedCategory;
      const matchesSearch = 
        searchQuery.trim() === '' ||
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.stats.grades.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const getCategoryIcon = (cat: GameCategory) => {
    switch (cat) {
      case 'board': return <Compass className="w-3.5 h-3.5" />;
      case 'quiz_show': return <Tv className="w-3.5 h-3.5" />;
      case 'action': return <Flame className="w-3.5 h-3.5" />;
      case 'seasonal': return <Snowflake className="w-3.5 h-3.5" />;
      case 'strategy': return <Building2 className="w-3.5 h-3.5" />;
      default: return <Gamepad2 className="w-3.5 h-3.5" />;
    }
  };

  const renderGameIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sun': return <Sun className="w-6 h-6 text-amber-300" />;
      case 'Snowflake': return <Snowflake className="w-6 h-6 text-cyan-300" />;
      case 'Tv': return <Tv className="w-6 h-6 text-indigo-300" />;
      case 'Flame': return <Flame className="w-6 h-6 text-red-400" />;
      case 'Swords': return <Swords className="w-6 h-6 text-emerald-300" />;
      case 'Gift': return <Gift className="w-6 h-6 text-purple-300" />;
      case 'Compass': return <Compass className="w-6 h-6 text-yellow-300" />;
      case 'Building2': return <Building2 className="w-6 h-6 text-blue-300" />;
      case 'Rocket': return <Rocket className="w-6 h-6 text-fuchsia-300" />;
      case 'Shield': return <Shield className="w-6 h-6 text-amber-400" />;
      case 'Zap': return <Zap className="w-6 h-6 text-lime-300" />;
      case 'Gavel': return <Gavel className="w-6 h-6 text-yellow-400" />;
      case 'Star': return <Star className="w-6 h-6 text-rose-300" />;
      default: return <Gamepad2 className="w-6 h-6 text-yellow-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950">
      {/* Top Steam/Epic Games Style Launcher Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-2.5 shadow-2xl">
        <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Suite Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-yellow-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mario text-lg sm:text-xl text-yellow-300 tracking-wider flex items-center gap-1.5">
                  ALT GAMES
                </h1>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 tracking-widest hidden sm:inline-block">
                  CLASSROOM ARCADE
                </span>
              </div>
              <p className="text-[11px] text-white/50 -mt-0.5">
                Upgraded Interactive PowerPoint Alternatives for ESL & Language Teachers
              </p>
            </div>
          </div>

          {/* Right Action Tools: Sound & Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                sounds.playClick();
                onToggleSound();
              }}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-white/15 cursor-pointer transition-all"
              title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Google Profile & Cloud Sync */}
            <AccountMenu />
          </div>
        </div>
      </header>

      {/* Main Launcher Body */}
      <main className="flex-1 max-w-[1750px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
        {/* Spotlight Hero Banner (Epic Games / Steam Featured Carousel) */}
        <section className="relative rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-black">
          {/* Ambient Spotlight Background Graphic */}
          <div 
            className="absolute inset-0 opacity-40 mix-blend-screen bg-cover bg-center pointer-events-none"
            style={{
              backgroundImage: spotlightGame.cover.patternType === 'palm'
                ? 'radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.45) 0%, transparent 60%)'
                : 'radial-gradient(circle at 70% 30%, rgba(56, 189, 248, 0.45) 0%, transparent 60%)'
            }}
          />

          <div className="relative z-10 p-6 sm:p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 min-h-[380px]">
            {/* Left Info Column */}
            <div className="flex-1 space-y-4 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full ${spotlightGame.badgeColor} tracking-wider shadow-lg flex items-center gap-1`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  {spotlightGame.badge}
                </span>
                <span className="text-xs uppercase font-bold px-3 py-1 rounded-full bg-slate-800/90 border border-white/15 text-slate-300">
                  {spotlightGame.category.replace('_', ' ')}
                </span>
                <span className="text-xs font-semibold text-white/50 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {spotlightGame.stats.duration}
                </span>
              </div>

              <h2 className="font-mario text-3xl sm:text-4xl lg:text-5xl text-yellow-300 leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                {spotlightGame.title}
              </h2>

              <p className="text-base sm:text-lg text-indigo-100 font-medium leading-relaxed">
                {spotlightGame.tagline}
              </p>

              <p className="text-sm text-slate-300/80 leading-relaxed max-w-2xl">
                {spotlightGame.description}
              </p>

              {/* Stat Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/15 text-xs text-slate-200">
                  <Users className="w-3.5 h-3.5 text-amber-300" />
                  <span>{spotlightGame.stats.players}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/15 text-xs text-slate-200">
                  <Star className="w-3.5 h-3.5 text-yellow-300" />
                  <span>{spotlightGame.stats.questions}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/15 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{spotlightGame.stats.grades}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <button
                  onClick={() => {
                    sounds.playGameStart();
                    onLaunchGame(spotlightGame);
                  }}
                  className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-mario text-lg shadow-[0_10px_25px_rgba(245,158,11,0.4)] border-2 border-yellow-200 flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  PLAY GAME
                </button>

                {spotlightGame.hasTeacherGuide && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onOpenRulebook();
                    }}
                    className="px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-indigo-200 hover:text-white border border-indigo-400/40 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all hover:scale-105 shadow-md"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-300" />
                    Mario Party Rules & Guide
                  </button>
                )}

                <button
                  onClick={() => {
                    sounds.playCardFlip();
                    setPreviewGame(spotlightGame);
                  }}
                  className="px-4 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/15 text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Info className="w-4 h-4" />
                  Game Details
                </button>
              </div>
            </div>

            {/* Right Interactive Box Art Showcase Card */}
            <div className="w-full sm:w-80 lg:w-96 shrink-0 flex flex-col gap-3">
              <SnesBoxArt game={spotlightGame} size="hero" />

              {/* Quick Theme Switcher & Box Art Hint */}
              <div className="w-full flex flex-col gap-1.5 p-2.5 rounded-2xl bg-black/60 border border-white/10 px-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white/70">Featured Edition:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        sounds.playPop();
                        setSpotlightGameId('mario_party_summer');
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        spotlightGameId === 'mario_party_summer'
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      Summer
                    </button>
                    <button
                      onClick={() => {
                        sounds.playPop();
                        setSpotlightGameId('mario_party_winter');
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        spotlightGameId === 'mario_party_winter'
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      Holiday
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-amber-300/80 flex items-center justify-center gap-1 pt-1 border-t border-white/10">
                  <Upload className="w-3 h-3" />
                  <span>Click box or drag & drop your image to set cover art</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {(['all', 'board', 'quiz_show', 'action', 'strategy', 'seasonal'] as GameCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => {
                  sounds.playPop();
                  setSelectedCategory(cat);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 border-yellow-300 shadow-md glass-glow-gold'
                    : 'bg-slate-900/80 text-slate-300 border-white/10 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {getCategoryIcon(cat)}
                {cat === 'all' ? `All Games (${LAUNCHER_GAMES.length})` : cat.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search games, grades, mechanics..."
              className="w-full bg-slate-900/90 border border-white/15 rounded-2xl pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>

        {/* Box Art Library Grid (Steam / Epic Games Store vertical poster style) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mario text-xl text-yellow-300 flex items-center gap-2">
              <span>GAME LIBRARY</span>
              <span className="text-xs font-sans font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                {filteredGames.length} Available
              </span>
            </h3>
            <span className="text-xs text-white/50 hidden sm:inline-block">
              Click any game for play, details, or rule previews
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredGames.map(game => (
              <motion.div
                key={game.id}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className={`group relative flex flex-col rounded-3xl overflow-hidden border-2 bg-slate-900/90 shadow-xl transition-all ${
                  game.isPlayable 
                    ? 'border-white/15 hover:border-amber-400/80 hover:shadow-[0_10px_35px_rgba(245,158,11,0.25)]' 
                    : 'border-white/10 opacity-85 hover:opacity-100 hover:border-indigo-400/50 hover:shadow-[0_10px_30px_rgba(99,102,241,0.2)]'
                }`}
              >
                {/* Upper SNES Box Art Area */}
                <div className="p-3 bg-slate-950/80 pb-0">
                  <SnesBoxArt game={game} size="card" />
                </div>

                {/* Lower Information & Actions Body */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-4 bg-slate-950/80">
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300/80 line-clamp-2 leading-relaxed">
                      {game.description}
                    </p>

                    {/* Stats Pill Row */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/60">
                      <span className="bg-slate-800/80 px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
                        <Users className="w-3 h-3 text-amber-300" />
                        {game.stats.players}
                      </span>
                      <span className="bg-slate-800/80 px-2 py-0.5 rounded-md border border-white/10">
                        {game.stats.questions}
                      </span>
                      <span className="bg-slate-800/80 px-2 py-0.5 rounded-md border border-white/10">
                        {game.stats.grades}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons on Card */}
                  <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                    {game.isPlayable ? (
                      <>
                        <button
                          onClick={() => {
                            sounds.playGameStart();
                            onLaunchGame(game);
                          }}
                          className={`w-full py-2.5 px-3 rounded-xl font-mario text-xs sm:text-sm font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                            game.themeKey === 'christmas'
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950'
                              : game.themeKey === 'classic'
                                ? 'bg-gradient-to-r from-rose-500 to-amber-400 hover:from-rose-400 hover:to-amber-300 text-slate-950'
                                : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          PLAY NOW
                        </button>

                        <div className="flex items-center justify-between gap-2 text-[11px] pt-1">
                          {game.hasTeacherGuide ? (
                            <button
                              onClick={() => {
                                sounds.playClick();
                                onOpenRulebook();
                              }}
                              className="text-indigo-300 hover:text-indigo-100 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Open Mario Party Host Guide & Rules"
                            >
                              <BookOpen className="w-3 h-3 text-indigo-400" />
                              Host Guide & Rules
                            </button>
                          ) : (
                            <span />
                          )}

                          <button
                            onClick={() => {
                              sounds.playCardFlip();
                              setPreviewGame(game);
                            }}
                            className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors ml-auto"
                          >
                            <Info className="w-3 h-3" />
                            Details
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1.5">
                        <button
                          onClick={() => {
                            sounds.playCardFlip();
                            setPreviewGame(game);
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-indigo-200 border border-indigo-400/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                          Preview Game Concept
                        </button>
                        <p className="text-[10px] text-center text-white/40 italic">
                          Coming in the 12-Game Classroom Suite
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Game Details & Mechanics Modal */}
      <AnimatePresence>
        {previewGame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-slate-900 rounded-3xl border-2 border-white/20 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
            >
              {/* Header Box Art Banner */}
              <div className={`p-6 bg-gradient-to-r ${previewGame.cover.heroGradient} flex items-start justify-between gap-4`}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/25 flex items-center justify-center text-3xl shadow-inner">
                    {previewGame.cover.coverArtEmoji}
                  </div>
                  <div>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${previewGame.badgeColor}`}>
                      {previewGame.badge}
                    </span>
                    <h3 className="font-mario text-2xl text-white drop-shadow mt-1">
                      {previewGame.title}
                    </h3>
                    <p className="text-xs text-indigo-100 font-medium">
                      {previewGame.tagline}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setPreviewGame(null)}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer border border-white/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm text-slate-300">
                {/* 16-Bit SNES Box Art Showcase */}
                <div className="w-full max-w-sm mx-auto">
                  <SnesBoxArt game={previewGame} size="modal" />
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
                    Overview
                  </h4>
                  <p className="leading-relaxed">
                    {previewGame.description}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/40 p-3 rounded-2xl border border-white/10 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/50 block">Players</span>
                    <span className="font-bold text-white text-xs">{previewGame.stats.players}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/50 block">Duration</span>
                    <span className="font-bold text-white text-xs">{previewGame.stats.duration}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/50 block">Bank Size</span>
                    <span className="font-bold text-white text-xs">{previewGame.stats.questions}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/50 block">Grades</span>
                    <span className="font-bold text-white text-xs">{previewGame.stats.grades}</span>
                  </div>
                </div>

                {/* Core Features */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
                    Key Features & Mechanics
                  </h4>
                  <ul className="space-y-1.5">
                    {previewGame.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* PowerPoint Replacement Context */}
                <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-400/30">
                  <span className="text-xs font-bold text-indigo-300 block mb-1">
                    💡 Classroom PowerPoint Upgrade
                  </span>
                  <p className="text-xs text-indigo-200">
                    {previewGame.powerpointInspiration}
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-950/90 border-t border-white/15 flex items-center justify-between gap-3">
                <button
                  onClick={() => setPreviewGame(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>

                {previewGame.isPlayable ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {previewGame.hasTeacherGuide && (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setPreviewGame(null);
                          onOpenRulebook();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-indigo-400/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                        Host Guide & Rules
                      </button>
                    )}
                    <button
                      onClick={() => {
                        sounds.playGameStart();
                        setPreviewGame(null);
                        onLaunchGame(previewGame);
                      }}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-mario text-xs sm:text-sm font-bold shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      PLAY THIS GAME
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-amber-300/80 italic">
                    Currently scheduled for upcoming release
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
