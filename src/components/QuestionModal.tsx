import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, CheckCircle, AlertCircle, Sparkles, Eye, RefreshCw, Upload, Image as ImageIcon, Trash2, Plus, Minus } from 'lucide-react';
import { GameQuestion, Team } from '../types';
import { CHARACTERS } from '../data/characters';
import { sounds } from '../utils/sound';
import { MarioCoin } from './MarioCoin';
import { TeamAvatar } from './TeamAvatar';
import { compressImageFile } from '../utils/imageUtils';
import { shuffleWordLetters } from '../utils/shuffle';

interface QuestionModalProps {
  question: GameQuestion;
  currentTeam: Team;
  onClose: () => void;
  onAnswerCorrect: (coins: number) => void;
  onAnswerIncorrect: () => void;
  onTriggerRoulette: () => void;
  onUpdateQuestionImage?: (blockNumber: number, imageUrl: string | undefined) => void;
  onAdjustCoins?: (teamId: string, delta: number) => void;
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
  onAdjustCoins,
}) => {
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledOption[]>(() => getShuffledOptions(question));
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  const [currentImage, setCurrentImage] = useState<string | undefined>(question.imageUrl || question.image);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  const [spelledLetters, setSpelledLetters] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<{ id: string; char: string; isUsed: boolean }[]>([]);

  const charInfo = CHARACTERS[currentTeam.characterId];
  const baseRewardCoins = question.type === 'mystery_card' ? 0 : Math.max(1, Number(question.rewardCoins) || 1);
  const [customCoinReward, setCustomCoinReward] = useState<number | null>(null);
  const effectiveBaseReward = customCoinReward !== null ? customCoinReward : baseRewardCoins;
  const rewardCoins = currentTeam.hasDoubleTurn ? effectiveBaseReward * 2 : effectiveBaseReward;

  useEffect(() => {
    setCurrentImage(question.imageUrl || question.image);
    setImageLoadFailed(false);
    setCustomCoinReward(null);
    if (question.type === 'multiple_choice') {
      setShuffledOptions(getShuffledOptions(question));
      setSelectedOption(null);
      setEliminatedOptions([]);
      setIsAnswerRevealed(false);
      setStatus('idle');
    } else if (question.type === 'unscramble') {
      const randomized = shuffleWordLetters(question.targetWord || question.scrambledLetters.join(''));
      const letters = randomized.map((char, index) => ({
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

  const handleLetterClick = (item: { id: string; char: string; isUsed: boolean }) => {
    if (item.isUsed || status === 'correct') return;
    sounds.playLetterTile(spelledLetters.length);
    setSpelledLetters(prev => [...prev, item.char]);
    setAvailableLetters(prev => prev.map(l => l.id === item.id ? { ...l, isUsed: true } : l));
  };

  const handleRemoveLetter = (indexToRemove: number) => {
    if (status === 'correct') return;
    sounds.playPop();
    const charToRemove = spelledLetters[indexToRemove];
    const newSpelled = spelledLetters.filter((_, i) => i !== indexToRemove);
    setSpelledLetters(newSpelled);

    let restored = false;
    setAvailableLetters(prev => prev.map(l => {
      if (!restored && l.isUsed && l.char === charToRemove) {
        restored = true;
        return { ...l, isUsed: false };
      }
      return l;
    }));
  };

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

  const handleClaimReward = () => {
    sounds.playClaimReward();
    onAnswerCorrect(rewardCoins);
  };

  const renderChoiceButtons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4 flex-1 min-h-0 auto-rows-fr">
      {shuffledOptions.map((opt, idx) => {
        const isSelected = selectedOption === idx;
        const isCorrectOption = opt.isCorrect;
        const isEliminated = eliminatedOptions.includes(idx);

        let btnStyle = 'bg-slate-800/95 hover:bg-slate-700 border-white/25 text-white hover:border-indigo-400/70';
        if (isAnswerRevealed) {
          if (isCorrectOption) {
            btnStyle = 'bg-emerald-600 border-emerald-300 text-white font-black ring-4 ring-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.45)]';
          } else if (isSelected && !isCorrectOption) {
            btnStyle = 'bg-red-700 border-red-500 text-white/90 line-through opacity-60';
          } else {
            btnStyle = 'bg-slate-900/50 border-white/10 text-slate-400 opacity-50';
          }
        } else if (isEliminated) {
          btnStyle = 'bg-red-950/70 border-red-500/50 text-red-300/70 line-through cursor-not-allowed opacity-50';
        }

        return (
          <button
            key={idx}
            disabled={isAnswerRevealed || isEliminated}
            onClick={() => handleSelectOption(idx)}
            className={`min-h-[4.25rem] sm:min-h-0 h-full rounded-2xl border-2 text-left text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold transition-all flex items-center justify-between px-3 sm:px-4 lg:px-5 py-3 shadow-xl cursor-pointer ${btnStyle}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl border-2 flex items-center justify-center text-lg sm:text-xl lg:text-2xl font-black shrink-0 ${
                isEliminated
                  ? 'bg-red-900/70 border-red-500/50 text-red-300'
                  : 'bg-black/50 border-white/20 text-yellow-300'
              }`}>
                {['A', 'B', 'C', 'D'][idx]}
              </span>
              <span className="leading-snug break-words">{opt.text}</span>
            </div>
            {isAnswerRevealed && isCorrectOption && (
              <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-300 shrink-0 ml-2 drop-shadow" />
            )}
            {!isAnswerRevealed && isEliminated && (
              <span className="text-[10px] sm:text-xs font-bold text-red-300 uppercase bg-red-950/90 px-2 py-1 rounded-lg border border-red-500/50 shrink-0 ml-2">
                Incorrect
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const renderImagePanel = (compact = false) => {
    if (!currentImage && !(onUpdateQuestionImage && question.type !== 'mystery_card')) return null;

    if (!currentImage) {
      return (
        <button
          type="button"
          disabled={isProcessingImage}
          onClick={() => fileUploadRef.current?.click()}
          className="self-end text-xs text-indigo-200 hover:text-white flex items-center gap-1.5 bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-400/40 cursor-pointer font-semibold shrink-0"
        >
          <ImageIcon className="w-4 h-4 text-amber-400" />
          {isProcessingImage ? 'Processing...' : 'Add image'}
        </button>
      );
    }

    return (
      <div className={`relative min-h-0 flex items-center justify-center ${compact ? 'h-full max-h-full' : 'max-h-40 sm:max-h-48 lg:max-h-56 w-full'}`}>
        <div className="relative h-full max-h-full rounded-2xl overflow-hidden border-2 border-white/25 bg-black/70 shadow-2xl flex items-center justify-center">
          {!imageLoadFailed ? (
            <img
              src={currentImage}
              alt={question.imageAlt || question.title}
              referrerPolicy="no-referrer"
              onError={() => setImageLoadFailed(true)}
              className="max-h-full max-w-full w-auto h-auto object-contain"
            />
          ) : (
            <div className="p-4 text-center space-y-2 max-w-xs">
              <p className="text-amber-300 text-sm font-bold flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Image failed to load
              </p>
              {onUpdateQuestionImage && (
                <button
                  type="button"
                  onClick={() => fileUploadRef.current?.click()}
                  className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Upload replacement
                </button>
              )}
            </div>
          )}

          {onUpdateQuestionImage && !imageLoadFailed && (
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button
                type="button"
                disabled={isProcessingImage}
                onClick={() => fileUploadRef.current?.click()}
                className="p-1.5 rounded-lg bg-slate-950/80 text-white border border-white/20 cursor-pointer"
                title="Change image"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-1.5 rounded-lg bg-slate-950/80 text-red-300 border border-white/20 cursor-pointer"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const isCorrectClickable = isAnswerRevealed && (status === 'correct' || question.type === 'open_trivia');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 lg:p-4 bg-slate-950/88">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="relative w-full max-w-6xl h-[min(94dvh,980px)] max-h-[94dvh] bg-slate-900 rounded-3xl border-2 border-white/25 shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        <div className="bg-slate-800/95 px-3 sm:px-5 py-2.5 sm:py-3 text-white flex items-center justify-between border-b border-white/15 shrink-0 gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="font-mario text-lg sm:text-2xl md:text-3xl text-yellow-300 text-shadow-mario whitespace-nowrap">
              BLOCK #{question.blockNumber}
            </span>
            <span className="hidden sm:inline bg-slate-700/90 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border border-white/20 text-indigo-200">
              {question.category.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-xl ${charInfo.bgColor} bg-opacity-60 border border-white/30 text-xs sm:text-sm font-bold text-white`}>
              <TeamAvatar characterId={currentTeam.characterId} size="xs" customUrl={currentTeam.customImageUrl} />
              <span className="hidden sm:inline max-w-[140px] truncate">{currentTeam.name}</span>
              <div className={`flex items-center gap-1 ml-1 px-2 py-0.5 rounded-lg border transition-colors ${
                currentTeam.coins < 0
                  ? 'bg-red-950/90 border-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                  : 'bg-black/50 border-white/20'
              }`}>
                <MarioCoin size="xs" />
                <span className={`font-mario text-xs sm:text-sm ${
                  currentTeam.coins < 0 ? 'text-red-500 font-black drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]' : 'text-yellow-300'
                }`}>
                  {currentTeam.coins}
                </span>
                {onAdjustCoins && (
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playPop();
                        onAdjustCoins(currentTeam.id, 1);
                      }}
                      title="Add 1 coin"
                      className="w-4 h-4 rounded bg-white/10 hover:bg-emerald-500/50 text-white flex items-center justify-center border border-white/20 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playPop();
                        onAdjustCoins(currentTeam.id, -1);
                      }}
                      title="Deduct 1 coin"
                      className="w-4 h-4 rounded bg-white/10 hover:bg-red-500/50 text-white flex items-center justify-center border border-white/20 cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col px-3 sm:px-5 lg:px-6 py-3 sm:py-4 gap-3 overflow-hidden">
          {!(question.type === 'open_trivia' && currentImage) && (
            <h2 className="font-mario text-xl sm:text-2xl md:text-3xl lg:text-[2.15rem] text-yellow-300 leading-tight drop-shadow-md shrink-0">
              {question.title}
            </h2>
          )}

          <input
            ref={fileUploadRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {question.type === 'multiple_choice' && (
            <div className={`flex-1 min-h-0 overflow-y-auto lg:overflow-hidden ${currentImage ? 'flex flex-col lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] gap-3 lg:gap-5' : 'flex flex-col'}`}>
              {currentImage && renderImagePanel(true)}
              {renderChoiceButtons()}
            </div>
          )}

          {question.type === 'open_trivia' && (
            currentImage ? (
              <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)] gap-4 lg:gap-6 items-center">
                {/* Left Side: Clue Image taking up full left side */}
                <div className="w-full h-64 sm:h-80 lg:h-full min-h-0 flex items-center justify-center">
                  {renderImagePanel(true)}
                </div>

                {/* Right Side: Question Title & Answer */}
                <div className="w-full flex-1 min-h-0 flex flex-col justify-center gap-4 sm:gap-6 p-1 sm:p-2 lg:p-4">
                  <h2 className="font-mario text-2xl sm:text-3xl lg:text-4xl text-yellow-300 leading-tight drop-shadow-md">
                    {question.title}
                  </h2>

                  <div className="w-full">
                    {!isAnswerRevealed ? (
                      <button
                        onClick={() => {
                          sounds.playCardFlip();
                          sounds.playPowerUp();
                          setIsAnswerRevealed(true);
                          setStatus('correct');
                        }}
                        className="w-full py-5 sm:py-6 lg:py-7 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 text-white font-mario text-xl sm:text-2xl lg:text-3xl rounded-3xl shadow-2xl flex items-center justify-center gap-3 border-2 border-indigo-400/60 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Eye className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-300 drop-shadow" />
                        REVEAL ANSWER
                      </button>
                    ) : (
                      <div className="w-full p-5 sm:p-7 lg:p-8 bg-black/75 rounded-3xl border-2 border-white/25 text-center space-y-2 shadow-2xl">
                        <span className="text-xs sm:text-sm uppercase font-black text-indigo-300 tracking-widest block">
                          ANSWER
                        </span>
                        <h3 className="font-mario text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-emerald-300 leading-tight drop-shadow-[0_0_20px_rgba(110,231,183,0.4)]">
                          {question.answer}
                        </h3>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center max-w-3xl mx-auto w-full gap-6">
                <div className="w-full flex justify-end">
                  {renderImagePanel()}
                </div>
                <div className="w-full">
                  {!isAnswerRevealed ? (
                    <button
                      onClick={() => {
                        sounds.playCardFlip();
                        sounds.playPowerUp();
                        setIsAnswerRevealed(true);
                        setStatus('correct');
                      }}
                      className="w-full py-6 sm:py-8 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-mario text-2xl sm:text-3xl rounded-3xl shadow-2xl flex items-center justify-center gap-3 border-2 border-indigo-400/60 cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      <Eye className="w-7 h-7" />
                      REVEAL ANSWER
                    </button>
                  ) : (
                    <div className="w-full p-6 sm:p-10 bg-black/70 rounded-3xl border-2 border-white/25 text-center space-y-2 shadow-inner">
                      <span className="text-xs sm:text-sm uppercase font-black text-indigo-300 tracking-widest block">
                        ANSWER
                      </span>
                      <h3 className="font-mario text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-emerald-300 leading-tight">
                        {question.answer}
                      </h3>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {question.type === 'unscramble' && (
            <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
              {currentImage && (
                <div className="shrink-0 max-h-28 sm:max-h-36 flex justify-center">
                  {renderImagePanel(false)}
                </div>
              )}

              <div className="flex-1 min-h-0 flex flex-col justify-center gap-3">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-black/75 rounded-3xl border-2 border-white/25 min-h-[72px]">
                  {spelledLetters.length === 0 ? (
                    <span className="text-slate-400 text-sm sm:text-lg font-bold italic">
                      Tap letters to spell the word
                    </span>
                  ) : (
                    spelledLetters.map((char, i) => (
                      <button
                        key={i}
                        onClick={() => handleRemoveLetter(i)}
                        className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-mario text-2xl sm:text-4xl rounded-xl shadow-xl border-2 border-yellow-100 cursor-pointer"
                      >
                        {char}
                      </button>
                    ))
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  {availableLetters.map(item => (
                    <button
                      key={item.id}
                      disabled={item.isUsed || status === 'correct'}
                      onClick={() => handleLetterClick(item)}
                      className={`w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 font-mario text-2xl sm:text-4xl rounded-xl border-2 flex items-center justify-center shadow-xl cursor-pointer ${
                        item.isUsed
                          ? 'bg-slate-900/60 border-white/10 text-white/20'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-300/70'
                      }`}
                    >
                      {item.char}
                    </button>
                  ))}
                </div>

                {isAnswerRevealed && status === 'correct' && (
                  <div className="p-2.5 bg-emerald-950/80 border-2 border-emerald-400/60 rounded-2xl text-center">
                    <span className="font-mario text-lg sm:text-2xl text-emerald-300">
                      {question.targetWord.toUpperCase()}
                    </span>
                  </div>
                )}
                {isAnswerRevealed && status === 'incorrect' && (
                  <div className="p-2.5 bg-red-950/80 border-2 border-red-500/60 rounded-2xl text-center font-mario text-red-300">
                    Not quite — try again or reveal
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 shrink-0">
                  <button
                    onClick={() => {
                      sounds.playCardFlip();
                      setSpelledLetters([]);
                      setAvailableLetters(prev => prev.map(l => ({ ...l, isUsed: false })));
                      setStatus('idle');
                    }}
                    className="px-4 py-2.5 bg-slate-800 text-slate-200 rounded-xl text-sm font-bold border border-white/25 cursor-pointer flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Reset
                  </button>
                  <button
                    onClick={handleCheckSpelling}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mario text-lg sm:text-xl rounded-xl border-2 border-emerald-300/80 cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> CHECK
                  </button>
                  <button
                    onClick={() => {
                      sounds.playCardFlip();
                      setIsAnswerRevealed(true);
                      setStatus('correct');
                      setSpelledLetters(question.targetWord.replace(/\s+/g, '').split(''));
                    }}
                    className="px-4 py-2.5 bg-slate-800 text-amber-300 rounded-xl text-sm font-bold border border-white/25 cursor-pointer"
                  >
                    Reveal
                  </button>
                </div>
              </div>
            </div>
          )}

          {question.type === 'mystery_card' && (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center gap-6">
              <p className="text-slate-200 text-lg sm:text-2xl font-bold max-w-2xl">
                {question.description}
              </p>
              <button
                onClick={onTriggerRoulette}
                className="px-8 py-5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-mario text-2xl sm:text-3xl rounded-3xl shadow-2xl border-2 border-yellow-200 flex items-center gap-3 cursor-pointer"
              >
                <Sparkles className="w-8 h-8" />
                OPEN MYSTERY CARDS
              </button>
            </div>
          )}
        </div>

        {question.type !== 'mystery_card' && (
          <div className="shrink-0 bg-slate-800/95 px-3 sm:px-5 py-3 border-t-2 border-white/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
              <span className="text-slate-300">Reward</span>
              <span className="font-mario text-2xl sm:text-3xl text-yellow-300 text-shadow-gold flex items-center gap-1.5">
                +{rewardCoins}
                <MarioCoin size="md" />
              </span>

              {/* Custom Points live adjustment in modal */}
              <div className="flex items-center gap-1 ml-1 bg-black/40 px-2 py-1 rounded-xl border border-white/15">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setCustomCoinReward(prev => Math.max(1, (prev ?? baseRewardCoins) - 1));
                  }}
                  title="Decrease reward by 1 coin (min 1)"
                  className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setCustomCoinReward(prev => (prev ?? baseRewardCoins) + 1);
                  }}
                  title="Increase reward by 1 coin"
                  className="w-5 h-5 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  +
                </button>
              </div>

              {currentTeam.hasDoubleTurn && (
                <span className="text-[11px] bg-gradient-to-r from-amber-500 to-red-600 text-yellow-100 px-2 py-1 rounded-lg font-bold border border-yellow-300/80">
                  2x Double Turn
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  sounds.playWrong();
                  onAnswerIncorrect();
                }}
                className="px-4 sm:px-5 py-2.5 sm:py-3 bg-red-900/70 hover:bg-red-800 text-red-200 rounded-xl font-bold text-sm border border-red-500/50 cursor-pointer flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Wrong
              </button>
              <button
                disabled={!isCorrectClickable}
                onClick={handleClaimReward}
                className={`px-5 sm:px-7 py-2.5 sm:py-3 font-mario text-sm sm:text-lg rounded-xl border-2 flex items-center gap-2 ${
                  isCorrectClickable
                    ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white border-emerald-300 cursor-pointer animate-pulse'
                    : 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                CORRECT +{rewardCoins}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
