import React from 'react';

interface MarioCoinProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  animated?: boolean;
}

export const MarioCoin: React.FC<MarioCoinProps> = ({
  className = '',
  size = 'md',
  animated = false,
}) => {
  const uid = React.useId().replace(/:/g, '');
  const sizeMap = {
    xs: 'w-3.5 h-3.5 text-[10px]',
    sm: 'w-4 h-4 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base',
    xl: 'w-10 h-10 text-xl',
    '2xl': 'w-20 h-20 text-4xl',
  };

  const dim = {
    xs: 14,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 40,
    '2xl': 88,
  }[size] ?? 24;

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
          <linearGradient id={`${uid}-coinOuter`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#eab308" />
            <stop offset="70%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
          <linearGradient id={`${uid}-coinInner`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Outer Coin Edge Rim */}
        <ellipse cx="16" cy="16" rx="14.5" ry="14.5" fill={`url(#${uid}-coinOuter)`} stroke="#78350f" strokeWidth="1" />

        {/* Inner Coin Rim */}
        <ellipse cx="16" cy="16" rx="11" ry="11" fill={`url(#${uid}-coinInner)`} stroke="#ca8a04" strokeWidth="0.8" />

        {/* Specular Edge Ring Highlight */}
        <ellipse cx="16" cy="16" rx="13" ry="13" fill="none" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.6" />

        {/* Center Star / Rectangular Emboss Slot (Classic Mario Coin) */}
        <rect x="14" y="9.5" width="4" height="13" rx="2" fill="#854d0e" />
        <rect x="14.5" y="10" width="3" height="12" rx="1.5" fill="#ca8a04" />
        <rect x="15" y="11" width="1.5" height="10" rx="0.75" fill="#fef08a" opacity="0.9" />
      </svg>
    </span>
  );
};
