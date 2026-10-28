import React, { useEffect, useState, useMemo, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { Library, LogIn, Trash2, CheckCircle2, RefreshCw, Download, Upload, Copy, AlertTriangle, FileDown, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Question } from '@/shared/types';
import { useAuth } from '@/shared/context/AuthContext';
import { CloudQuestionBank } from '@/shared/utils/firebase';
import { STARTER_QUESTION_BANKS, QuestionBank } from '@/games/mario-blast-classic/data/questionBanks';
import { MarkedPrompt } from '@/shared/components/MarkedPrompt';
import { legacySlashesToMarks } from '@/shared/markedPrompt';
import { optimizeDataUrl } from '@/shared/utils/imageUtils';
import { sounds } from '@/shared/utils/sound';
import { ExportPdfModal } from '@/shared/components/ExportPdfModal';
import { countTrailingDefaultFiller } from '@/games/mario-party-quiz/createBlocks';

interface QuestionLibraryPanelProps {
  questions: Question[];
  lessonGoal: string;
  onApply: (bank: QuestionBank) => void;
  onClose: () => void;
  /** Classic-only "Have you ever...?" grammar-drill starters; hidden for other themes. */
  showStarterExamples?: boolean;
  activeBankId?: string;
  activeBankName?: string;
  onActiveBankChange?: (bankId?: string, bankName?: string) => void;
}

type Armed = { id: string; mode: 'load' | 'delete' | 'update' | 'trim' } | null;

const LOCAL_CUSTOM_BANKS_KEY = 'superstar_local_custom_banks_v1';

export function loadLocalCustomBanks(): CloudQuestionBank[] {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_BANKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

/** Returns false when the browser refused the write (usually storage quota). */
export function saveLocalCustomBanks(banks: CloudQuestionBank[]): boolean {
  try {
    localStorage.setItem(LOCAL_CUSTOM_BANKS_KEY, JSON.stringify(banks));
    return true;
  } catch {
    return false;
  }
}

/**
 * Bolt Performance Optimization:
 * 1) Wrapped QuestionLibraryPanel and BankCard in React.memo to prevent VDOM re-renders
 *    and prompt regex parsing of all library bank cards during text input keystrokes.
 * 2) Memoized uniqueCountOptions array in useMemo to eliminate garbage collection re-allocations on render.
 */
export const QuestionLibraryPanel = React.memo(function QuestionLibraryPanel({
  questions,
  lessonGoal,
  onApply,
  onClose,
  showStarterExamples = true,
  activeBankId,
  activeBankName,
  onActiveBankChange,
}: QuestionLibraryPanelProps) {
  const { isLoggedIn, loginWithGoogle, listQuestionBanks, saveQuestionBank, deleteQuestionBank } = useAuth();
  const [name, setName] = useState(activeBankName || '');
  const [targetGoal, setTargetGoal] = useState(lessonGoal || '');
  const [saveCount, setSaveCount] = useState<number>(questions.length || 60);
  const [mine, setMine] = useState<CloudQuestionBank[]>(() => loadLocalCustomBanks());
  const [loadingMine, setLoadingMine] = useState(false);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState<Armed>(null);
  const [exportPdfDeck, setExportPdfDeck] = useState<{ questions: Question[]; name: string; goal: string } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const populatedCount = useMemo(() => {
    return questions.filter(q => q.title && q.title.trim().length > 0 && q.title !== 'Blank Question').length;
  }, [questions]);

  useEffect(() => {
    setTargetGoal(lessonGoal || '');
  }, [lessonGoal]);

  useEffect(() => {
    if (activeBankName && !name) {
      setName(activeBankName);
    }
  }, [activeBankName, name]);

  useEffect(() => {
    const localBanks = loadLocalCustomBanks();
    if (!isLoggedIn) {
      setMine(localBanks);
      return;
    }
    let cancelled = false;
    setLoadingMine(true);
    listQuestionBanks()
      .then(cloudBanks => {
        if (!cancelled) {
          const cloudIds = new Set(cloudBanks.map(b => b.id));
          const merged = [...cloudBanks, ...localBanks.filter(b => !cloudIds.has(b.id))];
          setMine(merged);
        }
      })
      .catch(() => {
        if (!cancelled) setMine(localBanks);
      })
      .finally(() => {
        if (!cancelled) setLoadingMine(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Only decks in "Yours" can be updated in place; starter examples are saved as new decks
  const activeIsMine = Boolean(activeBankId && mine.some(b => b.id === activeBankId));

  // Another deck (not the open one) that already uses the typed name
  const existingMatch = useMemo(() => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return null;
    return mine.find(b => b.id !== activeBankId && b.name.trim().toLowerCase() === trimmed) || null;
  }, [name, mine, activeBankId]);

  const isEditingLoadedBank = activeIsMine && (
    activeBankName?.trim().toLowerCase() === name.trim().toLowerCase() || !name.trim()
  );

  // Typed a new name while a saved deck is open: offer rename instead of only "save as new"
  const isRenamingLoadedBank = activeIsMine && !isEditingLoadedBank && !existingMatch;

  const handlePrimarySave = () => {
    if (isEditingLoadedBank || isRenamingLoadedBank) {
      void handleSave(activeBankId);
    } else if (existingMatch) {
      void handleSave(existingMatch.id);
    } else {
      void handleSave();
    }
  };

  const handleSave = async (targetBankId?: string, overrideName?: string) => {
    const rawName = overrideName ?? (name.trim() || activeBankName || '');
    const trimmed = rawName.trim();
    if (!trimmed) {
      toast.error('Name this set first');
      return;
    }

    const finalCount = Math.max(1, Math.min(saveCount, questions.length));
    const rawSlice = questions.slice(0, finalCount);

    setBusy(true);

    // Optimize large base64 images so that documents never exceed storage limits
    const selectedQuestions = await Promise.all(
      rawSlice.map(async (question) => {
        let imageUrl = question.imageUrl;
        if (imageUrl && imageUrl.startsWith('data:image/') && imageUrl.length > 50_000) {
          try {
            imageUrl = await optimizeDataUrl(imageUrl, 640, 0.72);
          } catch {
            // Keep original if optimization fails
          }
        }
        return {
          ...question,
          title: legacySlashesToMarks(question.title),
          imageUrl,
        };
      })
    );

    const bankId = targetBankId || `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const localBank: CloudQuestionBank = {
      id: bankId,
      name: trimmed,
      lessonGoal: targetGoal.trim(),
      questions: selectedQuestions,
      updatedAt: new Date().toISOString(),
    };

    // Always persist to local custom library immediately. Banks are matched by id only:
    // two decks may share a name, and saving one must never replace the other.
    const existingLocal = loadLocalCustomBanks();
    const updatedLocal = [
      localBank,
      ...existingLocal.filter(b => b.id !== localBank.id),
    ];
    const savedLocally = saveLocalCustomBanks(updatedLocal);

    let cloudResultBank: CloudQuestionBank | undefined;
    let cloudError: string | undefined;
    if (isLoggedIn) {
      try {
        // Same id locally and in the cloud, so the two copies stay one deck
        const result = await saveQuestionBank({
          id: bankId,
          name: trimmed,
          lessonGoal: targetGoal.trim(),
          questions: selectedQuestions,
        });
        if (result.success && result.bank) {
          cloudResultBank = result.bank;
        } else {
          cloudError = result.error;
        }
      } catch {
        cloudError = 'Could not reach the cloud library.';
      }
    }

    setBusy(false);

    if (!savedLocally && !cloudResultBank) {
      toast.error(`Could not save “${trimmed}”`, {
        description: isLoggedIn
          ? cloudError || 'Browser storage is full and the cloud save failed.'
          : 'Browser storage is full (large question images use it up). Sign in to save to the cloud, or remove images.',
      });
      return;
    }

    sounds.playSaveCloud();

    const activeSaved = cloudResultBank || localBank;
    setMine(prev => [
      activeSaved,
      ...prev.filter(b => b.id !== activeSaved.id),
    ]);
    setName(activeSaved.name);
    onActiveBankChange?.(activeSaved.id, activeSaved.name);
    setArmed(null);

    if (isLoggedIn && !cloudResultBank) {
      toast.warning(`Saved “${activeSaved.name}” on this computer only`, {
        description: cloudError || 'The cloud save failed.',
      });
    } else if (!savedLocally) {
      toast.warning(`Saved “${activeSaved.name}” to the cloud only`, {
        description: 'Browser storage is full, so this computer has no offline copy.',
      });
    } else {
      toast.success(
        cloudResultBank
          ? `Saved “${activeSaved.name}” to Cloud & Local Library!`
          : `Saved “${activeSaved.name}” to Local Library (${selectedQuestions.length} Qs)!`
      );
    }
  };

  // Remove built-in questions that older builds padded onto the end of a saved deck
  const handleTrimFiller = async (bank: CloudQuestionBank, fillerCount: number) => {
    const trimmedBank: CloudQuestionBank = {
      ...bank,
      questions: bank.questions.slice(0, bank.questions.length - fillerCount),
      updatedAt: new Date().toISOString(),
    };
    setBusy(true);
    const savedLocally = saveLocalCustomBanks([
      trimmedBank,
      ...loadLocalCustomBanks().filter(b => b.id !== bank.id),
    ]);
    let savedToCloud = false;
    if (isLoggedIn) {
      try {
        const result = await saveQuestionBank({
          id: trimmedBank.id,
          name: trimmedBank.name,
          lessonGoal: trimmedBank.lessonGoal,
          questions: trimmedBank.questions,
        });
        savedToCloud = result.success;
      } catch {}
    }
    setBusy(false);
    setArmed(null);
    if (!savedLocally && !savedToCloud) {
      toast.error(`Could not update “${bank.name}”`);
      return;
    }
    setMine(prev => prev.map(b => (b.id === bank.id ? trimmedBank : b)));
    toast.success(`Removed ${fillerCount} filler questions from “${bank.name}”`, {
      description: activeBankId === bank.id
        ? `It now has ${trimmedBank.questions.length} questions. Load it again to refresh the open deck.`
        : `It now has ${trimmedBank.questions.length} questions.`,
    });
  };

  const handleDelete = async (bankId: string) => {
    setBusy(true);
    // Delete from local storage
    const local = loadLocalCustomBanks().filter(b => b.id !== bankId);
    saveLocalCustomBanks(local);

    if (isLoggedIn) {
      try {
        await deleteQuestionBank(bankId);
      } catch {}
    }
    setBusy(false);
    setArmed(null);

    if (activeBankId === bankId) {
      onActiveBankChange?.(undefined, undefined);
    }
    setMine(prev => prev.filter(bank => bank.id !== bankId));
    toast.info('Set deleted from your library');
  };

  const handleExportJson = () => {
    try {
      sounds.playClick();
      const exportName = name.trim() || activeBankName || 'quiz_questions';
      const finalCount = Math.max(1, Math.min(saveCount, questions.length));
      const payload = {
        name: exportName,
        lessonGoal: targetGoal.trim(),
        exportedAt: new Date().toISOString(),
        questions: questions.slice(0, finalCount),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${finalCount} questions as JSON backup`);
    } catch {
      toast.error('Failed to export questions');
    }
  };

  const handleExportPdf = () => {
    sounds.playClick();
    const exportName = name.trim() || activeBankName || 'Question Deck';
    const finalCount = Math.max(1, Math.min(saveCount, questions.length));
    setExportPdfDeck({
      questions: questions.slice(0, finalCount),
      name: exportName,
      goal: targetGoal.trim(),
    });
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
          toast.error('Invalid question set JSON format');
          return;
        }
        sounds.playPowerUp();
        const importedName = typeof parsed.name === 'string' ? parsed.name : file.name.replace(/\.json$/i, '');
        const importedGoal = typeof parsed.lessonGoal === 'string' ? parsed.lessonGoal : '';
        setName(importedName);
        setTargetGoal(importedGoal);
        onApply({
          id: `imported_${Date.now()}`,
          name: importedName,
          lessonGoal: importedGoal,
          questions: parsed.questions,
        });
        toast.success(`Imported “${importedName}” (${parsed.questions.length} Qs loaded)`);
      } catch {
        toast.error('Could not parse question JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const uniqueCountOptions = useMemo(() => {
    const countOptions = [10, 15, 20, 25, 30, questions.length];
    return Array.from(new Set(countOptions.filter(c => c <= questions.length)));
  }, [questions.length]);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-slate-950/40">
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-orange-300" />
          <h3 className="font-mario text-lg text-yellow-300">
            Question Library
          </h3>
          <span className="text-[0.6875rem] text-slate-400">
            Save custom sets or load premade curriculum
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Export PDF button */}
          <button
            type="button"
            onClick={handleExportPdf}
            title="Export questions to PDF with hidden teacher answer key"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/15 cursor-pointer transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          {/* Export JSON backup button */}
          <button
            type="button"
            onClick={handleExportJson}
            title="Download questions as JSON file"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/15 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>

          {/* Import JSON button */}
          <button
            type="button"
            onClick={() => importFileRef.current?.click()}
            title="Import questions from JSON file"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/15 cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Import JSON</span>
          </button>
          <input
            type="file"
            ref={importFileRef}
            accept=".json,application/json"
            onChange={handleImportJson}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-white/15 cursor-pointer transition-colors"
          >
            Back to blocks
          </button>
        </div>
      </div>

      {/* Save / Update Set Form */}
      <div className="p-4 border-b border-white/10 bg-slate-900/60 shrink-0 space-y-3">
        {/* Active Set Banner */}
        {activeBankId && activeBankName && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-200 font-semibold">
                Currently editing loaded set: <span className="font-bold text-white">{activeBankName}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                onActiveBankChange?.(undefined, undefined);
                setName('');
              }}
              className="text-[0.6875rem] text-slate-400 hover:text-white underline cursor-pointer"
            >
              Clear link & save as separate set
            </button>
          </div>
        )}

        {/* Duplicate Name Collision Warning Banner */}
        {!isEditingLoadedBank && existingMatch && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              A set named <span className="font-bold text-white">“{existingMatch.name}”</span> already exists in your library. You can update it or save with a new name.
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            id="library-set-name"
            type="text"
            value={name}
            maxLength={40}
            placeholder="Set name (e.g. Unit 4 Animals Review)"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handlePrimarySave();
              }
            }}
            className="flex-1 min-w-[14rem] bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
          />
          <input
            id="library-set-goal"
            type="text"
            value={targetGoal}
            maxLength={80}
            placeholder="Lesson goal (optional note)"
            onChange={(e) => setTargetGoal(e.target.value)}
            className="flex-1 min-w-[14rem] bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
          />

          {/* Action Buttons: Update vs Save New */}
          {isEditingLoadedBank && activeBankId ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="library-update-set"
                type="button"
                disabled={busy}
                onClick={() => void handleSave(activeBankId)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black border border-emerald-200 cursor-pointer disabled:opacity-60 transition-all shadow-sm flex items-center gap-1.5"
                title={`Update and overwrite existing "${activeBankName}" in your library`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Update Active Set</span>
              </button>
              <button
                id="library-save-new"
                type="button"
                disabled={busy}
                onClick={() => void handleSave(undefined, name.trim() ? (name.trim() === activeBankName ? `${name.trim()} (New)` : name.trim()) : undefined)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold border border-indigo-400 cursor-pointer disabled:opacity-60 transition-all shadow flex items-center gap-1.5"
                title="Save as a brand new deck in your library (does NOT overwrite)"
              >
                <PlusCircle className="w-3.5 h-3.5 text-yellow-300" />
                <span>Save as New Deck</span>
              </button>
            </div>
          ) : isRenamingLoadedBank ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="library-rename-set"
                type="button"
                disabled={busy}
                onClick={() => void handleSave(activeBankId)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black border border-emerald-200 cursor-pointer disabled:opacity-60 transition-all shadow-sm flex items-center gap-1.5"
                title={`Rename "${activeBankName}" to "${name.trim()}" and save the open questions into it`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Rename & Update “{activeBankName}”</span>
              </button>
              <button
                id="library-save-new"
                type="button"
                disabled={busy}
                onClick={() => void handleSave()}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold border border-indigo-400 cursor-pointer disabled:opacity-60 transition-all shadow flex items-center gap-1.5"
                title={`Save as a brand new deck named "${name.trim()}" (does NOT change "${activeBankName}")`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-yellow-300" />
                <span>Save as New Deck</span>
              </button>
            </div>
          ) : existingMatch ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="library-overwrite-existing-set"
                type="button"
                disabled={busy}
                onClick={() => void handleSave(existingMatch.id)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black border border-amber-200 cursor-pointer disabled:opacity-60 transition-all shadow-sm flex items-center gap-1.5"
                title={`Update existing "${existingMatch.name}" in your library`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Update “{existingMatch.name}”</span>
              </button>
              <button
                id="library-save-duplicate-set"
                type="button"
                disabled={busy}
                onClick={() => void handleSave(undefined, `${name.trim()} (New)`)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold border border-indigo-400 cursor-pointer disabled:opacity-60 transition-all shadow flex items-center gap-1.5"
                title="Save as a new separate question set"
              >
                <PlusCircle className="w-3.5 h-3.5 text-yellow-300" />
                <span>Save as New Deck</span>
              </button>
            </div>
          ) : (
            <button
              id="library-save-set"
              type="button"
              disabled={busy}
              onClick={() => void handleSave()}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-black border border-orange-200 cursor-pointer disabled:opacity-60 transition-all shadow-sm flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Save as New Deck ({Math.min(saveCount, questions.length)} Qs)</span>
            </button>
          )}

          {!isLoggedIn && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                void loginWithGoogle();
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-950/70 hover:bg-indigo-900/90 text-indigo-200 border border-indigo-400/40 font-bold rounded-xl text-xs cursor-pointer shadow transition-colors"
              title="Sign in with Google to enable automatic cloud backup across devices"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-300" />
              <span>Cloud Sync (Google)</span>
            </button>
          )}
        </div>

        {/* Number of Questions Selector */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-orange-200/90 font-semibold text-[0.6875rem] uppercase tracking-wider">
            Questions to include:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {uniqueCountOptions.map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setSaveCount(cnt);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  saveCount === cnt
                    ? 'bg-orange-500 text-slate-950 border-orange-200 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-white/15 hover:bg-slate-700'
                }`}
              >
                {cnt === questions.length ? `All (${cnt})` : `${cnt} Qs`}
              </button>
            ))}

            {populatedCount > 0 && populatedCount < questions.length && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setSaveCount(populatedCount);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  saveCount === populatedCount
                    ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-sm'
                    : 'bg-amber-950/40 text-amber-200 border-amber-500/30 hover:bg-amber-900/40'
                }`}
              >
                Only Filled ({populatedCount} Qs)
              </button>
            )}

            {/* Stepper for custom count */}
            <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-lg border border-white/20 ml-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setSaveCount(prev => Math.max(1, prev - 1));
                }}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                title="Decrease question count"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={questions.length}
                value={saveCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    setSaveCount(Math.max(1, Math.min(val, questions.length)));
                  }
                }}
                className="w-10 bg-transparent text-center font-mario text-xs text-amber-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  setSaveCount(prev => Math.min(questions.length, prev + 1));
                }}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                title="Increase question count"
              >
                +
              </button>
            </div>
          </div>
          <span className="text-[0.6875rem] text-slate-400 ml-auto">
            Will save questions 1 through {Math.min(saveCount, questions.length)}.
          </span>
        </div>
      </div>

      {/* Library Banks Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
        {showStarterExamples && (
          <section>
            <h4 className="text-[0.6875rem] font-black uppercase tracking-wider text-orange-200 mb-2">Examples</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {STARTER_QUESTION_BANKS.map(bank => (
                <BankCard
                  key={bank.id}
                  bank={bank}
                  armed={armed}
                  busy={busy}
                  isActive={bank.id === activeBankId}
                  onArm={setArmed}
                  onApply={(appliedBank) => {
                    onActiveBankChange?.(appliedBank.id, appliedBank.name);
                    setName(appliedBank.name);
                    onApply(appliedBank);
                  }}
                  onExportPdf={(targetBank) => {
                    setExportPdfDeck({
                      questions: targetBank.questions,
                      name: targetBank.name,
                      goal: targetBank.lessonGoal,
                    });
                  }}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[0.6875rem] font-black uppercase tracking-wider text-sky-200">Yours</h4>
            {mine.length > 0 && (
              <span className="text-[0.6875rem] text-slate-400">
                {mine.length} {mine.length === 1 ? 'custom set' : 'custom sets'}
              </span>
            )}
          </div>

          {!isLoggedIn && (
            <p className="text-xs text-slate-400">Sign in to keep sets in your cloud library.</p>
          )}
          {isLoggedIn && loadingMine && (
            <p className="text-xs text-slate-400">Loading your saved sets…</p>
          )}
          {isLoggedIn && !loadingMine && mine.length === 0 && (
            <p className="text-xs text-slate-400">No saved sets yet. Name a set above and click Save to Library.</p>
          )}
          {mine.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {mine.map(bank => (
                <BankCard
                  key={bank.id}
                  bank={bank}
                  armed={armed}
                  busy={busy}
                  canDelete
                  canUpdate
                  isActive={bank.id === activeBankId}
                  onArm={setArmed}
                  onApply={(appliedBank) => {
                    onActiveBankChange?.(appliedBank.id, appliedBank.name);
                    setName(appliedBank.name);
                    onApply(appliedBank);
                  }}
                  onUpdate={(targetId, targetName) => {
                    void handleSave(targetId, targetName);
                  }}
                  onTrimFiller={(fillerCount) => void handleTrimFiller(bank, fillerCount)}
                  onDelete={handleDelete}
                  onExportPdf={(targetBank) => {
                    setExportPdfDeck({
                      questions: targetBank.questions,
                      name: targetBank.name,
                      goal: targetBank.lessonGoal,
                    });
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Export Deck as PDF Modal */}
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

const BankCard = React.memo(function BankCard({
  bank,
  armed,
  busy,
  canDelete = false,
  canUpdate = false,
  isActive = false,
  onArm,
  onApply,
  onDelete,
  onUpdate,
  onTrimFiller,
  onExportPdf,
}: {
  key?: React.Key;
  bank: QuestionBank;
  armed: Armed;
  busy: boolean;
  canDelete?: boolean;
  canUpdate?: boolean;
  isActive?: boolean;
  onArm: (next: Armed) => void;
  onApply: (bank: QuestionBank) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, name: string) => void;
  onTrimFiller?: (fillerCount: number) => void;
  onExportPdf?: (bank: QuestionBank) => void;
}) {
  const sample = bank.questions[0]?.title ?? '';
  const loadArmed = armed?.id === bank.id && armed.mode === 'load';
  const deleteArmed = armed?.id === bank.id && armed.mode === 'delete';
  const updateArmed = armed?.id === bank.id && armed.mode === 'update';
  const trimArmed = armed?.id === bank.id && armed.mode === 'trim';
  const fillerCount = useMemo(
    () => (onTrimFiller ? countTrailingDefaultFiller(bank.questions) : 0),
    [bank.questions, Boolean(onTrimFiller)]
  );

  return (
    <div
      id={`library-bank-${bank.id}`}
      className={`rounded-2xl border p-3 flex flex-col gap-2 bg-slate-900/80 transition-all ${
        isActive
          ? 'border-emerald-400/80 ring-2 ring-emerald-500/50 shadow-md shadow-emerald-950/40'
          : loadArmed
          ? 'border-orange-300 ring-2 ring-orange-400/70'
          : updateArmed
          ? 'border-amber-400 ring-2 ring-amber-400/70'
          : 'border-white/15'
      }`}
    >
      <button
        type="button"
        onClick={() => {
          sounds.playClick();
          onArm(loadArmed ? null : { id: bank.id, mode: 'load' });
        }}
        className="text-left cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="font-bold text-white text-sm leading-tight truncate">{bank.name}</span>
            {isActive && (
              <span className="px-1.5 py-0.2 rounded-full text-[0.5625rem] font-black uppercase tracking-wider bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 shrink-0">
                Active
              </span>
            )}
          </div>
          <span className="px-2 py-0.5 rounded-full text-[0.6875rem] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mario shrink-0">
            {bank.questions.length} Qs
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {bank.lessonGoal && (
            <p className="text-[0.6875rem] text-rose-200 leading-snug line-clamp-1">{bank.lessonGoal}</p>
          )}
          {bank.questions.length < 60 && (
            <span className="text-[0.625rem] text-slate-400 ml-auto shrink-0 font-medium">
              Blocks 1–{bank.questions.length}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs leading-snug">
          <MarkedPrompt text={sample} className="text-yellow-200" />
        </p>
      </button>

      {fillerCount > 0 && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-[0.6875rem] text-amber-100">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="flex-1 leading-snug">
            Questions {bank.questions.length - fillerCount + 1}–{bank.questions.length} are built-in examples added by an older version.
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!trimArmed) {
                sounds.playClick();
                onArm({ id: bank.id, mode: 'trim' });
                return;
              }
              onTrimFiller?.(fillerCount);
            }}
            className={`px-2.5 py-1 rounded-lg font-bold border shrink-0 cursor-pointer disabled:opacity-60 ${
              trimArmed
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-200'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-200 border-white/15'
            }`}
          >
            {trimArmed ? `Remove ${fillerCount}?` : 'Remove'}
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-auto pt-1">
        {/* Load Button */}
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (!loadArmed) {
              sounds.playClick();
              onArm({ id: bank.id, mode: 'load' });
              return;
            }
            sounds.playCorrect();
            onApply({
              ...bank,
              questions: bank.questions.map(question => ({ ...question })),
            });
          }}
          className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer border transition-all ${
            loadArmed
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-200'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-white/15'
          }`}
        >
          {loadArmed ? 'Yes, Load' : 'Load'}
        </button>

        {/* Update / Overwrite Button */}
        {canUpdate && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (!updateArmed) {
                sounds.playClick();
                onArm({ id: bank.id, mode: 'update' });
                return;
              }
              onUpdate?.(bank.id, bank.name);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              updateArmed
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-200 ring-2 ring-amber-400 font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-200 border-white/15'
            }`}
            title={isActive
              ? 'Save your open Question Studio questions into this deck'
              : `Replace this deck's questions with the deck currently open in the Studio`}
          >
            {updateArmed ? (isActive ? 'Overwrite?' : 'Replace with open deck?') : 'Update'}
          </button>
        )}

        {/* Export PDF Button */}
        {onExportPdf && (
          <button
            type="button"
            aria-label={`Export ${bank.name} as PDF`}
            onClick={() => {
              sounds.playClick();
              onExportPdf(bank);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-300 border border-white/10 cursor-pointer transition-colors"
            title="Export this set to PDF with concealed answers"
          >
            <FileDown className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Delete Button */}
        {canDelete && (
          deleteArmed ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete?.(bank.id)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              Confirm
            </button>
          ) : (
            <button
              type="button"
              aria-label={`Delete ${bank.name}`}
              onClick={() => {
                sounds.playClick();
                onArm({ id: bank.id, mode: 'delete' });
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 border border-white/10 cursor-pointer"
              title="Delete this set"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )
        )}
      </div>
    </div>
  );
});
