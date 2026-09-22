import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, BookOpen, Layers, GraduationCap, Sparkles, Languages } from 'lucide-react';
import { sounds } from '@/shared/utils/sound';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';

interface ClassicRulebookModalProps {
  onClose: () => void;
}

const EN = {
  title: 'Mario Blast Classic — Host Guide',
  steps: [
    'The team whose turn it is only chooses the numbered question block. Anyone in the class can answer.',
    'When a team answers correctly, click that team, then click one of the six mystery cards.',
    'Each team may draw only one card per question. Speed matters: leftover cards disappear if a round-ender hits or the table is empty.',
    'Gold Star, Bowser’s Revolution, and Bowser’s Fury always end the round after their effect. Mystery Blocks can end the round only if the Piranha Plant is hit.',
    'You advance to the next question. Nothing auto-skips after a card.',
    'Hide a revealed answer if you clicked it by mistake. Skip action lets a team pass on a card without playing it.',
    'Question Studio sets the lesson goal, lets you tap a word to highlight it, and can save the set in the Question Library.',
  ],
  cards: [
    'Super Mushroom: pick 1 of 3 super-cards (1, 3, 5, or 10 coins). That amount is doubled right now — it is not saved for later.',
    'King Boo: shuffles the other teams’ coins. Yours stay put.',
    'Gold Star: +15 coins, then Round Over.',
    'Blooper: ink one rival. Their next coin card pays only 1 coin.',
    'Bowser’s Revolution: swap coins with a rival, then Round Over.',
    'Bowser’s Fury: −5 coins to every rival, then Round Over.',
    'Mystery Blocks: pick 1 of 3 — Treasure (10–15), 0 coins, or Piranha (round over).',
    'Action cards are rare. 1st place is even less likely to draw them.',
  ],
};

const JA = {
  title: 'マリオブラスト クラシック — 進行ガイド',
  steps: [
    '手番のチームは問題ブロックを選ぶだけです。答えはどのチームでも言えます。',
    '正解したらそのチームをクリックし、6枚のカードから1枚選びます。',
    '1問につき1チーム1枚まで。早いチームほど残りのカードから先に選べます。',
    'ゴールドスター、クッパレボリューション、クッパフューリーは効果のあと必ずラウンド終了。ミステリーブロックはパックンフラワーのときだけ終了します。',
    '次の問題へ進むのはホストがボタンを押したときです。',
    '答えを誤って出してしまったら Hide で隠せます。Skip action でカード効果を使わずに通せます。',
    'Question Studio でレッスンゴールを変え、変える単語をタップでオレンジにできます。セットは Question Library に保存できます。',
  ],
  cards: [
    'スーパーキノコ：3枚から1枚（1 / 3 / 5 / 10コイン）を選び、すぐ2倍。次のカードには残らない。',
    'キングテレサ：他チームのコインをシャッフル。自分のコインはそのまま。',
    'ゴールドスター：+15コインのあとラウンド終了。',
    'ブルーパー：相手1チームにインク。次のコインカードが必ず+1。',
    'クッパレボリューション：相手とコインを交換したあとラウンド終了。',
    'クッパフューリー：他チーム全員−5コインのあとラウンド終了。',
    'ミステリーブロック：3つのうち1つ（宝10–15 / 0 / パックンで終了）。',
    'アクションカードは低確率。1位はさらに当たりにくいです。',
  ],
};

export const ClassicRulebookModal: React.FC<ClassicRulebookModalProps> = ({ onClose }) => {
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
        <div className="p-4 sm:p-5 space-y-5">
          <section>
            <h3 className="font-mario text-sm text-amber-300 flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4" /> How to run a round
            </h3>
            <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-100">
              {t.steps.map(step => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
          <section>
            <h3 className="font-mario text-sm text-amber-300 flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4" /> Classic card remaps
            </h3>
            <ul className="space-y-1.5 text-sm text-slate-100">
              {t.cards.map(card => (
                <li key={card} className="flex gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0 mt-0.5" />
                  {card}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </motion.div>
    </div>
  );
};
