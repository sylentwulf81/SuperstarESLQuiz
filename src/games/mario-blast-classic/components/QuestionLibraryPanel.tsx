import React, { useEffect, useState } from 'react';
import { Library, LogIn, Trash2 } from 'lucide-react';
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
}

type Armed = { id: string; mode: 'load' | 'delete' } | null;

export function QuestionLibraryPanel({
  questions,
  lessonGoal,
  onApply,
  onClose,
}: QuestionLibraryPanelProps) {
  const { isLoggedIn, loginWithGoogle, listQuestionBanks, saveQuestionBank, deleteQuestionBank } = useAuth();
  const [name, setName] = useState('');
  const [mine, setMine] = useState<CloudQuestionBank[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState<Armed>(null);

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
      toast.error('Sign in to save a set');
      return;
    }
    setBusy(true);
    sounds.playSaveCloud();
    const saved = await saveQuestionBank({
      name: trimmed,
      lessonGoal,
      questions: questions.map(question => ({
        ...question,
        title: legacySlashesToMarks(question.title),
      })),
    });
    setBusy(false);
    if (!saved) {
      toast.error('Could not save this set');
      return;
    }
    setMine(prev => [saved, ...prev.filter(bank => bank.id !== saved.id)]);
    setName('');
    toast.success(`Saved “${saved.name}”`);
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

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-slate-950/40">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        <h3 className="font-mario text-lg text-yellow-300 flex items-center gap-2">
          <Library className="w-5 h-5 text-orange-300" />
          Question Library
        </h3>
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-white/15 cursor-pointer"
        >
          Back to blocks
        </button>
      </div>

      <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center gap-2 shrink-0">
        <input
          id="library-set-name"
          type="text"
          value={name}
          maxLength={40}
          placeholder="Set name"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleSave();
            }
          }}
          className="flex-1 min-w-[12rem] bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50"
        />
        <button
          id="library-save-set"
          type="button"
          disabled={busy}
          onClick={() => void handleSave()}
          className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-black border border-orange-200 cursor-pointer disabled:opacity-60"
        >
          Save this set
        </button>
        {!isLoggedIn && (
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              void loginWithGoogle();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
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
          <span className="font-mario text-amber-300 text-sm shrink-0">{bank.questions.length}</span>
        </div>
        <p className="text-[11px] text-rose-200 mt-1 leading-snug">{bank.lessonGoal}</p>
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
