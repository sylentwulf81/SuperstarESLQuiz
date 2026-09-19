import { useCallback, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/shared/context/AuthContext';
import { GameTheme } from '@/shared/types';
import { sounds } from '@/shared/utils/sound';
import { LauncherScreen } from '@/launcher/LauncherScreen';
import { LauncherGame } from '@/launcher/catalog';
import { MarioPartyQuiz, MARIO_PARTY_QUIZ_MODULE } from '@/games/mario-party-quiz';
import { RulebookModal } from '@/games/mario-party-quiz/components/RulebookModal';

type ShellSession =
  | { kind: 'launcher' }
  | {
      kind: typeof MARIO_PARTY_QUIZ_MODULE;
      theme: GameTheme;
      openStudio: boolean;
    };

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
    if (!game.isPlayable || game.gameModule !== MARIO_PARTY_QUIZ_MODULE) return;
    setSession({
      kind: MARIO_PARTY_QUIZ_MODULE,
      theme: game.themeKey ?? 'summer',
      openStudio: false,
    });
  }, []);

  const handleOpenQuestionStudio = useCallback((game: LauncherGame) => {
    if (!game.isPlayable || game.gameModule !== MARIO_PARTY_QUIZ_MODULE) return;
    setSession({
      kind: MARIO_PARTY_QUIZ_MODULE,
      theme: game.themeKey ?? 'summer',
      openStudio: true,
    });
  }, []);

  if (session.kind === MARIO_PARTY_QUIZ_MODULE) {
    return (
      <MarioPartyQuiz
        initialTheme={session.theme}
        startInStudio={session.openStudio}
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
        onOpenQuestionStudio={handleOpenQuestionStudio}
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
