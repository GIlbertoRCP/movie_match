import { describe, it, expect } from 'vitest';
import { createTmdbQuestionSource, clueFor } from '../content/tmdbQuestions.js';
import { CLUE_LEVELS } from '../content/images.js';

const overview = 'A skilled thief who steals corporate secrets from inside dreams is offered one final job that could give him his life back.';

const movie = (id, overrides = {}) => ({
  id,
  title: `Film ${id}`,
  alternativeTitles: [],
  year: 2000 + id,
  overview,
  posterPath: `/p${id}.jpg`,
  backdropPaths: [`/b${id}.jpg`],
  cast: [],
  directors: [],
  ...overrides,
});

// Deterministic "random" for repeatable picks.
function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

describe('clueFor', () => {
  it('builds each clue type', () => {
    const m = movie(1);
    expect(clueFor('poster', m)).toEqual({ type: 'poster', imagePath: '/p1.jpg', levels: CLUE_LEVELS });
    expect(clueFor('plot', m)).toMatchObject({ type: 'plot', text: overview });
    const still = clueFor('still', m, () => 0.5);
    expect(still).toEqual({ type: 'still', imagePath: '/b1.jpg', focus: { x: 0.5, y: 0.5 }, levels: CLUE_LEVELS });
  });

  it('keeps still focus points away from the edges', () => {
    expect(clueFor('still', movie(1), () => 0).focus).toEqual({ x: 0.25, y: 0.25 });
    expect(clueFor('still', movie(1), () => 0.9999).focus).toEqual({ x: 0.75, y: 0.75 });
  });

  it('returns null when a film cannot support the type', () => {
    expect(clueFor('still', movie(1, { backdropPaths: [] }))).toBeNull();
    expect(clueFor('plot', movie(1, { overview: 'Too short.' }))).toBeNull();
  });
});

describe('createTmdbQuestionSource', () => {
  const pool = { movies: Array.from({ length: 30 }, (_, i) => movie(i + 1)) };

  it('picks distinct films with an even mix of clue types', async () => {
    const questions = await createTmdbQuestionSource({ pool, random: seeded(7) }).pick(9);
    expect(new Set(questions.map((q) => q.id)).size).toBe(9);
    const counts = questions.reduce((acc, q) => ({ ...acc, [q.clue.type]: (acc[q.clue.type] ?? 0) + 1 }), {});
    expect(counts).toEqual({ poster: 3, still: 3, plot: 3 });
    expect(questions[0]).toMatchObject({ title: expect.any(String), year: expect.any(Number), posterPath: expect.any(String) });
  });

  it('falls back to another clue type when a film lacks one', async () => {
    const noStills = { movies: pool.movies.map((m) => ({ ...m, backdropPaths: [] })) };
    const questions = await createTmdbQuestionSource({ pool: noStills, random: seeded(3) }).pick(6);
    expect(questions).toHaveLength(6);
    expect(questions.some((q) => q.clue.type === 'still')).toBe(false);
  });

  it('never returns more questions than films', async () => {
    const small = { movies: pool.movies.slice(0, 2) };
    expect(await createTmdbQuestionSource({ pool: small }).pick(10)).toHaveLength(2);
  });

  it('refuses an empty pool', () => {
    expect(() => createTmdbQuestionSource({ pool: { movies: [] } })).toThrow();
  });
});
