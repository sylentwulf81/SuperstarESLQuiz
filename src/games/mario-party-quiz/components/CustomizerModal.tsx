import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings2,
  X,
  Check,
  RefreshCw,
  RotateCcw,
  Star,
  Cloud,
  UploadCloud,
  DownloadCloud,
  LogIn,
  Target,
  FlaskConical,
  Library,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BlockState,
  GameQuestion,
  QuestionType,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  OpenTriviaQuestion,
  UnscrambleQuestion,
  GameTheme,
} from '@/shared/types';
import { THEME_UI } from '@/shared/themeMeta';
import { sounds } from '@/shared/utils/sound';
import { useAuth } from '@/shared/context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar';
import { ImageUploader } from './ImageUploader';
import { MarioCoin } from '@/shared/components/MarioCoin';
import { shuffleWordLetters } from '@/shared/utils/shuffle';
import { DEFAULT_CLASSIC_LESSON_GOAL } from '@/games/mario-blast-classic/data/classicLesson';
import { legacySlashesToMarks } from '@/shared/markedPrompt';
import { PromptMarkField } from './PromptMarkField';
import { QuestionLibraryPanel } from '@/games/mario-blast-classic/components/QuestionLibraryPanel';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';
import { DEFAULT_QUESTIONS } from '../data/questions';
import { SUMMER_QUESTIONS } from '../data/summerQuestions';
import { CLASSIC_QUESTIONS } from '@/games/mario-blast-classic/data/classicQuestions';

interface CustomizerModalProps {
  theme: GameTheme;
  blocks: BlockState[];
  onUpdateBlockQuestion: (blockId: number, question: GameQuestion) => void;
  onResetAllQuestions: () => void;
  onSaveCloud?: () => Promise<void>;
  onLoadCloud?: () => Promise<void>;
  onClose: () => void;
  showCatchUpNote?: boolean;
  onToggleCatchUpNote?: () => void;
  lessonGoal?: string;
  onLessonGoalChange?: (goal: string) => void;
  onLessonGoalCommit?: (goal: string) => void;
  testGame?: boolean;
  onApplyQuestionBank?: (questions: GameQuestion[], lessonGoal: string, name: string, bankId?: string) => void;
  activeBankId?: string;
  activeBankName?: string;
  onActiveBankChange?: (bankId?: string, bankName?: string) => void;
}

type TabMode = 'deck' | 'library';
type BlockFilter = 'all' | 'filled' | 'empty';

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  theme,
  blocks,
  onUpdateBlockQuestion,
  onResetAllQuestions,
  onSaveCloud,
  onLoadCloud,
  onClose,
  showCatchUpNote = false,
  onToggleCatchUpNote,
  lessonGoal,
  onLessonGoalChange,
  onLessonGoalCommit,
  testGame = false,
  onToggleTestGame,
  onApplyQuestionBank,
  activeBankId,
  activeBankName,
  onActiveBankChange,
}) => {
  useBodyScrollLock();
  const { user, isLoggedIn, syncStatus, lastSyncedAt, loginWithGoogle } = useAuth();

  const [internalBankId, setInternalBankId] = useState<string | undefined>(activeBankId);
  const [internalBankName, setInternalBankName] = useState<string | undefined>(activeBankName);

  const currentActiveBankId = activeBankId ?? internalBankId;
  const currentActiveBankName = activeBankName ?? internalBankName;

  const handleActiveBankChange = useCallback((id?: string, name?: string) => {
    setInternalBankId(id);
    setInternalBankName(name);
    onActiveBankChange?.(id, name);
  }, [onActiveBankChange]);

  // Navigation & View tabs
  const [activeTab, setActiveTab] = useState<TabMode>('deck');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<number>(1);
  const [blockFilter, setBlockFilter] = useState<BlockFilter>('all');

  const currentBlock = useMemo(() => {
    return blocks.find(b => b.id === selectedBlockId) || blocks[0];
  }, [blocks, selectedBlockId]);

  // Working copy of currently active block question
  const [editingQuestion, setEditingQuestion] = useState<GameQuestion>(() => {
    const q = { ...currentBlock.question };
    if (q.type !== 'mystery_card') {
      q.rewardCoins = Math.max(1, Number(q.rewardCoins) || 1);
    }
    return q;
  });

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isCloudBusy, setIsCloudBusy] = useState(false);

  // References for debounced auto-save without losing keystrokes
  const activeBlockIdRef = useRef<number>(selectedBlockId);
  const editingQuestionRef = useRef<GameQuestion>(editingQuestion);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDirtyRef = useRef<boolean>(false);
  const undoHistoryRef = useRef<{ blockId: number; question: GameQuestion } | null>(null);

  // Synchronize ref on state changes
  useEffect(() => {
    activeBlockIdRef.current = selectedBlockId;
  }, [selectedBlockId]);

  // Sanitize helper
  const sanitizeQuestion = useCallback((q: GameQuestion): GameQuestion => {
    return {
      ...q,
      title: legacySlashesToMarks(q.title || ''),
    };
  }, []);

  // Flush pending save immediately
  const flushSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (isDirtyRef.current) {
      const sanitized = sanitizeQuestion(editingQuestionRef.current);
      onUpdateBlockQuestion(activeBlockIdRef.current, sanitized);
      isDirtyRef.current = false;
      setSaveStatus('saved');
    }
  }, [onUpdateBlockQuestion, sanitizeQuestion]);

  // Push updates with 350ms debounce
  const updateDraftQuestion = useCallback((updater: (prev: GameQuestion) => GameQuestion) => {
    setEditingQuestion((prev) => {
      const updated = updater(prev);
      editingQuestionRef.current = updated;
      isDirtyRef.current = true;
      setSaveStatus('saving');

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        const sanitized = sanitizeQuestion(updated);
        onUpdateBlockQuestion(activeBlockIdRef.current, sanitized);
        isDirtyRef.current = false;
        setSaveStatus('saved');
      }, 350);

      return updated;
    });
  }, [onUpdateBlockQuestion, sanitizeQuestion]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Switching blocks safely flushes current draft first
  const handleSelectBlock = (newId: number) => {
    if (newId === selectedBlockId) return;
    sounds.playClick();
    flushSave();

    activeBlockIdRef.current = newId;
    setSelectedBlockId(newId);

    const targetBlock = blocks.find(b => b.id === newId);
    if (targetBlock) {
      const q = { ...targetBlock.question };
      setEditingQuestion(q);
      editingQuestionRef.current = q;
      isDirtyRef.current = false;
      setSaveStatus('saved');
    }
  };

  const handlePrevBlock = () => {
    if (selectedBlockId > 1) {
      handleSelectBlock(selectedBlockId - 1);
    }
  };

  const handleNextBlock = () => {
    if (selectedBlockId < blocks.length) {
      handleSelectBlock(selectedBlockId + 1);
    }
  };

  // Safe modal close
  const handleClose = () => {
    flushSave();
    sounds.playClick();
    onClose();
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+Left / Alt+Right for fast block switching
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevBlock();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextBlock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Clear current block action with Undo
  const handleClearCurrent = () => {
    sounds.playPop();
    const prevQ = { ...editingQuestionRef.current };
    undoHistoryRef.current = { blockId: currentBlock.id, question: prevQ };

    let clearedQ: GameQuestion;
    if (prevQ.type === 'multiple_choice') {
      clearedQ = {
        ...prevQ,
        title: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        rewardCoins: 1,
        imageUrl: undefined,
        image: undefined,
      };
    } else if (prevQ.type === 'true_false') {
      clearedQ = {
        ...prevQ,
        title: '',
        isTrue: true,
        explanation: '',
        rewardCoins: 1,
        imageUrl: undefined,
        image: undefined,
      };
    } else if (prevQ.type === 'unscramble') {
      clearedQ = {
        ...prevQ,
        title: '',
        targetWord: '',
        scrambledLetters: [],
        rewardCoins: 1,
        imageUrl: undefined,
        image: undefined,
      };
    } else if (prevQ.type === 'open_trivia') {
      clearedQ = {
        ...prevQ,
        title: '',
        answer: '',
        hint: '',
        rewardCoins: 1,
        imageUrl: undefined,
        image: undefined,
      };
    } else {
      clearedQ = {
        ...prevQ,
        title: '',
        description: '',
        rewardCoins: 0,
      };
    }

    updateDraftQuestion(() => clearedQ);
    flushSave();

    toast(`Block #${currentBlock.id} cleared`, {
      description: 'Prompt and answers were emptied.',
      action: {
        label: 'Undo',
        onClick: () => {
          sounds.playClick();
          updateDraftQuestion(() => prevQ);
          flushSave();
          toast.success(`Block #${currentBlock.id} restored`);
        },
      },
    });
  };

  // Reset block to default curriculum question with Undo
  const handleResetCurrentToDefault = () => {
    sounds.playClick();
    const prevQ = { ...editingQuestionRef.current };
    undoHistoryRef.current = { blockId: currentBlock.id, question: prevQ };

    const defaultDeck =
      theme === 'summer'
        ? SUMMER_QUESTIONS
        : theme === 'classic'
        ? CLASSIC_QUESTIONS
        : DEFAULT_QUESTIONS;
    const defaultQ = defaultDeck[currentBlock.id - 1] || defaultDeck[0];
    if (!defaultQ) return;

    updateDraftQuestion(() => ({ ...defaultQ }));
    flushSave();

    toast.info(`Block #${currentBlock.id} reset to default`, {
      action: {
        label: 'Undo',
        onClick: () => {
          sounds.playClick();
          updateDraftQuestion(() => prevQ);
          flushSave();
        },
      },
    });
  };

  // Question type change
  const handleTypeChange = (type: QuestionType) => {
    if (type === editingQuestion.type) return;

    updateDraftQuestion((prev) => {
      const newQ: any = { ...prev, type };
      if (type === 'multiple_choice') {
        newQ.options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
        newQ.correctIndex = 0;
        newQ.rewardCoins = Math.max(1, Number(newQ.rewardCoins) || 1);
      } else if (type === 'true_false') {
        newQ.isTrue = true;
        newQ.explanation = '';
        newQ.rewardCoins = Math.max(1, Number(newQ.rewardCoins) || 1);
      } else if (type === 'open_trivia') {
        newQ.answer = 'Answer here';
        newQ.rewardCoins = Math.max(1, Number(newQ.rewardCoins) || 1);
      } else if (type === 'unscramble') {
        newQ.targetWord = 'WORD';
        newQ.scrambledLetters = ['W', 'O', 'R', 'D'];
        newQ.rewardCoins = Math.max(1, Number(newQ.rewardCoins) || 1);
      } else if (type === 'mystery_card') {
        newQ.description =
          'You uncovered a Special Mystery Card! Pick a lucky mystery card for bonus coins, power-ups, or chaotic Mario surprises!';
        newQ.rewardCoins = 0;
      }
      return newQ as GameQuestion;
    });
  };

  // Cloud backup handlers
  const handleSaveToCloud = async () => {
    if (!onSaveCloud) return;
    flushSave();
    setIsCloudBusy(true);
    sounds.playSaveCloud();
    try {
      await onSaveCloud();
      toast.success('Question Deck Synced to Cloud', {
        description: `All ${blocks.length} questions backed up to Firestore.`,
        duration: 3500,
      });
    } catch {
      toast.error('Cloud Sync Failed', {
        description: 'Unable to connect to Firestore database.',
      });
    } finally {
      setIsCloudBusy(false);
    }
  };

  const handleLoadFromCloud = async () => {
    if (!onLoadCloud) return;
    setIsCloudBusy(true);
    sounds.playCloudSync();
    try {
      await onLoadCloud();
      toast.info('Restored from Cloud', {
        description: 'Downloaded your cloud question deck from Firestore.',
        duration: 3500,
      });
    } catch {
      toast.error('Restore Failed', {
        description: 'Unable to load cloud questions.',
      });
    } finally {
      setIsCloudBusy(false);
    }
  };

  // Block metrics for navigator
  const isBlockFilled = (b: BlockState) => {
    const q = b.id === currentBlock.id ? editingQuestion : b.question;
    return Boolean(q.title && q.title.trim().length > 0 && q.title !== 'Blank Question');
  };

  const filledBlocksCount = useMemo(() => {
    return blocks.filter(isBlockFilled).length;
  }, [blocks, editingQuestion, currentBlock.id]);

  const filteredBlocks = useMemo(() => {
    if (blockFilter === 'filled') return blocks.filter(isBlockFilled);
    if (blockFilter === 'empty') return blocks.filter(b => !isBlockFilled(b));
    return blocks;
  }, [blocks, blockFilter, editingQuestion, currentBlock.id]);

  const renderTypeSpecificFields = () => {
    if (editingQuestion.type === 'mystery_card') {
      return (
        <div className="bg-amber-900/40 p-4 rounded-2xl border border-amber-500/50 shadow-inner">
          <p className="text-amber-300 text-sm font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
            Special Mystery Card Block
          </p>
          <p className="text-amber-200/80 text-xs mt-1">
            When players choose this block, the reward roulette wheel triggers instead of a question.
          </p>
        </div>
      );
    }

    if (editingQuestion.type === 'multiple_choice') {
      const q = editingQuestion as MultipleChoiceQuestion;
      return (
        <div className="space-y-3 bg-black/20 p-3.5 rounded-2xl border border-white/10">
          <label className="text-xs font-bold text-indigo-200 block">
            Options & Correct Answer:
          </label>
          {q.options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2.5">
              <input
                type="radio"
                name={`mc-answer-${currentBlock.id}`}
                checked={q.correctIndex === idx}
                onChange={() => updateDraftQuestion(prev => ({ ...prev, correctIndex: idx }))}
                className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 bg-black/40 border-white/20 cursor-pointer"
                title="Mark as correct answer"
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const val = e.target.value;
                  updateDraftQuestion((prev: any) => {
                    const newOptions = [...(prev.options || [])];
                    newOptions[idx] = val;
                    return { ...prev, options: newOptions };
                  });
                }}
                placeholder={`Option ${idx + 1}`}
                className={`flex-1 bg-black/40 border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 ${
                  q.correctIndex === idx
                    ? 'border-emerald-500/60 focus:ring-emerald-400/60 bg-emerald-950/20'
                    : 'border-white/20 focus:ring-indigo-400/60'
                }`}
              />
              {q.correctIndex === idx && (
                <span className="text-[11px] font-bold text-emerald-400 shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  Correct
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (editingQuestion.type === 'true_false') {
      const q = editingQuestion as TrueFalseQuestion;
      const isTrue = q.isTrue ?? true;
      return (
        <div className="space-y-3 bg-black/20 p-3.5 rounded-2xl border border-white/10">
          <label className="text-xs font-bold text-indigo-200 block">
            Correct Answer:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateDraftQuestion(prev => ({ ...prev, isTrue: true }))}
              className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-mario text-base sm:text-lg transition-colors cursor-pointer ${
                isTrue
                  ? 'bg-emerald-600 text-white border-emerald-300 ring-4 ring-emerald-400/50 shadow-lg font-black'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-white/15'
              }`}
            >
              <Check className="w-5 h-5 text-emerald-300" />
              <span>TRUE</span>
            </button>
            <button
              type="button"
              onClick={() => updateDraftQuestion(prev => ({ ...prev, isTrue: false }))}
              className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-mario text-base sm:text-lg transition-colors cursor-pointer ${
                !isTrue
                  ? 'bg-rose-600 text-white border-rose-300 ring-4 ring-rose-400/50 shadow-lg font-black'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-white/15'
              }`}
            >
              <X className="w-5 h-5 text-rose-300" />
              <span>FALSE</span>
            </button>
          </div>
          <div>
            <label className="text-xs font-bold text-indigo-200 block mb-1">
              Explanation (optional fact shown after answer):
            </label>
            <input
              type="text"
              value={q.explanation || ''}
              onChange={(e) => {
                const val = e.target.value;
                updateDraftQuestion(prev => ({ ...prev, explanation: val }));
              }}
              placeholder="e.g. Kyoto was the capital of Japan for over a thousand years."
              className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
            />
          </div>
        </div>
      );
    }

    if (editingQuestion.type === 'open_trivia') {
      const q = editingQuestion as OpenTriviaQuestion;
      return (
        <div className="space-y-3 bg-black/20 p-3.5 rounded-2xl border border-white/10">
          <div>
            <label className="text-xs font-bold text-indigo-200 block mb-1">
              Correct Answer:
            </label>
            <input
              type="text"
              value={q.answer || ''}
              onChange={(e) => {
                const val = e.target.value;
                updateDraftQuestion(prev => ({ ...prev, answer: val }));
              }}
              placeholder="e.g. Mount Fuji"
              className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
            />
          </div>
          {theme !== 'classic' && (
            <div>
              <label className="text-xs font-bold text-indigo-200 block mb-1">
                Hint (optional):
              </label>
              <input
                type="text"
                value={q.hint || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  updateDraftQuestion(prev => ({ ...prev, hint: val }));
                }}
                placeholder="e.g. eat → eaten"
                className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
              />
            </div>
          )}
        </div>
      );
    }

    if (editingQuestion.type === 'unscramble') {
      const q = editingQuestion as UnscrambleQuestion;
      return (
        <div className="bg-black/20 p-3.5 rounded-2xl border border-white/10 space-y-2">
          <label className="text-xs font-bold text-indigo-200 block">
            Target Word to Unscramble:
          </label>
          <input
            type="text"
            value={q.targetWord || ''}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              updateDraftQuestion(prev => ({
                ...prev,
                targetWord: val,
                scrambledLetters: shuffleWordLetters(val),
              }));
            }}
            placeholder="e.g. NINTENDO"
            className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
          />
          <p className="text-[11px] text-white/50">
            Letters are scrambled automatically for the students during the game.
          </p>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-sm overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-5xl h-[94vh] md:h-[88vh] min-h-[580px] max-h-[880px] bg-slate-900 rounded-3xl border border-white/20 shadow-2xl overflow-hidden my-auto flex flex-col"
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500 opacity-90 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />

        {/* Unified Top Navigation & Status Bar */}
        <div className="bg-slate-800/95 px-4 py-3 text-white flex flex-wrap items-center justify-between gap-3 border-b border-white/15 shrink-0">
          {/* Left: Studio Title & Mode Tabs */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-yellow-300" />
              <h2 className="font-mario text-xl text-yellow-300 drop-shadow">
                Question Studio
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 hidden sm:inline-block">
                {THEME_UI[theme].edition}
              </span>
              {currentActiveBankName && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 max-w-[140px] truncate hidden md:inline-block" title={currentActiveBankName}>
                  Set: {currentActiveBankName}
                </span>
              )}
            </div>

            {/* Main Tabs */}
            <div className="flex items-center bg-black/40 p-1 rounded-2xl border border-white/15 text-xs">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('deck');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  activeTab === 'deck'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Deck ({blocks.length})</span>
              </button>
              {onApplyQuestionBank && (
                <button
                  id="studio-open-library"
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('library');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                    activeTab === 'library'
                      ? 'bg-orange-500 text-slate-950 shadow-sm font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Library className="w-3.5 h-3.5" />
                  <span>Library</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Auto-Save Status, Settings, Close */}
          <div className="flex items-center gap-2.5">
            {/* Auto-Save Indicator */}
            {saveStatus === 'saving' ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Saving…</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved</span>
              </span>
            )}

            {/* Cloud Status Pill */}
            {isLoggedIn && user ? (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/60 border border-white/10 text-xs">
                <Avatar className="w-4 h-4 border border-amber-400/80">
                  {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || ''} referrerPolicy="no-referrer" />}
                  <AvatarFallback className="text-[8px] bg-indigo-800 text-amber-200">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-slate-300 text-[11px] truncate max-w-[100px]">
                  {user.displayName || user.email}
                </span>
                <Cloud className="w-3 h-3 text-emerald-400" />
              </div>
            ) : (
              <button
                type="button"
                onClick={loginWithGoogle}
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-indigo-200 border border-white/20 text-xs font-semibold cursor-pointer transition-colors"
                title="Sign in with Google to enable cloud backups"
              >
                <LogIn className="w-3 h-3 text-amber-300" />
                <span>Sign in</span>
              </button>
            )}

            {/* Deck Settings Popover Toggle */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setIsSettingsOpen(!isSettingsOpen);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                testGame || isSettingsOpen
                  ? 'bg-amber-500 text-slate-950 border-yellow-200 shadow-sm'
                  : 'bg-slate-800 text-slate-200 border-white/15 hover:bg-slate-700'
              }`}
              title="Game settings & deck options"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Settings</span>
              {testGame && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              )}
            </button>

            {/* Modal Close Button */}
            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 cursor-pointer"
              title="Close editor (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inline Lesson Goal Bar (Slim & Always Accessible) */}
        {activeTab === 'deck' && onLessonGoalChange && (
          <div className="bg-slate-950/80 px-4 py-2 border-b border-white/10 flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300 shrink-0">
              <Target className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline uppercase tracking-wider text-[11px]">Lesson Goal:</span>
            </div>
            <input
              type="text"
              value={lessonGoal ?? ''}
              onChange={(e) => onLessonGoalChange(e.target.value)}
              onBlur={() => onLessonGoalCommit?.(lessonGoal ?? '')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onLessonGoalCommit?.(lessonGoal ?? '');
                }
              }}
              placeholder={theme === 'classic' ? DEFAULT_CLASSIC_LESSON_GOAL : 'e.g. Summer vocabulary & trivia mix'}
              className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-400/50"
            />
          </div>
        )}

        {/* Settings Dialog Overlay */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-14 right-4 z-40 w-full max-w-md bg-slate-900/98 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-mario text-base text-yellow-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-300" />
                  Deck Settings & Rules
                </span>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cloud Sync Buttons */}
              <div className="space-y-1.5 bg-black/30 p-2.5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between text-indigo-200 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                    Cloud Backup
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {lastSyncedAt ? `Saved ${lastSyncedAt}` : 'Firestore'}
                  </span>
                </div>
                {isLoggedIn ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveToCloud}
                      disabled={isCloudBusy}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-colors"
                    >
                      <UploadCloud className={`w-3.5 h-3.5 ${isCloudBusy ? 'animate-bounce' : ''}`} />
                      <span>Sync to Cloud</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadFromCloud}
                      disabled={isCloudBusy}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-white/15 text-xs cursor-pointer transition-colors"
                    >
                      <DownloadCloud className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Restore Cloud</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs cursor-pointer shadow transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Sign in with Google</span>
                  </button>
                )}
              </div>

              {/* Test Mode */}
              {theme === 'classic' && onToggleTestGame && (
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-black/30 border border-white/10">
                  <div>
                    <span className="font-bold text-red-200 block">Test Mode</span>
                    <span className="text-[11px] text-slate-400 leading-tight block">
                      Mystery cards turn red and display names for rehearsing.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onToggleTestGame();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                      testGame
                        ? 'bg-red-600 text-white border-red-400 shadow'
                        : 'bg-slate-800 text-slate-300 border-white/15 hover:bg-slate-700'
                    }`}
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>{testGame ? 'On' : 'Off'}</span>
                  </button>
                </div>
              )}

              {/* Restore All Defaults */}
              <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                <span className="text-[11px] text-slate-400">Need to start over completely?</span>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playResetDeck();
                    onResetAllQuestions();
                    handleSelectBlock(1);
                    setIsSettingsOpen(false);
                    toast.info('Deck Restored to Defaults', {
                      description: `All ${blocks.length} questions reset to standard curriculum.`,
                      duration: 3500,
                    });
                  }}
                  className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 rounded-xl text-xs font-bold border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restore All Defaults</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Body */}
        {activeTab === 'library' && onApplyQuestionBank ? (
          <QuestionLibraryPanel
            questions={blocks.map(block =>
              block.id === currentBlock.id
                ? { ...editingQuestion, title: legacySlashesToMarks(editingQuestion.title) }
                : block.question
            )}
            lessonGoal={lessonGoal ?? ''}
            showStarterExamples={theme === 'classic'}
            activeBankId={currentActiveBankId}
            activeBankName={currentActiveBankName}
            onActiveBankChange={handleActiveBankChange}
            onApply={(bank) => {
              handleActiveBankChange(bank.id, bank.name);
              onApplyQuestionBank(bank.questions, bank.lessonGoal, bank.name, bank.id);
              setActiveTab('deck');
            }}
            onClose={() => setActiveTab('deck')}
          />
        ) : (
          <div className="p-3 sm:p-5 overflow-hidden flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 min-h-0">
            {/* Left Block Navigator Rail */}
            <div className="md:col-span-4 bg-slate-950/70 p-3 sm:p-3.5 rounded-2xl border border-white/15 flex flex-col h-full min-h-0 overflow-hidden shadow-inner">
              {/* Header & Filter Chips */}
              <div className="shrink-0 mb-2.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    Blocks Navigator
                  </span>
                  <span className="text-[11px] text-emerald-300 font-semibold bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {filledBlocksCount} / {blocks.length} Filled
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setBlockFilter('all')}
                    className={`px-2 py-0.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                      blockFilter === 'all'
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-slate-800/80 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    All ({blocks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockFilter('filled')}
                    className={`px-2 py-0.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                      blockFilter === 'filled'
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-slate-800/80 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    Filled ({filledBlocksCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockFilter('empty')}
                    className={`px-2 py-0.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                      blockFilter === 'empty'
                        ? 'bg-slate-700 text-white border-slate-500'
                        : 'bg-slate-800/80 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    Empty ({blocks.length - filledBlocksCount})
                  </button>
                </div>
              </div>

              {/* 60-Blocks Grid */}
              <div className="flex-1 min-h-0 overflow-y-auto p-1.5">
                <div className="grid grid-cols-6 gap-1.5">
                  {filteredBlocks.map((b) => {
                    const isCurrent = selectedBlockId === b.id;
                    const q = isCurrent ? editingQuestion : b.question;
                    const filled = Boolean(q.title && q.title.trim().length > 0 && q.title !== 'Blank Question');
                    const hasImage = Boolean(q.imageUrl || q.image);
                    const isMystery = q.type === 'mystery_card';

                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleSelectBlock(b.id)}
                        className={`p-2 rounded-xl font-mario text-sm border transition-colors cursor-pointer relative flex flex-col items-center justify-center ${
                          isCurrent
                            ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm z-10'
                            : isMystery
                            ? 'bg-amber-950/50 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
                            : filled
                            ? 'bg-slate-800/90 text-slate-100 border-white/20 hover:bg-slate-700'
                            : 'bg-slate-900/60 text-slate-400 border-white/10 hover:bg-slate-800/60'
                        }`}
                      >
                        {b.id}
                        {/* Dot indicator for filled question */}
                        {filled && !isCurrent && (
                          <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                        )}
                        {/* Mystery block star */}
                        {isMystery && (
                          <span className="absolute -top-1 -right-1 text-[8px]">⭐</span>
                        )}
                        {/* Image clue icon */}
                        {hasImage && (
                          <span className="absolute -bottom-1 -right-1 text-[9px] drop-shadow">🖼️</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigator Bottom Bar (Prev / Next Buttons) */}
              <div className="shrink-0 mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handlePrevBlock}
                  disabled={selectedBlockId <= 1}
                  className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-white/10 text-xs font-bold transition-colors cursor-pointer"
                  title="Previous block (Alt+Left)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <span className="text-[11px] font-mario text-amber-300 px-1">
                  #{currentBlock.id}
                </span>
                <button
                  type="button"
                  onClick={handleNextBlock}
                  disabled={selectedBlockId >= blocks.length}
                  className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-white/10 text-xs font-bold transition-colors cursor-pointer"
                  title="Next block (Alt+Right)"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Editor Pane */}
            <div className="md:col-span-8 bg-slate-950/60 rounded-2xl border border-white/15 flex flex-col h-full min-h-0 overflow-hidden shadow-xl">
              {/* Header: Block Info & Question Type Selector */}
              <div className="p-3.5 sm:p-4 border-b border-white/15 bg-slate-900/70 flex flex-col gap-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-mario text-xl text-yellow-300">
                      Block #{currentBlock.id}
                    </h3>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-400/30 font-bold uppercase tracking-wider">
                      {editingQuestion.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="text-[11px]">Autosaving changes</span>
                  </div>
                </div>

                {/* Segmented Type Switcher */}
                <div className="flex flex-wrap gap-2">
                  {(['multiple_choice', 'true_false', 'unscramble', 'open_trivia', 'mystery_card'] as QuestionType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTypeChange(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        editingQuestion.type === t
                          ? 'bg-indigo-600 text-white border-indigo-300 shadow glass-glow-blue'
                          : 'bg-slate-800/80 text-slate-300 border-white/10 hover:bg-slate-700'
                      }`}
                    >
                      {t === 'multiple_choice' && '🖼️ Multiple Choice'}
                      {t === 'true_false' && '⚖️ True or False'}
                      {t === 'unscramble' && '🔤 Unscramble'}
                      {t === 'open_trivia' && '🎁 Open Trivia'}
                      {t === 'mystery_card' && '⭐ Mystery Card'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Form Fields */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 [scrollbar-gutter:stable]">
                {/* Prompt Field */}
                {theme === 'classic' ? (
                  <PromptMarkField
                    value={editingQuestion.title}
                    onChange={(title) => updateDraftQuestion(prev => ({ ...prev, title }))}
                    onEnter={handleNextBlock}
                  />
                ) : (
                  <div>
                    <label className="text-xs font-bold text-indigo-200 block mb-1">
                      Question Prompt / Title:
                    </label>
                    <input
                      type="text"
                      value={editingQuestion.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateDraftQuestion(prev => ({ ...prev, title: val }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNextBlock();
                        }
                      }}
                      placeholder="e.g. Where is the Eiffel Tower located?"
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                    />
                  </div>
                )}

                {/* Description / Clue (Optional for other themes) */}
                {editingQuestion.type !== 'mystery_card' && theme !== 'classic' && (
                  <div>
                    <label className="text-xs font-bold text-indigo-200 block mb-1">
                      Description / Clue (Optional):
                    </label>
                    <textarea
                      value={editingQuestion.description || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateDraftQuestion(prev => ({ ...prev, description: val }));
                      }}
                      rows={2}
                      placeholder="Optional extra hints for players"
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                    />
                  </div>
                )}

                {/* Type Specific Fields */}
                {renderTypeSpecificFields()}

                {/* Image Clue Upload & Link */}
                {editingQuestion.type !== 'mystery_card' && (
                  <div className="pt-2 border-t border-white/10">
                    <ImageUploader
                      currentImageUrl={editingQuestion.imageUrl || editingQuestion.image}
                      onImageChange={(newImg) => {
                        updateDraftQuestion(prev => ({
                          ...prev,
                          imageUrl: newImg,
                          image: newImg,
                        }));
                      }}
                      isLoggedIn={isLoggedIn}
                      userEmail={user?.displayName || user?.email}
                      onPromptLogin={loginWithGoogle}
                      titlePrompt={`Block #${currentBlock.id}`}
                      questionType={editingQuestion.type}
                    />
                  </div>
                )}

              </div>

              {/* Bottom Action Bar */}
              <div className="p-3 sm:px-5 bg-slate-900/95 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 shrink-0">
                {/* Left: Clear Question & Reset Block */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearCurrent}
                    className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-bold border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Empties prompt and answers for this block (with undo)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Question</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetCurrentToDefault}
                    className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Restore standard curriculum question for this block"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                    <span>Reset Block</span>
                  </button>
                </div>

                {/* Right: Quick Block Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevBlock}
                    disabled={selectedBlockId <= 1}
                    className="px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold border border-white/15 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev Block</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextBlock}
                    disabled={selectedBlockId >= blocks.length}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold border border-indigo-400/50 flex items-center gap-1 transition-colors cursor-pointer shadow"
                  >
                    <span>Next Block</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
