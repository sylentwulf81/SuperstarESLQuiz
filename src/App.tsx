import { useCallback, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/shared/context/AuthContext';
import { GameTheme } from '@/shared/types';
import { sounds } from '@/shared/utils/sound';
import { LauncherScreen } from '@/launcher/LauncherScreen';
import { LauncherGame } from '@/launcher/catalog';
import { MarioPartyQuiz, MARIO_PARTY_QUIZ_MODULE } from '@/games/mario-party-quiz';
import { MarioBlastClassic, MARIO_BLAST_CLASSIC_MODULE } from '@/games/mario-blast-classic';
import { AlienInvasion, ALIEN_INVASION_MODULE } from '@/games/alien-invasion';
import { RulebookModal } from '@/games/mario-party-quiz/components/RulebookModal';

type ShellSession =
  | { kind: 'launcher' }
  | {
      kind: typeof MARIO_PARTY_QUIZ_MODULE;
      theme: GameTheme;
    }
  | { kind: typeof MARIO_BLAST_CLASSIC_MODULE }
  | { kind: typeof ALIEN_INVASION_MODULE };

function AppShell() {
  const [session, setSession] = useState<ShellSession>({ kind: 'launcher' });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      sounds.enabled = next;
      return next;
    });
  }, []);

  const exitToLauncher = useCallback(() => {
    setSession({ kind: 'launcher' });
  }, []);

  const handleLaunchGame = useCallback((game: LauncherGame) => {
    if (!game.isPlayable) return;
    if (game.gameModule === MARIO_BLAST_CLASSIC_MODULE) {
      setSession({ kind: MARIO_BLAST_CLASSIC_MODULE });
      return;
    }
    if (game.gameModule === ALIEN_INVASION_MODULE) {
      setSession({ kind: ALIEN_INVASION_MODULE });
      return;
    }
    if (game.gameModule !== MARIO_PARTY_QUIZ_MODULE) return;
    setSession({
      kind: MARIO_PARTY_QUIZ_MODULE,
      theme: game.themeKey ?? 'summer',
    });
  }, []);

  if (session.kind === MARIO_BLAST_CLASSIC_MODULE) {
    return (
      <MarioBlastClassic
        onExitToLauncher={exitToLauncher}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />
    );
  }

  if (session.kind === ALIEN_INVASION_MODULE) {
    return (
      <AlienInvasion
        onExitToLauncher={exitToLauncher}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />
    );
  }

  if (session.kind === MARIO_PARTY_QUIZ_MODULE) {
    return (
      <MarioPartyQuiz
        initialTheme={session.theme}
        onExitToLauncher={exitToLauncher}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />
    );
  }

  return (
    <>
      <LauncherScreen
        onLaunchGame={handleLaunchGame}
        onOpenRulebook={() => setIsRulesModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />
      <AnimatePresence>
        {isRulesModalOpen && (
          <RulebookModal
            onClose={() => setIsRulesModalOpen(false)}
            onTestCardInGame={() => undefined}
            activeTeamName="Host"
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
      <Toaster
        position="top-center"
        richColors
        theme="dark"
        closeButton
        toastOptions={{
          className: 'font-sans font-medium text-sm border border-white/20 shadow-2xl backdrop-blur-md',
          style: {
            zIndex: 999999,
          },
        }}
      />
    </AuthProvider>
  );
}
