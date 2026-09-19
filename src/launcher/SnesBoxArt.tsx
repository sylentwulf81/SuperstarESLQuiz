import React, { useState, useEffect } from 'react';
import { LauncherGame } from '@/launcher/catalog';

interface SnesBoxArtProps {
  game: LauncherGame;
  size?: 'hero' | 'card' | 'modal';
  className?: string;
  allowUpload?: boolean;
}

export const SnesBoxArt: React.FC<SnesBoxArtProps> = ({
  game,
  size = 'card',
  className = '',
  allowUpload = true,
}) => {
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`snes_box_art_v2_${game.id}`);
      if (stored) {
        setCustomImage(stored);
      }
    } catch {
      // Storage unavailable
    }
  }, [game.id]);

  const processFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomImage(dataUrl);
        setImageError(false);
        try {
          localStorage.setItem(`snes_box_art_v2_${game.id}`, dataUrl);
        } catch {
          // LocalStorage full or blocked
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!allowUpload) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!allowUpload) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const displayImage = customImage || (!imageError ? game.cover.backgroundImage : undefined) || null;
  const isCard = size === 'card';

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`group relative aspect-[4/3] w-full overflow-hidden select-none ${
        isCard ? '' : 'rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)]'
      } ${className}`}
    >
      {displayImage ? (
        <img
          src={displayImage}
          alt={game.title}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center transition-[filter] duration-300 group-hover:brightness-110"
        />
      ) : (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br ${game.cover.cardGradient}`}
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center text-3xl sm:text-4xl shadow-2xl">
            {game.cover.coverArtEmoji}
          </div>
          <h4 className="font-mario text-sm sm:text-base text-yellow-300 drop-shadow mt-2 line-clamp-1">
            {game.shortTitle}
          </h4>
        </div>
      )}

      {isDragging && (
        <div className="absolute inset-0 z-10 pointer-events-none border-2 border-dashed border-yellow-300 bg-slate-950/30" />
      )}
    </div>
  );
};
