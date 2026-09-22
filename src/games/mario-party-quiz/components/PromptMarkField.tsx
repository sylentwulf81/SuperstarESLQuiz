import { promptWords, toggleMarkedWord, legacySlashesToMarks } from '@/shared/markedPrompt';
import { MarkedPrompt } from '@/shared/components/MarkedPrompt';
import { sounds } from '@/shared/utils/sound';

interface PromptMarkFieldProps {
  value: string;
  onChange: (next: string) => void;
  onEnter?: () => void;
}

export function PromptMarkField({ value, onChange, onEnter }: PromptMarkFieldProps) {
  const shown = legacySlashesToMarks(value);
  const words = promptWords(shown);

  return (
    <div>
      <label className="text-xs font-bold text-indigo-200 block mb-1" htmlFor="question-prompt-input">
        Question Prompt
      </label>
      <input
        id="question-prompt-input"
        type="text"
        value={shown}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onEnter?.();
          }
        }}
        className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
      />
      <p className="text-[11px] text-slate-400 mt-1.5">Tap the word to change. Or type *like this*.</p>
      {words.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {words.map(word => (
            <button
              key={word.index}
              type="button"
              aria-pressed={word.marked}
              onClick={() => {
                sounds.playClick();
                onChange(toggleMarkedWord(shown, word.index));
              }}
              className={`px-2.5 py-1 rounded-lg text-sm font-bold border cursor-pointer transition-all ${
                word.marked
                  ? 'bg-orange-500 text-slate-950 border-orange-200 shadow-[0_2px_0_#9a3412]'
                  : 'bg-slate-800 text-slate-100 border-white/15 hover:bg-slate-700'
              }`}
            >
              {word.display}
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 rounded-xl bg-slate-950/80 border border-white/10 px-3 py-2">
        <MarkedPrompt text={shown} className="text-sm sm:text-base font-bold text-yellow-300 leading-snug" />
      </div>
    </div>
  );
}
