import { describe, it, expect } from 'vitest';
import { normalizeTitle, editDistance, isCorrectGuess } from '../game/answers.js';

describe('normalizeTitle', () => {
  it.each([
    ['The Matrix', 'matrix'],
    ['  the   MATRIX  ', 'matrix'],
    ['Amélie', 'amelie'],
    ['WALL·E', 'wall e'],
    ['Fast & Furious', 'fast and furious'],
    ['Mission: Impossible', 'mission impossible'],
    ['A Quiet Place', 'quiet place'],
    ['An American Tail', 'american tail'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeTitle(input)).toBe(expected);
  });

  it('keeps a lone article that is the whole title', () => {
    expect(normalizeTitle('The')).toBe('the');
  });

  it('handles non-strings', () => {
    expect(normalizeTitle(undefined)).toBe('');
    expect(normalizeTitle(42)).toBe('');
  });
});

describe('editDistance', () => {
  it('computes Levenshtein distance', () => {
    expect(editDistance('kitten', 'sitting')).toBe(3);
    expect(editDistance('same', 'same')).toBe(0);
    expect(editDistance('', 'abc')).toBe(3);
  });

  it('exits early once the limit is exceeded', () => {
    expect(editDistance('abcdefgh', 'zzzzzzzz', 2)).toBe(3);
  });
});

describe('isCorrectGuess', () => {
  it('accepts exact and differently formatted answers', () => {
    expect(isCorrectGuess('the matrix', 'The Matrix')).toBe(true);
    expect(isCorrectGuess('Matrix', 'The Matrix')).toBe(true);
    expect(isCorrectGuess('back to the future!', 'Back to the Future')).toBe(true);
  });

  it('tolerates small typos on longer titles', () => {
    expect(isCorrectGuess('Incepton', 'Inception')).toBe(true); // 1 typo, 9 chars
    expect(isCorrectGuess('Jurasic Prk', 'Jurassic Park')).toBe(true); // 2 typos
    expect(isCorrectGuess('Jursic Prk', 'Jurassic Park')).toBe(false); // 3 typos
  });

  it('requires short titles to be exact', () => {
    expect(isCorrectGuess('Up', 'Up')).toBe(true);
    expect(isCorrectGuess('Us', 'Up')).toBe(false);
    expect(isCorrectGuess('Jawz', 'Jaws')).toBe(false);
  });

  it('accepts alternative titles', () => {
    expect(isCorrectGuess('Walle', 'WALL·E', ['Wall-E', 'Walle'])).toBe(true);
    expect(isCorrectGuess('Sen to Chihiro no Kamikakushi', 'Spirited Away', ['Sen to Chihiro no Kamikakushi'])).toBe(true);
  });

  it('rejects empty or unrelated guesses', () => {
    expect(isCorrectGuess('', 'Jaws')).toBe(false);
    expect(isCorrectGuess('   ', 'Jaws')).toBe(false);
    expect(isCorrectGuess('The', 'The Matrix')).toBe(false);
  });

  it('treats sequel numbers as significant', () => {
    expect(isCorrectGuess('Toy Story 2', 'Toy Story')).toBe(false);
    expect(isCorrectGuess('Toy Story', 'Toy Story 2')).toBe(false);
    expect(isCorrectGuess('Toy Story 3', 'Toy Story 2')).toBe(false);
    expect(isCorrectGuess('toy stroy 2', 'Toy Story 2')).toBe(true);
  });
});
