import React, { useMemo } from 'react';
import { parseMarkedPrompt } from '@/shared/markedPrompt';

interface MarkedPromptProps {
  text: string;
  className?: string;
}

/**
 * Bolt Performance Optimization:
 * 1) Wrap MarkedPrompt in React.memo to prevent unnecessary VDOM re-renders when parent modal state or timer ticks.
 * 2) Memoize parseMarkedPrompt result via useMemo to avoid re-parsing prompt text on every render.
 */
export const MarkedPrompt = React.memo(function MarkedPrompt({ text, className }: MarkedPromptProps) {
  const parts = useMemo(() => parseMarkedPrompt(text), [text]);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.marked ? (
          <span
            key={index}
            className="inline-block px-[0.28em] rounded-[0.2em] bg-orange-500 text-slate-950 align-middle leading-[1.05] [text-shadow:none]"
          >
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  );
});
