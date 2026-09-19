import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Upload, Image as ImageIcon } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  // Load custom box art from localStorage if teacher uploaded one via browser
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
    reader.onload = (event) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Determine current image source:
  // 1. User uploaded image from state
  // 2. Game's configured cover image (public/assets/boxart)
  const displayImage = customImage || (!imageError ? game.cover.backgroundImage : undefined) || null;

  const isHero = size === 'hero';
  const isModal = size === 'modal';

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative rounded-2xl overflow-hidden group select-none transition-all duration-300 ${
        isHero
          ? 'aspect-[16/10] w-full shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.2)]'
          : isModal
          ? 'aspect-[16/10] w-full shadow-2xl'
          : 'aspect-[16/10] w-full shadow-[0_10px_25px_rgba(0,0,0,0.8)]'
      } ${className}`}
      style={{
        background: 'linear-gradient(145deg, #2a2d36 0%, #17181d 50%, #0d0e12 100%)',
        border: isDragging ? '3px dashed #facc15' : '3px solid #474b59',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.8), 0 12px 30px rgba(0,0,0,0.85)',
      }}
    >
      {/* Hidden File Input for Custom Box Art Upload */}
      {allowUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {/* SNES Classic Red Side Strip (Iconic Super Nintendo Right Header Edge) */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-8 sm:w-10 z-20 flex flex-col items-center justify-between py-2 border-l border-black/60 shadow-[-4px_0_12px_rgba(0,0,0,0.6)]"
        style={{
          background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 45%, #991b1b 100%)',
        }}
      >
        {/* Red Oval Logo Pill */}
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 border border-white/40 flex items-center justify-center p-0.5">
          <div className="w-full h-full rounded-full bg-red-700 flex items-center justify-center text-[10px] font-black text-white">
            ALT
          </div>
        </div>

        {/* Vertical Rotated "SUPER NINTENDO / ALT ARCADE" Typography */}
        <div className="flex-1 flex items-center justify-center my-1 overflow-hidden">
          <span 
            className="text-[9px] sm:text-[10px] font-black tracking-widest text-white/90 uppercase whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            CLASSROOM ENTERTAINMENT SYSTEM
          </span>
        </div>

        {/* Region & Bit Badge */}
        <div className="text-[7px] sm:text-[8px] font-black text-white/80 bg-black/40 px-1 py-0.5 rounded border border-white/20 tracking-tighter">
          16-BIT
        </div>
      </div>

      {/* Main Artwork Window (Inside Beveled SNES Cardboard Cutout) */}
      <div 
        className="absolute inset-y-1.5 left-1.5 right-9 sm:right-11 rounded-xl overflow-hidden z-10 bg-slate-950 flex items-center justify-center"
        style={{
          border: '2px solid #20222a',
          boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={game.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center transition-[filter] duration-300 group-hover:brightness-110"
          />
        ) : (
          /* Stylized Retro Vector Artwork Fallback */
          <div 
            className={`w-full h-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br ${game.cover.cardGradient}`}
          >
            {/* Ambient Background Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay flex items-center justify-center text-8xl">
              {game.cover.coverArtEmoji}
            </div>

            <div className="relative z-10 text-center space-y-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center text-3xl sm:text-4xl shadow-2xl">
                {game.cover.coverArtEmoji}
              </div>
              <h4 className="font-mario text-sm sm:text-base text-yellow-300 drop-shadow line-clamp-1">
                {game.shortTitle}
              </h4>
              <p className="text-[10px] text-white/70 italic line-clamp-1">
                {game.tagline}
              </p>
            </div>
          </div>
        )}

        {/* Vintage Gloss & Cardboard Sheen Reflection */}
        <div 
          className="absolute inset-0 pointer-events-none z-10 opacity-30"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 30%, transparent 60%, rgba(0,0,0,0.4) 100%)',
          }}
        />

        {/* Official SNES Gold Seal of Quality Medallion */}
        <div className="absolute top-2 left-2 z-20">
          <div 
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-full border border-yellow-300/80 shadow-[0_2px_10px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center text-center p-0.5"
            style={{
              background: 'radial-gradient(circle, #fef08a 0%, #eab308 60%, #a16207 100%)',
              boxShadow: '0 0 8px rgba(250,204,21,0.5), inset 0 1px 2px rgba(255,255,255,0.8)',
            }}
          >
            <div className="w-full h-full rounded-full border border-dashed border-amber-900/60 flex flex-col items-center justify-center px-0.5 leading-none">
              <span className="text-[5px] sm:text-[6px] font-black uppercase text-amber-950 tracking-tighter">
                Official
              </span>
              <span className="text-[6.5px] sm:text-[7.5px] font-black uppercase text-amber-950 tracking-tighter leading-tight font-sans">
                CLASSROOM
              </span>
              <span className="text-[5px] sm:text-[6px] font-black uppercase text-amber-950 tracking-tighter">
                Seal of Quality
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right Player/Game Mode Tag */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 text-[9px] font-bold text-yellow-300 shadow-md">
          <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
          <span>{game.stats.players}</span>
        </div>

        {/* Bottom Banner Title Overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-2.5 pt-6 z-20 flex items-end justify-between">
          <div className="leading-tight">
            <span className="text-[9px] uppercase font-black text-amber-400 tracking-wider block">
              {game.badge}
            </span>
            <h3 className="font-mario text-xs sm:text-sm text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] line-clamp-1">
              {game.shortTitle}
            </h3>
          </div>

          <span className="text-[9px] font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded border border-white/20">
            {game.stats.duration}
          </span>
        </div>

        {/* Hover "Custom Art" Button for Teachers to load their own image */}
        {allowUpload && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-yellow-300 font-bold text-xs z-30 cursor-pointer backdrop-blur-xs p-4 text-center"
            title="Click to select or change box art image from your device"
          >
            <div className="w-10 h-10 rounded-full bg-yellow-400/20 border border-yellow-400/60 flex items-center justify-center">
              <Upload className="w-5 h-5 text-yellow-300" />
            </div>
            <span>{customImage ? 'Change Box Art' : 'Upload SNES Box Art'}</span>
            <span className="text-[10px] text-white/60 font-normal">
              Select JPEG / PNG from your device
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
