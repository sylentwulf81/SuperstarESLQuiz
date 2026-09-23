export interface MarkedPart {
  text: string;
  marked: boolean;
}

export interface PromptWord {
  index: number;
  display: string;
  marked: boolean;
}

/** ` / cook / ` from older decks becomes ` *cook* `. */
export function legacySlashesToMarks(raw: string): string {
  return raw.replace(/ \/ ([^/\n]+?) \/ /g, ' *$1* ');
}

export function parseMarkedPrompt(raw: string): MarkedPart[] {
  const text = legacySlashesToMarks(raw);
  const parts: MarkedPart[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > last) {
      parts.push({ text: text.slice(last, match.index), marked: false });
    }
    parts.push({ text: match[1], marked: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), marked: false });
  if (parts.length === 0) parts.push({ text, marked: false });
  return parts;
}

function readToken(token: string): { lead: string; core: string; trail: string; marked: boolean } {
  const wrapped = token.match(/^(.*?)\*([^*]+)\*(.*)$/);
  if (wrapped) {
    return { lead: wrapped[1], core: wrapped[2], trail: wrapped[3], marked: true };
  }
  const plain = token.match(/^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9]*)$/);
  if (plain && plain[2]) {
    return { lead: plain[1], core: plain[2], trail: plain[3], marked: false };
  }
  return { lead: '', core: token, trail: '', marked: false };
}

export function promptWords(raw: string): PromptWord[] {
  const pieces = legacySlashesToMarks(raw).split(/(\s+)/);
  const words: PromptWord[] = [];
  let index = 0;
  for (const piece of pieces) {
    if (piece === '' || /^\s+$/.test(piece)) continue;
    const token = readToken(piece);
    words.push({
      index,
      display: `${token.lead}${token.core}${token.trail}`,
      marked: token.marked,
    });
    index += 1;
  }
  return words;
}

export function toggleMarkedWord(raw: string, wordIndex: number): string {
  const pieces = legacySlashesToMarks(raw).split(/(\s+)/);
  let index = 0;
  return pieces
    .map(piece => {
      if (piece === '' || /^\s+$/.test(piece)) return piece;
      const current = index;
      index += 1;
      if (current !== wordIndex) return piece;
      const token = readToken(piece);
      if (token.marked) return `${token.lead}${token.core}${token.trail}`;
      return `${token.lead}*${token.core}*${token.trail}`;
    })
    .join('');
}
