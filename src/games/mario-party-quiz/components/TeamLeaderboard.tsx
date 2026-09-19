import React from 'react';
import { Plus, Minus, Crown, Flame, Zap, ShieldAlert } from 'lucide-react';
import { Team } from '@/shared/types';
import { CHARACTERS } from '@/games/mario-party-quiz/data/characters';
import { sounds } from '@/shared/utils/sound';
import { MarioCoin } from '@/shared/components/MarioCoin';
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
    <div className="w-full max-w-[1750px] mx-auto px-2 sm:px-4 pt-1.5 pb-1 shrink-0">
      <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl border border-white/15 p-2 sm:p-2.5 shadow-xl">
        <div className={`grid gap-2 sm:gap-2.5 ${gridLayoutClasses}`}>
          {teams.map((team, idx) => {
            const char = CHARACTERS[team.characterId];
            const isActive = idx === currentTeamIndex;
            const isLeader = team.coins === highestScore && team.coins > 0;
            const rank = sortedTeams.findIndex((t) => t.id === team.id) + 1;
            const isStunned = (team.skipTurns ?? 0) > 0;

            return (
              <div
                key={team.id}
                onClick={() => {
                  if (!isActive) {
                    sounds.playPop();
                    onSelectTeamTurn(idx);
                  }
                }}
                className={`relative flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl transition-all duration-200 cursor-pointer select-none border shadow-md ${
                  isStunned
                    ? 'bg-sky-950/80 border-sky-400 ring-2 ring-sky-400/80 text-white'
                    : isActive
                    ? `${char.bgColor} bg-opacity-35 border-yellow-300 ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.35)] z-10 text-white scale-[1.01]`
                    : isLeader
                    ? 'bg-amber-950/60 border-amber-400/50 hover:border-amber-400/80 text-slate-100'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-white/15 text-slate-200 hover:border-white/25'
                }`}
              >
                {/* Team Icon Card Avatar */}
                <div className="relative shrink-0">
                  <TeamAvatar
                    characterId={team.characterId}
                    size="md"
                    customUrl={team.customImageUrl}
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl shadow-md border ${
                      isActive ? 'ring-2 ring-yellow-300 border-yellow-200 shadow-[0_0_10px_rgba(250,204,21,0.4)]' : 'border-white/25'
                    }`}
                  />
                </div>

                {/* Team Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm truncate leading-tight text-white drop-shadow-sm">
                      {team.name}
                    </h4>
                    {isLeader && (
                      <span className="shrink-0 bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 px-1.5 py-px rounded-full text-[9px] font-black flex items-center gap-0.5 shadow-sm">
                        <Crown className="w-2.5 h-2.5 fill-amber-900" />
                        1st
                      </span>
                    )}
                    {team.hasDoubleTurn && (
                      <span className="shrink-0 bg-gradient-to-r from-amber-500 to-red-600 text-yellow-100 px-1.5 py-px rounded-full text-[9px] font-black flex items-center gap-0.5 shadow-sm">
                        <Zap className="w-2.5 h-2.5 fill-yellow-300" />
                        2x
                      </span>
                    )}
                    {isStunned && (
                      <span className="shrink-0 bg-sky-600 text-white px-1.5 py-px rounded-full text-[9px] font-black flex items-center gap-0.5 shadow-sm">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        Skip
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-indigo-200 font-semibold mt-0.5">
                    <span className="opacity-90">Rank #{rank}</span>
                    {team.streak > 1 && (
                      <span className="flex items-center text-amber-300 font-bold">
                        <Flame className="w-3 h-3 fill-amber-400 mr-0.5" />
                        {team.streak}x streak
                      </span>
                    )}
                  </div>
                </div>

                {/* Coins Counter + Adjusters */}
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border shrink-0 transition-colors ${
                    team.coins < 0
                      ? 'bg-red-950/90 border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.4)] ring-1 ring-red-500/50'
                      : 'bg-black/50 border-white/15 shadow-inner'
                  }`}
                >
                  <MarioCoin size="sm" animated={isActive} />
                  <span
                    className={`font-mario text-xl sm:text-2xl leading-none min-w-[24px] text-center transition-colors ${
                      team.coins < 0
                        ? 'text-red-500 font-black drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]'
                        : 'text-yellow-300 text-shadow-gold'
                    }`}
                  >
                    {team.coins}
                  </span>
                  <div className="flex flex-col gap-0.5 ml-0.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        sounds.playPop();
                        onAdjustCoins(team.id, 1);
                      }}
                      title="Add 1 coin"
                      className="w-5 h-5 rounded-md bg-white/10 hover:bg-emerald-500/50 text-white flex items-center justify-center border border-white/20 hover:border-emerald-300 cursor-pointer transition-colors active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        sounds.playPop();
                        onAdjustCoins(team.id, -1);
                      }}
                      title="Deduct 1 coin"
                      className="w-5 h-5 rounded-md bg-white/10 hover:bg-red-500/50 text-white flex items-center justify-center border border-white/20 hover:border-red-300 cursor-pointer transition-colors active:scale-95"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
