import React, { useMemo } from 'react';
import { Plus, Minus, Flame, Zap, ShieldAlert } from 'lucide-react';
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

const RANK_STYLES: Record<number, string> = {
  1: 'bg-gradient-to-b from-amber-300 to-yellow-500 text-amber-950 border-yellow-100/90 shadow-[0_1px_6px_rgba(250,204,21,0.55)]',
  2: 'bg-gradient-to-b from-slate-100 to-slate-300 text-slate-800 border-white/80 shadow-[0_1px_5px_rgba(15,23,42,0.35)]',
  3: 'bg-gradient-to-b from-orange-300 to-amber-700 text-orange-950 border-orange-200/70 shadow-[0_1px_5px_rgba(180,83,9,0.4)]',
};

function rankLabel(rank: number) {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  return `${rank}th`;
}

export const TeamLeaderboard = React.memo(function TeamLeaderboard({
  teams,
  currentTeamIndex,
  onSelectTeamTurn,
  onAdjustCoins,
}: TeamLeaderboardProps) {
  // Bolt Performance Optimization: Precompute team ranks map and highest score in useMemo
  // to avoid O(N^2) sortedTeams.findIndex calls when iterating through teams in leaderboard render.
  const { teamRanksMap, highestScore } = useMemo(() => {
    const sorted = [...teams].sort((a, b) => b.coins - a.coins);
    const ranks: Record<string, number> = {};
    sorted.forEach((team, idx) => {
      ranks[team.id] = idx + 1;
    });
    return {
      teamRanksMap: ranks,
      highestScore: sorted[0]?.coins ?? 0,
    };
  }, [teams]);

  const gridLayoutClasses =
    teams.length <= 3
      ? 'grid-cols-1 sm:grid-cols-3 max-w-6xl mx-auto'
      : teams.length === 4
      ? 'grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto'
      : teams.length === 5
      ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5 max-w-[1600px] mx-auto'
      : teams.length === 6
      ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6 max-w-[1750px] mx-auto'
      : 'grid-cols-2 md:grid-cols-4 xl:grid-cols-8 max-w-[1750px] mx-auto';

  return (
    <div className="w-full max-w-[1750px] mx-auto px-2 sm:px-4 pt-1.5 pb-1 shrink-0">
      <div className="bg-slate-900/95 rounded-2xl border border-white/15 p-2 sm:p-2.5 shadow-xl overflow-visible">
        <div className={`grid gap-2 sm:gap-2.5 ${gridLayoutClasses}`}>
          {teams.map((team, idx) => {
            const char = CHARACTERS[team.characterId];
            const isActive = idx === currentTeamIndex;
            const isLeader = team.coins === highestScore && team.coins > 0;
            const rank = teamRanksMap[team.id];
            const isStunned = (team.skipTurns ?? 0) > 0;
            const showPodiumBadge = rank <= 3 && team.coins > 0;

            return (
              <div
                key={team.id}
                onClick={() => {
                  if (!isActive) {
                    sounds.playPop();
                    onSelectTeamTurn(idx);
                  }
                }}
                className={`relative flex items-center gap-2 p-2 sm:p-2.5 rounded-xl cursor-pointer select-none border shadow-md overflow-visible ${
                  isStunned
                    ? 'bg-sky-950/80 border-sky-400 ring-2 ring-sky-400/80 text-white'
                    : isActive
                    ? `${char.bgColor} bg-opacity-35 border-yellow-300 ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.35)] z-10 text-white scale-[1.01]`
                    : isLeader
                    ? 'bg-amber-950/60 border-amber-400/50 hover:border-amber-400/80 text-slate-100'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-white/15 text-slate-200 hover:border-white/25'
                }`}
              >
                {showPodiumBadge && (
                  <span
                    className={`absolute top-0.5 left-0.5 z-20 h-5 min-w-[1.7rem] px-1.5 rounded-md text-[10px] font-black tracking-wide whitespace-nowrap flex items-center justify-center border ring-1 ring-black/40 ${RANK_STYLES[rank]}`}
                    title={`Rank ${rankLabel(rank)}`}
                  >
                    {rankLabel(rank)}
                  </span>
                )}

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

                <div className="min-w-0 flex-1">
                  <h4
                    title={team.name}
                    className="font-bold text-xs sm:text-[13px] leading-snug text-white drop-shadow-sm line-clamp-2 break-words"
                  >
                    {team.name}
                  </h4>
                  <div className="flex items-center flex-wrap gap-1 mt-0.5">
                    {team.hasDoubleTurn && (
                      <span className="shrink-0 bg-gradient-to-r from-amber-500 to-red-600 text-yellow-100 px-1.5 py-px rounded-full text-[9px] font-black flex items-center gap-0.5 shadow-sm">
                        <Zap className="w-2.5 h-2.5 fill-yellow-300" />
                        2x
                      </span>
                    )}
                    {team.doubleNextCoinReward && (
                      <span className="shrink-0 bg-gradient-to-r from-red-500 to-rose-600 text-yellow-100 px-1.5 py-px rounded-full text-[9px] font-black flex items-center gap-0.5 shadow-sm">
                        <Zap className="w-2.5 h-2.5 fill-yellow-300" />
                        2x$
                      </span>
                    )}
                    {team.skipNextCoinReward && (
                      <span className="shrink-0 bg-sky-600 text-white px-1.5 py-px rounded-full text-[9px] font-black flex items-center gap-0.5 shadow-sm">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        Skip$
                      </span>
                    )}
                    {team.blooperNextCoin && (
                      <span className="shrink-0 bg-indigo-800 text-indigo-100 px-1.5 py-px rounded-full text-[9px] font-black shadow-sm">
                        🦑1
                      </span>
                    )}
                    {isStunned && (
                      <span className="shrink-0 bg-sky-600 text-white px-1.5 py-px rounded-full text-[9px] font-black flex items-center gap-0.5 shadow-sm">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        Skip
                      </span>
                    )}
                    {team.streak > 1 && (
                      <span className="flex items-center text-amber-300 font-bold text-[10px]">
                        <Flame className="w-3 h-3 fill-amber-400 mr-0.5" />
                        {team.streak}x
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`flex items-center gap-1 px-1.5 py-1 rounded-xl border shrink-0 ${
                    team.coins < 0
                      ? 'bg-red-950/90 border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.4)] ring-1 ring-red-500/50'
                      : 'bg-black/50 border-white/15 shadow-inner'
                  }`}
                >
                  <MarioCoin size="sm" />
                  <span
                    className={`font-mario text-lg sm:text-xl leading-none min-w-[22px] text-center ${
                      team.coins < 0
                        ? 'text-red-500 font-black drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]'
                        : 'text-yellow-300 text-shadow-gold'
                    }`}
                  >
                    {team.coins}
                  </span>
                  <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
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
});
