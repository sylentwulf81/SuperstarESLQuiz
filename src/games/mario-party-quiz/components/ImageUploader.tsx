import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, Image as ImageIcon, Trash2, Link as LinkIcon, Check, Cloud, LogIn, Sparkles, Crop } from 'lucide-react';
import { compressImageFile, readFileAsDataUrl } from '@/shared/utils/imageUtils';
import { sounds } from '@/shared/utils/sound';
import { QuestionType } from '@/shared/types';
import { ImageCropModal } from './ImageCropModal';

interface ImageUploaderProps {
  currentImageUrl?: string;
  onImageChange: (dataUrlOrUrl: string | undefined) => void;
  isLoggedIn: boolean;
  userEmail?: string | null;
  onPromptLogin?: () => void;
  titlePrompt?: string;
  questionType?: QuestionType;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImageUrl,
  onImageChange,
  isLoggedIn,
  userEmail,
  onPromptLogin,
  titlePrompt,
  questionType,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState(currentImageUrl || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCropper = (source: string) => {
    setErrorMessage(null);
    setCropSource(source);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WEBP, or SVG).');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      sounds.playPowerUp();
      if (file.type === 'image/svg+xml') {
        const compressedDataUrl = await compressImageFile(file, 960, 720, 0.82);
        onImageChange(compressedDataUrl);
        setManualUrl(compressedDataUrl);
      } else {
        const dataUrl = await readFileAsDataUrl(file);
        openCropper(dataUrl);
      }
    } catch (err: unknown) {
      console.error('Image compression error:', err);
      setErrorMessage('Could not process image file. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset file input so selecting the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    onImageChange(undefined);
    setManualUrl('');
  };

  const handleApplyUrl = () => {
    if (!manualUrl.trim()) {
      onImageChange(undefined);
    } else {
      sounds.playCoin();
      openCropper(manualUrl.trim());
    }
  };

  const previewAspectClass =
    questionType === 'multiple_choice' ? 'aspect-[3/4] sm:w-36 h-auto' : 'aspect-[4/3] sm:w-52 h-auto';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>Question Clue Image {titlePrompt ? `(${titlePrompt})` : ''}:</span>
        </label>

        {isLoggedIn ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <Cloud className="w-3 h-3 text-emerald-400" /> Cloud Upload Active ({userEmail || 'Signed In'})
          </span>
        ) : onPromptLogin ? (
          <button
            type="button"
            onClick={onPromptLogin}
            className="inline-flex items-center gap-1 text-[10px] text-amber-300 hover:text-amber-200 underline cursor-pointer"
          >
            <LogIn className="w-3 h-3 text-amber-400" /> Sign in for Cloud Backup
          </button>
        ) : null}
      </div>

      {/* Main Upload Dropzone or Active Preview */}
      {currentImageUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-black/50 p-3 flex flex-col sm:flex-row items-center gap-4">
          <div className={`relative w-full ${previewAspectClass} max-h-48 bg-slate-950 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center shrink-0`}>
            <img
              src={currentImageUrl}
              alt="Clue Preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
              onError={(e) => {
                // If an old Unsplash link is broken, inform user and allow quick replacement
                (e.target as HTMLElement).classList.add('opacity-40');
              }}
            />
            <div className="absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] text-emerald-300 font-bold flex items-center gap-1">
              <Check className="w-2.5 h-2.5 text-emerald-400" /> Attached
            </div>
          </div>

          <div className="flex-1 text-left space-y-2 w-full">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Image Clue Ready</span>
              {currentImageUrl.startsWith('data:') && (
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded border border-indigo-400/30 font-medium">
                  Direct Upload (Fast & Offline)
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-300">
              This image will be displayed on-screen during the question prompt. Crop it to match the card shape before saving.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => openCropper(currentImageUrl)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-yellow-200/70 cursor-pointer shadow"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Crop / Adjust</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-indigo-400/40 cursor-pointer shadow"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Replace Image File</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl flex items-center gap-1 border border-white/10 cursor-pointer"
              >
                <LinkIcon className="w-3 h-3" />
                <span>{showUrlInput ? 'Hide URL' : 'Edit URL'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearImage}
                className="px-2.5 py-1.5 bg-red-950/70 hover:bg-red-900/80 text-red-300 text-xs rounded-xl flex items-center gap-1 border border-red-500/30 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-yellow-400 bg-amber-500/10 scale-[1.01]'
              : 'border-white/20 bg-black/30 hover:border-indigo-400/60 hover:bg-black/40'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow">
            {isProcessing ? (
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            ) : (
              <Upload className="w-5 h-5 text-amber-300" />
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-white">
              {isProcessing ? 'Processing & Compressing...' : 'Click to Upload or Drag & Drop Image'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Supports PNG, JPG, WEBP, GIF (Automatically compressed for instant loading)
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowUrlInput(!showUrlInput);
              }}
              className="text-[11px] text-indigo-300 hover:text-indigo-200 underline flex items-center gap-1 cursor-pointer"
            >
              <LinkIcon className="w-3 h-3" />
              <span>Or enter web image URL</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Manual URL Input Fallback */}
      {showUrlInput && (
        <div className="p-3 bg-black/40 border border-white/15 rounded-xl space-y-2 mt-2">
          <label className="text-[11px] text-slate-300 font-semibold block">
            Direct Web Image URL:
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="flex-1 bg-black/50 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-red-400 font-semibold bg-red-950/60 p-2 rounded-lg border border-red-500/30">
          {errorMessage}
        </p>
      )}

      {cropSource && (
        <ImageCropModal
          sourceUrl={cropSource}
          questionType={questionType}
          onCancel={() => setCropSource(null)}
          onApply={(dataUrl) => {
            onImageChange(dataUrl);
            setManualUrl(dataUrl);
            setCropSource(null);
          }}
        />
      )}
    </div>
  );
};
