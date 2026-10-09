import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileDown,
  X,
  Printer,
  RotateCw,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Scissors,
  FileText,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { Question } from '@/shared/types';
import { sounds } from '@/shared/utils/sound';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';
import {
  ExportPdfMode,
  AnswerOrientation,
  PageFormat,
  downloadDeckPdf,
  openDeckPdfPreview,
  formatPromptForPrint,
  getQuestionAnswer,
  getQuestionTypeDisplay,
} from '@/shared/utils/pdfExport';

interface ExportPdfModalProps {
  questions: Question[];
  deckName: string;
  lessonGoal?: string;
  onClose: () => void;
}

/**
 * Bolt Performance Optimization:
 * 1) Wrapped ExportPdfModal in React.memo to prevent unnecessary re-renders during parent layout ticks.
 * 2) Memoized cheatSheetItems via useMemo to avoid re-running regex prompt formatting, type display
 *    allocations, and answer parsing for all 60 questions on every UI setting toggle.
 */
export const ExportPdfModal: React.FC<ExportPdfModalProps> = React.memo(function ExportPdfModal({
  questions,
  deckName,
  lessonGoal = '',
  onClose,
}) {
  useBodyScrollLock();

  const [exportMode, setExportMode] = useState<ExportPdfMode>('cheat_sheet');
  const [orientation, setOrientation] = useState<AnswerOrientation>('upside_down');
  const [pageFormat, setPageFormat] = useState<PageFormat>('letter');
  const [includeHints, setIncludeHints] = useState<boolean>(true);
  const [includeExplanations, setIncludeExplanations] = useState<boolean>(true);
  const [includeOptionsList, setIncludeOptionsList] = useState<boolean>(true);
  const [showFoldLine, setShowFoldLine] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<'all' | 'populated_only'>('all');
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [isSimulatingFold, setIsSimulatingFold] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const populatedQuestions = useMemo(() => {
    return questions.filter(
      q => q.title && q.title.trim().length > 0 && q.title !== 'Blank Question'
    );
  }, [questions]);

  const activeQuestions = filterMode === 'populated_only' && populatedQuestions.length > 0
    ? populatedQuestions
    : questions;

  const cheatSheetItems = useMemo(() => {
    return activeQuestions.map((q, idx) => ({
      q,
      ans: getQuestionAnswer(q),
      qMeta: getQuestionTypeDisplay(q.type),
      qNum: q.blockNumber || q.id || idx + 1,
      prompt: formatPromptForPrint(q.title || '(Blank Question)'),
    }));
  }, [activeQuestions]);

  const currentPreviewQ = activeQuestions[previewIndex] || activeQuestions[0];
  const totalCount = activeQuestions.length;

  const answerInfo = useMemo(() => {
    return currentPreviewQ ? getQuestionAnswer(currentPreviewQ) : { answerText: '' };
  }, [currentPreviewQ]);

  const typeMeta = useMemo(() => {
    return currentPreviewQ
      ? getQuestionTypeDisplay(currentPreviewQ.type)
      : { label: 'QUESTION', text: [0, 0, 0], bg: [255, 255, 255], border: [200, 200, 200] };
  }, [currentPreviewQ]);

  const handleDownload = () => {
    try {
      setIsGenerating(true);
      sounds.playCoin();
      const filename = downloadDeckPdf({
        questions: activeQuestions,
        deckName,
        lessonGoal,
        exportMode,
        answerOrientation: orientation,
        pageFormat,
        includeHints,
        includeExplanations,
        includeOptionsList,
        showFoldLine,
        filterMode: 'all',
      });
      toast.success(`Exported ${totalCount} questions as PDF`, {
        description: `Saved to ${filename}`,
      });
      setIsGenerating(false);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF');
      setIsGenerating(false);
    }
  };

  const handlePreview = () => {
    try {
      sounds.playClick();
      openDeckPdfPreview({
        questions: activeQuestions,
        deckName,
        lessonGoal,
        exportMode,
        answerOrientation: orientation,
        pageFormat,
        includeHints,
        includeExplanations,
        includeOptionsList,
        showFoldLine,
        filterMode: 'all',
      });
      toast.info('Opened PDF in new browser tab for print preview');
    } catch (e) {
      console.error(e);
      toast.error('Could not open PDF preview');
    }
  };

  const cleanPrompt = useMemo(() => {
    return currentPreviewQ ? formatPromptForPrint(currentPreviewQ.title) : '';
  }, [currentPreviewQ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center">
                <FileDown className="w-5 h-5 text-rose-300" />
              </div>
            </div>
            <div>
              <h3 className="font-mario text-lg sm:text-xl text-yellow-300 drop-shadow">
                Export Question Deck as PDF
              </h3>
              <p className="text-xs text-slate-400">
                {exportMode === 'cheat_sheet'
                  ? 'Teacher answer key for phone/tablet second-screen reference'
                  : 'Full-page printable cards with answer concealment'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Settings + Right Live Card Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
          {/* Left Column: Settings & Configuration */}
          <div className="lg:col-span-6 space-y-4 text-xs">
            {/* Format Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                Export Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setExportMode('cheat_sheet');
                  }}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    exportMode === 'cheat_sheet'
                      ? 'bg-emerald-500/20 border-emerald-400 text-white ring-2 ring-emerald-400/30 shadow-md'
                      : 'bg-black/30 border-white/10 text-slate-300 hover:bg-black/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" />
                      Teacher Answer Key
                    </span>
                    {exportMode === 'cheat_sheet' && (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Compact cheat sheet for phones/tablets. Check answers secretly while students guess.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setExportMode('cards');
                  }}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    exportMode === 'cards'
                      ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-400/30 shadow-md'
                      : 'bg-black/30 border-white/10 text-slate-300 hover:bg-black/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5" />
                      Printable Flashcards
                    </span>
                    {exportMode === 'cards' && (
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    1 card per page with upside-down or fold flaps for physical paper printing.
                  </p>
                </button>
              </div>
            </div>

            {/* Deck Summary Card */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 block">
                  Active Question Deck
                </span>
                <span className="font-bold text-white text-sm block truncate max-w-[240px]">
                  {deckName || 'Question Deck'}
                </span>
                {lessonGoal && (
                  <span className="text-[11px] text-slate-400 block truncate max-w-[240px]">
                    Goal: {lessonGoal}
                  </span>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mario bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {exportMode === 'cheat_sheet'
                    ? `~${Math.max(1, Math.ceil(totalCount / 12))} Pages`
                    : `${totalCount} Pages`}
                </span>
              </div>
            </div>

            {/* Cheat Sheet Helper Banner */}
            {exportMode === 'cheat_sheet' && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-[11px] flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-emerald-300">Live Classroom Second-Screen</span>
                  Keep this PDF open on your phone or tablet while hosting the game on the projector. Glance at the numbers to instantly verify student guesses without revealing answers on screen!
                </div>
              </div>
            )}

            {/* Answer Concealment Option (Only for Cards) */}
            {exportMode === 'cards' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Answer Concealment (No Student Peeking)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setOrientation('upside_down');
                    }}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      orientation === 'upside_down'
                        ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-400/30 shadow-md'
                        : 'bg-black/30 border-white/10 text-slate-300 hover:bg-black/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-amber-200">Upside Down (180°)</span>
                      {orientation === 'upside_down' && (
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Answer is printed inverted at bottom. Students facing you cannot read it.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setOrientation('upright');
                    }}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      orientation === 'upright'
                        ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-400/30 shadow-md'
                        : 'bg-black/30 border-white/10 text-slate-300 hover:bg-black/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-amber-200">Fold-Away Flap</span>
                      {orientation === 'upright' && (
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Answer is upright below fold line. Fold bottom flap backward to hide.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Questions Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Questions to Include
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setFilterMode('all');
                  }}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all text-center ${
                    filterMode === 'all'
                      ? 'bg-slate-700 border-white/30 text-white font-bold'
                      : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Questions ({questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setFilterMode('populated_only');
                  }}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all text-center ${
                    filterMode === 'populated_only'
                      ? 'bg-slate-700 border-white/30 text-white font-bold'
                      : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Populated Only ({populatedQuestions.length})
                </button>
              </div>
            </div>

            {/* Page Size & Layout Toggles */}
            <div className="space-y-2 pt-1 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Paper Format
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPageFormat('letter')}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                        pageFormat === 'letter'
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-black/30 border-white/10 text-slate-400'
                      }`}
                    >
                      Letter (8.5×11)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageFormat('a4')}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                        pageFormat === 'a4'
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-black/30 border-white/10 text-slate-400'
                      }`}
                    >
                      A4
                    </button>
                  </div>
                </div>

                {exportMode === 'cards' ? (
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-black/20 border border-white/10 cursor-pointer hover:bg-black/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={showFoldLine}
                        onChange={(e) => setShowFoldLine(e.target.checked)}
                        className="w-4 h-4 text-amber-500 rounded bg-black/40 border-white/20 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-slate-400" />
                        Fold guide line
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2 rounded-xl bg-black/20 border border-white/10 cursor-pointer hover:bg-black/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeOptionsList}
                        onChange={(e) => setIncludeOptionsList(e.target.checked)}
                        className="w-4 h-4 text-emerald-500 rounded bg-black/40 border-white/20 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-300 font-medium">
                        List MC choices (A/B/C/D)
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Extra toggles */}
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-black/20 border border-white/10 cursor-pointer hover:bg-black/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeHints}
                    onChange={(e) => setIncludeHints(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded bg-black/40 border-white/20 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-300 font-medium">
                    Include hints
                  </span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-black/20 border border-white/10 cursor-pointer hover:bg-black/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeExplanations}
                    onChange={(e) => setIncludeExplanations(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded bg-black/40 border-white/20 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-300 font-medium">
                    Include explanations
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Live Preview */}
          <div className="lg:col-span-6 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
              <span className="uppercase tracking-wider flex items-center gap-1.5 text-indigo-300">
                <FileText className="w-3.5 h-3.5" />
                {exportMode === 'cheat_sheet'
                  ? `Live Cheat Sheet Preview (${totalCount} Questions)`
                  : `Live Page Preview (${previewIndex + 1} of ${totalCount})`}
              </span>
              {exportMode === 'cards' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={previewIndex <= 0}
                    onClick={() => {
                      sounds.playClick();
                      setPreviewIndex(prev => Math.max(0, prev - 1));
                    }}
                    className="p-1 rounded-lg bg-black/40 hover:bg-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={previewIndex >= totalCount - 1}
                    onClick={() => {
                      sounds.playClick();
                      setPreviewIndex(prev => Math.min(totalCount - 1, prev + 1));
                    }}
                    className="p-1 rounded-lg bg-black/40 hover:bg-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                    title="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Simulated Paper Sheet */}
            {exportMode === 'cheat_sheet' ? (
              <div className="relative flex-1 min-h-[420px] max-h-[460px] bg-white text-slate-900 rounded-2xl shadow-xl p-3 sm:p-4 flex flex-col border-4 border-slate-300 select-none overflow-hidden font-sans">
                {/* Header Banner */}
                <div className="border border-slate-200 bg-slate-50 rounded-xl p-2.5 mb-2.5 flex items-center justify-between shrink-0">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wide block truncate">
                      {deckName.toUpperCase()} • TEACHER ANSWER KEY
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {lessonGoal ? `Goal: ${lessonGoal} • ` : ''}Phone / Tablet Second-Screen Reference
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[9px] border border-amber-300 shrink-0">
                    TEACHER KEY
                  </span>
                </div>

                {/* Scrollable Questions List Preview */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                  {cheatSheetItems.map(({ q, ans, qMeta, qNum, prompt }, idx) => {
                    return (
                      <div
                        key={q.id || idx}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                      >
                        {/* Top row badges */}
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px] border border-slate-300">
                              #{qNum}
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded font-bold text-[8px] border uppercase"
                              style={{
                                backgroundColor: `rgb(${qMeta.bg.join(',')})`,
                                color: `rgb(${qMeta.text.join(',')})`,
                                borderColor: `rgb(${qMeta.border.join(',')})`,
                              }}
                            >
                              {qMeta.label}
                            </span>
                          </div>
                          {q.rewardCoins && (
                            <span className="text-[9px] font-bold text-amber-700">
                              ★ {q.rewardCoins}
                            </span>
                          )}
                        </div>

                        {/* Prompt */}
                        <p className="font-bold text-slate-900 text-xs leading-tight mb-1.5">
                          {prompt}
                        </p>

                        {/* Options if MC and enabled */}
                        {includeOptionsList && q.type === 'multiple_choice' && (q as any).options && (
                          <div className="text-[9px] text-slate-500 mb-1.5 flex flex-wrap gap-x-2">
                            {((q as any).options as string[]).map((opt, i) => (
                              <span key={i}>
                                <strong className="text-slate-700">{['A', 'B', 'C', 'D'][i]})</strong> {opt}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Bold Emerald Answer Badge */}
                        <div className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] flex items-center justify-between">
                          <span>✔ ANSWER: {ans.answerText}</span>
                        </div>

                        {/* Notes / hints if any */}
                        {includeExplanations && ans.explanationText && (
                          <p className="text-[9px] text-slate-500 italic mt-1">
                            Note: {ans.explanationText}
                          </p>
                        )}
                        {includeHints && ans.hintText && (
                          <p className="text-[9px] text-slate-500 italic mt-0.5">
                            Hint: {ans.hintText}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer preview */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 mt-2 shrink-0">
                  <span>Superstar ESL Quiz • Teacher Second-Screen Key</span>
                  <span>~{Math.max(1, Math.ceil(totalCount / 12))} Pages Total</span>
                </div>
              </div>
            ) : (
              <div className="relative flex-1 min-h-[380px] bg-white text-slate-900 rounded-2xl shadow-xl p-4 sm:p-5 flex flex-col justify-between border-4 border-slate-300 select-none overflow-hidden font-sans">
                {/* Paper Top Header */}
                <div className="border-b-2 border-slate-200 pb-2 flex items-center justify-between gap-2 text-[10px]">
                  <div>
                    <span className="font-bold text-slate-900 uppercase tracking-wide block truncate max-w-[200px]">
                      {deckName.toUpperCase()}
                    </span>
                    <span className="text-[9px] text-slate-500 block truncate max-w-[200px]">
                      {lessonGoal ? `Lesson: ${lessonGoal}` : 'Classroom Question Deck'}
                    </span>
                  </div>
                  <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    Page {previewIndex + 1} of {totalCount}
                  </span>
                </div>

                {/* Question Strip */}
                <div className="flex items-center justify-between gap-2 my-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-black text-[10px] border border-amber-300">
                      Q#{currentPreviewQ?.blockNumber || currentPreviewQ?.id || previewIndex + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold text-[9px] border border-indigo-200 uppercase">
                      {typeMeta.label}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    {currentPreviewQ?.category || 'TRIVIA'}
                  </span>
                </div>

                {/* Question Main Prompt */}
                <div className="flex-1 py-2 flex flex-col justify-center">
                  <p className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-4">
                    {cleanPrompt || '(No question text)'}
                  </p>

                  {/* Multiple choice options preview */}
                  {currentPreviewQ?.type === 'multiple_choice' && (
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      {((currentPreviewQ as any).options || ['Option A', 'Option B', 'Option C', 'Option D']).map(
                        (opt: string, i: number) => (
                          <div
                            key={i}
                            className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-700 truncate"
                          >
                            <span className="font-bold text-slate-900 mr-1.5">
                              {['A', 'B', 'C', 'D'][i]})
                            </span>
                            {opt}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* True / False preview */}
                  {currentPreviewQ?.type === 'true_false' && (
                    <div className="mt-3 flex gap-2">
                      <span className="flex-1 text-center py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]">
                        TRUE
                      </span>
                      <span className="flex-1 text-center py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px]">
                        FALSE
                      </span>
                    </div>
                  )}

                  {/* Unscramble preview */}
                  {currentPreviewQ?.type === 'unscramble' && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(((currentPreviewQ as any).scrambledLetters as string[]) || []).map((l, i) => (
                        <span
                          key={i}
                          className="w-6 h-6 rounded bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs flex items-center justify-center"
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fold Line & Scissors */}
                {showFoldLine && (
                  <div className="relative my-2">
                    <div className="border-t-2 border-dashed border-slate-400 w-full" />
                    <span className="absolute left-1/2 -top-2 -translate-x-1/2 bg-white px-2 text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Scissors className="w-2.5 h-2.5" />
                      FOLD HERE TO CONCEAL ANSWER
                    </span>
                  </div>
                )}

                {/* Teacher Answer Key Section */}
                <div
                  className={`relative rounded-xl p-2.5 border transition-all ${
                    isSimulatingFold
                      ? 'opacity-0 scale-95 pointer-events-none'
                      : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 mb-1">
                    <span>TEACHER ANSWER KEY</span>
                    <span className="text-amber-700 font-medium">
                      {orientation === 'upside_down' ? 'Printed Inverted 180°' : 'Concealed by fold'}
                    </span>
                  </div>

                  <div
                    className={`py-1 text-center transition-transform duration-300 ${
                      orientation === 'upside_down'
                        ? 'rotate-180 transform origin-center text-slate-800'
                        : 'text-slate-900'
                    }`}
                  >
                    <p className="font-black text-xs leading-tight">
                      ANSWER: {answerInfo.answerText}
                    </p>
                    {includeExplanations && (answerInfo.explanationText || answerInfo.hintText) && (
                      <p className="text-[9px] text-slate-600 mt-0.5">
                        {answerInfo.explanationText ? `Note: ${answerInfo.explanationText}` : `Hint: ${answerInfo.hintText}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Interactive Fold Simulation Toggle */}
                <button
                  type="button"
                  onClick={() => setIsSimulatingFold(!isSimulatingFold)}
                  className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Simulate paper folding over answer"
                >
                  {isSimulatingFold ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                  <span>{isSimulatingFold ? 'Unfold' : 'Fold paper'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-white/15 cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-200 text-xs font-bold border border-indigo-400/30 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print Preview</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 hover:from-rose-400 hover:to-yellow-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95 disabled:opacity-60"
            >
              <FileDown className="w-4 h-4" />
              <span>{isGenerating ? 'Generating PDF…' : `Download PDF (${totalCount} Qs)`}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
});
