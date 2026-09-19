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
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';
import { GameTheme, Question } from '@/shared/types';
import { THEME_UI } from '@/shared/themeMeta';

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
  questions: Question[]
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
        updatedAt: new Date().toISOString()
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
): Promise<Question[] | null> {
  if (!userId) return null;
  try {
    const deckRef = doc(db, 'users', userId, 'questionSets', theme);
    const snap = await getDoc(deckRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.questionsData) {
        const parsed = JSON.parse(data.questionsData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
    return null;
  } catch (err) {
    console.error('Failed to load questions from Firestore:', err);
    return null;
  }
}
