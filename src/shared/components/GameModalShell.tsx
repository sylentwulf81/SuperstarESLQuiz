import React from 'react';
import { motion } from 'motion/react';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';

interface GameModalShellProps {
  children: React.ReactNode;
  barColor?: string;
  className?: string;
  zIndexClass?: string;
}

/** One classroom overlay size so card reveals don't jump when inner content changes. */
export const GAME_MODAL_FRAME =
  'relative w-[min(96vw,86rem)] h-[min(92dvh,54rem)] bg-slate-900 rounded-3xl border-2 border-white/20 shadow-2xl overflow-hidden flex flex-col';

export const GameModalShell: React.FC<GameModalShellProps> = ({
  children,
  barColor,
  className = '',
  zIndexClass = 'z-50',
}) => {
  useBodyScrollLock();
  return (
    <div className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-2 sm:p-3 bg-slate-950/88`}>
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        className={`${GAME_MODAL_FRAME} ${className}`}
      >
        {barColor && <div className="absolute top-0 inset-x-0 h-1.5" style={{ background: barColor }} />}
        {children}
      </motion.div>
    </div>
  );
};
