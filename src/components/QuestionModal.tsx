import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Sparkles, HelpCircle, Eye, EyeOff, RefreshCw, Volume2, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { GameQuestion, Team } from '../types';
import { CHARACTERS } from '../data/characters';
import { sounds } from '../utils/sound';
import { MarioCoin } from './MarioCoin';
import { TeamAvatar } from './TeamAvatar';
import { compressImageFile } from '../utils/imageUtils';

interface QuestionModalProps {
  question: GameQuestion;
  currentTeam: Team;
  onClose: () => void;
  onAnswerCorrect: (coins: number) => void;
  onAnswerIncorrect: () => void;
  onTriggerRoulette: () => void;
  onUpdateQuestionImage?: (blockNumber: number, imageUrl: string | undefined) => void;
}

interface ShuffledOption {
  text: string;
  isCorrect: boolean;
}

const getShuffledOptions = (q: GameQuestion): ShuffledOption[] => {
  if (q.type !== 'multiple_choice') return [];
  const opts: ShuffledOption[] = q.options.map((text, idx) => ({
    text,
    isCorrect: idx === q.correctIndex,
  }));
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
};

export const QuestionModal: React.FC<QuestionModalProps> = ({
  question,
  currentTeam,
  onClose,
  onAnswerCorrect,
  onAnswerIncorrect,
  onTriggerRoulette,
  onUpdateQuestionImage,
}) => {
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledOption[]>(() => getShuffledOptions(question));
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  // Image Clue Upload & Display state
  const [currentImage, setCurrentImage] = useState<string | undefined>(question.imageUrl || question.image);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  // Spelling / Unscramble state
  const [spelledLetters, setSpelledLetters] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<{ id: string; char: string; isUsed: boolean }[]>([]);

  const charInfo = CHARACTERS[currentTeam.characterId];

  useEffect(() => {
    setCurrentImage(question.imageUrl || question.image);
    setImageLoadFailed(false);
    setIsHintVisible(false);
    if (question.type === 'multiple_choice') {
      setShuffledOptions(getShuffledOptions(question));
      setSelectedOption(null);
      setEliminatedOptions([]);
      setIsAnswerRevealed(false);
      setStatus('idle');
    } else if (question.type === 'unscramble') {
      const letters = question.scrambledLetters.map((char, index) => ({
        id: `${char}-${index}`,
        char,
        isUsed: false,
      }));
      setAvailableLetters(letters);
      setSpelledLetters([]);
      setIsAnswerRevealed(false);
      setStatus('idle');
    } else {
      setSelectedOption(null);
      setEliminatedOptions([]);
      setIsAnswerRevealed(false);
      setStatus('idle');
    }
  }, [question]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      sounds.playPowerUp();
      const compressedDataUrl = await compressImageFile(file, 960, 720, 0.82);
      setCurrentImage(compressedDataUrl);
      setImageLoadFailed(false);
      if (onUpdateQuestionImage) {
        onUpdateQuestionImage(question.blockNumber, compressedDataUrl);
      }
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      setIsProcessingImage(false);
      if (fileUploadRef.current) {
        fileUploadRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    sounds.playClick();
    setCurrentImage(undefined);
    setImageLoadFailed(false);
    if (onUpdateQuestionImage) {
      onUpdateQuestionImage(question.blockNumber, undefined);
    }
  };

  // Handle Multiple Choice Click (Does NOT reveal correct answer if wrong; eliminates choice for steals)
  const handleSelectOption = (idx: number) => {
    if (status === 'correct' || eliminatedOptions.includes(idx) || isAnswerRevealed || question.type !== 'multiple_choice') return;
    setSelectedOption(idx);

    const isCorrect = shuffledOptions[idx]?.isCorrect;
    if (isCorrect) {
      setIsAnswerRevealed(true);
      setStatus('correct');
      sounds.playCorrect();
    } else {
      setEliminatedOptions(prev => [...prev, idx]);
      setStatus('incorrect');
      sounds.playWrong();
    }
  };

  // Letter Click for Unscramble
  const handleLetterClick = (item: { id: string; char: string; isUsed: boolean }) => {
    if (item.isUsed || status === 'correct') return;
    sounds.playLetterTile(spelledLetters.length);
    setSpelledLetters(prev => [...prev, item.char]);
    setAvailableLetters(prev => prev.map(l => l.id === item.id ? { ...l, isUsed: true } : l));
  };

  // Remove letter from spelled
  const handleRemoveLetter = (indexToRemove: number) => {
    if (status === 'correct') return;
    sounds.playPop();
    const charToRemove = spelledLetters[indexToRemove];
    const newSpelled = spelledLetters.filter((_, i) => i !== indexToRemove);
    setSpelledLetters(newSpelled);

    // Find first matching used letter in availableLetters and restore it
    let restored = false;
    setAvailableLetters(prev => prev.map(l => {
      if (!restored && l.isUsed && l.char === charToRemove) {
        restored = true;
        return { ...l, isUsed: false };
      }
      return l;
    }));
  };

  // Check Spelling
  const handleCheckSpelling = () => {
    if (question.type !== 'unscramble') return;
    const currentWord = spelledLetters.join('').replace(/\s+/g, '').toUpperCase();
    const target = question.targetWord.replace(/\s+/g, '').toUpperCase();

    setIsAnswerRevealed(true);
    if (currentWord === target) {
      setStatus('correct');
      sounds.playWordSolved();
    } else {
      setStatus('incorrect');
      sounds.playWrong();
    }
  };

  // Award Coins
  const handleClaimReward = () => {
    sounds.playClaimReward();
    const coins = currentTeam.hasDoubleTurn ? question.rewardCoins * 2 : question.rewardCoins;
    onAnswerCorrect(coins);
  };

  // Colors for slide dashed border (random or alternating green/red like slides)
  const isGreenTheme = question.id % 2 === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-4xl lg:max-w-5xl bg-slate-900 rounded-3xl border-2 border-white/25 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]"
      >
        {/* Luminous top ambient glow */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-95 shadow-[0_0_20px_rgba(99,102,241,0.7)]" />

        {/* Top Header with Mario Coin Bar */}
        <div className="bg-slate-800/95 p-4 sm:p-5 text-white flex items-center justify-between border-b border-white/15 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mario text-2xl sm:text-3xl md:text-4xl text-yellow-300 text-shadow-mario">
              BLOCK #{question.blockNumber}
            </span>
            <span className="bg-slate-700/90 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider border border-white/20 text-indigo-200">
              {question.category.replace('_', ' ')}
            </span>
          </div>

          {/* Current Turn Badge */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl ${charInfo.bgColor} bg-opacity-60 border border-white/30 text-xs sm:text-sm font-bold text-white shadow-md`}>
              <TeamAvatar characterId={currentTeam.characterId} size="xs" customUrl={currentTeam.customImageUrl} />
              <span>{currentTeam.name}'s Turn</span>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-4 sm:p-6 md:p-8 space-y-5 overflow-y-auto flex-1">
          {/* Slide Box */}
          <div className="p-5 sm:p-7 md:p-8 rounded-3xl border-2 border-white/20 bg-slate-950/70 relative shadow-2xl">
            {/* Question Title */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <h2 className="font-mario text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-yellow-300 leading-tight drop-shadow-md">
                {question.title}
              </h2>
            </div>

            {/* Visual Clue Image (if any) or Presenter Image Upload */}
            {currentImage ? (
              <div className="flex flex-col items-center my-4 relative">
                <div className="relative rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl max-h-64 sm:max-h-80 md:max-h-96 bg-black/70 flex items-center justify-center min-w-[260px]">
                  {!imageLoadFailed ? (
                    <img
                      src={currentImage}
                      alt={question.imageAlt || question.title}
                      referrerPolicy="no-referrer"
                      onError={() => setImageLoadFailed(true)}
                      className="max-h-64 sm:max-h-80 md:max-h-96 w-auto object-contain"
                    />
                  ) : (
                    <div className="p-6 text-center space-y-3 bg-slate-900/90 max-w-sm rounded-xl">
                      <p className="text-amber-300 text-sm font-bold flex items-center justify-center gap-1.5">
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                        <span>Web image link failed to load</span>
                      </p>
                      <p className="text-slate-400 text-xs">
                        External links can expire. You can quickly upload an image directly:
                      </p>
                      {onUpdateQuestionImage && (
                        <button
                          type="button"
                          disabled={isProcessingImage}
                          onClick={() => fileUploadRef.current?.click()}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl cursor-pointer flex items-center gap-2 mx-auto shadow"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload Replacement Image</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Presenter Quick Actions toolbar */}
                {onUpdateQuestionImage && !imageLoadFailed && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessingImage}
                      onClick={() => fileUploadRef.current?.click()}
                      className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-750 px-3 py-1.5 rounded-xl border border-white/20 transition-all cursor-pointer shadow-sm font-semibold"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isProcessingImage ? 'Uploading...' : 'Change Image'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs text-red-400/90 hover:text-red-300 flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-red-950/40 border border-transparent hover:border-red-500/30 transition-all cursor-pointer font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            ) : onUpdateQuestionImage && question.type !== 'mystery_card' ? (
              <div className="flex justify-end -mt-2 mb-3">
                <button
                  type="button"
                  disabled={isProcessingImage}
                  onClick={() => fileUploadRef.current?.click()}
                  className="text-xs text-indigo-200 hover:text-white flex items-center gap-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 px-3 py-1.5 rounded-xl border border-indigo-400/40 transition-all cursor-pointer font-semibold shadow-sm"
                >
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>{isProcessingImage ? 'Processing...' : 'Upload Image Clue'}</span>
                </button>
              </div>
            ) : null}

            {/* Hidden Presenter File Input */}
            <input
              ref={fileUploadRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Question Type 1: Multiple Choice */}
            {question.type === 'multiple_choice' && (
              <div className="space-y-4 mt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  {shuffledOptions.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrectOption = opt.isCorrect;
                    const isEliminated = eliminatedOptions.includes(idx);

                    let btnStyle = 'bg-slate-800/90 hover:bg-slate-750/95 border-white/20 text-white hover:border-indigo-400/60 shadow-md';
                    if (isAnswerRevealed) {
                      if (isCorrectOption) {
                        btnStyle = 'bg-emerald-600 border-emerald-300 text-white font-black scale-102 ring-4 ring-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]';
                      } else if (isSelected && !isCorrectOption) {
                        btnStyle = 'bg-red-700 border-red-500 text-white/90 line-through opacity-60';
                      } else {
                        btnStyle = 'bg-slate-900/40 border-white/10 text-slate-400 opacity-50';
                      }
                    } else if (isEliminated) {
                      btnStyle = 'bg-red-950/70 border-red-500/50 text-red-300/70 line-through cursor-not-allowed opacity-50 scale-98';
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswerRevealed || isEliminated}
                        onClick={() => handleSelectOption(idx)}
                        className={`p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border-2 text-left text-lg sm:text-xl md:text-2xl font-bold transition-all flex items-center justify-between shadow-xl cursor-pointer min-h-[76px] sm:min-h-[88px] ${btnStyle}`}
                      >
                        <div className="flex items-center gap-3.5 sm:gap-4">
                          <span className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl border-2 flex items-center justify-center text-base sm:text-xl md:text-2xl font-black shrink-0 ${
                            isEliminated 
                              ? 'bg-red-900/70 border-red-500/50 text-red-300' 
                              : 'bg-black/50 border-white/20 text-yellow-300'
                          }`}>
                            {['A', 'B', 'C', 'D'][idx]}
                          </span>
                          <span className="leading-snug">{opt.text}</span>
                        </div>
                        {isAnswerRevealed && isCorrectOption && (
                          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300 shrink-0 ml-2 drop-shadow" />
                        )}
                        {!isAnswerRevealed && isEliminated && (
                          <span className="text-xs sm:text-sm font-bold text-red-300 uppercase bg-red-950/90 px-2.5 py-1 rounded-lg border border-red-500/50 shrink-0 ml-2">
                            Incorrect
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Question Type 2: Open Trivia */}
            {question.type === 'open_trivia' && (
              <div className="space-y-4 mt-5">
                {question.hint && (
                  <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4 bg-indigo-950/70 border-2 border-indigo-500/40 rounded-2xl sm:rounded-3xl shadow-inner">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setIsHintVisible(prev => !prev);
                      }}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm border-2 border-indigo-400/50 cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
                      title={isHintVisible ? "Hide hint" : "Show hint"}
                    >
                      {isHintVisible ? (
                        <>
                          <EyeOff className="w-4 h-4 text-amber-300 shrink-0" />
                          <span>Hide Hint</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 text-amber-300 shrink-0" />
                          <span>Show Clue / Hint</span>
                        </>
                      )}
                    </button>

                    {isHintVisible ? (
                      <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-sm sm:text-base md:text-lg text-indigo-100 font-medium italic flex items-center gap-2 flex-1"
                      >
                        <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                        <span><strong className="text-amber-300 not-italic">Hint:</strong> {question.hint}</span>
                      </motion.div>
                    ) : (
                      <span className="text-xs sm:text-sm text-indigo-300/80 italic">
                        Hint is hidden so students can guess first! Click the eye button to reveal.
                      </span>
                    )}
                  </div>
                )}

                {!isAnswerRevealed ? (
                  <button
                    onClick={() => {
                      sounds.playCardFlip();
                      sounds.playPowerUp();
                      setIsAnswerRevealed(true);
                      setStatus('correct');
                    }}
                    className="w-full py-5 sm:py-6 md:py-7 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-mario text-xl sm:text-2xl md:text-3xl rounded-3xl shadow-2xl flex items-center justify-center gap-3 border-2 border-indigo-400/60 transition-all cursor-pointer glass-glow-indigo"
                  >
                    <Eye className="w-6 h-6 sm:w-7 sm:h-7" />
                    REVEAL CORRECT ANSWER
                  </button>
                ) : (
                  <div className="p-6 sm:p-8 bg-black/70 rounded-3xl border-2 border-white/25 text-center space-y-3 shadow-inner">
                    <span className="text-sm sm:text-base uppercase font-bold text-indigo-300 tracking-wider">Answer:</span>
                    <h3 className="font-mario text-3xl sm:text-4xl md:text-5xl text-emerald-300 drop-shadow-md">
                      {question.answer}
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-300 font-semibold flex items-center justify-center gap-2 pt-1">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      Answer revealed! Click "CORRECT!" below to award coins or "Wrong" to pass.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Question Type 3: Unscramble Spelling (Classroom Distance Optimized) */}
            {question.type === 'unscramble' && (
              <div className="space-y-6 mt-5">
                {/* Spelled letters target box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1 text-xs sm:text-sm text-indigo-200 font-bold uppercase tracking-wider">
                    <span>Your Spelled Word:</span>
                    {spelledLetters.length > 0 && status !== 'correct' && (
                      <span className="text-amber-300/80 font-normal">Click letter to remove</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 md:gap-4 p-4 sm:p-6 bg-black/75 rounded-3xl border-2 border-white/25 min-h-[90px] sm:min-h-[110px] md:min-h-[120px] shadow-inner">
                    {spelledLetters.length === 0 ? (
                      <span className="text-slate-400 text-base sm:text-xl md:text-2xl font-bold italic tracking-wide">
                        Click letter tiles below to spell the word!
                      </span>
                    ) : (
                      spelledLetters.map((char, i) => (
                        <button
                          key={i}
                          onClick={() => handleRemoveLetter(i)}
                          className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-mario text-2xl sm:text-4xl md:text-5xl font-black rounded-2xl shadow-xl border-2 border-yellow-100 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center drop-shadow"
                          title="Click to remove"
                        >
                          {char}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Available letter tiles to click */}
                <div className="space-y-1.5">
                  <div className="px-1 text-xs sm:text-sm text-indigo-200 font-bold uppercase tracking-wider text-center">
                    Available Letters:
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 md:gap-4">
                    {availableLetters.map(item => (
                      <button
                        key={item.id}
                        disabled={item.isUsed || status === 'correct'}
                        onClick={() => handleLetterClick(item)}
                        className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 font-mario text-2xl sm:text-4xl md:text-5xl font-black rounded-2xl border-2 transition-all flex items-center justify-center shadow-xl cursor-pointer ${
                          item.isUsed
                            ? 'bg-slate-900/60 border-white/10 text-white/20 scale-90 cursor-not-allowed shadow-none'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-300/70 hover:scale-110 active:scale-95 shadow-indigo-950/60 ring-2 ring-indigo-400/40'
                        }`}
                      >
                        {item.char}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Announcement if checked */}
                {isAnswerRevealed && status === 'correct' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 bg-emerald-950/80 border-2 border-emerald-400/60 rounded-2xl text-center shadow-lg"
                  >
                    <span className="font-mario text-xl sm:text-2xl text-emerald-300 flex items-center justify-center gap-2">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                      CORRECT SPELLING: {question.targetWord.toUpperCase()}!
                    </span>
                  </motion.div>
                )}

                {isAnswerRevealed && status === 'incorrect' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 bg-red-950/80 border-2 border-red-500/60 rounded-2xl text-center shadow-lg"
                  >
                    <span className="font-mario text-lg sm:text-xl text-red-300 flex items-center justify-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      NOT QUITE! TRY AGAIN OR REVEAL
                    </span>
                  </motion.div>
                )}

                {/* Action buttons for spelling */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      sounds.playCardFlip();
                      setSpelledLetters([]);
                      setAvailableLetters(prev => prev.map(l => ({ ...l, isUsed: false })));
                      setStatus('idle');
                    }}
                    className="px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-2xl text-sm sm:text-base font-bold border border-white/25 flex items-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <RefreshCw className="w-4 h-4" /> Reset Letters
                  </button>

                  <button
                    onClick={handleCheckSpelling}
                    className="px-6 sm:px-8 py-3 sm:py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mario text-lg sm:text-xl md:text-2xl rounded-2xl shadow-xl border-2 border-emerald-300/80 flex items-center gap-2.5 transition-all cursor-pointer shadow-emerald-950/50"
                  >
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" /> CHECK SPELLING
                  </button>

                  <button
                    onClick={() => {
                      sounds.playCardFlip();
                      setIsAnswerRevealed(true);
                      setStatus('correct');
                      setSpelledLetters(question.targetWord.replace(/\s+/g, '').split(''));
                    }}
                    className="px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-800 hover:bg-slate-750 text-amber-300 rounded-2xl text-sm sm:text-base font-bold border border-white/25 transition-all cursor-pointer shadow-md"
                  >
                    Reveal Answer
                  </button>
                </div>
              </div>
            )}

            {/* Question Type 4: Mystery Card */}
            {question.type === 'mystery_card' && (
              <div className="text-center py-6 sm:py-8 space-y-6">
                <p className="text-slate-200 text-lg sm:text-xl md:text-2xl font-bold">
                  {question.description}
                </p>
                <button
                  onClick={onTriggerRoulette}
                  className="px-8 sm:px-10 py-5 sm:py-6 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-mario text-2xl sm:text-3xl md:text-4xl rounded-3xl shadow-2xl border-2 border-yellow-200 flex items-center gap-3 mx-auto animate-pulse transition-all cursor-pointer glass-glow-gold"
                >
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-950" />
                  OPEN 6-CARD MYSTERY ROULETTE!
                </button>
              </div>
            )}
          </div>

          {/* Scoring & Decision Footer (For Host / Teacher & Players) */}
          {question.type !== 'mystery_card' && (
            <div className="bg-slate-800/95 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-white/20 flex flex-wrap items-center justify-between gap-4 shadow-xl shrink-0">
              <div className="flex items-center gap-2.5 text-base sm:text-lg font-semibold">
                <span className="text-slate-300">Block Reward:</span>
                <span className="font-mario text-2xl sm:text-3xl text-yellow-300 text-shadow-gold flex items-center gap-2">
                  +{currentTeam.hasDoubleTurn ? question.rewardCoins * 2 : question.rewardCoins}
                  <MarioCoin size="md" /> Coins
                </span>
                {currentTeam.hasDoubleTurn && (
                  <span className="text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-red-600 text-yellow-100 px-2.5 py-1 rounded-xl font-bold border border-yellow-300/80 animate-pulse flex items-center gap-1 shadow-md">
                    ⭐ 2x Bonus Active! (+Double Coins)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    sounds.playWrong();
                    onAnswerIncorrect();
                  }}
                  className="px-5 sm:px-6 py-3 sm:py-3.5 bg-red-900/70 hover:bg-red-800/90 text-red-200 hover:text-white rounded-xl font-bold text-sm sm:text-base transition-all border border-red-500/50 cursor-pointer flex items-center gap-2 shadow-md"
                  title="Mark this block as missed with an X and pass turn to next team"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-300" />
                  Wrong (Pass)
                </button>

                {(() => {
                  const isCorrectClickable = isAnswerRevealed && (status === 'correct' || question.type === 'open_trivia');
                  return (
                    <button
                      disabled={!isCorrectClickable}
                      onClick={handleClaimReward}
                      className={`px-6 sm:px-8 py-3 sm:py-3.5 font-mario text-base sm:text-xl rounded-xl shadow-xl border-2 flex items-center gap-2 transition-all ${
                        isCorrectClickable
                          ? 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white border-emerald-300 cursor-pointer shadow-emerald-900/50 animate-pulse'
                          : 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed opacity-50'
                      }`}
                      title={!isCorrectClickable ? 'Revealing or picking the correct answer unlocks this button' : 'Award coins to current team'}
                    >
                      <CheckCircle className={`w-5 h-5 ${isCorrectClickable ? 'text-white' : 'text-slate-500'}`} />
                      CORRECT! CLAIM +{currentTeam.hasDoubleTurn ? question.rewardCoins * 2 : question.rewardCoins} COINS
                    </button>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
