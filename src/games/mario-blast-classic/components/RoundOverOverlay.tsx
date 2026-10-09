import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Star, Flame, Bug, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { sounds } from '@/shared/utils/sound';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';
import { GameQuestion } from '@/shared/types';
import { MarkedPrompt } from '@/shared/components/MarkedPrompt';
import { RoundOverReason } from '../engine';

export type { RoundOverReason } from '../engine';

interface RoundOverOverlayProps {
  reason: RoundOverReason;
  cardCount?: number;
  onContinue: () => void;
  question?: GameQuestion;
  lessonGoal?: string;
  onReviewQuestion?: () => void;
}

const COPY: Record<RoundOverReason, { title: string; body: string; accent: string }> = {
  cards: {
    title: 'ROUND OVER!',
    body: 'All cards claimed',
    accent: 'from-amber-400 to-yellow-300',
  },
  gold_star: {
    title: 'ROUND OVER!',
    body: 'Gold Star!',
    accent: 'from-yellow-300 to-amber-400',
  },
  bowser_revolution: {
    title: 'ROUND OVER!',
    body: "Bowser's Revolution!",
    accent: 'from-orange-500 to-red-600',
  },
  bowser_fury: {
    title: 'ROUND OVER!',
    body: "Bowser's Fury!",
    accent: 'from-red-500 to-amber-500',
  },
  piranha: {
    title: 'ROUND OVER!',
    body: 'Piranha Plant!',
    accent: 'from-lime-400 to-green-700',
  },
  host: {
    title: 'ROUND OVER!',
    body: 'Host closed the round',
    accent: 'from-rose-400 to-amber-300',
  },
};

function ReasonMark({ reason }: { reason: RoundOverReason }) {
  if (reason === 'gold_star') return <Star className="w-14 h-14 sm:w-20 sm:h-20 text-yellow-300 fill-yellow-300" />;
  if (reason === 'bowser_revolution' || reason === 'bowser_fury') {
    return <Flame className="w-14 h-14 sm:w-20 sm:h-20 text-orange-400 fill-red-500" />;
  }
  if (reason === 'piranha') return <Bug className="w-14 h-14 sm:w-20 sm:h-20 text-lime-300" />;
  return <Sparkles className="w-14 h-14 sm:w-20 sm:h-20 text-yellow-300" />;
}

export const RoundOverOverlay: React.FC<RoundOverOverlayProps> = ({
  reason,
  cardCount,
  onContinue,
  question,
  lessonGoal,
  onReviewQuestion,
}) => {
  useBodyScrollLock();
  const [showAnswerPreview, setShowAnswerPreview] = useState(false);
  const copy = COPY[reason];
  const hitCard = reason === 'gold_star' || reason === 'bowser_revolution' || reason === 'bowser_fury' || reason === 'piranha';
  const body =
    reason === 'cards' && cardCount
      ? `All ${cardCount} cards claimed`
      : copy.body;

  const answerText = question
    ? question.type === 'open_trivia'
      ? question.answer
      : question.type === 'unscramble'
      ? question.targetWord
      : question.type === 'true_false'
      ? `${question.isTrue ? 'TRUE' : 'FALSE'}${question.explanation ? ` — ${question.explanation}` : ''}`
      : undefined
    : undefined;

  useEffect(() => {
    if (reason === 'gold_star') sounds.playSuperstar();
    else if (reason === 'bowser_revolution') sounds.playBowser();
    else if (reason === 'bowser_fury') sounds.playBowserFury();
    else if (reason === 'piranha') sounds.playWrong();
    sounds.playRoundOver();
  }, [reason]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.65, opacity: 0, rotate: -4 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
        className={`relative w-full max-w-3xl rounded-[2.5rem] border-4 border-yellow-300 bg-gradient-to-b from-slate-900 to-slate-950 px-5 py-6 sm:px-8 sm:py-8 text-center shadow-[0_0_80px_rgba(250,204,21,0.55)] my-auto ${
          hitCard ? 'ring-8 ring-red-500/40' : ''
        }`}
      >
        <motion.div
          animate={{ opacity: [0.35, 0.8, 0.35], scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className={`absolute inset-0 rounded-[2.5rem] bg-gradient-to-r ${copy.accent} opacity-20 pointer-events-none`}
        />

        <div className="relative">
          <div className="flex justify-center mb-2">
            <ReasonMark reason={reason} />
          </div>

          <motion.h2
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.08 }}
            className="font-mario text-[clamp(2.5rem,8vw,5.5rem)] text-yellow-300 text-shadow-mario leading-[0.95]"
          >
            ROUND OVER!
          </motion.h2>

          <p className="mt-2 font-mario text-lg sm:text-2xl text-white text-shadow-mario">
            {body}
          </p>

          {/* Question & Answer Review Banner */}
          {question && (
            <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-black/60 border border-white/20 text-left space-y-2 max-w-2xl mx-auto shadow-inner">
              {lessonGoal && (
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-300">
                  {lessonGoal}
                </p>
              )}
              <h4 className="font-mario text-base sm:text-lg text-yellow-200 leading-snug">
                <MarkedPrompt text={question.title} />
              </h4>

              {answerText && (
                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                      Answer:
                    </span>
                    {showAnswerPreview ? (
                      <span className="font-mario text-base sm:text-xl text-emerald-300 font-bold">
                        {answerText}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Hidden — click reveal below
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playCardFlip();
                      setShowAnswerPreview(prev => !prev);
                    }}
                    className="self-start sm:self-auto px-3 py-1 rounded-lg bg-indigo-700/80 hover:bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-indigo-400/40"
                  >
                    {showAnswerPreview ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Reveal Answer</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {onReviewQuestion && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onReviewQuestion();
                }}
                className="px-6 py-3.5 rounded-2xl bg-indigo-700 hover:bg-indigo-600 active:scale-95 text-white font-mario text-lg sm:text-xl border-2 border-indigo-300/60 cursor-pointer inline-flex items-center gap-2 shadow-lg transition-transform"
              >
                <Eye className="w-5 h-5 text-yellow-300" />
                REVIEW QUESTION SCREEN
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sounds.playGameStart();
                onContinue();
              }}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-mario text-xl sm:text-2xl border-4 border-yellow-100 cursor-pointer hover:scale-105 active:scale-95 transition-transform inline-flex items-center gap-2 shadow-[0_0_30px_rgba(250,204,21,0.45)]"
            >
              <Sparkles className="w-6 h-6" />
              <span>NEXT QUESTION</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
