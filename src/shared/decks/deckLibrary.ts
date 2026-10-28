import { Question } from '@/shared/types';
import { CloudQuestionBank } from '@/shared/utils/firebase';
import { legacySlashesToMarks } from '@/shared/markedPrompt';
import { optimizeDataUrl } from '@/shared/utils/imageUtils';

/**
 * The teacher's saved decks ("My Decks"). Every deck lives in browser storage and, when
 * signed in, in the cloud under the same id. A deck's folder and description are stored
 * on the deck; empty folders are remembered in this browser only.
 */

const LOCAL_DECKS_KEY = 'superstar_local_custom_banks_v1';
const LOCAL_FOLDERS_KEY = 'superstar_deck_folders_v1';

export type Deck = CloudQuestionBank;

type CloudSave = (bank: {
  id?: string;
  name: string;
  lessonGoal: string;
  questions: Question[];
  folder?: string;
  description?: string;
}) => Promise<{ success: boolean; bank?: CloudQuestionBank; error?: string }>;

export function loadLocalDecks(): Deck[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_DECKS_KEY) || '[]');
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

/** Returns false when the browser refused the write (usually storage quota). */
export function saveLocalDecks(decks: Deck[]): boolean {
  try {
    localStorage.setItem(LOCAL_DECKS_KEY, JSON.stringify(decks));
    return true;
  } catch {
    return false;
  }
}

export function loadStoredFolders(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_FOLDERS_KEY) || '[]');
    if (Array.isArray(parsed)) return parsed.filter((f): f is string => typeof f === 'string' && f.trim().length > 0);
  } catch {}
  return [];
}

export function saveStoredFolders(folders: string[]) {
  try {
    localStorage.setItem(LOCAL_FOLDERS_KEY, JSON.stringify(folders));
  } catch {}
}

export function newDeckId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Shrink large embedded images so a deck fits browser storage and a 1 MB cloud document. */
async function prepareQuestions(questions: Question[]): Promise<Question[]> {
  return Promise.all(
    questions.map(async question => {
      let imageUrl = question.imageUrl;
      if (imageUrl && imageUrl.startsWith('data:image/') && imageUrl.length > 50_000) {
        try {
          imageUrl = await optimizeDataUrl(imageUrl, 640, 0.72);
        } catch {
          // keep the original if optimizing fails
        }
      }
      return { ...question, title: legacySlashesToMarks(question.title || ''), imageUrl };
    })
  );
}

export interface PersistResult {
  deck: Deck;
  savedLocally: boolean;
  savedToCloud: boolean;
  cloudError?: string;
}

/** Save a deck locally and, when a cloud save is given (signed in), to the cloud with the same id. */
export async function persistDeck(deck: Deck, cloudSave?: CloudSave): Promise<PersistResult> {
  const saved: Deck = {
    ...deck,
    name: deck.name.trim().slice(0, 40),
    lessonGoal: deck.lessonGoal.trim(),
    questions: await prepareQuestions(deck.questions),
    updatedAt: new Date().toISOString(),
  };
  const savedLocally = saveLocalDecks([saved, ...loadLocalDecks().filter(d => d.id !== saved.id)]);
  let savedToCloud = false;
  let cloudError: string | undefined;
  if (cloudSave) {
    try {
      const result = await cloudSave({
        id: saved.id,
        name: saved.name,
        lessonGoal: saved.lessonGoal,
        questions: saved.questions,
        folder: saved.folder ?? '',
        description: saved.description ?? '',
      });
      savedToCloud = result.success;
      cloudError = result.error;
    } catch {
      cloudError = 'Could not reach the cloud library.';
    }
  }
  return { deck: saved, savedLocally, savedToCloud, cloudError };
}
