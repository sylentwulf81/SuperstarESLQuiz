import React, { useMemo } from 'react';
import { Check, X as XIcon, Trophy } from 'lucide-react';
import { BlockState, Team } from '@/shared/types';
import { CHARACTERS } from '@/games/mario-party-quiz/data/characters';
import { sounds } from '@/shared/utils/sound';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { TeamAvatar } from './TeamAvatar';

interface GameBoardProps {
  blocks: BlockState[];
  teams: Team[];
  onSelectBlock: (blockId: number) => void;
  isGameOver?: boolean;
  onOpenLeaderboard?: () => void;
}

/**
 * Primary desktop (lg+): centered 12×5 landscape board with square cells.
 * Narrower views: compressed 6×10 portrait board.
 */
export const GameBoard = React.memo(function GameBoard({
  blocks,
  teams,
  onSelectBlock,
  isGameOver,
  onOpenLeaderboard,
}: GameBoardProps) {
  // Bolt Performance Optimization: Precompute team lookup map to convert O(N_teams) array find
  // calls per block (60 blocks per render) into O(1) hash map lookups.
  const teamsMap = useMemo(() => {
    const map: Record<string, Team> = {};
    for (const team of teams) {
      map[team.id] = team;
    }
    return map;
  }, [teams]);

  // Dynamically compute optimal grid layout based on block count
  const { lgCols, lgRows, smCols, smRows } = useMemo(() => {
    const total = blocks.length;
    if (total <= 0) return { lgCols: 12, lgRows: 5, smCols: 6, smRows: 10 };

    // Standard 60-block setup
    if (total === 60) return { lgCols: 12, lgRows: 5, smCols: 6, smRows: 10 };

    // Dynamic desktop layout: target ~2.4:1 landscape ratio (12:5)
    // Find factors or optimal rectangular arrangement
    let bestLgCols = Math.ceil(Math.sqrt(total * 2.2));
    bestLgCols = Math.max(4, Math.min(12, bestLgCols));
    const bestLgRows = Math.ceil(total / bestLgCols);

    // Dynamic portrait layout: target ~0.6:1 portrait ratio (6:10)
    let bestSmCols = Math.ceil(Math.sqrt(total * 0.6));
    bestSmCols = Math.max(3, Math.min(8, bestSmCols));
    const bestSmRows = Math.ceil(total / bestSmCols);

    return {
      lgCols: bestLgCols,
      lgRows: bestLgRows,
      smCols: bestSmCols,
      smRows: bestSmRows,
    };
  }, [blocks.length]);

  const lgAspect = `${lgCols}/${lgRows}`;
  const smAspect = `${smCols}/${smRows}`;

  return (
    <div className="@container/board w-full h-full min-h-0 flex items-center justify-center px-2 sm:px-3 py-1">
      <div
        style={{
          aspectRatio: undefined,
        }}
        className="relative max-h-full"
      >
        <div
          style={{
            ['--lg-aspect' as any]: `${lgCols} / ${lgRows}`,
            ['--sm-aspect' as any]: `${smCols} / ${smRows}`,
          }}
          className={`
            relative max-h-full max-w-full
            w-[min(100%,calc(100cqh*${smCols}/${smRows}))] aspect-[var(--sm-aspect)]
            lg:w-[min(100%,calc(100cqh*${lgCols}/${lgRows}))] lg:aspect-[var(--lg-aspect)]
          `}
        >
        {isGameOver && (
          <div className="absolute inset-x-2 top-2 z-30 flex justify-center pointer-events-none">
            <div className="pointer-events-auto w-[min(100%,48rem)]">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-900/95 to-amber-950/90 border-2 border-yellow-400/80 p-3 sm:p-4 shadow-[0_0_35px_rgba(250,204,21,0.4)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 border border-yellow-200 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 animate-bounce shrink-0">
                    🏆
                  </div>
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow">
                        BOARD CLEAR
                      </span>
                      <span className="font-mario text-yellow-300 text-base sm:text-lg text-shadow-gold">
                        ALL {blocks.length} QUESTIONS ANSWERED!
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      The board is cleared! Check final scores, medals, and the champion.
                    </p>
                  </div>
                </div>

                {onOpenLeaderboard && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSuperstar();
                      onOpenLeaderboard();
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 font-mario px-5 py-2.5 rounded-xl text-base sm:text-lg shadow-xl border-2 border-yellow-200 transition-all cursor-pointer glass-glow-gold animate-pulse shrink-0"
                  >
                    <Trophy className="w-5 h-5 fill-amber-950 text-amber-950" />
                    <span>VIEW LEADERBOARD</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            ['--lg-cols' as any]: `repeat(${lgCols}, minmax(0, 1fr))`,
            ['--lg-rows' as any]: `repeat(${lgRows}, minmax(0, 1fr))`,
            ['--sm-cols' as any]: `repeat(${smCols}, minmax(0, 1fr))`,
            ['--sm-rows' as any]: `repeat(${smRows}, minmax(0, 1fr))`,
            gridTemplateColumns: `var(--sm-cols)`,
            gridTemplateRows: `var(--sm-rows)`,
          }}
          className="w-full h-full grid lg:[grid-template-columns:var(--lg-cols)] lg:[grid-template-rows:var(--lg-rows)] gap-[clamp(0.2rem,0.8vmin,0.65rem)]"
        >
          {blocks.map(block => {
            const isOpened = block.isOpened;
            const isClearedWithX = isOpened && block.isIncorrectCleared;
            const openedTeam =
              isOpened && !isClearedWithX && block.openedByTeamId
                ? teamsMap[block.openedByTeamId]
                : null;
            const openedChar = openedTeam ? CHARACTERS[openedTeam.characterId] : null;

            return (
              <button
                key={block.id}
                type="button"
                onClick={() => {
                  if (isOpened) return;
                  sounds.playBlockHit();
                  onSelectBlock(block.id);
                }}
                disabled={isOpened}
                className={`relative w-full h-full min-h-0 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center select-none overflow-hidden transition-transform duration-100 ease-out z-0 ${
                  isOpened
                    ? isClearedWithX
                      ? 'bg-red-950/40 border border-red-500/30 opacity-70 shadow-inner cursor-not-allowed'
                      : 'bg-slate-900/60 border border-white/10 opacity-75 shadow-inner cursor-not-allowed'
                    : 'gold-mario-block cursor-pointer shadow-md hover:brightness-110 active:brightness-95 hover:z-20'
                }`}
              >
                {!isOpened ? (
                  <span className="relative z-10 font-mario text-white text-shadow-mario tracking-wider leading-none select-none text-[clamp(0.85rem,4.6cqw,2.15rem)]">
                    {block.id}
                  </span>
                ) : (
                  <div className="relative z-10 flex flex-col items-center justify-center p-0.5 w-full min-h-0">
                    {isClearedWithX ? (
                      <XIcon className="text-red-400 stroke-[3] w-[45%] h-[45%] max-w-8 max-h-8" />
                    ) : openedChar ? (
                      <>
                        <TeamAvatar
                          characterId={openedChar.id}
                          size="sm"
                          customUrl={openedTeam?.customImageUrl}
                          className="w-[42%] h-[42%] max-w-8 max-h-8"
                        />
                        <span className="font-bold text-white/90 truncate max-w-full leading-tight text-center text-[clamp(0.5rem,1.6cqw,0.75rem)] mt-0.5">
                          {openedTeam?.name}
                        </span>
                        {block.rewardCoins ? (
                          <span className="font-mario text-yellow-300 text-shadow-gold flex items-center justify-center gap-0.5 text-[clamp(0.55rem,1.7cqw,0.8rem)] w-full truncate">
                            +{block.rewardCoins}
                            <MarioCoin size="xs" />
                          </span>
                        ) : (
                          <Check className="w-3 h-3 text-emerald-400" />
                        )}
                      </>
                    ) : (
                      <Check className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);
});
