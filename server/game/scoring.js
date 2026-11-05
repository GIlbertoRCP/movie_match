import { SCORING } from './constants.js';

// Points for a correct answer: linear in the time left, plus a bonus for being first.
export function pointsForCorrectGuess({ remainingMs, totalMs, isFirst }) {
  const fraction = totalMs > 0 ? Math.min(1, Math.max(0, remainingMs / totalMs)) : 0;
  const speedPoints = Math.round(SCORING.min + (SCORING.max - SCORING.min) * fraction);
  return speedPoints + (isFirst ? SCORING.firstCorrectBonus : 0);
}
