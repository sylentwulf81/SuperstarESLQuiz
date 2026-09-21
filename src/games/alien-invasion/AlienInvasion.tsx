import React, { useCallback, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { InvasionTeam, factionOf } from './data/factions';
import { sounds } from '@/shared/utils/sound';
import { US_STATE_PATHS } from './data/usStatePaths';
import { questionForState } from './data/invasionQuestions';
import { InvasionSetup } from './components/InvasionSetup';
import { UsaMap } from './components/UsaMap';
import { InvasionHeader } from './components/InvasionHeader';
import { InvasionQuestionModal } from './components/InvasionQuestionModal';
import { InvasionRulebookModal } from './components/InvasionRulebookModal';
import { InvasionVictoryModal } from './components/InvasionVictoryModal';
import { InvasionCinematic } from './components/InvasionCinematic';
import { ENDING_SCENES, INTRO_SCENES } from './data/cinematicScenes';

export const ALIEN_INVASION_MODULE = 'alien-invasion' as const;

export interface AlienInvasionProps {
  onExitToLauncher: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type InvasionView = 'setup' | 'intro' | 'board';

const emptyOwners = (): Record<string, string | null> => {
  const next: Record<string, string | null> = {};
  for (const state of US_STATE_PATHS) next[state.id] = null;
  return next;
};

export function AlienInvasion({
  onExitToLauncher,
  soundEnabled,
  onToggleSound,
}: AlienInvasionProps) {
  const [view, setView] = useState<InvasionView>('setup');
  const [teams, setTeams] = useState<InvasionTeam[]>([]);
  const [owners, setOwners] = useState<Record<string, string | null>>(emptyOwners);
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isEndingOpen, setIsEndingOpen] = useState(false);

  const counts = useMemo(() => {
    const next: Record<string, number> = {};
    for (const team of teams) next[team.id] = 0;
    for (const state of US_STATE_PATHS) {
      const teamId = owners[state.id];
      if (typeof teamId === 'string' && teamId in next) next[teamId] += 1;
    }
    return next;
  }, [owners, teams]);

  const capturedCount = US_STATE_PATHS.filter(state => Boolean(owners[state.id])).length;

  const resetBoard = useCallback(() => {
    setOwners(emptyOwners());
    setSelectedStateId(null);
    setPulseId(null);
    setIsVictoryOpen(false);
    setIsEndingOpen(false);
  }, []);

  const handleStartGame = useCallback((nextTeams: InvasionTeam[]) => {
    setTeams(nextTeams);
    resetBoard();
    setView('intro');
  }, [resetBoard]);

  const winnerFactionId = useMemo(() => {
    const sorted = [...teams].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
    return sorted[0] ? factionOf(sorted[0]).id : 'aliens';
  }, [counts, teams]);

  const handleSelectState = useCallback((stateId: string) => {
    sounds.playBlockHit();
    setSelectedStateId(stateId);
  }, []);

  const handleCapture = useCallback((teamId: string) => {
    if (!selectedStateId) return;
    const previous = owners[selectedStateId];
    const isSteal = Boolean(previous && previous !== teamId);
    setOwners(current => ({ ...current, [selectedStateId]: teamId }));
    setPulseId(selectedStateId);
    setSelectedStateId(null);
    if (isSteal) sounds.playStarCoin();
    else sounds.playCorrect();
    window.setTimeout(() => {
      setPulseId(current => (current === selectedStateId ? null : current));
    }, 900);
  }, [owners, selectedStateId]);

  const selectedQuestion = selectedStateId ? questionForState(selectedStateId) : null;

  return (
    <div className="h-dvh max-h-dvh overflow-hidden text-slate-100 flex flex-col relative bg-slate-950">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(217,70,239,0.22),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.16),transparent_38%),linear-gradient(#020617,#1e1b4b_55%,#020617)]" />
        <div
          className="absolute inset-0 opacity-40 bg-[radial-gradient(#fff_1px,transparent_1px)]"
          style={{ backgroundSize: '18px 18px' }}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        {view === 'setup' && (
          <InvasionSetup
            onStartGame={handleStartGame}
            onOpenRules={() => setIsRulesOpen(true)}
            onBackToLauncher={onExitToLauncher}
          />
        )}

        {view === 'intro' && (
          <InvasionCinematic
            scenes={INTRO_SCENES}
            soundEnabled={soundEnabled}
            onDone={() => setView('board')}
          />
        )}

        {view === 'board' && (
          <>
            <InvasionHeader
              teams={teams}
              counts={counts}
              capturedCount={capturedCount}
              totalStates={US_STATE_PATHS.length}
              soundEnabled={soundEnabled}
              onToggleSound={onToggleSound}
              onOpenRules={() => setIsRulesOpen(true)}
              onDeclareWinner={() => setIsEndingOpen(true)}
              onResetGame={() => {
                resetBoard();
                setView('setup');
              }}
              onExitToLauncher={onExitToLauncher}
            />
            <div className="flex-1 min-h-0 p-2 sm:p-3">
              <div className="h-full rounded-3xl border border-fuchsia-400/20 bg-slate-950/40 shadow-[0_0_40px_rgba(217,70,239,0.12)] overflow-hidden">
                <UsaMap
                  teams={teams}
                  owners={owners}
                  selectedId={selectedStateId}
                  pulseId={pulseId}
                  onSelect={handleSelectState}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedStateId && selectedQuestion && (
          <InvasionQuestionModal
            stateId={selectedStateId}
            question={selectedQuestion}
            teams={teams}
            ownerTeamId={owners[selectedStateId] ?? null}
            onCapture={handleCapture}
            onClose={() => setSelectedStateId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRulesOpen && <InvasionRulebookModal onClose={() => setIsRulesOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isEndingOpen && (
          <InvasionCinematic
            scenes={ENDING_SCENES[winnerFactionId]}
            soundEnabled={soundEnabled}
            skipLabel="SCORES"
            onDone={() => {
              setIsEndingOpen(false);
              setIsVictoryOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVictoryOpen && (
          <InvasionVictoryModal
            teams={teams}
            counts={counts}
            onRestart={() => {
              resetBoard();
              setView('setup');
            }}
            onClose={() => setIsVictoryOpen(false)}
            onExitToLauncher={onExitToLauncher}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
