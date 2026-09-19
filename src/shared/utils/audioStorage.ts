/**
 * IndexedDB Persistent Audio Storage for Mario Jeopardy
 * Allows user-uploaded MP3/WAV/audio files to persist permanently across browser reloads,
 * restarts, and new game sessions.
 */

export interface StoredAudioTrack {
  id: string;
  name: string;
  blob: Blob;
  size: number;
  type: string;
  createdAt: number;
}

const DB_NAME = 'MarioJeopardy_Audio_DB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_audio_tracks';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open audio database'));
    };
  });
}

export async function getAllStoredAudioTracks(): Promise<StoredAudioTrack[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as StoredAudioTrack[]) || [];
        // Sort newest first
        results.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        resolve(results);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to retrieve stored tracks'));
      };
    });
  } catch (error) {
    console.warn('Could not load audio tracks from IndexedDB:', error);
    return [];
  }
}

export async function saveAudioTrack(file: File): Promise<StoredAudioTrack> {
  const db = await openDB();
  const trackId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanName = file.name.replace(/\.[^/.]+$/, '');

  const storedTrack: StoredAudioTrack = {
    id: trackId,
    name: cleanName,
    blob: file,
    size: file.size,
    type: file.type || 'audio/mpeg',
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(storedTrack);

    request.onsuccess = () => {
      resolve(storedTrack);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to save audio file to IndexedDB'));
    };
  });
}

export async function deleteAudioTrack(trackId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(trackId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to delete audio file from IndexedDB'));
      };
    });
  } catch (error) {
    console.error('Error deleting track from IndexedDB:', error);
  }
}
