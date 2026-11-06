import { describe, it, expect } from 'vitest';
import { pointsForCorrectGuess } from '../game/scoring.js';
import { SCORING } from '../game/constants.js';

describe('pointsForCorrectGuess', () => {
  const totalMs = 30_000;

  it('gives the maximum for an instant answer', () => {
    expect(pointsForCorrectGuess({ remainingMs: totalMs, totalMs, isFirst: false })).toBe(SCORING.max);
  });

  it('gives the minimum at the buzzer', () => {
    expect(pointsForCorrectGuess({ remainingMs: 0, totalMs, isFirst: false })).toBe(SCORING.min);
  });

  it('scales linearly in between', () => {
    expect(pointsForCorrectGuess({ remainingMs: totalMs / 2, totalMs, isFirst: false })).toBe(
      (SCORING.min + SCORING.max) / 2
    );
  });

  it('adds the bonus for the first correct answer', () => {
    expect(pointsForCorrectGuess({ remainingMs: 0, totalMs, isFirst: true })).toBe(
      SCORING.min + SCORING.firstCorrectBonus
    );
  });

  it('clamps out-of-range time', () => {
    expect(pointsForCorrectGuess({ remainingMs: -500, totalMs, isFirst: false })).toBe(SCORING.min);
    expect(pointsForCorrectGuess({ remainingMs: totalMs * 2, totalMs, isFirst: false })).toBe(SCORING.max);
  });
});
