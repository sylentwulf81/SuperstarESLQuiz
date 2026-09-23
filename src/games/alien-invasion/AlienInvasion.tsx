import React, { useCallback, useMemo, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { InvasionTeam, factionOf } from './data/factions';
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
import { EngineEffect, afterPaint, playEngineSound } from '@/shared/engineFx';
import {
  createMapTakeoverState,
  reduceMapTakeover,
  stateCounts,
  capturedCount,
  MapTakeoverEvent,
} from './engine';

export const ALIEN_INVASION_MODULE = 'alien-invasion' as const;

export interface AlienInvasionProps {
  onExitToLauncher: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function AlienInvasion({
  onExitToLauncher,
  soundEnabled,
  onToggleSound,
}: AlienInvasionProps) {
  const [state, setState] = React.useState(createMapTakeoverState);
  const [isRulesOpen, setIsRulesOpen] = React.useState(false);
  const pendingEffectsRef = useRef<EngineEffect[]>([]);

  const runEffects = useCallback((effects: EngineEffect[]) => {
    for (const effect of effects) {
      if (effect.kind === 'sound') playEngineSound(effect.sound);
      if (effect.kind === 'clearPulse') {
        window.setTimeout(() => {
          setState(prev => reduceMapTakeover(prev, { type: 'CLEAR_PULSE', stateId: effect.stateId }).state);
        }, effect.ms);
      }
    }
  }, []);

  const dispatch = useCallback((event: MapTakeoverEvent) => {
    setState(prev => {
      const result = reduceMapTakeover(prev, event);
      pendingEffectsRef.current = result.effects;
      return result.state;
    });
    afterPaint(() => {
      const effects = pendingEffectsRef.current;
      if (effects.length === 0) return;
      pendingEffectsRef.current = [];
      runEffects(effects);
    });
  }, [runEffects]);

  const { view, teams, owners, selectedStateId, pulseId, isVictoryOpen, isEndingOpen } = state;
  const counts = useMemo(() => stateCounts(state), [state]);
  const captured = capturedCount(state);

  const winnerFactionId = useMemo(() => {
    const sorted = [...teams].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
    return sorted[0] ? factionOf(sorted[0]).id : 'aliens';
  }, [counts, teams]);

  const handleStartGame = useCallback((nextTeams: InvasionTeam[]) => {
    dispatch({ type: 'START', teams: nextTeams });
  }, [dispatch]);

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
            onDone={() => dispatch({ type: 'INTRO_DONE' })}
          />
        )}

        {view === 'board' && (
          <>
            <InvasionHeader
              teams={teams}
              counts={counts}
              capturedCount={captured}
              totalStates={US_STATE_PATHS.length}
              soundEnabled={soundEnabled}
              onToggleSound={onToggleSound}
              onOpenRules={() => setIsRulesOpen(true)}
              onDeclareWinner={() => dispatch({ type: 'DECLARE_WINNER' })}
              onResetGame={() => dispatch({ type: 'RESTART' })}
              onExitToLauncher={onExitToLauncher}
            />
            <div className="flex-1 min-h-0 p-2 sm:p-3">
              <div className="h-full rounded-3xl border border-fuchsia-400/20 bg-slate-950/40 shadow-[0_0_40px_rgba(217,70,239,0.12)] overflow-hidden">
                <UsaMap
                  teams={teams}
                  owners={owners}
                  selectedId={selectedStateId}
                  pulseId={pulseId}
                  onSelect={stateId => dispatch({ type: 'SELECT_STATE', stateId })}
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
            onCapture={teamId => dispatch({ type: 'CAPTURE', teamId })}
            onClose={() => dispatch({ type: 'CLOSE_QUESTION' })}
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
            onDone={() => dispatch({ type: 'ENDING_DONE' })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVictoryOpen && (
          <InvasionVictoryModal
            teams={teams}
            counts={counts}
            onRestart={() => dispatch({ type: 'RESTART' })}
            onClose={() => dispatch({ type: 'CLOSE_VICTORY' })}
            onExitToLauncher={onExitToLauncher}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
