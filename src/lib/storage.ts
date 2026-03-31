import type { LearnerProfile, VocabularyItem, SessionRecord } from '@/types';

const STORAGE_KEY = 'russmeister_';

const KEYS = {
  profile: `${STORAGE_KEY}profile`,
  vocabulary: `${STORAGE_KEY}vocabulary`,
  sessionHistory: `${STORAGE_KEY}session_history`,
} as const;

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = `${STORAGE_KEY}test`;
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function getItem<T>(key: string): T | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error(`[RussMeister] Failed to save to localStorage key: ${key}`);
  }
}

/**
 * Save a learner profile to localStorage.
 */
export function saveProfile(profile: LearnerProfile): void {
  setItem(KEYS.profile, profile);
}

/**
 * Load a learner profile from localStorage.
 */
export function loadProfile(): LearnerProfile | null {
  return getItem<LearnerProfile>(KEYS.profile);
}

/**
 * Save vocabulary items to localStorage.
 */
export function saveVocabulary(items: VocabularyItem[]): void {
  setItem(KEYS.vocabulary, items);
}

/**
 * Load vocabulary items from localStorage.
 */
export function loadVocabulary(): VocabularyItem[] {
  return getItem<VocabularyItem[]>(KEYS.vocabulary) ?? [];
}

/**
 * Save session history to localStorage.
 */
export function saveSessionHistory(sessions: SessionRecord[]): void {
  setItem(KEYS.sessionHistory, sessions);
}

/**
 * Load session history from localStorage.
 */
export function loadSessionHistory(): SessionRecord[] {
  return getItem<SessionRecord[]>(KEYS.sessionHistory) ?? [];
}

/**
 * Clear all RussMeister data from localStorage.
 */
export function clearAll(): void {
  if (!isLocalStorageAvailable()) return;
  Object.values(KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}
