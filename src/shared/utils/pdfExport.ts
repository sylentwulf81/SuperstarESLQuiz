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

export type ExportPdfMode = 'cheat_sheet' | 'cards';
export type AnswerOrientation = 'upside_down' | 'upright';
export type PageFormat = 'letter' | 'a4';

export interface DeckPdfOptions {
  questions: Question[];
  deckName?: string;
  lessonGoal?: string;
  exportMode?: ExportPdfMode;
  answerOrientation?: AnswerOrientation;
  pageFormat?: PageFormat;
  includeHints?: boolean;
  includeExplanations?: boolean;
  includeOptionsList?: boolean;
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
 * Builds a compact Teacher Answer Key / Cheat Sheet designed for fast second-screen
 * reference on phones and tablets during live classroom games (e.g. Classic or Party mode).
 * Features:
 * - Multi-question compact layout (~10-15 questions per page, 30 questions in ~2-3 pages)
 * - Clear bold Question # matching classroom block numbers
 * - High-contrast bold emerald answer badge for instant 0.5s visual verification
 * - Prompt text and full multiple choice option preview
 * - Optional hints and notes/explanations
 * - No upside-down text or scissors fold lines needed
 */
export function generateCheatSheetPdf(options: DeckPdfOptions): { doc: jsPDF; filename: string } {
  const {
    questions,
    deckName = 'Superstar ESL Quiz Deck',
    lessonGoal = '',
    pageFormat = 'letter',
    includeHints = true,
    includeExplanations = true,
    includeOptionsList = true,
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
  const marginX = 12;
  const contentWidth = pageWidth - marginX * 2;
  const headerHeight = 15;
  const topMargin = 10;
  const bottomMargin = 10;
  const maxContentY = pageHeight - bottomMargin;

  const drawHeader = () => {
    // Header Banner
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.roundedRect(marginX, topMargin, contentWidth, headerHeight, 2, 2, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    const titleText = `${deckName.toUpperCase()} • TEACHER ANSWER KEY`;
    const titleTruncated = titleText.length > 55 ? titleText.slice(0, 53) + '…' : titleText;
    doc.text(titleTruncated, marginX + 3.5, topMargin + 5.5);

    // Subtitle / Goal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    if (lessonGoal && lessonGoal.trim()) {
      const goalTruncated = lessonGoal.length > 60 ? lessonGoal.slice(0, 58) + '…' : lessonGoal;
      doc.text(`Goal: ${goalTruncated}  •  Phone/Tablet Second-Screen Reference`, marginX + 3.5, topMargin + 10.8);
    } else {
      doc.text('Superstar ESL Quiz • Phone / Tablet Second-Screen Reference (Confidential)', marginX + 3.5, topMargin + 10.8);
    }

    // Right Badge
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(pageWidth - marginX - 35, topMargin + 3.2, 32, 8.5, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(146, 64, 14);
    doc.text('TEACHER KEY', pageWidth - marginX - 35 + 16, topMargin + 8.8, { align: 'center' });
  };

  let currentY = topMargin + headerHeight + 3.5;
  drawHeader();

  itemsToExport.forEach((q, index) => {
    const questionNumber = q.blockNumber || q.id || index + 1;
    const typeMeta = getQuestionTypeDisplay(q.type);
    const answerInfo = getQuestionAnswer(q);
    const promptRaw = q.title || '(Blank Question)';
    const cleanPrompt = formatPromptForPrint(promptRaw);

    // Prompt lines
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    const promptLines = doc.splitTextToSize(cleanPrompt, contentWidth - 44);

    // Multiple choice options summary line
    let optionsLine = '';
    if (includeOptionsList && q.type === 'multiple_choice') {
      const mc = q as MultipleChoiceQuestion;
      if (mc.options && mc.options.length > 0) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        optionsLine = mc.options.map((opt, i) => `${letters[i]}) ${opt}`).join('   ');
      }
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    const optionsLines = optionsLine ? doc.splitTextToSize(optionsLine, contentWidth - 44) : [];

    // Answer lines
    const ansPrefix = q.type === 'mystery_card' ? 'EVENT:' : 'ANSWER:';
    const ansString = `${ansPrefix} ${answerInfo.answerText}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const answerLines = doc.splitTextToSize(ansString, contentWidth - 14);

    // Note / hint lines
    let noteText = '';
    if (includeExplanations && answerInfo.explanationText) {
      noteText = `Note: ${answerInfo.explanationText}`;
    } else if (includeHints && answerInfo.hintText) {
      noteText = `Hint: ${answerInfo.hintText}`;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    const noteLines = noteText ? doc.splitTextToSize(noteText, contentWidth - 14) : [];

    // Compute dynamic row height
    const promptHeight = promptLines.length * 3.5;
    const optionsHeight = optionsLines.length > 0 ? optionsLines.length * 2.8 + 1 : 0;
    const answerHeight = answerLines.length * 3.4 + 2.5;
    const noteHeight = noteLines.length > 0 ? noteLines.length * 2.6 + 1 : 0;
    const padding = 5;
    const cardHeight = Math.max(14, promptHeight + optionsHeight + answerHeight + noteHeight + padding);

    // Break page if necessary
    if (currentY + cardHeight > maxContentY) {
      doc.addPage(pageFormat, 'portrait');
      drawHeader();
      currentY = topMargin + headerHeight + 3.5;
    }

    // Card Container
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, currentY, contentWidth, cardHeight, 2, 2, 'FD');

    // Number Badge (#1)
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(marginX + 2.5, currentY + 2.5, 12, 6.5, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`#${questionNumber}`, marginX + 8.5, currentY + 6.8, { align: 'center' });

    // Type Badge
    const typeLabel = typeMeta.label.length > 14 ? typeMeta.label.slice(0, 12) + '…' : typeMeta.label;
    doc.setFillColor(...typeMeta.bg);
    doc.setDrawColor(...typeMeta.border);
    doc.roundedRect(marginX + 16, currentY + 2.5, 21, 6.5, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...typeMeta.text);
    doc.text(typeLabel, marginX + 26.5, currentY + 6.8, { align: 'center' });

    // Reward Coins (right)
    if (q.rewardCoins) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(180, 83, 9);
      doc.text(`★ ${q.rewardCoins}`, pageWidth - marginX - 3.5, currentY + 6.8, { align: 'right' });
    }

    // Prompt lines
    let textY = currentY + 5.8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(15, 23, 42);
    promptLines.forEach((line: string, i: number) => {
      doc.text(line, marginX + 39, textY + i * 3.5);
    });
    textY += promptLines.length * 3.5;

    // Options breakdown
    if (optionsLines.length > 0) {
      textY += 0.8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      optionsLines.forEach((line: string, i: number) => {
        doc.text(line, marginX + 39, textY + i * 2.8);
      });
      textY += optionsLines.length * 2.8;
    }

    // High-Contrast Answer Box
    textY += 1.2;
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.setLineWidth(0.25);
    doc.roundedRect(marginX + 2.5, textY, contentWidth - 5, answerHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(6, 95, 70);
    answerLines.forEach((line: string, i: number) => {
      doc.text(line, marginX + 5, textY + 3.8 + i * 3.4);
    });
    textY += answerHeight;

    // Optional Note / Explanation
    if (noteLines.length > 0) {
      textY += 1.2;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      noteLines.forEach((line: string, i: number) => {
        doc.text(line, marginX + 5, textY + i * 2.6);
      });
    }

    currentY += cardHeight + 2;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Superstar ESL Quiz • Teacher Second-Screen Answer Key (${itemsToExport.length} Questions)`,
      marginX,
      pageHeight - 4.5
    );
    doc.text(
      `Page ${p} of ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 4.5,
      { align: 'right' }
    );
  }

  const sanitizedName = deckName.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 30) || 'question_deck';
  const filename = `${sanitizedName}_teacher_answer_key.pdf`;

  return { doc, filename };
}

/**
 * Builds the PDF with 1 page per question containing:
 * - Question Number & Deck Metadata
 * - Question Type badge
 * - Question prompt & options
 * - Answer in a concealed format (Upside down or fold-away flap)
 */
export function generateCardPagesPdf(options: DeckPdfOptions): { doc: jsPDF; filename: string } {
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
 * Main export generator: delegates to Teacher Cheat Sheet (default)
 * or Full-Page Flashcards based on exportMode.
 */
export function generateDeckPdf(options: DeckPdfOptions): { doc: jsPDF; filename: string } {
  if (options.exportMode === 'cards') {
    return generateCardPagesPdf(options);
  }
  return generateCheatSheetPdf(options);
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
