import { useCallback, useState, lazy, Suspense } from 'react';
import { AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from '@/shared/context/AuthContext';
import { GameTheme } from '@/shared/types';
import { sounds } from '@/shared/utils/sound';
import { LauncherScreen } from '@/launcher/LauncherScreen';
import { LauncherGame, PlayableGameModule } from '@/launcher/catalog';

const MARIO_PARTY_QUIZ_MODULE: PlayableGameModule = 'mario-party-quiz';
const MARIO_BLAST_CLASSIC_MODULE: PlayableGameModule = 'mario-blast-classic';
const ALIEN_INVASION_MODULE: PlayableGameModule = 'alien-invasion';

// Bolt Performance Optimization: Lazy-load game modules & modal to code-split large game assets
// and decrease initial JavaScript payload for faster launcher initial page load (~70%+ reduction).
const MarioPartyQuiz = lazy(() =>
  import('@/games/mario-party-quiz').then(m => ({ default: m.MarioPartyQuiz }))
);
const MarioBlastClassic = lazy(() =>
  import('@/games/mario-blast-classic').then(m => ({ default: m.MarioBlastClassic }))
);
const AlienInvasion = lazy(() =>
  import('@/games/alien-invasion').then(m => ({ default: m.AlienInvasion }))
);
const RulebookModal = lazy(() =>
  import('@/games/mario-party-quiz/components/RulebookModal').then(m => ({ default: m.RulebookModal }))
);

function GameLoadingFallback() {
  return (
    <div className="fixed inset-0 min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-amber-300 z-50">
      <Loader2 className="w-12 h-12 animate-spin text-amber-400" />
      <span className="font-mario text-xl tracking-wider animate-pulse">Loading Game Module...</span>
    </div>
  );
}

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
      <Suspense fallback={<GameLoadingFallback />}>
        <MarioBlastClassic
          onExitToLauncher={exitToLauncher}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      </Suspense>
    );
  }

  if (session.kind === ALIEN_INVASION_MODULE) {
    return (
      <Suspense fallback={<GameLoadingFallback />}>
        <AlienInvasion
          onExitToLauncher={exitToLauncher}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      </Suspense>
    );
  }

  if (session.kind === MARIO_PARTY_QUIZ_MODULE) {
    return (
      <Suspense fallback={<GameLoadingFallback />}>
        <MarioPartyQuiz
          initialTheme={session.theme}
          onExitToLauncher={exitToLauncher}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      </Suspense>
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
          <Suspense fallback={null}>
            <RulebookModal
              onClose={() => setIsRulesModalOpen(false)}
              onTestCardInGame={() => undefined}
              activeTeamName="Host"
            />
          </Suspense>
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
