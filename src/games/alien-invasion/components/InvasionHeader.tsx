import React from 'react';
import { BookOpen, Library, RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react';
import { InvasionTeam, factionOf } from '../data/factions';
import { sounds } from '@/shared/utils/sound';
import { AccountMenu } from '@/shared/components/AccountMenu';
import { FactionAvatar } from './FactionAvatar';

interface InvasionHeaderProps {
  teams: InvasionTeam[];
  counts: Record<string, number>;
  capturedCount: number;
  totalStates: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenRules: () => void;
  onDeclareWinner: () => void;
  onResetGame: () => void;
  onExitToLauncher: () => void;
}

export const InvasionHeader: React.FC<InvasionHeaderProps> = ({
  teams,
  counts,
  capturedCount,
  totalStates,
  soundEnabled,
  onToggleSound,
  onOpenRules,
  onDeclareWinner,
  onResetGame,
  onExitToLauncher,
}) => {
  return (
    <header className="shrink-0 px-3 py-2 sm:px-4 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onExitToLauncher();
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 border border-white/15 cursor-pointer"
          >
            <Library className="w-3.5 h-3.5 text-fuchsia-300" />
            Library
          </button>
          <h1 className="font-mario text-sm sm:text-lg text-white tracking-wide truncate">INVADE THE USA</h1>
          <span className="font-mario text-lg sm:text-2xl text-yellow-300">
            {capturedCount}/{totalStates}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenRules();
            }}
            className="p-2 rounded-xl bg-slate-800 text-yellow-300 border border-white/15 cursor-pointer"
            title="Rules"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-slate-800 text-slate-100 border border-white/15 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onDeclareWinner();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-mario text-xs sm:text-sm cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            WINNER
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onResetGame();
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-100 border border-white/15 cursor-pointer"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <AccountMenu />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {teams.map(team => (
          <div
            key={team.id}
            className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-2xl bg-slate-900/80 border border-white/15"
            style={{ boxShadow: `inset 0 0 0 2px ${factionOf(team).accentColor}` }}
          >
            <FactionAvatar factionId={team.factionId} size="sm" customUrl={team.customImageUrl} />
            <span className="font-mario text-xl sm:text-2xl text-yellow-300">{counts[team.id] ?? 0}</span>
          </div>
        ))}
      </div>
    </header>
  );
};
