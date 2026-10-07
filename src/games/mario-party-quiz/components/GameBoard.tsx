import React, { useMemo, useState, useRef, useEffect } from 'react';
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
 * Primary desktop (landscape): centered board with square cells fitting the viewport.
 * Narrower views (portrait): responsive aspect ratio.
 * Dynamic layout: measures available space and smoothly sizes blocks for 10 to 60 questions.
 */
export const GameBoard = React.memo(function GameBoard({
  blocks,
  teams,
  onSelectBlock,
  isGameOver,
  onOpenLeaderboard,
}: GameBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Measure available container dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Precompute team lookup map for O(1) lookups
  const teamsMap = useMemo(() => {
    const map: Record<string, Team> = {};
    for (const team of teams) {
      map[team.id] = team;
    }
    return map;
  }, [teams]);

  // Dynamically compute optimal grid layout based on block count and orientation
  const isLandscape = containerSize.width === 0 || containerSize.width >= containerSize.height;

  const { cols, rows } = useMemo(() => {
    const total = blocks.length;
    if (total <= 0) return { cols: 12, rows: 5 };

    if (isLandscape) {
      if (total === 60) return { cols: 12, rows: 5 };
      if (total <= 12) return { cols: Math.min(total, 6), rows: Math.ceil(total / Math.min(total, 6)) };
      if (total <= 20) return { cols: 5, rows: Math.ceil(total / 5) };
      if (total <= 30) return { cols: Math.min(total, 8), rows: Math.ceil(total / Math.min(total, 8)) };
      if (total <= 40) return { cols: 10, rows: Math.ceil(total / 10) };
      // General formula for landscape: aspect ratio ~ 1.8 to 2.4
      let bestCols = Math.ceil(Math.sqrt(total * 2.2));
      bestCols = Math.max(4, Math.min(12, bestCols));
      const bestRows = Math.ceil(total / bestCols);
      return { cols: bestCols, rows: bestRows };
    } else {
      // Portrait / narrower mobile/tablet layout
      if (total === 60) return { cols: 6, rows: 10 };
      if (total <= 12) return { cols: 3, rows: Math.ceil(total / 3) };
      if (total <= 24) return { cols: 4, rows: Math.ceil(total / 4) };
      let bestCols = Math.ceil(Math.sqrt(total * 0.65));
      bestCols = Math.max(3, Math.min(8, bestCols));
      const bestRows = Math.ceil(total / bestCols);
      return { cols: bestCols, rows: bestRows };
    }
  }, [blocks.length, isLandscape]);

  // Calculate board dimensions that fit within container while maintaining aspect ratio
  const boardDimensions = useMemo(() => {
    const { width: w, height: h } = containerSize;
    if (w <= 0 || h <= 0) return null;

    const targetRatio = cols / rows;
    const currentRatio = w / h;

    let finalW: number;
    let finalH: number;

    if (currentRatio > targetRatio) {
      // Container is wider than board ratio -> fit height
      finalH = h;
      finalW = h * targetRatio;
    } else {
      // Container is taller than board ratio -> fit width
      finalW = w;
      finalH = w / targetRatio;
    }

    return {
      width: Math.floor(finalW),
      height: Math.floor(finalH),
    };
  }, [containerSize, cols, rows]);

  // Compute block size estimate for proportional font scaling
  const approxCellSize = useMemo(() => {
    if (!boardDimensions) return 48;
    return Math.min(boardDimensions.width / cols, boardDimensions.height / rows);
  }, [boardDimensions, cols, rows]);

  // Font size scales naturally with cell size
  const numberFontSize = Math.max(16, Math.min(52, Math.floor(approxCellSize * 0.46)));
  const teamLabelFontSize = Math.max(9, Math.min(16, Math.floor(approxCellSize * 0.16)));
  const coinLabelFontSize = Math.max(10, Math.min(18, Math.floor(approxCellSize * 0.18)));

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-0 flex items-center justify-center p-2 sm:p-3 overflow-hidden"
    >
      <div
        style={{
          width: boardDimensions ? `${boardDimensions.width}px` : '100%',
          height: boardDimensions ? `${boardDimensions.height}px` : '100%',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
        className="relative flex items-center justify-center transition-all duration-150"
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
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
          className="w-full h-full grid gap-[clamp(0.2rem,0.8vmin,0.65rem)]"
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
                  <span
                    style={{ fontSize: `${numberFontSize}px` }}
                    className="relative z-10 font-mario text-white text-shadow-mario tracking-wider leading-none select-none"
                  >
                    {block.id}
                  </span>
                ) : (
                  <div className="relative z-10 flex flex-col items-center justify-center p-0.5 w-full min-h-0">
                    {isClearedWithX ? (
                      <XIcon className="text-red-400 stroke-[3] w-[45%] h-[45%] max-w-10 max-h-10" />
                    ) : openedChar ? (
                      <>
                        <TeamAvatar
                          characterId={openedChar.id}
                          size="sm"
                          customUrl={openedTeam?.customImageUrl}
                          className="w-[42%] h-[42%] max-w-10 max-h-10"
                        />
                        <span
                          style={{ fontSize: `${teamLabelFontSize}px` }}
                          className="font-bold text-white/90 truncate max-w-full leading-tight text-center mt-0.5"
                        >
                          {openedTeam?.name}
                        </span>
                        {block.rewardCoins ? (
                          <span
                            style={{ fontSize: `${coinLabelFontSize}px` }}
                            className="font-mario text-yellow-300 text-shadow-gold flex items-center justify-center gap-0.5 w-full truncate"
                          >
                            +{block.rewardCoins}
                            <MarioCoin size="xs" />
                          </span>
                        ) : (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
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
  );
});
