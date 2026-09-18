import React from 'react';
import { Check, X as XIcon, Trophy } from 'lucide-react';
import { BlockState, Team } from '../types';
import { CHARACTERS } from '../data/characters';
import { sounds } from '../utils/sound';
import { MarioCoin } from './MarioCoin';
import { TeamAvatar } from './TeamAvatar';

interface GameBoardProps {
  blocks: BlockState[];
  teams: Team[];
  onSelectBlock: (blockId: number) => void;
  isGameOver?: boolean;
  onOpenLeaderboard?: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  blocks,
  teams,
  onSelectBlock,
  isGameOver,
  onOpenLeaderboard,
}) => {
  return (
    <div className="w-full h-full flex-1 flex flex-col items-center justify-center min-h-0 px-2 sm:px-4 py-1">
      {/* Container */}
      <div className="relative w-full max-w-[1600px] mx-auto p-2 sm:p-4 flex flex-col items-center justify-center">
        {/* Game Over Leaderboard Banner mirroring the Superstar reveal */}
        {isGameOver && (
          <div className="w-full max-w-3xl mx-auto mb-3 sm:mb-4 px-1">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-900/95 to-amber-950/90 border-2 border-yellow-400/80 p-3 sm:p-4 shadow-[0_0_35px_rgba(250,204,21,0.4)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 border border-yellow-200 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 animate-bounce shrink-0">
                  🏆
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow">
                      GAME COMPLETE
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
        )}

        {/* Mystery Blocks Grid (60 blocks: 5 rows of 12 on desktop/smartboard, 6 rows of 10 on tablet, 10 rows of 6 on mobile) */}
        <div className="w-full grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-1.5 sm:gap-2 md:gap-3 xl:gap-4">
          {blocks.map((block) => {
            const isOpened = block.isOpened;
            const isClearedWithX = isOpened && block.isIncorrectCleared;
            const openedTeam =
              isOpened && !isClearedWithX && block.openedByTeamId
                ? teams.find((t) => t.id === block.openedByTeamId)
                : null;
            const openedChar = openedTeam
              ? CHARACTERS[openedTeam.characterId]
              : null;

            return (
              <button
                key={block.id}
                onClick={() => {
                  if (isOpened) return;
                  sounds.playBlockHit();
                  onSelectBlock(block.id);
                }}
                disabled={isOpened}
                className={`relative w-full aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center select-none overflow-hidden transition-transform duration-100 ease-out z-0 ${
                  isOpened
                    ? isClearedWithX
                      ? 'bg-red-950/40 border border-red-500/30 opacity-70 shadow-inner cursor-not-allowed'
                      : 'bg-slate-900/60 border border-white/10 opacity-75 shadow-inner cursor-not-allowed'
                    : 'gold-mario-block cursor-pointer shadow-md hover:scale-105 active:scale-95 hover:z-20'
                }`}
              >
                {/* Block Content */}
                {!isOpened ? (
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    {/* Block Number */}
                    <span className="font-mario text-white text-shadow-mario tracking-wider leading-none select-none text-xl sm:text-2xl md:text-3xl lg:text-4xl">
                      {block.id}
                    </span>
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center justify-center p-0.5 sm:p-1 w-full">
                    {isClearedWithX ? (
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-mario text-red-300/80 mb-0.5 text-[10px] md:text-xs">
                          #{block.id}
                        </span>
                        <div className="rounded-lg bg-red-900/40 border border-red-500/50 flex items-center justify-center shadow-lg w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8">
                          <XIcon className="text-red-400 stroke-[3] w-3.5 h-3.5 md:w-5 md:h-5" />
                        </div>
                        <span className="font-bold text-red-300/80 uppercase tracking-wider mt-0.5 text-[8px] sm:text-[9px] md:text-[10px]">
                          MISSED
                        </span>
                      </div>
                    ) : openedChar ? (
                      <div className="flex flex-col items-center justify-center w-full px-1">
                        <TeamAvatar characterId={openedChar.id} size="sm" customUrl={openedTeam?.customImageUrl} className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                        <span className="font-bold text-white/90 truncate max-w-full leading-tight text-center text-[9px] sm:text-[10px] md:text-xs lg:text-sm mt-0.5">
                          {openedTeam?.name}
                        </span>
                        {block.rewardCoins ? (
                          <span className="font-mario text-yellow-300 text-shadow-gold flex items-center justify-center gap-0.5 text-[10px] sm:text-[11px] md:text-xs lg:text-sm mt-0.5 w-full truncate">
                            +{block.rewardCoins}
                            <MarioCoin size="xs" />
                          </span>
                        ) : (
                          <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="font-mario text-base sm:text-lg text-slate-400">
                          {block.id}
                        </span>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
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
};
