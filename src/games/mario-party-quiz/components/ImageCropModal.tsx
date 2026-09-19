import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Crop, RotateCcw, X, ZoomIn } from 'lucide-react';
import { QuestionType } from '@/shared/types';
import { cropAndCompressImage, loadImageElement } from '@/shared/utils/imageUtils';
import { sounds } from '@/shared/utils/sound';

type AspectId = 'portrait' | 'landscape' | 'square' | 'wide' | 'original';

const ASPECTS: { id: AspectId; label: string; hint: string; ratio: number | null }[] = [
  { id: 'portrait', label: 'Portrait', hint: 'Multiple choice card', ratio: 3 / 4 },
  { id: 'landscape', label: 'Landscape', hint: 'Unscramble & trivia', ratio: 4 / 3 },
  { id: 'square', label: 'Square', hint: 'Centered clue', ratio: 1 },
  { id: 'wide', label: 'Wide', hint: 'Banner clue', ratio: 16 / 9 },
  { id: 'original', label: 'Original', hint: 'Keep photo shape', ratio: null },
];

const defaultAspectForType = (type?: QuestionType): AspectId => {
  if (type === 'multiple_choice') return 'portrait';
  if (type === 'unscramble' || type === 'open_trivia') return 'landscape';
  return 'landscape';
};

interface ImageCropModalProps {
  sourceUrl: string;
  questionType?: QuestionType;
  onCancel: () => void;
  onApply: (dataUrl: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  sourceUrl,
  questionType,
  onCancel,
  onApply,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aspectId, setAspectId] = useState<AspectId>(defaultAspectForType(questionType));
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState({ w: 480, h: 360 });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadImageElement(sourceUrl)
      .then(loaded => {
        if (!cancelled) setImg(loaded);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this image for cropping. Try uploading the file directly.');
      });
    return () => {
      cancelled = true;
    };
  }, [sourceUrl]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const update = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageSize({ w: rect.width, h: rect.height });
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [img]);

  const naturalW = img?.naturalWidth || 1;
  const naturalH = img?.naturalHeight || 1;
  const aspectRatio = aspectId === 'original' ? naturalW / naturalH : (ASPECTS.find(a => a.id === aspectId)?.ratio || 4 / 3);

  const frame = useMemo(() => {
    const pad = 28;
    const maxW = Math.max(80, stageSize.w - pad * 2);
    const maxH = Math.max(80, stageSize.h - pad * 2);
    let fw = maxW;
    let fh = fw / aspectRatio;
    if (fh > maxH) {
      fh = maxH;
      fw = fh * aspectRatio;
    }
    return {
      w: fw,
      h: fh,
      x: (stageSize.w - fw) / 2,
      y: (stageSize.h - fh) / 2,
    };
  }, [aspectRatio, stageSize.h, stageSize.w]);

  const fitScale = Math.max(frame.w / naturalW, frame.h / naturalH);
  const displayW = naturalW * fitScale * zoom;
  const displayH = naturalH * fitScale * zoom;
  const maxPanX = Math.max(0, (displayW - frame.w) / 2);
  const maxPanY = Math.max(0, (displayH - frame.h) / 2);

  const clampedPan = {
    x: Math.max(-maxPanX, Math.min(maxPanX, pan.x)),
    y: Math.max(-maxPanY, Math.min(maxPanY, pan.y)),
  };

  useEffect(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [aspectId]);

  const cropRect = useMemo(() => {
    const imgX = stageSize.w / 2 + clampedPan.x - displayW / 2;
    const imgY = stageSize.h / 2 + clampedPan.y - displayH / 2;
    const scale = fitScale * zoom;
    return {
      x: (frame.x - imgX) / scale,
      y: (frame.y - imgY) / scale,
      width: frame.w / scale,
      height: frame.h / scale,
    };
  }, [clampedPan.x, clampedPan.y, displayH, displayW, fitScale, frame.h, frame.w, frame.x, frame.y, stageSize.h, stageSize.w, zoom]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, panX: clampedPan.x, panY: clampedPan.y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.panX + (e.clientX - dragRef.current.x),
      y: dragRef.current.panY + (e.clientY - dragRef.current.y),
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleApply = () => {
    if (!img) return;
    setIsSaving(true);
    try {
      sounds.playPowerUp();
      const dataUrl = cropAndCompressImage(img, cropRect);
      onApply(dataUrl);
    } catch {
      setError('Could not crop this image. Please try another file.');
      setIsSaving(false);
    }
  };

  const previewStyle: React.CSSProperties | undefined = img
    ? {
        width: `${(naturalW / cropRect.width) * 100}%`,
        height: `${(naturalH / cropRect.height) * 100}%`,
        left: `${(-cropRect.x / cropRect.width) * 100}%`,
        top: `${(-cropRect.y / cropRect.height) * 100}%`,
      }
    : undefined;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85">
      <div className="w-full max-w-5xl max-h-[94vh] bg-slate-900 rounded-3xl border-2 border-white/20 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-4 sm:px-5 py-3 border-b border-white/15 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-mario text-lg sm:text-xl text-yellow-300 flex items-center gap-2">
              <Crop className="w-5 h-5 text-amber-300" />
              Crop & Adjust Image
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Drag to pan, zoom to fill the card. Portrait matches multiple-choice; landscape matches unscramble and trivia.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer"
            aria-label="Cancel crop"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(240px,0.85fr)] gap-4">
          <div className="space-y-3">
            <div
              ref={stageRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative w-full h-[42vh] min-h-[280px] rounded-2xl overflow-hidden bg-black border border-white/15 cursor-grab active:cursor-grabbing touch-none"
            >
              {img && (
                <img
                  src={sourceUrl}
                  alt="Crop source"
                  draggable={false}
                  className="absolute max-w-none pointer-events-none select-none"
                  style={{
                    width: displayW,
                    height: displayH,
                    left: stageSize.w / 2 + clampedPan.x - displayW / 2,
                    top: stageSize.h / 2 + clampedPan.y - displayH / 2,
                  }}
                />
              )}
              <div
                className="absolute rounded-xl border-2 border-yellow-300 pointer-events-none"
                style={{
                  left: frame.x,
                  top: frame.y,
                  width: frame.w,
                  height: frame.h,
                  boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.62)',
                }}
              />
              {!img && !error && (
                <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-300">Loading image…</p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ASPECTS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setAspectId(option.id);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer ${
                    aspectId === option.id
                      ? 'bg-amber-500 text-slate-950 border-yellow-200'
                      : 'bg-slate-800 text-slate-300 border-white/15 hover:bg-slate-700'
                  }`}
                  title={option.hint}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-3 text-xs text-slate-200 font-semibold">
              <ZoomIn className="w-4 h-4 text-amber-300 shrink-0" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.02}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="flex-1 accent-amber-400"
              />
              <span className="w-10 text-right text-amber-200">{zoom.toFixed(1)}x</span>
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-indigo-200">How it will look on the card</p>
            <div className="rounded-2xl border border-white/15 bg-slate-950/80 p-3 space-y-3">
              {questionType === 'multiple_choice' ? (
                <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-2 items-stretch">
                  <div className="relative overflow-hidden rounded-xl border border-white/20 bg-black aspect-[3/4]">
                    {img && previewStyle && (
                      <img src={sourceUrl} alt="" className="absolute max-w-none" style={previewStyle} />
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {['A', 'B', 'C', 'D'].map(letter => (
                      <div key={letter} className="rounded-lg bg-slate-800 border border-white/10 px-2 py-2 text-[10px] text-slate-400 font-bold">
                        {letter} Choice
                      </div>
                    ))}
                  </div>
                </div>
              ) : questionType === 'unscramble' ? (
                <div className="space-y-2">
                  <div className="relative overflow-hidden rounded-xl border border-white/20 bg-black aspect-[4/3]">
                    {img && previewStyle && (
                      <img src={sourceUrl} alt="" className="absolute max-w-none" style={previewStyle} />
                    )}
                  </div>
                  <div className="flex justify-center gap-1">
                    {['A', 'B', 'C', 'D'].map(letter => (
                      <span key={letter} className="w-7 h-7 rounded-md bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                        {letter}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 items-center">
                  <div className="relative overflow-hidden rounded-xl border border-white/20 bg-black aspect-[4/3]">
                    {img && previewStyle && (
                      <img src={sourceUrl} alt="" className="absolute max-w-none" style={previewStyle} />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 rounded bg-yellow-300/80 w-4/5" />
                    <div className="h-8 rounded-lg bg-indigo-600/80" />
                  </div>
                </div>
              )}
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Cropping to the card shape keeps the clue large. You can still switch aspect if the photo needs a different frame.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p className="mx-4 mb-2 text-xs text-red-300 bg-red-950/70 border border-red-500/30 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="px-4 sm:px-5 py-3 border-t border-white/15 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setPan({ x: 0, y: 0 });
              setZoom(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-white/15 cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-white/15 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!img || isSaving}
              onClick={handleApply}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold border border-emerald-300/50 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Saving…' : 'Apply Crop'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
