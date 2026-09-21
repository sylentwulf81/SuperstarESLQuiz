import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Check, Play, Rocket, Users } from 'lucide-react';
import { sounds } from '@/shared/utils/sound';
import { AccountMenu } from '@/shared/components/AccountMenu';
import {
  INVASION_FACTION_LIST,
  InvasionFactionId,
  InvasionTeam,
} from '../data/factions';
import { FactionAvatar } from './FactionAvatar';

interface InvasionSetupProps {
  onStartGame: (teams: InvasionTeam[]) => void;
  onOpenRules: () => void;
  onBackToLauncher: () => void;
}

export const InvasionSetup: React.FC<InvasionSetupProps> = ({
  onStartGame,
  onOpenRules,
  onBackToLauncher,
}) => {
  const [selectedIds, setSelectedIds] = useState<InvasionFactionId[]>([]);
  const [teamNames, setTeamNames] = useState<Record<InvasionFactionId, string>>(() =>
    Object.fromEntries(INVASION_FACTION_LIST.map(faction => [faction.id, faction.name])) as Record<
      InvasionFactionId,
      string
    >
  );

  const toggleFaction = (factionId: InvasionFactionId) => {
    if (selectedIds.includes(factionId)) {
      sounds.playCharacterDeselect();
      setSelectedIds(selectedIds.filter(id => id !== factionId));
    } else {
      sounds.playCharacterSelect();
      setSelectedIds([...selectedIds, factionId]);
    }
  };

  const isStartReady = selectedIds.length >= 2;

  const handleStart = () => {
    if (!isStartReady) return;
    sounds.playGameStart();
    const teams: InvasionTeam[] = selectedIds.map(factionId => ({
      id: `team_${factionId}`,
      factionId,
      name: teamNames[factionId] || INVASION_FACTION_LIST.find(f => f.id === factionId)?.name || factionId,
    }));
    onStartGame(teams);
  };

  return (
    <div className="min-h-[85vh] lg:min-h-0 flex-1 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-5xl bg-slate-900 rounded-3xl border border-fuchsia-400/30 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-fuchsia-500 via-violet-400 to-cyan-400" />

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col">
          <div className="bg-slate-800/90 p-4 sm:p-5 text-white border-b border-white/15 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onBackToLauncher();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-slate-200 hover:text-white border border-white/20 text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-fuchsia-300" />
                Activity Library
              </button>
              <AccountMenu />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="font-mario text-2xl sm:text-3xl text-white text-shadow-mario tracking-wider">
                  INVADE THE USA
                </h1>
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-black uppercase border bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/40">
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Paint the USA</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onOpenRules();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer border border-indigo-300/40"
              >
                <BookOpen className="w-4 h-4 text-yellow-300" />
                VIEW RULES
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h3 className="font-mario text-base sm:text-lg text-yellow-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-fuchsia-400" />
                CHOOSE TEAMS ({selectedIds.length}/{INVASION_FACTION_LIST.length})
              </h3>
              <span
                className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                  isStartReady
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                }`}
              >
                {isStartReady ? 'Ready!' : 'Choose at least 2'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
              {INVASION_FACTION_LIST.map(faction => {
                const isSelected = selectedIds.includes(faction.id);
                return (
                  <div
                    key={faction.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={faction.name}
                    onClick={() => toggleFaction(faction.id)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggleFaction(faction.id);
                      }
                    }}
                    className={`relative rounded-2xl p-2.5 flex flex-col items-center gap-1.5 border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-fuchsia-900/90 to-slate-900 border-yellow-400 shadow-lg'
                        : 'bg-slate-800/60 border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                    <FactionAvatar
                      factionId={faction.id}
                      size="lg"
                      className="w-14 h-14 sm:w-16 sm:h-16 shadow-md"
                    />
                    <span
                      className="text-[10px] font-black uppercase tracking-wide"
                      style={{ color: faction.accentColor }}
                    >
                      {faction.tagline}
                    </span>
                    <div className="w-full text-center" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={teamNames[faction.id]}
                        onChange={e => setTeamNames(prev => ({ ...prev, [faction.id]: e.target.value }))}
                        className={`w-full text-center text-xs font-bold rounded-lg px-1.5 py-0.5 border ${
                          isSelected
                            ? 'bg-slate-950/80 text-yellow-300 border-yellow-400/50 focus:outline-none'
                            : 'bg-slate-900/50 text-slate-400 border-white/10'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                disabled={!isStartReady}
                onClick={handleStart}
                className={`w-full sm:w-auto px-9 py-3.5 font-mario text-lg sm:text-xl rounded-2xl shadow-xl border flex items-center justify-center gap-2.5 ${
                  isStartReady
                    ? 'bg-gradient-to-r from-fuchsia-600 to-violet-500 hover:from-fuchsia-500 hover:to-violet-400 text-white border-fuchsia-300/80 cursor-pointer'
                    : 'bg-white/10 text-slate-400 border-white/15 cursor-not-allowed opacity-50'
                }`}
              >
                <Play className={`w-5 h-5 ${isStartReady ? 'fill-current' : ''}`} />
                {isStartReady ? `START INVASION (${selectedIds.length})` : 'SELECT 2 TEAMS'}
              </button>
              <p className="text-xs text-fuchsia-200/80 font-medium">Click any state. Paint it. Steal it.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
