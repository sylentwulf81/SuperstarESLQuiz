import React, { useMemo } from 'react';
import { Plus, Minus, Flame, Zap, ShieldAlert, Sparkles } from 'lucide-react';
import { Team } from '@/shared/types';
import { CHARACTERS } from '@/games/mario-party-quiz/data/characters';
import { sounds } from '@/shared/utils/sound';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { TeamAvatar } from './TeamAvatar';

export interface TeamSidebarProps {
  teams: Team[];
  allTeams?: Team[];
  startIndex?: number;
  currentTeamIndex: number;
  onSelectTeamTurn: (index: number) => void;
  onAdjustCoins: (teamId: string, delta: number) => void;
  className?: string;
  side?: 'left' | 'right';
  hideMobileTrack?: boolean;
}

const RANK_STYLES: Record<number, { badge: string; text: string }> = {
  1: {
    badge: 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-amber-950 border-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.6)] font-black',
    text: '1st',
  },
  2: {
    badge: 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300 text-slate-900 border-white shadow-[0_0_8px_rgba(255,255,255,0.4)] font-black',
    text: '2nd',
  },
  3: {
    badge: 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 text-amber-950 border-orange-300 shadow-[0_0_8px_rgba(217,119,6,0.4)] font-black',
    text: '3rd',
  },
};

/**
 * Full-height Classroom Team Sidebar.
 * Displays vertically on widescreen displays (projectors & smartboards),
 * providing huge, easily-readable coin totals from the back of the room.
 * Supports split dual-rail mode (max 4 per side) to eliminate scrolling with 5+ teams.
 */
export const TeamSidebar: React.FC<TeamSidebarProps> = React.memo(function TeamSidebar({
  teams,
  allTeams,
  startIndex = 0,
  currentTeamIndex,
  onSelectTeamTurn,
  onAdjustCoins,
  className = '',
  side = 'left',
  hideMobileTrack = false,
}) {
  const rankingSource = allTeams || teams;
  const { teamRanksMap, highestScore } = useMemo(() => {
    const sorted = [...rankingSource].sort((a, b) => b.coins - a.coins);
    const ranks: Record<string, number> = {};
    sorted.forEach((team, idx) => {
      ranks[team.id] = idx + 1;
    });
    return {
      teamRanksMap: ranks,
      highestScore: sorted[0]?.coins ?? 0,
    };
  }, [rankingSource]);

  const borderClass = side === 'right' ? 'border-l border-white/15' : 'border-r border-white/15';

  return (
    <aside
      className={`shrink-0 flex flex-col z-20 select-none ${className}`}
      aria-label="Classroom Teams"
    >
      {/* Desktop / Projector Vertical Rail */}
      <div className={`hidden lg:flex flex-col h-full w-56 xl:w-64 bg-slate-900/95 ${borderClass} p-3 overflow-y-auto gap-2.5 shadow-2xl backdrop-blur-md`}>
        <div className="px-1 py-0.5 flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
          <span className="font-mario text-xs xl:text-sm text-yellow-300 tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {side === 'right' ? 'TEAMS' : 'STANDINGS'}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {rankingSource.length} Teams
          </span>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-y-auto px-1 py-1 [scrollbar-width:thin]">
          {teams.map((team, idx) => {
            const globalIndex = startIndex + idx;
            const char = CHARACTERS[team.characterId];
            const isActive = globalIndex === currentTeamIndex;
            const rank = teamRanksMap[team.id];
            const isLeader = team.coins === highestScore && team.coins > 0;
            const rankInfo = rank <= 3 && team.coins > 0 ? RANK_STYLES[rank] : null;

            return (
              <div
                key={team.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!isActive) {
                    sounds.playPop();
                    onSelectTeamTurn(globalIndex);
                  }
                }}
                className={`relative rounded-2xl border-2 transition-all cursor-pointer flex flex-col p-2.5 shadow-md ${
                  isActive
                    ? `${char.bgColor} bg-opacity-40 border-yellow-300 ring-2 ring-yellow-400/90 shadow-[0_0_15px_rgba(250,204,21,0.35)] z-10`
                    : isLeader
                    ? 'bg-amber-950/60 border-amber-400/60 hover:border-amber-300/90 text-slate-100'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-white/15 hover:border-white/30 text-slate-200'
                }`}
              >
                {/* Active Turn Badge - positioned safely inside without clipping */}
                {isActive && (
                  <span className="absolute -top-2 right-2.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 text-slate-950 font-mario text-[9px] shadow border border-white font-black z-20">
                    ★ TURN ★
                  </span>
                )}

                {/* Top: Avatar, Name & Rank Badge */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0">
                    <TeamAvatar
                      characterId={team.characterId}
                      size="md"
                      customUrl={team.customImageUrl}
                      className={`w-11 h-11 xl:w-12 xl:h-12 rounded-xl shadow-md border ${
                        isActive ? 'ring-2 ring-yellow-300 border-yellow-100' : 'border-white/20'
                      }`}
                    />
                    {rankInfo && (
                      <span
                        className={`absolute -top-1.5 -left-1.5 h-4.5 px-1.5 rounded-md text-[9px] flex items-center justify-center border leading-none ${rankInfo.badge}`}
                      >
                        {rankInfo.text}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 leading-tight">
                    <h4 className="font-mario text-sm xl:text-base text-white text-shadow-mario truncate">
                      {team.name}
                    </h4>
                    {/* Status badges */}
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      {team.hasDoubleTurn && (
                        <span className="bg-gradient-to-r from-amber-500 to-red-600 text-yellow-100 px-1 py-0.2 rounded text-[8px] font-black flex items-center gap-0.5 border border-yellow-200">
                          <Zap className="w-2 h-2 fill-current" /> 2x
                        </span>
                      )}
                      {team.doubleNextCoinReward && (
                        <span className="bg-red-700 text-yellow-100 px-1 py-0.2 rounded text-[8px] font-black border border-yellow-300">
                          ×2
                        </span>
                      )}
                      {team.blooperNextCoin && (
                        <span className="bg-indigo-900 text-indigo-100 px-1 py-0.2 rounded text-[8px] font-black">
                          🦑
                        </span>
                      )}
                      {team.skipNextCoinReward && (
                        <span className="bg-sky-600 text-white px-1 py-0.2 rounded text-[8px] font-black flex items-center gap-0.5">
                          <ShieldAlert className="w-2 h-2" /> Skip
                        </span>
                      )}
                      {team.streak > 1 && (
                        <span className="flex items-center gap-0.5 bg-black/60 text-amber-300 text-[8px] font-bold px-1 py-0.2 rounded border border-amber-400/40">
                          <Flame className="w-2 h-2 fill-amber-400" />
                          {team.streak}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom: Huge Coin Display & Teacher Adjust Buttons */}
                <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between gap-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xl bg-black/60 border border-white/15 shadow-inner">
                    <MarioCoin size="sm" />
                    <span
                      className={`font-mario text-2xl xl:text-3xl leading-none ${
                        team.coins < 0
                          ? 'text-red-400 font-black'
                          : 'text-yellow-300 text-shadow-gold drop-shadow-[0_0_10px_rgba(250,204,21,0.55)]'
                      }`}
                    >
                      {team.coins}
                    </span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        onAdjustCoins(team.id, 1);
                      }}
                      title={`Add 1 coin to ${team.name}`}
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-emerald-600/80 text-white flex items-center justify-center border border-white/20 hover:border-emerald-300 cursor-pointer transition-all active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playPop();
                        onAdjustCoins(team.id, -1);
                      }}
                      title={`Deduct 1 coin from ${team.name}`}
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-rose-600/80 text-white flex items-center justify-center border border-white/20 hover:border-rose-300 cursor-pointer transition-all active:scale-90"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile / Narrow Screen Horizontal Track */}
      {!hideMobileTrack && (
        <div className="lg:hidden w-full bg-slate-900/95 border-b border-white/15 p-1.5 shadow-md overflow-x-auto [scrollbar-width:none]">
          <div className="flex items-center justify-center gap-1.5 min-w-max mx-auto px-1">
            {rankingSource.map((team, idx) => {
              const char = CHARACTERS[team.characterId];
              const isActive = idx === currentTeamIndex;
              const rank = teamRanksMap[team.id];
              const rankInfo = rank <= 3 && team.coins > 0 ? RANK_STYLES[rank] : null;

              return (
                <div
                  key={team.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!isActive) {
                      sounds.playPop();
                      onSelectTeamTurn(idx);
                    }
                  }}
                  className={`relative flex items-center gap-1.5 px-2 py-1.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isActive
                      ? `${char.bgColor} bg-opacity-40 border-yellow-300 ring-2 ring-yellow-400 text-white`
                      : 'bg-slate-800/80 border-white/15 text-slate-200'
                  }`}
                >
                  {rankInfo && (
                    <span
                      className={`absolute -top-1.5 -left-1.5 h-4 px-1 rounded-md text-[8px] flex items-center justify-center border ${rankInfo.badge}`}
                    >
                      {rankInfo.text}
                    </span>
                  )}
                  <TeamAvatar characterId={team.characterId} size="sm" customUrl={team.customImageUrl} />
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/50 border border-white/15">
                    <MarioCoin size="xs" />
                    <span className="font-mario text-base text-yellow-300 leading-none">
                      {team.coins}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
});
