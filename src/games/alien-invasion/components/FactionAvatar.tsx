import React, { useEffect, useState } from 'react';
import { InvasionFactionId, INVASION_FACTIONS } from '../data/factions';

interface FactionAvatarProps {
  factionId: InvasionFactionId;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  customUrl?: string;
  showBorder?: boolean;
}

const SIZE_MAP = {
  xs: 'w-5 h-5 rounded-md text-[10px]',
  sm: 'w-7 h-7 rounded-lg text-sm',
  md: 'w-9 h-9 rounded-xl text-base',
  lg: 'w-12 h-12 rounded-xl text-xl',
  xl: 'w-20 h-20 rounded-2xl text-3xl',
  '2xl': 'w-28 h-28 rounded-3xl text-5xl',
};

function FactionMark({ factionId }: { factionId: InvasionFactionId }) {
  if (factionId === 'anime') {
    return (
      <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden>
        <rect width="64" height="64" fill="#831843" />
        <path d="M10 28 L18 4 L24 22 L32 2 L40 22 L46 4 L54 28 L52 20 L44 8 L32 6 L20 8 L12 20 Z" fill="#f9a8d4" />
        <ellipse cx="32" cy="38" rx="16" ry="18" fill="#fbcfe8" />
        <ellipse cx="25" cy="38" rx="5.5" ry="6.5" fill="#fff" />
        <ellipse cx="39" cy="38" rx="5.5" ry="6.5" fill="#fff" />
        <circle cx="26" cy="39" r="2.4" fill="#0f172a" />
        <circle cx="40" cy="39" r="2.4" fill="#0f172a" />
        <path d="M26 48 Q32 52 40 48" stroke="#9d174d" strokeWidth="2" fill="none" />
        <path d="M22 8 L26 20" stroke="#fb7185" strokeWidth="2" />
        <path d="M42 8 L38 20" stroke="#fb7185" strokeWidth="2" />
      </svg>
    );
  }

  if (factionId === 'robots') {
    return (
      <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden>
        <rect width="64" height="64" fill="#0e7490" />
        <rect x="14" y="16" width="36" height="32" rx="4" fill="#a5f3fc" />
        <rect x="20" y="24" width="24" height="10" rx="2" fill="#083344" />
        <rect x="24" y="27" width="6" height="4" fill="#22d3ee" />
        <rect x="34" y="27" width="6" height="4" fill="#22d3ee" />
        <rect x="28" y="8" width="8" height="10" fill="#67e8f9" />
        <circle cx="32" cy="8" r="4" fill="#ecfeff" />
      </svg>
    );
  }

  if (factionId === 'aliens') {
    return (
      <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden>
        <rect width="64" height="64" fill="#3f6212" />
        <ellipse cx="32" cy="34" rx="16" ry="20" fill="#bef264" />
        <ellipse cx="24" cy="32" rx="6" ry="10" fill="#0f172a" />
        <ellipse cx="40" cy="32" rx="6" ry="10" fill="#0f172a" />
        <circle cx="24" cy="30" r="2" fill="#ecfccb" />
        <circle cx="40" cy="30" r="2" fill="#ecfccb" />
      </svg>
    );
  }

  if (factionId === 'zombies') {
    return (
      <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden>
        <rect width="64" height="64" fill="#6b21a8" />
        <circle cx="32" cy="30" r="16" fill="#d8b4fe" />
        <circle cx="26" cy="28" r="3.5" fill="#0f172a" />
        <circle cx="40" cy="26" r="2.5" fill="#0f172a" />
        <path d="M22 40 Q32 36 44 42" stroke="#581c87" strokeWidth="3" fill="none" />
        <path d="M18 18 L22 8 L26 18" stroke="#e9d5ff" strokeWidth="3" fill="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden>
      <rect width="64" height="64" fill="#9a3412" />
      <circle cx="32" cy="36" r="16" fill="#fdba74" />
      <polygon points="16,22 22,6 28,22" fill="#fb923c" />
      <polygon points="36,22 42,4 50,22" fill="#fb923c" />
      <circle cx="26" cy="36" r="3" fill="#0f172a" />
      <circle cx="40" cy="36" r="3" fill="#0f172a" />
      <path d="M24 46 Q32 50 42 44" stroke="#7c2d12" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

export const FactionAvatar: React.FC<FactionAvatarProps> = ({
  factionId,
  size = 'md',
  className = '',
  customUrl,
  showBorder = true,
}) => {
  const faction = INVASION_FACTIONS[factionId];
  const [imgError, setImgError] = useState(false);
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const stockUrl = faction.imageUrl;
  const activeImageUrl = customUrl || stockUrl;

  useEffect(() => {
    setImgError(false);
  }, [customUrl, factionId]);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden select-none ${sizeClass} ${
        showBorder ? 'border border-white/20 shadow-md' : ''
      } ${className}`}
      style={{ backgroundColor: faction.accentColor }}
    >
      {activeImageUrl && !imgError ? (
        <img
          src={activeImageUrl}
          alt={faction.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover select-none pointer-events-none"
        />
      ) : (
        <FactionMark factionId={factionId} />
      )}
    </div>
  );
};
