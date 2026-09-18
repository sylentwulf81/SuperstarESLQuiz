import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, loginAnonymouslyUser, logoutUser, saveQuestionsToFirestore, loadQuestionsFromFirestore } from '../utils/firebase';
import { Question, GameTheme } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: string | null;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  saveQuestionsCloud: (theme: GameTheme, questions: Question[]) => Promise<boolean>;
  loadQuestionsCloud: (theme: GameTheme) => Promise<Question[] | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLoginGoogle = async () => {
    try {
      setSyncStatus('syncing');
      await loginWithGoogle();
      setSyncStatus('synced');
    } catch (err) {
      console.error('Login error:', err);
      setSyncStatus('error');
    }
  };

  const handleLoginGuest = async () => {
    try {
      await loginAnonymouslyUser();
    } catch (err) {
      console.error('Guest login error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setSyncStatus('idle');
      setLastSyncedAt(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSaveQuestions = async (theme: GameTheme, questions: Question[]): Promise<boolean> => {
    if (!user) return false;
    setSyncStatus('syncing');
    try {
      const success = await saveQuestionsToFirestore(user.uid, theme, questions);
      if (success) {
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        return true;
      } else {
        setSyncStatus('error');
        return false;
      }
    } catch {
      setSyncStatus('error');
      return false;
    }
  };

  const handleLoadQuestions = async (theme: GameTheme): Promise<Question[] | null> => {
    if (!user) return null;
    setSyncStatus('syncing');
    try {
      const questions = await loadQuestionsFromFirestore(user.uid, theme);
      if (questions) {
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        return questions;
      }
      setSyncStatus('idle');
      return null;
    } catch {
      setSyncStatus('error');
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggedIn: !!user && !user.isAnonymous,
        syncStatus,
        lastSyncedAt,
        loginWithGoogle: handleLoginGoogle,
        loginAsGuest: handleLoginGuest,
        logout: handleLogout,
        saveQuestionsCloud: handleSaveQuestions,
        loadQuestionsCloud: handleLoadQuestions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
