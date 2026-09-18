import React from 'react';
import { Plus, Minus, Crown, Flame, Zap, ShieldAlert } from 'lucide-react';
import { Team } from '../types';
import { CHARACTERS } from '../data/characters';
import { sounds } from '../utils/sound';
import { MarioCoin } from './MarioCoin';
import { TeamAvatar } from './TeamAvatar';

interface TeamLeaderboardProps {
  teams: Team[];
  currentTeamIndex: number;
  onSelectTeamTurn: (index: number) => void;
  onAdjustCoins: (teamId: string, delta: number) => void;
}

export const TeamLeaderboard: React.FC<TeamLeaderboardProps> = ({
  teams,
  currentTeamIndex,
  onSelectTeamTurn,
  onAdjustCoins,
}) => {
  // Sort teams by coins descending to calculate ranks
  const sortedTeams = [...teams].sort((a, b) => b.coins - a.coins);
  const highestScore = sortedTeams[0]?.coins ?? 0;

  // Responsive grid configuration based on team count
  const gridLayoutClasses =
    teams.length <= 3
      ? 'grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto'
      : teams.length === 4
      ? 'grid-cols-2 sm:grid-cols-4 max-w-5xl mx-auto'
      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 max-w-[1750px] mx-auto';

  return (
    <div className="w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-5 pb-2 sm:pb-3">
      <div className={`grid gap-2.5 sm:gap-3.5 ${gridLayoutClasses}`}>
        {teams.map((team, idx) => {
          const char = CHARACTERS[team.characterId];
          const isActive = idx === currentTeamIndex;
          const isLeader = team.coins === highestScore && team.coins > 0;
          const rank = sortedTeams.findIndex((t) => t.id === team.id) + 1;

          return (
            <div
              key={team.id}
              onClick={() => {
                if (!isActive) {
                  sounds.playPop();
                  onSelectTeamTurn(idx);
                }
              }}
              className={`relative flex flex-col justify-between p-2.5 sm:p-3 lg:p-3 rounded-2xl transition-all duration-200 cursor-pointer select-none border shadow-xl ${
                (team.skipTurns ?? 0) > 0
                  ? 'bg-sky-950/80 border-sky-400 ring-2 ring-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.35)] text-white'
                  : isActive
                  ? `${char.bgColor} bg-opacity-40 border-indigo-400/80 ring-2 ring-indigo-400/70 shadow-[0_0_15px_rgba(99,102,241,0.25)] scale-[1.01] z-10 text-white`
                  : isLeader
                  ? 'bg-amber-950/70 border-amber-400/60 ring-1 ring-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.15)] text-slate-100 scale-[1.005]'
                  : 'bg-slate-900/80 hover:bg-slate-850 border-white/15 text-slate-200 hover:border-white/25'
              }`}
            >
              {/* Leader Crown Badge - positioned with clearance from header */}
              {isLeader && (
                <div className="absolute -top-3.5 right-2 sm:right-3 bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1 shadow-lg border-2 border-yellow-200/90 shadow-[0_0_15px_rgba(250,204,21,0.6)] z-20 animate-pulse">
                  <Crown className="w-3.5 h-3.5 fill-amber-900 text-amber-900" />
                  <span>LEADER</span>
                </div>
              )}

              {/* Mushroom / Superstar 2x Indicator */}
              {team.hasDoubleTurn && (
                <div className="absolute -top-3 left-2 bg-gradient-to-r from-amber-500 to-red-600 text-yellow-200 px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-md border border-yellow-300/80 animate-pulse z-20">
                  <Zap className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                  <span>⭐ 2x BONUS TURN</span>
                </div>
              )}

              {/* Blue Shell Stunned Indicator */}
              {(team.skipTurns ?? 0) > 0 && (
                <div className="absolute -top-3 left-2 bg-gradient-to-r from-sky-600 to-blue-700 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-md border border-sky-300 animate-bounce z-20 shadow-[0_0_10px_rgba(56,189,248,0.5)]">
                  <ShieldAlert className="w-3 h-3 text-sky-200" />
                  <span>🐢 STUNNED (SKIPS TURN)</span>
                </div>
              )}

              {/* Team Header */}
              <div className="flex items-center gap-2 mb-1.5">
                <TeamAvatar
                  characterId={team.characterId}
                  size="md"
                  customUrl={team.customImageUrl}
                  className={isActive ? 'ring-2 ring-yellow-300 shadow-md scale-105' : ''}
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm sm:text-base truncate leading-tight text-white">
                    {team.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-indigo-200 font-semibold">
                    <span>Rank #{rank}</span>
                    {team.streak > 1 && (
                      <span className="flex items-center text-amber-300 font-bold">
                        <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {team.streak}x
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Coins Display */}
              <div
                className={`my-1.5 flex items-center justify-between px-2.5 py-1.5 rounded-xl border shadow-inner transition-colors ${
                  team.coins < 0
                    ? 'bg-red-950/70 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                    : 'bg-black/45 border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MarioCoin size="sm" animated={isActive} />
                  <span
                    className={`font-mario text-2xl sm:text-3xl tracking-wide leading-none ${
                      team.coins < 0
                        ? 'text-red-400 drop-shadow-[0_2px_8px_rgba(239,68,68,0.6)]'
                        : 'text-yellow-300 text-shadow-gold'
                    }`}
                  >
                    {team.coins}
                  </span>
                </div>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider ${
                    team.coins < 0 ? 'text-red-300 font-black' : 'text-indigo-200/80'
                  }`}
                >
                  Coins
                </span>
              </div>

              {/* Host Quick Adjust Footer */}
              <div className="mt-1 flex items-center justify-between pt-1.5 border-t border-white/10 text-xs">
                <span className="text-white/60 font-medium text-[11px]">
                  {team.blocksOpened} blocks
                </span>
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      sounds.playPop();
                      onAdjustCoins(team.id, -1);
                    }}
                    title="Deduct 1 coin"
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/10 hover:bg-red-500/40 text-white flex items-center justify-center text-xs transition-colors border border-white/15 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      sounds.playPop();
                      onAdjustCoins(team.id, 1);
                    }}
                    title="Add 1 coin"
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/10 hover:bg-emerald-500/40 text-white flex items-center justify-center text-xs transition-colors border border-white/15 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
