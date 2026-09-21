import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Languages, Rocket, X } from 'lucide-react';
import { sounds } from '@/shared/utils/sound';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';

interface InvasionRulebookModalProps {
  onClose: () => void;
}

const EN = {
  title: 'Invade the USA — Host Guide',
  steps: [
    'Split the class into 2–5 teams. Pick Anime, Robots, Aliens, Zombies, or Monsters.',
    'The map starts white. Any team can attack any state. No turn order.',
    'Click a state. The class answers the English question. You judge.',
    'Tap the winning team. The state paints their color.',
    'Click a painted state to steal it after another question.',
    'Tiny East Coast states have extra letter chips. Use those if the shape is hard to hit.',
    'When you are ready, tap WINNER. Most states win.',
  ],
};

const JA = {
  title: 'インベイド・ザ・USA — 進行ガイド',
  steps: [
    'クラスを2〜5チームに分けます。アニメ / ロボット / エイリアン / ゾンビ / モンスターから選びます。',
    '地図は白からスタート。どのチームでも、どの州でも攻撃できます。順番はありません。',
    '州をクリック。英語の問題にクラスが答え、ホストが判定します。',
    '勝ったチームをタップすると、その色に塗られます。',
    '塗済みの州をもう一度クリックすると、問題のあと奪えます。',
    '東海岸の小さい州は文字チップもあります。押しにくいときはそれを使ってください。',
    '終わったら WINNER。州の数がいちばん多いチームの勝ちです。',
  ],
};

export const InvasionRulebookModal: React.FC<InvasionRulebookModalProps> = ({ onClose }) => {
  useBodyScrollLock();
  const [lang, setLang] = useState<'en' | 'ja'>('en');
  const t = lang === 'ja' ? JA : EN;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 bg-slate-950/80">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto bg-slate-900 rounded-3xl border border-white/20 shadow-2xl"
      >
        <div className="sticky top-0 bg-slate-900/95 border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <h2 className="font-mario text-lg sm:text-xl text-yellow-300 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {t.title}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setLang(lang === 'en' ? 'ja' : 'en');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-bold text-indigo-200 border border-white/15 cursor-pointer inline-flex items-center gap-1"
            >
              <Languages className="w-3.5 h-3.5" />
              {lang === 'en' ? 'JA' : 'EN'}
            </button>
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
        </div>
        <div className="p-4 sm:p-5">
          <h3 className="font-mario text-sm text-amber-300 flex items-center gap-2 mb-2">
            <Rocket className="w-4 h-4" /> How to play
          </h3>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-100">
            {t.steps.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </motion.div>
    </div>
  );
};
