import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, X } from 'lucide-react';
import { InvasionTeam } from '../data/factions';
import { sounds } from '@/shared/utils/sound';
import { FactionAvatar } from './FactionAvatar';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';
import { InvasionQuestion, scrambleWord } from '../data/invasionQuestions';
import { US_STATE_PATHS } from '../data/usStatePaths';

interface InvasionQuestionModalProps {
  stateId: string;
  question: InvasionQuestion;
  teams: InvasionTeam[];
  ownerTeamId: string | null;
  onCapture: (teamId: string) => void;
  onClose: () => void;
}

export const InvasionQuestionModal: React.FC<InvasionQuestionModalProps> = ({
  stateId,
  question,
  teams,
  ownerTeamId,
  onCapture,
  onClose,
}) => {
  useBodyScrollLock();
  const [showAnswer, setShowAnswer] = useState(false);
  const stateName = US_STATE_PATHS.find(s => s.id === stateId)?.name ?? stateId;
  const owner = teams.find(t => t.id === ownerTeamId);
  const letters = question.type === 'unscramble' ? scrambleWord(question.answer) : [];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 bg-slate-950/80">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-3xl max-h-[92dvh] overflow-y-auto bg-slate-900 rounded-3xl border border-fuchsia-400/30 shadow-2xl"
      >
        <div className="sticky top-0 z-10 bg-slate-900/95 border-b border-white/10 px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mario text-xl sm:text-2xl text-yellow-300 truncate">{stateName}</p>
            {owner && (
              <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-black uppercase text-fuchsia-200">
                <FactionAvatar factionId={owner.factionId} size="xs" customUrl={owner.customImageUrl} />
                STEAL
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          <p className="font-mario text-2xl sm:text-4xl text-white leading-tight text-center">{question.prompt}</p>

          {question.type === 'multiple_choice' && question.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {question.options.map(option => {
                const isCorrect = showAnswer && option === question.answer;
                return (
                  <div
                    key={option}
                    className={`px-4 py-3 rounded-2xl border text-lg sm:text-xl font-black text-center ${
                      isCorrect
                        ? 'bg-emerald-500 text-slate-950 border-emerald-200'
                        : 'bg-slate-800 text-white border-white/15'
                    }`}
                  >
                    {option}
                  </div>
                );
              })}
            </div>
          )}

          {question.type === 'unscramble' && (
            <div className="flex flex-wrap justify-center gap-2">
              {letters.map((letter, index) => (
                <span
                  key={`${letter}-${index}`}
                  className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-slate-800 border-2 border-fuchsia-300/50 text-white font-mario text-2xl sm:text-3xl flex items-center justify-center"
                >
                  {letter}
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setShowAnswer(on => !on);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-yellow-300 font-bold border border-yellow-400/40 cursor-pointer"
            >
              {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAnswer ? 'HIDE' : 'SHOW'}
            </button>
          </div>

          {showAnswer && (
            <p className="text-center font-mario text-2xl sm:text-3xl text-emerald-300">{question.answer}</p>
          )}

          <div className="pt-2 border-t border-white/10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {teams.map(team => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onCapture(team.id);
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border-2 border-white/15 hover:border-yellow-400 cursor-pointer"
                >
                  <FactionAvatar factionId={team.factionId} size="lg" customUrl={team.customImageUrl} className="w-16 h-16" />
                  <span className="font-mario text-sm text-yellow-300 truncate w-full">{team.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
