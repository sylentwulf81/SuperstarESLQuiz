import React, { useState, useEffect } from 'react';
import { CharacterId } from '@/shared/types';
import { CHARACTERS } from '@/games/mario-party-quiz/data/characters';
import { TeamEmblem } from './TeamEmblems';

interface TeamAvatarProps {
  characterId: CharacterId;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  customUrl?: string;
  showBorder?: boolean;
}

const SIZE_MAP = {
  xs: 'w-5 h-5 rounded-md text-xs',
  sm: 'w-7 h-7 rounded-lg text-sm',
  md: 'w-9 h-9 rounded-xl text-base',
  lg: 'w-12 h-12 rounded-xl text-xl',
  xl: 'w-20 h-20 rounded-2xl text-3xl',
  '2xl': 'w-28 h-28 rounded-3xl text-5xl',
};

export const TeamAvatar: React.FC<TeamAvatarProps> = ({
  characterId,
  size = 'md',
  className = '',
  customUrl,
  showBorder = true,
}) => {
  const char = CHARACTERS[characterId];
  const [imgError, setImgError] = useState(false);
  const [storedUrl, setStoredUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`avatar_${characterId}`);
      if (saved) {
        setStoredUrl(saved);
      }
    } catch {
      // Ignore storage errors
    }
  }, [characterId]);

  useEffect(() => {
    setImgError(false);
  }, [customUrl, storedUrl, characterId]);

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const stockAvatar = char?.imageUrl;
  const activeImageUrl = customUrl || storedUrl || stockAvatar;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden select-none transition-transform ${sizeClass} ${
        showBorder ? 'border border-white/20 shadow-md' : ''
      } ${className}`}
    >
      {activeImageUrl && !imgError ? (
        <img
          src={activeImageUrl}
          alt={char?.name || 'Team Emblem'}
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain select-none pointer-events-none"
        />
      ) : char ? (
        <TeamEmblem characterId={characterId} className="w-full h-full object-cover" />
      ) : (
        <span className="select-none leading-none">🎮</span>
      )}
    </div>
  );
};
