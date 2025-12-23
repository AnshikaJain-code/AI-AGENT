interface ReviewResult {
  quality: 0 | 1 | 2 | 3 | 4 | 5;
}

interface FlashcardReviewState {
  easeFactor: number;
  intervalDays: number;
  nextReviewDate: Date;
  reviewCount: number;
  correctCount: number;
}

const INITIAL_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

export function calculateNextReview(
  current: FlashcardReviewState,
  result: ReviewResult
): FlashcardReviewState {
  const quality = result.quality;
  let newEaseFactor = current.easeFactor;
  let newIntervalDays = current.intervalDays;

  newEaseFactor =
    newEaseFactor +
    (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  if (newEaseFactor < MIN_EASE_FACTOR) {
    newEaseFactor = MIN_EASE_FACTOR;
  }

  if (quality < 3) {
    newIntervalDays = 1;
  } else {
    if (current.reviewCount === 0) {
      newIntervalDays = 1;
    } else if (current.reviewCount === 1) {
      newIntervalDays = 3;
    } else {
      newIntervalDays = Math.round(current.intervalDays * newEaseFactor);
    }
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newIntervalDays);

  const newCorrectCount =
    quality >= 3 ? current.correctCount + 1 : current.correctCount;

  return {
    easeFactor: newEaseFactor,
    intervalDays: newIntervalDays,
    nextReviewDate: nextDate,
    reviewCount: current.reviewCount + 1,
    correctCount: newCorrectCount,
  };
}

export function initializeFlashcardReview(): FlashcardReviewState {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);

  return {
    easeFactor: INITIAL_EASE_FACTOR,
    intervalDays: 1,
    nextReviewDate: nextDate,
    reviewCount: 0,
    correctCount: 0,
  };
}

export function getFlashcardsDueForReview(
  flashcards: Array<{
    id: string;
    review: FlashcardReviewState;
  }>
): string[] {
  const now = new Date();
  return flashcards
    .filter((fc) => fc.review.nextReviewDate <= now)
    .map((fc) => fc.id);
}

export function getRetentionRate(state: FlashcardReviewState): number {
  if (state.reviewCount === 0) return 0;
  return (state.correctCount / state.reviewCount) * 100;
}

export function estimateTimeToMastery(state: FlashcardReviewState): number {
  const retentionRate = getRetentionRate(state);

  if (retentionRate >= 90) return 0;

  const reviewsNeeded = Math.ceil(
    Math.log(0.99) / Math.log(1 - retentionRate / 100)
  );
  const avgDaysBetweenReviews = state.intervalDays || 1;

  return Math.max(0, (reviewsNeeded - state.reviewCount) * avgDaysBetweenReviews);
}
