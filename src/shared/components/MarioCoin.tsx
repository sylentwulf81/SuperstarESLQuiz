import React from 'react';

interface MarioCoinProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  animated?: boolean;
}

const DIM_MAP: Record<string, number> = {
  xs: 14,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  '2xl': 88,
};

/**
 * Bolt Performance Optimization:
 * 1) Wrapped MarioCoin in React.memo to prevent unnecessary VDOM re-renders of high-density coin instances
 *    when parent board state, timers, or scores update.
 * 2) Moved DIM_MAP lookup outside component render pass and removed unused sizeMap to eliminate object allocations.
 * 3) Used React.useId() for SVG gradient IDs to ensure unique DOM IDs across instances without collisions.
 */
export const MarioCoin = React.memo(function MarioCoin({
  className = '',
  size = 'md',
  animated = false,
}: MarioCoinProps) {
  const uid = React.useId();
  const dim = DIM_MAP[size] ?? 24;
  const outerGradId = `${uid}-coinOuter`;
  const innerGradId = `${uid}-coinInner`;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${
        animated ? 'animate-coin-spin' : ''
      } ${className}`}
      style={{ width: dim, height: dim }}
    >
      <svg
        viewBox="0 0 32 32"
        width={dim}
        height={dim}
        className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
      >
        <defs>
          <linearGradient id={outerGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#eab308" />
            <stop offset="70%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
          <linearGradient id={innerGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Outer Coin Edge Rim */}
        <ellipse cx="16" cy="16" rx="14.5" ry="14.5" fill={`url(#${outerGradId})`} stroke="#78350f" strokeWidth="1" />

        {/* Inner Coin Rim */}
        <ellipse cx="16" cy="16" rx="11" ry="11" fill={`url(#${innerGradId})`} stroke="#ca8a04" strokeWidth="0.8" />

        {/* Specular Edge Ring Highlight */}
        <ellipse cx="16" cy="16" rx="13" ry="13" fill="none" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.6" />

        {/* Center Star / Rectangular Emboss Slot (Classic Mario Coin) */}
        <rect x="14" y="9.5" width="4" height="13" rx="2" fill="#854d0e" />
        <rect x="14.5" y="10" width="3" height="12" rx="1.5" fill="#ca8a04" />
        <rect x="15" y="11" width="1.5" height="10" rx="0.75" fill="#fef08a" opacity="0.9" />
      </svg>
    </span>
  );
});
