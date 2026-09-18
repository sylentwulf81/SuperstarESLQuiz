import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings2, X, Check, RefreshCw, Star, Cloud, UploadCloud, DownloadCloud, LogIn, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { BlockState, GameQuestion, QuestionType, MultipleChoiceQuestion, OpenTriviaQuestion, UnscrambleQuestion, GameTheme } from '../types';
import { sounds } from '../utils/sound';
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { ImageUploader } from './ImageUploader';
import { MarioCoin } from './MarioCoin';
import { shuffleWordLetters } from '../utils/shuffle';

interface CustomizerModalProps {
  theme: GameTheme;
  blocks: BlockState[];
  onUpdateBlockQuestion: (blockId: number, question: GameQuestion) => void;
  onResetAllQuestions: () => void;
  onSaveCloud?: () => Promise<void>;
  onLoadCloud?: () => Promise<void>;
  onClose: () => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  theme,
  blocks,
  onUpdateBlockQuestion,
  onResetAllQuestions,
  onSaveCloud,
  onLoadCloud,
  onClose,
}) => {
  const { user, isLoggedIn, syncStatus, lastSyncedAt, loginWithGoogle } = useAuth();
  const [selectedBlockId, setSelectedBlockId] = useState<number>(1);
  const currentBlock = blocks.find(b => b.id === selectedBlockId) || blocks[0];

  const [editingQuestion, setEditingQuestion] = useState<GameQuestion>(currentBlock.question);
  const [isCloudBusy, setIsCloudBusy] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isCustomPoints, setIsCustomPoints] = useState<boolean>(() => {
    const coins = currentBlock?.question?.rewardCoins;
    return coins !== undefined && ![1, 3, 5, 10].includes(coins);
  });

  useEffect(() => {
    const blk = blocks.find(b => b.id === selectedBlockId);
    if (blk) {
      const q = { ...blk.question };
      if (q.type !== 'mystery_card') {
        q.rewardCoins = Math.max(1, Number(q.rewardCoins) || 1);
      }
      setEditingQuestion(q);
      setIsCustomPoints(![1, 3, 5, 10].includes(q.rewardCoins));
    }
  }, [selectedBlockId, blocks]);

  const handleSelectBlock = (id: number) => {
    sounds.playClick();
    setSelectedBlockId(id);
  };

  const handleSaveCurrent = () => {
    sounds.playCorrect();
    const finalCoins = editingQuestion.type === 'mystery_card'
      ? 0
      : Math.max(1, Number(editingQuestion.rewardCoins) || 1);
    const sanitizedQuestion: GameQuestion = {
      ...editingQuestion,
      rewardCoins: finalCoins,
    };
    onUpdateBlockQuestion(currentBlock.id, sanitizedQuestion);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2200);
  };

  const handleSaveToCloud = async () => {
    if (!onSaveCloud) return;
    setIsCloudBusy(true);
    sounds.playSaveCloud();
    try {
      await onSaveCloud();
      toast.success('Question Deck Synced to Cloud', {
        description: 'All 60 questions backed up to Firestore.',
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

  const handleTypeChange = (type: QuestionType) => {
    if (type === editingQuestion.type) return;

    let newQ: any = { ...editingQuestion, type };
    if (type === 'multiple_choice') {
      newQ.options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
      newQ.correctIndex = 0;
    } else if (type === 'open_trivia') {
      newQ.answer = 'Answer here';
    } else if (type === 'unscramble') {
      newQ.targetWord = 'WORD';
      newQ.scrambledLetters = ['W', 'O', 'R', 'D'];
    } else if (type === 'mystery_card') {
      newQ.description = 'You uncovered a Special Mystery Card! Pick a lucky mystery card for bonus coins, power-ups, or chaotic Mario surprises!';
    }
    setEditingQuestion(newQ as GameQuestion);
  };

  const renderTypeSpecificFields = () => {
    if (editingQuestion.type === 'mystery_card') {
      return (
        <div className="bg-amber-900/40 p-4 rounded-xl border border-amber-500/50">
          <p className="text-amber-300 text-sm font-bold flex items-center gap-2">
            <Star className="w-5 h-5" /> This block is a Special Mystery Card!
          </p>
          <p className="text-amber-200/80 text-xs mt-1">When players select this block, it will trigger the roulette wheel instead of a question.</p>
        </div>
      );
    }

    if (editingQuestion.type === 'multiple_choice') {
      const q = editingQuestion as MultipleChoiceQuestion;
      return (
        <div className="space-y-3">
          <label className="text-xs font-bold text-indigo-200 block">Options & Correct Answer:</label>
          {q.options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                checked={q.correctIndex === idx}
                onChange={() => setEditingQuestion({ ...q, correctIndex: idx })}
                className="w-4 h-4 text-indigo-500 focus:ring-indigo-500 bg-black/40 border-white/20"
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOptions = [...q.options];
                  newOptions[idx] = e.target.value;
                  setEditingQuestion({ ...q, options: newOptions });
                }}
                className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
              />
            </div>
          ))}
        </div>
      );
    }

    if (editingQuestion.type === 'open_trivia') {
      const q = editingQuestion as OpenTriviaQuestion;
      return (
        <div>
          <label className="text-xs font-bold text-indigo-200 block mb-1">Correct Answer:</label>
          <input
            type="text"
            value={q.answer}
            onChange={(e) => setEditingQuestion({ ...q, answer: e.target.value })}
            className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
          />
        </div>
      );
    }

    if (editingQuestion.type === 'unscramble') {
      const q = editingQuestion as UnscrambleQuestion;
      return (
        <div>
          <label className="text-xs font-bold text-indigo-200 block mb-1">Target Word to Unscramble:</label>
          <input
            type="text"
            value={q.targetWord}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setEditingQuestion({
                ...q,
                targetWord: val,
                scrambledLetters: shuffleWordLetters(val)
              });
            }}
            placeholder="e.g. NINTENDO"
            className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
          />
          <p className="text-[10px] text-white/50 mt-1">Letters are automatically scrambled when saved.</p>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 overflow-hidden">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-5xl h-[92vh] md:h-[86vh] min-h-[580px] max-h-[860px] bg-slate-900 rounded-3xl border border-white/20 shadow-2xl overflow-hidden my-auto flex flex-col"
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-90 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />

        {/* Header */}
        <div className="bg-slate-800/90 p-4 text-white flex items-center justify-between border-b border-white/15 shrink-0">
          <div className="flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-yellow-300" />
            <h2 className="font-mario text-2xl text-yellow-300 drop-shadow">
              Question Deck Editor
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              {theme === 'summer' ? 'Summer Edition' : 'Christmas Edition'}
            </span>
          </div>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Persistence Banner */}
        <div className="bg-slate-950/80 px-4 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            {isLoggedIn && user ? (
              <>
                <Avatar className="w-6 h-6 border border-amber-400/80">
                  {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || ''} referrerPolicy="no-referrer" />}
                  <AvatarFallback className="text-[10px] bg-indigo-800 text-amber-200">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white">{user.displayName || user.email}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-semibold">
                    <Cloud className="w-3 h-3 text-emerald-400" /> Cloud Sync Active
                  </span>
                  {lastSyncedAt && <span className="text-white/50 text-[10px]">(Last saved {lastSyncedAt})</span>}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-indigo-200">
                <span className="text-amber-300 font-semibold">Local Storage Mode</span>
                <span className="text-slate-400 text-[11px]">— Edits persist on this browser. Optional: sign in to sync with Firestore.</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <button
                  onClick={handleSaveToCloud}
                  disabled={isCloudBusy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl border border-yellow-200 shadow-sm transition-all cursor-pointer text-xs"
                >
                  <UploadCloud className={`w-3.5 h-3.5 ${isCloudBusy ? 'animate-bounce' : ''}`} />
                  <span>Sync to Cloud</span>
                </button>
                <button
                  onClick={handleLoadFromCloud}
                  disabled={isCloudBusy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-white/15 transition-all cursor-pointer text-xs"
                >
                  <DownloadCloud className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Restore from Cloud</span>
                </button>
              </>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl shadow-sm transition-all cursor-pointer text-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sign in for Cloud Backup</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-5 overflow-hidden flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 min-h-0">
          {/* Left Block selector grid */}
          <div className="md:col-span-4 bg-slate-950/70 p-3 sm:p-3.5 rounded-2xl border border-white/15 flex flex-col h-full min-h-0 overflow-hidden shadow-inner">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block mb-2 px-1 shrink-0">
              Select Block (1-{blocks.length})
            </span>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="grid grid-cols-6 gap-1.5">
                {blocks.map((b) => {
                  const hasImage = Boolean(b.question.imageUrl || b.question.image);
                  return (
                    <button
                      key={b.id}
                      onClick={() => handleSelectBlock(b.id)}
                      className={`p-2 rounded-xl font-mario text-sm border transition-all cursor-pointer relative ${
                        selectedBlockId === b.id
                          ? 'bg-amber-500 text-slate-950 border-yellow-200 font-bold scale-105 glass-glow-gold'
                          : b.question.type === 'mystery_card' 
                            ? 'bg-amber-900/60 text-amber-300 border-amber-500/50 hover:bg-amber-800/60'
                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-white/10'
                      }`}
                    >
                      {b.id}
                      {b.question.type === 'mystery_card' && (
                        <span className="absolute -top-1 -right-1 text-[8px]">⭐</span>
                      )}
                      {hasImage && (
                        <span className="absolute -bottom-1 -right-1 text-[9px] drop-shadow">🖼️</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-white/50 mt-2 px-1 leading-tight shrink-0 border-t border-white/10 pt-2">
              ⭐ Mystery Card block &bull; 🖼️ Clue image attached
            </p>
          </div>

          {/* Right Editor Pane */}
          <div className="md:col-span-8 bg-slate-950/60 rounded-2xl border border-white/15 flex flex-col h-full min-h-0 overflow-hidden shadow-xl">
            {/* Pinned Header & Type Switcher */}
            <div className="p-3.5 sm:p-4 border-b border-white/15 bg-slate-900/70 flex flex-col gap-2.5 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-mario text-xl text-yellow-300">
                  Editing Block #{currentBlock.id}
                </h3>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-400/30 font-bold uppercase tracking-wider">
                  {editingQuestion.type.replace('_', ' ')}
                </span>
              </div>

              {/* Type Switcher */}
              <div className="flex flex-wrap gap-2">
                {(['multiple_choice', 'unscramble', 'open_trivia', 'mystery_card'] as QuestionType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTypeChange(t)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      editingQuestion.type === t
                        ? 'bg-indigo-600 text-white border-indigo-300 shadow'
                        : 'bg-slate-800/80 text-slate-300 border-white/10 hover:bg-slate-700'
                    }`}
                  >
                    {t === 'multiple_choice' && '🖼️ Multiple Choice'}
                    {t === 'unscramble' && '🔤 Unscramble'}
                    {t === 'open_trivia' && '🎁 Open Trivia'}
                    {t === 'mystery_card' && '⭐ Mystery Card'}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Form Fields with stable scrollbar */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 [scrollbar-gutter:stable]">
              <div>
                <label className="text-xs font-bold text-indigo-200 block mb-1">
                  Question Prompt / Title:
                </label>
                <input
                  type="text"
                  value={editingQuestion.title}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, title: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveCurrent();
                    }
                  }}
                  className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                />
              </div>

              {editingQuestion.type !== 'mystery_card' && (
                <div>
                  <label className="text-xs font-bold text-indigo-200 block mb-1">
                    Description / Clue (Optional):
                  </label>
                  <textarea
                    value={editingQuestion.description || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, description: e.target.value })}
                    rows={2}
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
                      setEditingQuestion(prev => ({
                        ...prev,
                        imageUrl: newImg,
                        image: newImg,
                      }));
                    }}
                    isLoggedIn={isLoggedIn}
                    userEmail={user?.displayName || user?.email}
                    onPromptLogin={loginWithGoogle}
                    titlePrompt={`Block #${currentBlock.id}`}
                  />
                </div>
              )}

              {editingQuestion.type !== 'mystery_card' && (
                <div>
                  <label className="text-xs font-bold text-indigo-200 block mb-1.5">
                    Reward Coins: <span className="text-white/50 text-[11px] font-normal">(Default: at least 1 Coin)</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[1, 3, 5, 10].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setIsCustomPoints(false);
                          setEditingQuestion(prev => ({ ...prev, rewardCoins: amt }));
                        }}
                        className={`px-3.5 py-1.5 rounded-xl font-mario text-sm border transition-all cursor-pointer ${
                          !isCustomPoints && (editingQuestion.rewardCoins || 1) === amt
                            ? 'bg-amber-500 text-slate-950 border-yellow-200 shadow glass-glow-gold'
                            : 'bg-slate-800/80 text-slate-300 border-white/15 hover:bg-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          +{amt}
                          <MarioCoin size="xs" />
                        </span>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setIsCustomPoints(true);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-mario text-sm border transition-all cursor-pointer ${
                        isCustomPoints || ![1, 3, 5, 10].includes(editingQuestion.rewardCoins || 1)
                          ? 'bg-amber-500 text-slate-950 border-yellow-200 shadow glass-glow-gold'
                          : 'bg-slate-800/80 text-slate-300 border-white/15 hover:bg-slate-700'
                      }`}
                    >
                      <span>Custom</span>
                    </button>

                    {(isCustomPoints || ![1, 3, 5, 10].includes(editingQuestion.rewardCoins || 1)) && (
                      <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-xl border border-yellow-400/40 shadow-inner">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playPop();
                            const currentVal = Math.max(1, Number(editingQuestion.rewardCoins) || 1);
                            setEditingQuestion(prev => ({ ...prev, rewardCoins: Math.max(1, currentVal - 1) }));
                          }}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-sm cursor-pointer border border-white/20"
                          title="Minus 1 coin"
                        >
                          -
                        </button>
                        <span className="text-yellow-300 font-mario text-sm font-bold">+</span>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={editingQuestion.rewardCoins || 1}
                          onChange={(e) => {
                            const parsed = parseInt(e.target.value, 10);
                            setEditingQuestion(prev => ({
                              ...prev,
                              rewardCoins: isNaN(parsed) ? 1 : Math.max(1, parsed)
                            }));
                          }}
                          onBlur={() => {
                            if (!editingQuestion.rewardCoins || editingQuestion.rewardCoins < 1) {
                              setEditingQuestion(prev => ({ ...prev, rewardCoins: 1 }));
                            }
                          }}
                          className="w-14 bg-black/80 border border-white/30 rounded-lg px-1.5 py-0.5 text-center font-mario text-sm text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playPop();
                            const currentVal = Math.max(1, Number(editingQuestion.rewardCoins) || 1);
                            setEditingQuestion(prev => ({ ...prev, rewardCoins: currentVal + 1 }));
                          }}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-sm cursor-pointer border border-white/20"
                          title="Plus 1 coin"
                        >
                          +
                        </button>
                        <span className="text-xs text-amber-200 font-bold ml-1 flex items-center gap-1">
                          Coins <MarioCoin size="xs" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pinned Bottom Action Bar */}
            <div className="p-3 sm:px-5 bg-slate-900/95 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => {
                  sounds.playResetDeck();
                  onResetAllQuestions();
                  handleSelectBlock(1);
                  toast.info('Deck Restored to Defaults', {
                    description: `All ${blocks.length} questions reset to standard curriculum.`,
                    duration: 3500,
                  });
                }}
                className="px-3.5 py-2 bg-slate-800/80 hover:bg-red-950/60 text-slate-300 hover:text-red-300 rounded-xl text-xs font-bold border border-white/15 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Restore Defaults
              </button>

              <button
                onClick={handleSaveCurrent}
                className={`px-5 py-2 font-mario text-base rounded-xl shadow-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSavedRecently
                    ? 'bg-gradient-to-r from-emerald-500 to-green-400 text-white border-yellow-200 scale-105 shadow-[0_0_20px_rgba(74,222,128,0.7)]'
                    : 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white border-emerald-300/60'
                }`}
              >
                <Check className="w-4 h-4" /> {isSavedRecently ? 'Saved! 🎉' : 'Save Block Changes'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
