import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  signInAnonymously
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  getDocs,
  deleteDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';
import { GameTheme, Question } from '@/shared/types';
import { THEME_UI } from '@/shared/themeMeta';

export interface SavedQuestionSet {
  questions: Question[];
  lessonGoal?: string;
}

export interface CloudQuestionBank {
  id: string;
  name: string;
  lessonGoal: string;
  questions: Question[];
  updatedAt: string;
}

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore with configured database ID
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Connection test on boot as required by guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline. Check network connection.');
      return false;
    }
    // Document might not exist, but connection to server succeeded
    return true;
  }
}

// Trigger connection check
testConnection().catch(() => {});

/**
 * Sign in with Google (with popup and redirect fallback)
 */
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user);
    return result.user;
  } catch (error: any) {
    console.warn('Popup login failed or blocked, attempting redirect fallback...', error);
    try {
      await signInWithRedirect(auth, googleProvider);
      return null;
    } catch (redirectErr) {
      console.error('Google Sign In failed:', redirectErr);
      throw redirectErr;
    }
  }
}

/**
 * Optional guest / anonymous sign-in for seamless cloud sync without Google account
 */
export async function loginAnonymouslyUser(): Promise<User> {
  const cred = await signInAnonymously(auth);
  await syncUserProfile(cred.user);
  return cred.user;
}

/**
 * Sign out of Firebase
 */
export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Update user document in Firestore on login
 */
async function syncUserProfile(user: User) {
  if (!user || user.isAnonymous) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Mario Party Host',
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync user profile to firestore:', err);
  }
}

/**
 * Save custom question deck to Firestore for this user
 */
export async function saveQuestionsToFirestore(
  userId: string,
  theme: string,
  questions: Question[],
  extras?: { lessonGoal?: string }
): Promise<boolean> {
  if (!userId) return false;
  try {
    const deckRef = doc(db, 'users', userId, 'questionSets', theme);
    await setDoc(
      deckRef,
      {
        id: theme,
        userId: userId,
        title: THEME_UI[(theme as GameTheme)]?.firebaseTitle || `${theme} Custom Questions`,
        theme,
        questionsData: JSON.stringify(questions),
        updatedAt: new Date().toISOString(),
        ...(extras?.lessonGoal !== undefined ? { lessonGoal: extras.lessonGoal } : {}),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error('Failed to save questions to Firestore:', err);
    return false;
  }
}

/**
 * Load saved custom questions from Firestore for this user
 */
export async function loadQuestionsFromFirestore(
  userId: string,
  theme: string
): Promise<SavedQuestionSet | null> {
  if (!userId) return null;
  try {
    const deckRef = doc(db, 'users', userId, 'questionSets', theme);
    const snap = await getDoc(deckRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.questionsData) {
        const parsed = JSON.parse(data.questionsData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return {
            questions: parsed,
            lessonGoal: typeof data.lessonGoal === 'string' ? data.lessonGoal : undefined,
          };
        }
      }
    }
    return null;
  } catch (err) {
    console.error('Failed to load questions from Firestore:', err);
    return null;
  }
}

function newBankId(): string {
  return `lib${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Save a named question bank to this user's cloud library.
 */
export async function saveQuestionBankToFirestore(
  userId: string,
  bank: { name: string; lessonGoal: string; questions: Question[] }
): Promise<CloudQuestionBank | null> {
  if (!userId) return null;
  const name = bank.name.trim().slice(0, 40);
  if (!name || !Array.isArray(bank.questions) || bank.questions.length === 0) return null;
  const id = newBankId();
  const saved: CloudQuestionBank = {
    id,
    name,
    lessonGoal: bank.lessonGoal.trim(),
    questions: bank.questions,
    updatedAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'users', userId, 'questionSets', id), {
      id,
      userId,
      kind: 'library',
      name: saved.name,
      title: saved.name,
      theme: 'classic',
      lessonGoal: saved.lessonGoal,
      questionsData: JSON.stringify(saved.questions),
      updatedAt: saved.updatedAt,
    });
    return saved;
  } catch (err) {
    console.error('Failed to save question bank:', err);
    return null;
  }
}

export async function listQuestionBanksFromFirestore(userId: string): Promise<CloudQuestionBank[]> {
  if (!userId) return [];
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'questionSets'));
    const banks: CloudQuestionBank[] = [];
    snap.forEach(item => {
      const data = item.data();
      if (data.kind !== 'library') return;
      if (typeof data.questionsData !== 'string' || typeof data.name !== 'string') return;
      try {
        const parsed = JSON.parse(data.questionsData);
        if (!Array.isArray(parsed) || parsed.length === 0) return;
        banks.push({
          id: item.id,
          name: data.name,
          lessonGoal: typeof data.lessonGoal === 'string' ? data.lessonGoal : '',
          questions: parsed,
          updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
        });
      } catch {
        // skip a corrupt bank
      }
    });
    banks.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    return banks;
  } catch (err) {
    console.error('Failed to list question banks:', err);
    return [];
  }
}

export async function deleteQuestionBankFromFirestore(userId: string, bankId: string): Promise<boolean> {
  if (!userId || !bankId) return false;
  try {
    await deleteDoc(doc(db, 'users', userId, 'questionSets', bankId));
    return true;
  } catch (err) {
    console.error('Failed to delete question bank:', err);
    return false;
  }
}
