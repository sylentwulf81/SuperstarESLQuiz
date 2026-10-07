import { jsPDF } from 'jspdf';
import {
  Question,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  OpenTriviaQuestion,
  UnscrambleQuestion,
  MysteryCardQuestion,
} from '@/shared/types';
import { legacySlashesToMarks } from '@/shared/markedPrompt';

export type AnswerOrientation = 'upside_down' | 'upright';
export type PageFormat = 'letter' | 'a4';

export interface DeckPdfOptions {
  questions: Question[];
  deckName?: string;
  lessonGoal?: string;
  answerOrientation?: AnswerOrientation;
  pageFormat?: PageFormat;
  includeHints?: boolean;
  includeExplanations?: boolean;
  showFoldLine?: boolean;
  filterMode?: 'all' | 'populated_only';
}

export interface FormattedAnswer {
  answerText: string;
  explanationText?: string;
  hintText?: string;
}

/**
 * Format prompt text for printing, converting *word* into [word]
 */
export function formatPromptForPrint(raw: string): string {
  if (!raw) return '';
  const converted = legacySlashesToMarks(raw);
  return converted.replace(/\*([^*]+)\*/g, '[$1]');
}

/**
 * Extract question answer & explanation
 */
export function getQuestionAnswer(q: Question): FormattedAnswer {
  switch (q.type) {
    case 'multiple_choice': {
      const mc = q as MultipleChoiceQuestion;
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      const correctIdx = typeof mc.correctIndex === 'number' ? mc.correctIndex : 0;
      const letter = letters[correctIdx] ?? `${correctIdx + 1}`;
      const optText = mc.options?.[correctIdx] ?? '';
      return {
        answerText: `${letter}) ${optText}`,
        explanationText: mc.explanation?.trim() || undefined,
      };
    }
    case 'true_false': {
      const tf = q as TrueFalseQuestion;
      return {
        answerText: tf.isTrue ? 'TRUE' : 'FALSE',
        explanationText: tf.explanation?.trim() || undefined,
      };
    }
    case 'open_trivia': {
      const ot = q as OpenTriviaQuestion;
      return {
        answerText: ot.answer?.trim() || '(No answer specified)',
        hintText: ot.hint?.trim() || undefined,
      };
    }
    case 'unscramble': {
      const us = q as UnscrambleQuestion;
      return {
        answerText: us.targetWord?.trim() || '(No answer specified)',
        hintText: us.hint?.trim() || undefined,
      };
    }
    case 'mystery_card': {
      const my = q as MysteryCardQuestion;
      return {
        answerText: 'Mystery Block / Surprise Roulette Event',
        explanationText: my.description?.trim() || undefined,
      };
    }
    default:
      return { answerText: 'N/A' };
  }
}

export function getQuestionTypeDisplay(type: string): { label: string; bg: [number, number, number]; text: [number, number, number]; border: [number, number, number] } {
  switch (type) {
    case 'multiple_choice':
      return { label: 'MULTIPLE CHOICE', bg: [239, 246, 255], text: [29, 78, 216], border: [147, 197, 253] };
    case 'true_false':
      return { label: 'TRUE OR FALSE', bg: [240, 253, 244], text: [21, 128, 61], border: [134, 239, 172] };
    case 'open_trivia':
      return { label: 'OPEN TRIVIA', bg: [250, 245, 255], text: [126, 34, 206], border: [216, 180, 254] };
    case 'unscramble':
      return { label: 'WORD UNSCRAMBLE', bg: [254, 249, 195], text: [161, 98, 7], border: [253, 224, 71] };
    case 'mystery_card':
      return { label: 'MYSTERY CARD', bg: [255, 241, 242], text: [190, 18, 60], border: [253, 164, 175] };
    default:
      return { label: 'QUESTION', bg: [241, 245, 249], text: [71, 85, 105], border: [203, 213, 225] };
  }
}

/**
 * Builds the PDF with 1 page per question containing:
 * - Question Number & Deck Metadata
 * - Question Type badge
 * - Question prompt & options
 * - Answer in a concealed format (Upside down or fold-away flap)
 */
export function generateDeckPdf(options: DeckPdfOptions): { doc: jsPDF; filename: string } {
  const {
    questions,
    deckName = 'Superstar ESL Quiz Deck',
    lessonGoal = '',
    answerOrientation = 'upside_down',
    pageFormat = 'letter',
    includeHints = true,
    includeExplanations = true,
    showFoldLine = true,
    filterMode = 'all',
  } = options;

  const targetQuestions = filterMode === 'populated_only'
    ? questions.filter(q => q.title && q.title.trim().length > 0 && q.title !== 'Blank Question')
    : questions;

  const itemsToExport = targetQuestions.length > 0 ? targetQuestions : questions;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: pageFormat,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;

  itemsToExport.forEach((q, index) => {
    if (index > 0) {
      doc.addPage(pageFormat, 'portrait');
    }

    const questionNumber = q.blockNumber || q.id || index + 1;
    const totalCount = itemsToExport.length;
    const typeMeta = getQuestionTypeDisplay(q.type);
    const answerInfo = getQuestionAnswer(q);

    // ─────────────────────────────────────────────────────────────
    // 1. TOP HEADER BANNER (Deck Title & Lesson Goal)
    // ─────────────────────────────────────────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.35);
    doc.roundedRect(marginX, 12, contentWidth, 14, 2.5, 2.5, 'FD');

    // Deck Name & Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(deckName.toUpperCase(), marginX + 4, 18);

    if (lessonGoal && lessonGoal.trim()) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const goalTruncated = lessonGoal.length > 70 ? lessonGoal.slice(0, 68) + '…' : lessonGoal;
      doc.text(`Lesson Goal: ${goalTruncated}`, marginX + 4, 23);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Superstar ESL Quiz • Classroom Question Deck', marginX + 4, 23);
    }

    // Right Page Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Question ${index + 1} of ${totalCount}`, pageWidth - marginX - 4, 20.5, { align: 'right' });

    // ─────────────────────────────────────────────────────────────
    // 2. QUESTION TITLE & TYPE STRIP
    // ─────────────────────────────────────────────────────────────
    const stripY = 32;

    // Number Badge (e.g., QUESTION #1)
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(marginX, stripY, 34, 9, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(146, 64, 14);
    doc.text(`QUESTION #${questionNumber}`, marginX + 17, stripY + 6, { align: 'center' });

    // Question Type Pill
    const pillWidth = 46;
    doc.setFillColor(...typeMeta.bg);
    doc.setDrawColor(...typeMeta.border);
    doc.roundedRect(marginX + 38, stripY, pillWidth, 9, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...typeMeta.text);
    doc.text(typeMeta.label, marginX + 38 + pillWidth / 2, stripY + 6, { align: 'center' });

    // Category / Coins Tag (Right side)
    const categoryLabel = q.category ? q.category.replace(/_/g, ' ').toUpperCase() : 'GENERAL';
    const coinsLabel = q.rewardCoins ? `★ ${q.rewardCoins} COINS` : '';
    const metaString = coinsLabel ? `${categoryLabel}  •  ${coinsLabel}` : categoryLabel;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(metaString, pageWidth - marginX, stripY + 6, { align: 'right' });

    // ─────────────────────────────────────────────────────────────
    // 3. MAIN QUESTION CARD
    // ─────────────────────────────────────────────────────────────
    const cardY = 46;
    const foldY = pageHeight - 58; // Position of fold line
    const cardHeight = foldY - cardY - 6; // Leave gap before fold line

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.roundedRect(marginX, cardY, contentWidth, cardHeight, 3.5, 3.5, 'FD');

    // Question Prompt Text
    const promptRaw = q.title || '(Blank Question)';
    const cleanPrompt = formatPromptForPrint(promptRaw);

    // Auto-scale font size if prompt is extra long
    const promptFontSize = cleanPrompt.length > 150 ? 14 : cleanPrompt.length > 80 ? 16 : 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(promptFontSize);
    doc.setTextColor(15, 23, 42);

    const promptLines = doc.splitTextToSize(cleanPrompt, contentWidth - 16);
    let currentY = cardY + 14;
    doc.text(promptLines, marginX + 8, currentY);

    const lineHeight = promptFontSize * 0.48;
    currentY += promptLines.length * lineHeight + 6;

    // Type-specific content
    if (q.type === 'multiple_choice') {
      const mc = q as MultipleChoiceQuestion;
      const options = mc.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
      const optLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

      const availableHeight = (cardY + cardHeight) - currentY - 4;
      const optBoxHeight = Math.min(13, Math.max(9, (availableHeight - (options.length * 2.5)) / options.length));

      options.forEach((optText, optIdx) => {
        const optY = currentY + optIdx * (optBoxHeight + 2.5);
        if (optY + optBoxHeight > cardY + cardHeight - 2) return;

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(marginX + 8, optY, contentWidth - 16, optBoxHeight, 2, 2, 'FD');

        // Letter Badge (e.g. A)
        doc.setFillColor(226, 232, 240);
        doc.circle(marginX + 15, optY + optBoxHeight / 2, 3.2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(optLetters[optIdx] ?? `${optIdx + 1}`, marginX + 15, optY + optBoxHeight / 2 + 1, { align: 'center' });

        // Option text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.setTextColor(30, 41, 59);
        const maxOptWidth = contentWidth - 36;
        const optLines = doc.splitTextToSize(optText || `(Empty Option ${optIdx + 1})`, maxOptWidth);
        doc.text(optLines[0] || '', marginX + 22, optY + optBoxHeight / 2 + 1.2);
      });
    } else if (q.type === 'unscramble') {
      const us = q as UnscrambleQuestion;
      const letters = us.scrambledLetters && us.scrambledLetters.length > 0
        ? us.scrambledLetters
        : (us.targetWord ? us.targetWord.toUpperCase().split('') : []);

      currentY += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('SCRAMBLED LETTERS:', marginX + 8, currentY);
      currentY += 6;

      // Draw letter tiles
      const tileSize = 11;
      const tileGap = 3.5;
      const totalTilesWidth = letters.length * tileSize + (letters.length - 1) * tileGap;
      const startX = Math.max(marginX + 8, (pageWidth - totalTilesWidth) / 2);

      letters.forEach((char, charIdx) => {
        const tx = startX + charIdx * (tileSize + tileGap);
        if (tx + tileSize > pageWidth - marginX - 8) return;

        doc.setFillColor(254, 249, 195);
        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(0.4);
        doc.roundedRect(tx, currentY, tileSize, tileSize, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(146, 64, 14);
        doc.text(char.toUpperCase(), tx + tileSize / 2, currentY + tileSize / 2 + 2, { align: 'center' });
      });

      if (includeHints && us.hint) {
        currentY += tileSize + 7;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Hint: ${us.hint}`, marginX + 8, currentY);
      }
    } else if (q.type === 'true_false') {
      currentY += 6;
      const boxW = (contentWidth - 22) / 2;
      const boxH = 15;

      // True box
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(134, 239, 172);
      doc.setLineWidth(0.4);
      doc.roundedRect(marginX + 8, currentY, boxW, boxH, 2.5, 2.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(21, 128, 61);
      doc.text('TRUE', marginX + 8 + boxW / 2, currentY + boxH / 2 + 2, { align: 'center' });

      // False box
      doc.setFillColor(255, 241, 242);
      doc.setDrawColor(253, 164, 175);
      doc.roundedRect(marginX + 14 + boxW, currentY, boxW, boxH, 2.5, 2.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(190, 18, 60);
      doc.text('FALSE', marginX + 14 + boxW + boxW / 2, currentY + boxH / 2 + 2, { align: 'center' });
    } else if (q.type === 'open_trivia') {
      const ot = q as OpenTriviaQuestion;
      if (includeHints && ot.hint) {
        currentY += 4;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Hint: ${ot.hint}`, marginX + 8, currentY);
      }

      // Add clean student writing line
      currentY += 14;
      if (currentY < cardY + cardHeight - 12) {
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.line(marginX + 8, currentY, pageWidth - marginX - 8, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('Student response area', marginX + 8, currentY + 4);
      }
    } else if (q.type === 'mystery_card') {
      const my = q as MysteryCardQuestion;
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const descLines = doc.splitTextToSize(
        my.description || 'Special Mystery Card! Draw a roulette prize or bonus card.',
        contentWidth - 16
      );
      doc.text(descLines, marginX + 8, currentY);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. CONCEALMENT / FOLD GUIDE SEPARATOR
    // ─────────────────────────────────────────────────────────────
    if (showFoldLine) {
      doc.setLineDashPattern([2, 2], 0);
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.35);
      doc.line(marginX, foldY, pageWidth - marginX, foldY);
      doc.setLineDashPattern([], 0); // Reset dash

      // Fold Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        '✂ - - - - - - - - - - - - - FOLD HERE TO CONCEAL ANSWER FROM STUDENTS - - - - - - - - - - - - - ✂',
        pageWidth / 2,
        foldY - 1.2,
        { align: 'center' }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 5. TEACHER ANSWER KEY CONTAINER (Bottom Section)
    // ─────────────────────────────────────────────────────────────
    const ansBoxY = foldY + 3.5;
    const ansBoxHeight = pageHeight - ansBoxY - 10;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.roundedRect(marginX, ansBoxY, contentWidth, ansBoxHeight, 2.5, 2.5, 'FD');

    // Header label inside answer box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('TEACHER ANSWER KEY • QUICK CHECK', marginX + 4, ansBoxY + 5);

    if (answerOrientation === 'upside_down') {
      // Small indicator on top of answer box explaining inverted format
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('(Answer printed upside-down below so students cannot peek)', pageWidth - marginX - 4, ansBoxY + 5, { align: 'right' });

      // Inverted Answer text rotated 180 degrees
      // Note: In 180-deg rotation, text draws upside-down centered at (x, y)
      const centerY = ansBoxY + ansBoxHeight / 2 + 3.5;
      const centerX = pageWidth / 2;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);

      const ansFormatted = `ANSWER: ${answerInfo.answerText}`;
      doc.text(ansFormatted, centerX, centerY, { angle: 180, align: 'center' });

      if (includeExplanations && (answerInfo.explanationText || answerInfo.hintText)) {
        const extraNote = answerInfo.explanationText
          ? `Note: ${answerInfo.explanationText}`
          : `Hint: ${answerInfo.hintText}`;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(extraNote, centerX, centerY + 6, { angle: 180, align: 'center' });
      }
    } else {
      // Upright Answer format (to be concealed by folding the flap)
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('(Fold along line above to hide while presenting)', pageWidth - marginX - 4, ansBoxY + 5, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`ANSWER: ${answerInfo.answerText}`, marginX + 6, ansBoxY + 12.5);

      if (includeExplanations && (answerInfo.explanationText || answerInfo.hintText)) {
        const extraNote = answerInfo.explanationText
          ? `Note: ${answerInfo.explanationText}`
          : `Hint: ${answerInfo.hintText}`;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(extraNote, marginX + 6, ansBoxY + 18.5);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 6. PAGE FOOTER
    // ─────────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Superstar ESL Quiz • Block #${questionNumber}`,
      marginX,
      pageHeight - 4
    );
    doc.text(
      `Page ${index + 1} of ${totalCount}`,
      pageWidth - marginX,
      pageHeight - 4,
      { align: 'right' }
    );
  });

  const sanitizedName = deckName.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 30) || 'question_deck';
  const filename = `${sanitizedName}_questions.pdf`;

  return { doc, filename };
}

/**
 * Direct download trigger for the question deck PDF
 */
export function downloadDeckPdf(options: DeckPdfOptions): string {
  const { doc, filename } = generateDeckPdf(options);
  doc.save(filename);
  return filename;
}

/**
 * Opens PDF in a new window/tab for instant print or preview
 */
export function openDeckPdfPreview(options: DeckPdfOptions): void {
  const { doc } = generateDeckPdf(options);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
