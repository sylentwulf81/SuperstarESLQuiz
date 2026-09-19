import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, Minus, Plus, Users, X } from 'lucide-react';
import { GameTheme } from '@/shared/types';
import { THEME_UI } from '@/shared/themeMeta';
import { sounds } from '@/shared/utils/sound';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';

const CLASS_SIZE_KEY = 'mp_class_size_v1';
const MIN_STUDENTS = 1;
const MAX_STUDENTS = 80;
const MIN_GROUPS = 2;
const MAX_GROUPS = 6;

function loadClassSize(): number {
  try {
    const raw = localStorage.getItem(CLASS_SIZE_KEY);
    const n = raw ? Number.parseInt(raw, 10) : NaN;
    if (Number.isFinite(n)) return Math.min(MAX_STUDENTS, Math.max(MIN_STUDENTS, n));
  } catch {
    // ignore
  }
  return 24;
}

function persistClassSize(n: number) {
  try {
    localStorage.setItem(CLASS_SIZE_KEY, String(n));
  } catch {
    // ignore
  }
}

function splitGroups(students: number, groups: number): number[] {
  const g = Math.max(1, groups);
  const n = Math.max(0, students);
  const base = Math.floor(n / g);
  const extra = n % g;
  return Array.from({ length: g }, (_, i) => base + (i < extra ? 1 : 0));
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

interface TeamCalculatorModalProps {
  theme: GameTheme;
  suggestedGroups: number;
  onClose: () => void;
}

export const TeamCalculatorModal: React.FC<TeamCalculatorModalProps> = ({
  theme,
  suggestedGroups,
  onClose,
}) => {
  useBodyScrollLock();
  const [students, setStudents] = useState(loadClassSize);
  const [groups, setGroups] = useState(() =>
    clamp(suggestedGroups, MIN_GROUPS, MAX_GROUPS),
  );

  useEffect(() => {
    persistClassSize(students);
  }, [students]);

  const sizes = splitGroups(students, groups);
  const unique = [...new Set(sizes)];

  const bumpStudents = (delta: number) => {
    sounds.playPop();
    setStudents(n => clamp(n + delta, MIN_STUDENTS, MAX_STUDENTS));
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 bg-slate-950/82">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="relative w-[min(36rem,calc(100vw-1.5rem))] bg-slate-900 rounded-3xl border-2 border-white/20 shadow-2xl overflow-hidden"
      >
        <div className={`absolute top-0 inset-x-0 h-1.5 ${THEME_UI[theme].barClass}`} />

        <div className="px-4 sm:px-5 py-3.5 border-b border-white/15 flex items-center justify-between gap-3">
          <h2 className="font-mario text-lg sm:text-xl text-yellow-300 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-300" />
            Team size
          </h2>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-800/70 border border-white/12 p-3 text-center h-[7.75rem] flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 block mb-2">
                Class
              </span>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => bumpStudents(-1)}
                  className="w-11 h-11 rounded-xl bg-slate-950/70 hover:bg-slate-950 text-white border border-white/15 cursor-pointer inline-flex items-center justify-center"
                  aria-label="Fewer students"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  min={MIN_STUDENTS}
                  max={MAX_STUDENTS}
                  value={students}
                  onChange={e => {
                    const n = Number.parseInt(e.target.value, 10);
                    if (Number.isFinite(n)) setStudents(clamp(n, MIN_STUDENTS, MAX_STUDENTS));
                  }}
                  className="w-[4.75rem] bg-transparent text-center font-mario text-4xl sm:text-5xl text-yellow-300 leading-none tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Students in class"
                />
                <button
                  type="button"
                  onClick={() => bumpStudents(1)}
                  className="w-11 h-11 rounded-xl bg-slate-950/70 hover:bg-slate-950 text-white border border-white/15 cursor-pointer inline-flex items-center justify-center"
                  aria-label="More students"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-800/70 border border-white/12 p-3 text-center h-[7.75rem] flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 block mb-2">
                Teams
              </span>
              <div className="flex items-center justify-center gap-1.5">
                {Array.from({ length: MAX_GROUPS - MIN_GROUPS + 1 }, (_, i) => MIN_GROUPS + i).map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setGroups(n);
                    }}
                    className={`w-10 h-11 rounded-xl font-mario text-xl border cursor-pointer ${
                      groups === n
                        ? 'bg-amber-500 text-slate-950 border-yellow-200 shadow-md'
                        : 'bg-slate-950/70 text-white border-white/15 hover:border-white/40'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-black/35 border border-white/10 px-3 py-4">
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
              {Array.from({ length: MAX_GROUPS }, (_, idx) => {
                const active = idx < groups;
                const count = active ? sizes[idx] : 0;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border-2 px-1 py-2.5 text-center h-[5.75rem] ${
                      !active
                        ? 'bg-slate-950/40 border-white/10 opacity-25'
                        : count === 0
                          ? 'bg-slate-900/60 border-white/10 opacity-40'
                          : 'bg-slate-800/90 border-amber-300/40'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {idx + 1}
                    </span>
                    <div className="font-mario text-3xl sm:text-4xl text-yellow-300 leading-none mt-0.5 tabular-nums">
                      {active ? count : '–'}
                    </div>
                    <Users className="w-3.5 h-3.5 text-amber-200 mx-auto mt-1" />
                  </div>
                );
              })}
            </div>
            <p className="mt-3 h-7 text-center font-mario text-lg text-amber-200 leading-7">
              {unique
                .slice()
                .sort((a, b) => b - a)
                .map(n => `${sizes.filter(s => s === n).length}×${n}`)
                .join('  ·  ')}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
