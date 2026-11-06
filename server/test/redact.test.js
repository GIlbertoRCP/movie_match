import { describe, it, expect } from 'vitest';
import { redactOverview, plotClueFor, BLANK } from '../content/redact.js';

const inception = {
  title: 'Inception',
  alternativeTitles: [],
  directors: ['Christopher Nolan'],
  cast: [
    { name: 'Leonardo DiCaprio', character: 'Dom Cobb' },
    { name: 'Joseph Gordon-Levitt', character: 'Arthur' },
  ],
  overview:
    'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life as payment for a task considered impossible: "inception".',
};

describe('redactOverview', () => {
  it('blanks title words and character names', () => {
    const { text, redacted } = redactOverview(inception.overview, inception);
    expect(text).toMatch(new RegExp(`^${BLANK}, a skilled thief`));
    expect(text).toContain(`"${BLANK}"`);
    expect(text).not.toMatch(/cobb|inception/i);
    expect(redacted).toBe(2);
  });

  it('handles possessives, accents and case', () => {
    const movie = { title: 'Amélie', cast: [{ name: 'Audrey Tautou', character: 'Amélie Poulain' }] };
    const { text } = redactOverview("AMELIE's world changes when she meets a stranger. Poulain's plan begins.", movie);
    expect(text).toBe(`${BLANK} world changes when she meets a stranger. ${BLANK} plan begins.`);
  });

  it('merges a full name into one blank', () => {
    const movie = { title: 'X', cast: [{ name: 'Ellen Ripley', character: 'Ellen Ripley' }] };
    expect(redactOverview('Ellen Ripley wakes up.', movie).text).toBe(`${BLANK} wakes up.`);
  });

  it('keeps common words and numbers even when they appear in names or titles', () => {
    const movie = { title: 'The Man from 1984', cast: [{ name: 'Sam Doe', character: 'Young Man' }] };
    const { text } = redactOverview('In 1984 a young man and his mother flee.', movie);
    expect(text).toBe('In 1984 a young man and his mother flee.');
  });

  it('keeps words that merely contain a name', () => {
    const movie = { title: 'Up', cast: [{ name: 'Ed Asner', character: 'Carl' }] };
    expect(redactOverview('A careful plan by Carl.', movie).text).toBe(`A careful plan by ${BLANK}.`);
  });
});

describe('plotClueFor', () => {
  it('returns a plot clue for a readable synopsis', () => {
    expect(plotClueFor(inception)).toEqual({ type: 'plot', text: expect.stringContaining('skilled thief') });
  });

  it('rejects synopses that are too short', () => {
    expect(plotClueFor({ ...inception, overview: 'A thief steals dreams.' })).toBeNull();
  });

  it('rejects synopses that are mostly names', () => {
    const movie = {
      title: 'Alpha Beta',
      cast: [{ name: 'Gamma Delta', character: 'Epsilon Zeta' }],
      overview: 'Alpha and Beta meet Gamma, Delta, Epsilon and Zeta; Alpha leaves while Beta stays with Gamma and Zeta.',
    };
    expect(plotClueFor(movie)).toBeNull();
  });
});
