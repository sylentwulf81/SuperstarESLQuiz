import React, { useId } from 'react';

export interface MysteryCardBackProps {
  /** Optional index or identifier for the pattern ID (falls back to useId) */
  idx?: number | string;
  /** Whether the card is currently flipped (in 3D flip card implementations) */
  flipped?: boolean;
  /** Header badge text (defaults to '★ MYSTERY ★') */
  badgeText?: string;
  /** Center preview title override (used for test preview mode instead of the '?' medallion) */
  previewTitle?: string;
  /** Optional slot number (e.g. 1-6) to show at bottom if bottomLabel is not provided */
  slotNumber?: number;
  /** Custom bottom badge content (defaults to 'CARD {slotNumber}' or 'TAP TO PICK') */
  bottomLabel?: React.ReactNode;
  /** Whether to apply 3D transform / backface-visibility styles (for flip cards) */
  preserve3d?: boolean;
  /** Additional custom class names */
  className?: string;
  /** Additional custom styles */
  style?: React.CSSProperties;
}

export const MysteryCardBack: React.FC<MysteryCardBackProps> = React.memo(function MysteryCardBack({
  idx,
  flipped = false,
  badgeText = '★ MYSTERY ★',
  previewTitle,
  slotNumber,
  bottomLabel,
  preserve3d = false,
  className = '',
  style,
}) {
  const reactId = useId();
  const patternId = `argyle-${idx !== undefined ? idx : reactId.replace(/:/g, '')}`;

  const transformStyle: React.CSSProperties = preserve3d
    ? {
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'rotateY(0deg) translateZ(1px)',
        ...style,
      }
    : style || {};

  return (
    <div
      style={transformStyle}
      className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/90 bg-gradient-to-br from-red-700 via-rose-900 to-red-950 flex flex-col items-center justify-between p-2 sm:p-2.5 md:p-3 transition-opacity duration-200 select-none ${
        flipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${!flipped ? 'hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]' : ''} ${className}`}
    >
      {/* Argyle geometric SVG pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={patternId} width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M14 0 L28 14 L14 28 L0 14 Z" fill="none" stroke="#fbbf24" strokeWidth="1" />
            <circle cx="14" cy="14" r="1.5" fill="#fde047" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      {/* Gold inner border frame */}
      <div className="absolute inset-1 sm:inset-1.5 rounded-xl border border-amber-300/40 pointer-events-none" />

      {/* Top Header Badge */}
      <div className="relative z-10 text-center pt-0.5 sm:pt-1">
        <span className="font-mario text-[8px] sm:text-[10px] md:text-xs text-yellow-300 tracking-wider bg-black/60 px-2 sm:px-2.5 py-0.5 rounded-full border border-amber-400/50 shadow-sm leading-none inline-block">
          {badgeText}
        </span>
      </div>

      {/* Center Question Mark Medallion or Test Preview Title */}
      <div className="relative z-10 my-auto flex items-center justify-center w-full px-1">
        {previewTitle ? (
          <span className="font-mario text-[clamp(0.65rem,8cqw,0.95rem)] text-yellow-100 text-center leading-tight text-shadow-mario px-1 line-clamp-3">
            {previewTitle}
          </span>
        ) : (
          <div className="w-[clamp(2.75rem,36cqw,4.5rem)] h-[clamp(2.75rem,36cqw,4.5rem)] sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full p-1 sm:p-1.5 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 shadow-[0_0_20px_rgba(250,204,21,0.5)] flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-full bg-gradient-to-b from-red-900 to-red-950 border border-yellow-200/60 flex items-center justify-center">
              <span className="font-mario text-[clamp(1.75rem,24cqw,3rem)] sm:text-4xl lg:text-5xl text-yellow-300 text-shadow-mario leading-none select-none">
                ?
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Badge */}
      <div className="relative z-10 pb-0.5 sm:pb-1 text-center">
        {bottomLabel !== undefined ? (
          bottomLabel
        ) : slotNumber !== undefined ? (
          <span className="text-[9px] sm:text-[10px] md:text-[11px] font-black text-amber-200 uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded-full border border-amber-400/40 leading-none inline-block">
            CARD {slotNumber}
          </span>
        ) : (
          <span className="text-[9px] sm:text-[10px] font-bold text-amber-200 uppercase tracking-wider bg-black/50 px-2 py-0.5 rounded-full border border-amber-400/40 animate-pulse leading-none inline-block">
            TAP TO PICK
          </span>
        )}
      </div>
    </div>
  );
});
