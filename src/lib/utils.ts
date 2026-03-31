import type { CEFRLevel } from '@/types';

/**
 * Generate a unique ID using crypto.randomUUID with a fallback.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format a date string or Date object into a human-readable string.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Merge class names, filtering out falsy values.
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

const CEFR_MAP: Record<CEFRLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

const NUMBER_MAP: Record<number, CEFRLevel> = {
  1: 'A1',
  2: 'A2',
  3: 'B1',
  4: 'B2',
  5: 'C1',
  6: 'C2',
};

/**
 * Convert a CEFR level to its numeric equivalent (1-6).
 */
export function cefrToNumber(level: CEFRLevel): number {
  return CEFR_MAP[level];
}

/**
 * Convert a number (1-6) to a CEFR level.
 */
export function numberToCefr(n: number): CEFRLevel {
  const clamped = Math.max(1, Math.min(6, Math.round(n)));
  return NUMBER_MAP[clamped];
}
