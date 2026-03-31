import type { VocabularyItem } from '@/types';

/**
 * Leitner box intervals in days.
 * Box 0: due immediately (next session)
 * Box 1: 2 days
 * Box 2: 7 days
 * Box 3: 14 days
 * Box 4: 30 days
 */
const LEITNER_INTERVALS: Record<number, number> = {
  0: 0,
  1: 2,
  2: 7,
  3: 14,
  4: 30,
};

const MAX_BOX = 4;

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString();
}

/**
 * Calculate the next review date and update SRS fields for a vocabulary item
 * based on whether the learner answered correctly.
 *
 * Correct: move up one Leitner box (max 4), schedule next review per interval.
 * Incorrect: reset to box 0, schedule for next session (immediate).
 */
export function calculateNextReview(
  item: VocabularyItem,
  wasCorrect: boolean
): VocabularyItem {
  const now = new Date();
  const newTimesSeen = item.times_seen + 1;
  const newTimesCorrect = wasCorrect ? item.times_correct + 1 : item.times_correct;

  let newBox: number;
  if (wasCorrect) {
    newBox = Math.min(item.leitner_box + 1, MAX_BOX);
  } else {
    newBox = 0;
  }

  const intervalDays = LEITNER_INTERVALS[newBox];
  const nextReview = addDays(now, intervalDays);

  return {
    ...item,
    leitner_box: newBox,
    next_review: nextReview,
    last_seen: now.toISOString(),
    times_seen: newTimesSeen,
    times_correct: newTimesCorrect,
  };
}

/**
 * Get vocabulary items that are due for review, sorted by urgency.
 * Items with no next_review date are considered immediately due.
 * Items in box 0 are always due.
 *
 * @param vocabulary - All vocabulary items
 * @param count - Maximum number of items to return (default: all due items)
 */
export function getDueItems(
  vocabulary: VocabularyItem[],
  count?: number
): VocabularyItem[] {
  const now = new Date();

  const dueItems = vocabulary.filter((item) => {
    // Items never reviewed are always due
    if (item.next_review === null) return true;
    // Items in box 0 are always due
    if (item.leitner_box === 0) return true;
    // Items whose review date has passed
    return new Date(item.next_review) <= now;
  });

  // Sort by priority: lower box first, then by next_review date (oldest first)
  dueItems.sort((a, b) => {
    if (a.leitner_box !== b.leitner_box) {
      return a.leitner_box - b.leitner_box;
    }
    const aDate = a.next_review ? new Date(a.next_review).getTime() : 0;
    const bDate = b.next_review ? new Date(b.next_review).getTime() : 0;
    return aDate - bDate;
  });

  if (count !== undefined) {
    return dueItems.slice(0, count);
  }

  return dueItems;
}
