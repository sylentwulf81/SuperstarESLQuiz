import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  FileDown,
  Folder,
  FolderPlus,
  Pencil,
  Play,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Question, QuestionType } from '@/shared/types';
import { useAuth } from '@/shared/context/AuthContext';
import { STARTER_QUESTION_BANKS, QuestionBank } from '@/games/mario-blast-classic/data/questionBanks';
import { countTrailingDefaultFiller, makeBlankQuestion } from '@/games/mario-party-quiz/createBlocks';
import { ExportPdfModal } from '@/shared/components/ExportPdfModal';
import { MarkedPrompt } from '@/shared/components/MarkedPrompt';
import { sounds } from '@/shared/utils/sound';
import {
  Deck,
  loadLocalDecks,
  loadStoredFolders,
  newDeckId,
  persistDeck,
  saveLocalDecks,
  saveStoredFolders,
} from './deckLibrary';

interface MyDecksPanelProps {
  /** The deck the game is currently using. */
  activeBankId?: string;
  /** Classic-only "Have you ever…?" starters. */
  showStarterExamples?: boolean;
  /** Make this deck the game's deck. */
  onLoad: (deck: QuestionBank) => void;
  /** Make this deck the game's deck and open it in the Question Editor. */
  onEdit: (deck: Deck) => void;
  /** The game's deck was deleted. */
  onActiveDeckRemoved?: () => void;
}

type Armed = { id: string; mode: 'load' | 'edit' | 'delete' | 'trim' } | null;

const DECK_DRAG_TYPE = 'application/x-superstar-deck';
const DECK_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(15rem,16rem))] gap-3';
const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'open_trivia', label: 'Open answer' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'true_false', label: 'True or false' },
  { value: 'unscramble', label: 'Unscramble' },
];

export const MyDecksPanel = React.memo(function MyDecksPanel({
  activeBankId,
  showStarterExamples = true,
  onLoad,
  onEdit,
  onActiveDeckRemoved,
}: MyDecksPanelProps) {
  const { isLoggedIn, loginWithGoogle, listQuestionBanks, saveQuestionBank, deleteQuestionBank } = useAuth();
  const [mine, setMine] = useState<Deck[]>(loadLocalDecks);
  const [loadingMine, setLoadingMine] = useState(false);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState<Armed>(null);
  const [storedFolders, setStoredFolders] = useState<string[]>(loadStoredFolders);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(() => new Set());
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'deck' | 'folder' | null>(null);
  const [exportPdfDeck, setExportPdfDeck] = useState<{ questions: Question[]; name: string; goal: string } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const cloudSave = isLoggedIn ? saveQuestionBank : undefined;

  // Cloud decks first, plus any local-only decks
  useEffect(() => {
    const localDecks = loadLocalDecks();
    if (!isLoggedIn) {
      setMine(localDecks);
      return;
    }
    let cancelled = false;
    setLoadingMine(true);
    listQuestionBanks()
      .then(cloudDecks => {
        if (cancelled) return;
        const cloudIds = new Set(cloudDecks.map(d => d.id));
        setMine([...cloudDecks, ...localDecks.filter(d => !cloudIds.has(d.id))]);
      })
      .catch(() => {
        if (!cancelled) setMine(localDecks);
      })
      .finally(() => {
        if (!cancelled) setLoadingMine(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const activeIsMine = Boolean(activeBankId && mine.some(d => d.id === activeBankId));

  const folders = useMemo(() => {
    const names = new Set<string>(storedFolders);
    for (const deck of mine) if (deck.folder?.trim()) names.add(deck.folder.trim());
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [storedFolders, mine]);

  const decksByFolder = useMemo(() => {
    const map = new Map<string, Deck[]>();
    for (const deck of mine) {
      const key = deck.folder?.trim() || '';
      map.set(key, [...(map.get(key) || []), deck]);
    }
    return map;
  }, [mine]);

  // Save a deck and report the outcome; returns the saved deck or null
  const saveDeck = async (deck: Deck, successMessage?: string): Promise<Deck | null> => {
    setBusy(true);
    const result = await persistDeck(deck, cloudSave);
    setBusy(false);
    if (!result.savedLocally && !result.savedToCloud) {
      toast.error(`Could not save “${deck.name}”`, {
        description: isLoggedIn
          ? result.cloudError || 'Browser storage is full and the cloud save failed.'
          : 'Browser storage is full (large question images use it up). Sign in to save to the cloud, or remove images.',
      });
      return null;
    }
    setMine(prev => [result.deck, ...prev.filter(d => d.id !== result.deck.id)]);
    if (isLoggedIn && !result.savedToCloud) {
      toast.warning(`Saved “${deck.name}” on this computer only`, { description: result.cloudError });
    } else if (successMessage) {
      toast.success(successMessage);
    }
    return result.deck;
  };

  const handleCreateDeck = async (values: NewDeckValues) => {
    const deck: Deck = {
      id: newDeckId(),
      name: values.name,
      lessonGoal: values.lessonGoal,
      description: values.description,
      folder: values.folder,
      questions: Array.from({ length: values.count }, (_, i) => makeBlankQuestion(i, values.type)),
      updatedAt: new Date().toISOString(),
    };
    const saved = await saveDeck(deck);
    if (!saved) return;
    sounds.playPowerUp();
    setDialog(null);
    onEdit(saved);
  };

  const handleCreateFolder = (name: string) => {
    if (folders.some(f => f.toLowerCase() === name.toLowerCase())) {
      toast.error(`A folder named “${name}” already exists`);
      return;
    }
    const next = [...storedFolders, name];
    setStoredFolders(next);
    saveStoredFolders(next);
    setDialog(null);
    sounds.playPop();
  };

  // Move a deck into a folder ('' = unfiled)
  const handleMoveToFolder = async (deckId: string, folder: string) => {
    const deck = mine.find(d => d.id === deckId);
    if (!deck || (deck.folder?.trim() || '') === folder) return;
    const moved: Deck = { ...deck, folder };
    setMine(prev => prev.map(d => (d.id === deckId ? moved : d)));
    saveLocalDecks([moved, ...loadLocalDecks().filter(d => d.id !== deckId)]);
    sounds.playPop();
    if (isLoggedIn) {
      try {
        await saveQuestionBank({ id: deck.id, name: deck.name, lessonGoal: deck.lessonGoal, questions: deck.questions, folder });
      } catch {
        toast.warning(`Moved “${deck.name}” on this computer only`);
      }
    }
  };

  // Removing a folder keeps its decks: they become unfiled
  const handleDeleteFolder = (folder: string) => {
    const next = storedFolders.filter(f => f !== folder);
    setStoredFolders(next);
    saveStoredFolders(next);
    for (const deck of decksByFolder.get(folder) || []) void handleMoveToFolder(deck.id, '');
    toast.info(`Folder “${folder}” removed; its decks are now unfiled`);
  };

  const handleDelete = async (deckId: string) => {
    setBusy(true);
    saveLocalDecks(loadLocalDecks().filter(d => d.id !== deckId));
    if (isLoggedIn) {
      try {
        await deleteQuestionBank(deckId);
      } catch {}
    }
    setBusy(false);
    setArmed(null);
    if (activeBankId === deckId) onActiveDeckRemoved?.();
    setMine(prev => prev.filter(d => d.id !== deckId));
    toast.info('Deck deleted');
  };

  // Older builds padded short decks with built-in questions; remove them from the saved deck
  const handleTrimFiller = async (deck: Deck, fillerCount: number) => {
    setArmed(null);
    const saved = await saveDeck(
      { ...deck, questions: deck.questions.slice(0, deck.questions.length - fillerCount) },
      `Removed ${fillerCount} filler questions from “${deck.name}”`
    );
    if (saved && activeBankId === deck.id) onLoad(saved);
  };

  const handleDuplicate = async (deck: QuestionBank) => {
    sounds.playClick();
    await saveDeck(
      {
        id: newDeckId(),
        name: `${deck.name} (copy)`.slice(0, 40),
        lessonGoal: deck.lessonGoal,
        questions: deck.questions.map(q => ({ ...q })),
        updatedAt: new Date().toISOString(),
      },
      `Copied “${deck.name}” to your decks`
    );
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
          toast.error('That file is not a question set');
          return;
        }
        const name = (typeof parsed.name === 'string' && parsed.name.trim()) || file.name.replace(/\.json$/i, '');
        await saveDeck(
          {
            id: newDeckId(),
            name,
            lessonGoal: typeof parsed.lessonGoal === 'string' ? parsed.lessonGoal : '',
            description: typeof parsed.description === 'string' ? parsed.description : undefined,
            questions: parsed.questions,
            updatedAt: new Date().toISOString(),
          },
          `Imported “${name}” (${parsed.questions.length} questions)`
        );
      } catch {
        toast.error('Could not read that file');
      }
    };
    reader.readAsText(file);
  };

  // Loading replaces the game's questions; ask first only when they aren't saved in a deck
  const confirmThen = (deck: QuestionBank, mode: 'load' | 'edit', run: () => void) => {
    if (activeIsMine || deck.id === activeBankId || (armed?.id === deck.id && armed.mode === mode)) {
      setArmed(null);
      run();
      return;
    }
    sounds.playClick();
    setArmed({ id: deck.id, mode });
  };

  const renderCard = (deck: QuestionBank, isMine: boolean) => (
    <DeckCard
      key={deck.id}
      deck={deck}
      armed={armed}
      busy={busy}
      isMine={isMine}
      isActive={deck.id === activeBankId}
      onLoad={() => confirmThen(deck, 'load', () => {
        sounds.playCorrect();
        onLoad({ ...deck, questions: deck.questions.map(q => ({ ...q })) });
        toast.success(`“${deck.name}” is ready to play`);
      })}
      onEdit={isMine ? () => confirmThen(deck, 'edit', () => onEdit(deck as Deck)) : undefined}
      onDuplicate={!isMine ? () => void handleDuplicate(deck) : undefined}
      onExportPdf={() => {
        sounds.playClick();
        setExportPdfDeck({ questions: deck.questions, name: deck.name, goal: deck.lessonGoal });
      }}
      onArm={setArmed}
      onDelete={isMine ? () => void handleDelete(deck.id) : undefined}
      onTrimFiller={isMine ? count => void handleTrimFiller(deck as Deck, count) : undefined}
    />
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h3 className="text-xl font-bold text-white">My Decks</h3>
          <p className="text-sm text-slate-400">
            {mine.length} {mine.length === 1 ? 'deck' : 'decks'}
            {mine.length > 0 && ' · drag a deck onto a folder to file it'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setDialog('deck');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Question Set
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setDialog('folder');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold border border-white/15 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-sky-300" />
            New Folder
          </button>
          <button
            type="button"
            onClick={() => importFileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-sm font-semibold cursor-pointer"
            title="Add a deck from a JSON backup file"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <input type="file" ref={importFileRef} accept=".json,application/json" onChange={handleImportJson} className="hidden" />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
        {!isLoggedIn && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-sm text-slate-300">
            Decks are saved in this browser. Sign in to back them up and use them on other computers.
            <button
              type="button"
              onClick={() => void loginWithGoogle()}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold cursor-pointer"
            >
              Sign in
            </button>
          </div>
        )}
        {isLoggedIn && loadingMine && <p className="text-sm text-slate-400">Loading your decks…</p>}

        <div className="space-y-3">
          {[...folders, ''].map(folder => {
            const decks = decksByFolder.get(folder) || [];
            // With no folders and no decks there is nothing to drop onto; once folders exist, Unfiled stays as a drop zone
            if (folder === '' && decks.length === 0 && folders.length === 0) {
              return (
                <p key="__empty" className="text-sm text-slate-400">
                  No decks yet. Click New Question Set to make one{showStarterExamples ? ', or copy an example below' : ''}.
                </p>
              );
            }
            const isCollapsed = collapsedFolders.has(folder);
            return (
              <div
                key={folder || '__unfiled'}
                onDragOver={e => {
                  if (!e.dataTransfer.types.includes(DECK_DRAG_TYPE)) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dropTarget !== folder) setDropTarget(folder);
                }}
                onDragLeave={e => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
                }}
                onDrop={e => {
                  e.preventDefault();
                  setDropTarget(null);
                  const deckId = e.dataTransfer.getData(DECK_DRAG_TYPE);
                  if (deckId) void handleMoveToFolder(deckId, folder);
                }}
                className={`rounded-2xl border p-3 transition-colors ${
                  dropTarget === folder ? 'border-sky-400 bg-sky-950/40' : 'border-white/10 bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2 px-1 pb-2.5">
                  <button
                    type="button"
                    onClick={() => setCollapsedFolders(prev => {
                      const next = new Set(prev);
                      if (next.has(folder)) next.delete(folder);
                      else next.add(folder);
                      return next;
                    })}
                    className="flex items-center gap-1.5 text-sm font-semibold text-slate-200 hover:text-white cursor-pointer"
                    aria-expanded={!isCollapsed}
                  >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <Folder className={`w-4 h-4 ${folder ? 'text-sky-300' : 'text-slate-500'}`} />
                    {folder || 'Unfiled'}
                    <span className="text-xs font-normal text-slate-400">({decks.length})</span>
                  </button>
                  {folder && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFolder(folder)}
                      className="ml-auto p-1 rounded-md text-slate-500 hover:text-rose-300 hover:bg-white/5 cursor-pointer"
                      title="Remove folder (its decks become unfiled)"
                      aria-label={`Remove folder ${folder}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {!isCollapsed && (
                  decks.length > 0 ? (
                    <div className={DECK_GRID}>{decks.map(deck => renderCard(deck, true))}</div>
                  ) : (
                    <p className="px-1 pb-1 text-sm text-slate-500">
                      {folder ? 'Empty folder. Drag decks here.' : 'Drag decks here to take them out of a folder.'}
                    </p>
                  )
                )}
              </div>
            );
          })}
        </div>

        {showStarterExamples && (
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Examples</h4>
            <div className={DECK_GRID}>{STARTER_QUESTION_BANKS.map(deck => renderCard(deck, false))}</div>
          </section>
        )}
      </div>

      <AnimatePresence>
        {dialog === 'deck' && (
          <NewDeckDialog
            folders={folders}
            busy={busy}
            onCancel={() => setDialog(null)}
            onCreate={values => void handleCreateDeck(values)}
          />
        )}
        {dialog === 'folder' && (
          <NewFolderDialog onCancel={() => setDialog(null)} onCreate={handleCreateFolder} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exportPdfDeck && (
          <ExportPdfModal
            questions={exportPdfDeck.questions}
            deckName={exportPdfDeck.name}
            lessonGoal={exportPdfDeck.goal}
            onClose={() => setExportPdfDeck(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

interface NewDeckValues {
  name: string;
  lessonGoal: string;
  description: string;
  folder: string;
  count: number;
  type: QuestionType;
}

function DialogShell({ title, onCancel, children }: { title: string; onCancel: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-lg bg-slate-900 border border-white/15 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

const FIELD = 'w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/50';
const LABEL = 'block text-sm font-semibold text-slate-200 mb-1';

function NewDeckDialog({
  folders,
  busy,
  onCancel,
  onCreate,
}: {
  folders: string[];
  busy: boolean;
  onCancel: () => void;
  onCreate: (values: NewDeckValues) => void;
}) {
  const [values, setValues] = useState<NewDeckValues>({
    name: '',
    lessonGoal: '',
    description: '',
    folder: '',
    count: 20,
    type: 'open_trivia',
  });
  const [nameError, setNameError] = useState(false);
  const set = (patch: Partial<NewDeckValues>) => setValues(prev => ({ ...prev, ...patch }));

  return (
    <DialogShell title="New Question Set" onCancel={onCancel}>
      <form
        className="px-5 pb-5 space-y-3.5"
        onSubmit={e => {
          e.preventDefault();
          const name = values.name.trim();
          if (!name) {
            setNameError(true);
            return;
          }
          onCreate({ ...values, name, lessonGoal: values.lessonGoal.trim(), description: values.description.trim() });
        }}
      >
        <div>
          <label htmlFor="new-deck-name" className={LABEL}>Lesson title</label>
          <input
            id="new-deck-name"
            autoFocus
            maxLength={40}
            value={values.name}
            onChange={e => {
              set({ name: e.target.value });
              setNameError(false);
            }}
            placeholder="Unit 4: Animals"
            className={FIELD}
          />
          {nameError && <p className="mt-1 text-xs text-rose-300">Enter a lesson title first.</p>}
        </div>
        <div>
          <label htmlFor="new-deck-goal" className={LABEL}>
            Lesson goal <span className="font-normal text-slate-400">(optional, shown above each question)</span>
          </label>
          <input id="new-deck-goal" maxLength={80} value={values.lessonGoal} onChange={e => set({ lessonGoal: e.target.value })} placeholder="Ask and answer “Can you…?”" className={FIELD} />
        </div>
        <div>
          <label htmlFor="new-deck-description" className={LABEL}>
            Description <span className="font-normal text-slate-400">(optional, only you see it)</span>
          </label>
          <input id="new-deck-description" maxLength={120} value={values.description} onChange={e => set({ description: e.target.value })} placeholder="Review for Thursday's 4th graders" className={FIELD} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="new-deck-count" className={LABEL}>Questions</label>
            <input
              id="new-deck-count"
              type="number"
              min={10}
              max={60}
              value={values.count}
              onChange={e => set({ count: Math.max(10, Math.min(60, Number(e.target.value) || 10)) })}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="new-deck-type" className={LABEL}>Start each question as</label>
            <select id="new-deck-type" value={values.type} onChange={e => set({ type: e.target.value as QuestionType })} className={FIELD}>
              {QUESTION_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        {folders.length > 0 && (
          <div>
            <label htmlFor="new-deck-folder" className={LABEL}>Folder</label>
            <select id="new-deck-folder" value={values.folder} onChange={e => set({ folder: e.target.value })} className={FIELD}>
              <option value="">Unfiled</option>
              {folders.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-sm font-semibold cursor-pointer">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer">
            Create and edit
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function NewFolderDialog({ onCancel, onCreate }: { onCancel: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState(false);
  return (
    <DialogShell title="New Folder" onCancel={onCancel}>
      <form
        className="px-5 pb-5 space-y-3.5"
        onSubmit={e => {
          e.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) {
            setError(true);
            return;
          }
          onCreate(trimmed.slice(0, 40));
        }}
      >
        <div>
          <label htmlFor="new-folder-name" className={LABEL}>Folder name</label>
          <input
            id="new-folder-name"
            autoFocus
            maxLength={40}
            value={name}
            onChange={e => {
              setName(e.target.value);
              setError(false);
            }}
            placeholder="Grade 4"
            className={FIELD}
          />
          {error && <p className="mt-1 text-xs text-rose-300">Enter a folder name first.</p>}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-sm font-semibold cursor-pointer">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold cursor-pointer">
            Create folder
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

const ICON_BUTTON = 'p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 cursor-pointer transition-colors disabled:opacity-60';

const DeckCard = React.memo(function DeckCard({
  deck,
  armed,
  busy,
  isMine,
  isActive,
  onLoad,
  onEdit,
  onDuplicate,
  onExportPdf,
  onArm,
  onDelete,
  onTrimFiller,
}: {
  key?: React.Key;
  deck: QuestionBank & { description?: string };
  armed: Armed;
  busy: boolean;
  isMine: boolean;
  isActive: boolean;
  onLoad: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onExportPdf: () => void;
  onArm: (next: Armed) => void;
  onDelete?: () => void;
  onTrimFiller?: (count: number) => void;
}) {
  const isArmed = (mode: NonNullable<Armed>['mode']) => armed?.id === deck.id && armed.mode === mode;
  const fillerCount = useMemo(
    () => (onTrimFiller ? countTrailingDefaultFiller(deck.questions) : 0),
    [deck.questions, Boolean(onTrimFiller)]
  );
  const description = deck.description?.trim();

  return (
    <div
      id={`library-bank-${deck.id}`}
      draggable={isMine}
      onDragStart={isMine ? e => {
        e.dataTransfer.setData(DECK_DRAG_TYPE, deck.id);
        e.dataTransfer.effectAllowed = 'move';
      } : undefined}
      className={`h-52 rounded-2xl border p-3.5 flex flex-col gap-1.5 bg-indigo-950/50 overflow-hidden transition-colors ${
        isMine ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isActive ? 'border-emerald-400/80 ring-1 ring-emerald-400/50' : 'border-indigo-300/20 hover:border-indigo-300/40'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base font-bold text-white leading-tight truncate" title={deck.name}>{deck.name}</span>
          {isActive && (
            <span className="px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shrink-0">
              Active
            </span>
          )}
        </div>
        <span className="text-sm font-semibold text-amber-300 shrink-0">{deck.questions.length} Qs</span>
      </div>

      {deck.lessonGoal?.trim() && (
        <p className="text-sm text-rose-200 leading-snug line-clamp-1" title={deck.lessonGoal}>{deck.lessonGoal}</p>
      )}
      {description ? (
        <p className="text-sm text-slate-300 leading-snug line-clamp-2">{description}</p>
      ) : (
        <p className="text-sm text-slate-500 leading-snug line-clamp-2">
          <MarkedPrompt text={deck.questions[0]?.title || 'No questions written yet'} />
        </p>
      )}

      {fillerCount > 0 && (
        <div
          className="flex items-center gap-2 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-xs text-amber-100"
          title={`Questions ${deck.questions.length - fillerCount + 1}–${deck.questions.length} are built-in examples added by an older version.`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="flex-1 truncate">Q{deck.questions.length - fillerCount + 1}–{deck.questions.length} are built-in filler</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => (isArmed('trim') ? onTrimFiller?.(fillerCount) : onArm({ id: deck.id, mode: 'trim' }))}
            className="px-2 py-0.5 rounded-md font-semibold bg-slate-800 hover:bg-slate-700 text-amber-200 border border-white/15 cursor-pointer shrink-0"
          >
            {isArmed('trim') ? `Remove ${fillerCount}?` : 'Remove'}
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-auto pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={onLoad}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border cursor-pointer transition-colors ${
            isArmed('load') ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-white/15'
          }`}
          title="Use this deck in the game"
        >
          <Play className="w-3.5 h-3.5" />
          {isArmed('load') ? 'Replace?' : 'Load'}
        </button>
        {onEdit && (
          <button
            type="button"
            disabled={busy}
            onClick={onEdit}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border cursor-pointer transition-colors ${
              isArmed('edit') ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-200' : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/60'
            }`}
            title="Open in the Question Editor"
          >
            <Pencil className="w-3.5 h-3.5" />
            {isArmed('edit') ? 'Replace?' : 'Edit'}
          </button>
        )}
        {onDuplicate && (
          <button type="button" disabled={busy} onClick={onDuplicate} className={ICON_BUTTON} title="Copy to my decks so you can edit it" aria-label={`Copy ${deck.name} to my decks`}>
            <Copy className="w-4 h-4" />
          </button>
        )}
        <button type="button" onClick={onExportPdf} className={ICON_BUTTON} title="Download as PDF with a teacher answer key" aria-label={`Download ${deck.name} as PDF`}>
          <FileDown className="w-4 h-4" />
        </button>
        {onDelete && (
          isArmed('delete') ? (
            <button type="button" disabled={busy} onClick={onDelete} className="px-2.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold cursor-pointer">
              Delete?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onArm({ id: deck.id, mode: 'delete' })}
              className={`${ICON_BUTTON} hover:bg-rose-950 hover:text-rose-200`}
              title="Delete this deck"
              aria-label={`Delete ${deck.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )
        )}
      </div>
    </div>
  );
});
