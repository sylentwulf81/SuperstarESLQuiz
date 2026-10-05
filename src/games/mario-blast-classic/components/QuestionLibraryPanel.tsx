import React, { useEffect, useState, useMemo } from 'react';
import { Library, LogIn, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Question } from '@/shared/types';
import { useAuth } from '@/shared/context/AuthContext';
import { CloudQuestionBank } from '@/shared/utils/firebase';
import { STARTER_QUESTION_BANKS, QuestionBank } from '@/games/mario-blast-classic/data/questionBanks';
import { MarkedPrompt } from '@/shared/components/MarkedPrompt';
import { legacySlashesToMarks } from '@/shared/markedPrompt';
import { sounds } from '@/shared/utils/sound';

interface QuestionLibraryPanelProps {
  questions: Question[];
  lessonGoal: string;
  onApply: (bank: QuestionBank) => void;
  onClose: () => void;
  /** Classic-only "Have you ever...?" grammar-drill starters; hidden for other themes. */
  showStarterExamples?: boolean;
}

type Armed = { id: string; mode: 'load' | 'delete' } | null;

export function QuestionLibraryPanel({
  questions,
  lessonGoal,
  onApply,
  onClose,
  showStarterExamples = true,
}: QuestionLibraryPanelProps) {
  const { isLoggedIn, loginWithGoogle, listQuestionBanks, saveQuestionBank, deleteQuestionBank } = useAuth();
  const [name, setName] = useState('');
  const [targetGoal, setTargetGoal] = useState(lessonGoal || '');
  const [saveCount, setSaveCount] = useState<number>(questions.length || 60);
  const [mine, setMine] = useState<CloudQuestionBank[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState<Armed>(null);

  const populatedCount = useMemo(() => {
    return questions.filter(q => q.title && q.title.trim().length > 0 && q.title !== 'Blank Question').length;
  }, [questions]);

  useEffect(() => {
    setTargetGoal(lessonGoal || '');
  }, [lessonGoal]);

  useEffect(() => {
    if (!isLoggedIn) {
      setMine([]);
      return;
    }
    let cancelled = false;
    setLoadingMine(true);
    listQuestionBanks()
      .then(banks => {
        if (!cancelled) setMine(banks);
      })
      .finally(() => {
        if (!cancelled) setLoadingMine(false);
      });
    return () => {
      cancelled = true;
    };
    // listQuestionBanks identity changes when cloud status updates; refetch only when sign-in changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Name this set first');
      return;
    }
    if (!isLoggedIn) {
      toast.error('Sign in to save a set to your Cloud Library');
      return;
    }
    const finalCount = Math.max(1, Math.min(saveCount, questions.length));
    const selectedQuestions = questions.slice(0, finalCount).map(question => ({
      ...question,
      title: legacySlashesToMarks(question.title),
    }));

    setBusy(true);
    sounds.playSaveCloud();
    const saved = await saveQuestionBank({
      name: trimmed,
      lessonGoal: targetGoal.trim(),
      questions: selectedQuestions,
    });
    setBusy(false);
    if (!saved) {
      toast.error('Could not save this set');
      return;
    }
    setMine(prev => [saved, ...prev.filter(bank => bank.id !== saved.id)]);
    setName('');
    toast.success(`Saved “${saved.name}” (${selectedQuestions.length} questions attached)`);
  };

  const handleDelete = async (bankId: string) => {
    setBusy(true);
    const ok = await deleteQuestionBank(bankId);
    setBusy(false);
    setArmed(null);
    if (!ok) {
      toast.error('Could not delete that set');
      return;
    }
    setMine(prev => prev.filter(bank => bank.id !== bankId));
  };

  const countOptions = [10, 15, 20, 25, 30, questions.length];
  const uniqueCountOptions = Array.from(new Set(countOptions.filter(c => c <= questions.length)));

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-slate-950/40">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-orange-300" />
          <h3 className="font-mario text-lg text-yellow-300">
            Question Library
          </h3>
          <span className="text-[11px] text-slate-400">
            Save custom sets or load premade curriculum
          </span>
        </div>
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

      {/* Save Set Form with Question Count Selection */}
      <div className="p-4 border-b border-white/10 bg-slate-900/60 shrink-0 space-y-3">
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
                void handleSave();
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
          <button
            id="library-save-set"
            type="button"
            disabled={busy}
            onClick={() => void handleSave()}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-black border border-orange-200 cursor-pointer disabled:opacity-60 transition-all shadow-sm"
          >
            Save to Library ({Math.min(saveCount, questions.length)} Qs)
          </button>
          {!isLoggedIn && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                void loginWithGoogle();
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs cursor-pointer shadow"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-600" />
              Sign in to Save
            </button>
          )}
        </div>

        {/* Number of Questions Selector */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-orange-200/90 font-semibold text-[11px] uppercase tracking-wider">
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
          <span className="text-[11px] text-slate-400 ml-auto">
            Will save questions 1 through {Math.min(saveCount, questions.length)}.
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
        {showStarterExamples && (
          <section>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-orange-200 mb-2">Examples</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {STARTER_QUESTION_BANKS.map(bank => (
                <BankCard
                  key={bank.id}
                  bank={bank}
                  armed={armed}
                  busy={busy}
                  onArm={setArmed}
                  onApply={onApply}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <h4 className="text-[11px] font-black uppercase tracking-wider text-sky-200 mb-2">Yours</h4>
          {!isLoggedIn && (
            <p className="text-xs text-slate-400">Sign in to keep sets in your cloud.</p>
          )}
          {isLoggedIn && loadingMine && (
            <p className="text-xs text-slate-400">Loading…</p>
          )}
          {isLoggedIn && !loadingMine && mine.length === 0 && (
            <p className="text-xs text-slate-400">No saved sets yet.</p>
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
                  onArm={setArmed}
                  onApply={onApply}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function BankCard({
  bank,
  armed,
  busy,
  canDelete = false,
  onArm,
  onApply,
  onDelete,
}: {
  key?: React.Key;
  bank: QuestionBank;
  armed: Armed;
  busy: boolean;
  canDelete?: boolean;
  onArm: (next: Armed) => void;
  onApply: (bank: QuestionBank) => void;
  onDelete?: (id: string) => void;
}) {
  const sample = bank.questions[0]?.title ?? '';
  const loadArmed = armed?.id === bank.id && armed.mode === 'load';
  const deleteArmed = armed?.id === bank.id && armed.mode === 'delete';

  return (
    <div
      id={`library-bank-${bank.id}`}
      className={`rounded-2xl border p-3 flex flex-col gap-2 bg-slate-900/80 ${
        loadArmed ? 'border-orange-300 ring-2 ring-orange-400/70' : 'border-white/15'
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
          <span className="font-bold text-white text-sm leading-tight">{bank.name}</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mario shrink-0">
            {bank.questions.length} Qs
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {bank.lessonGoal && (
            <p className="text-[11px] text-rose-200 leading-snug line-clamp-1">{bank.lessonGoal}</p>
          )}
          {bank.questions.length < 60 && (
            <span className="text-[10px] text-slate-400 ml-auto shrink-0 font-medium">
              Blocks 1–{bank.questions.length}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs leading-snug">
          <MarkedPrompt text={sample} className="text-yellow-200" />
        </p>
      </button>
      <div className="flex items-center gap-1.5 mt-auto">
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
          className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer border ${
            loadArmed
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-200'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-white/15'
          }`}
        >
          {loadArmed ? 'Yes' : 'Load'}
        </button>
        {canDelete && (
          deleteArmed ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete?.(bank.id)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              aria-label={`Delete ${bank.name}`}
              onClick={() => {
                sounds.playClick();
                onArm({ id: bank.id, mode: 'delete' });
              }}
              className="ml-auto p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 border border-white/10 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )
        )}
      </div>
    </div>
  );
}
