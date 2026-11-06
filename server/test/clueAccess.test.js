import { describe, it, expect } from 'vitest';
import { createRoom, reduce, toPublicState, clueImageAccess, CLUE_UNLOCK_TOLERANCE_MS } from '../game/room.js';

const timings = { introMs: 3_000, guessMs: 30_000, revealMs: 5_000 };
const LEVELS = 5;
const INTERVAL = timings.guessMs / LEVELS; // 6s per level
const GUESS_START = timings.introMs; // game starts at t=0

const posterRound = {
  id: 'tmdb-1',
  title: 'Jaws',
  alternativeTitles: [],
  year: 1975,
  posterPath: '/secret-poster.jpg',
  clue: { type: 'poster', imagePath: '/secret-poster.jpg', levels: LEVELS },
  clueToken: 'tok-1',
};

function step(state, event) {
  const { state: next, error } = reduce(state, event);
  if (error) throw new Error(error);
  return next;
}

function at(phase) {
  let state = createRoom({ code: 'ABCD', now: 0, timings });
  state = step(state, { type: 'join', playerId: 'p1', name: 'Sam', now: 0 });
  state = step(state, { type: 'start', playerId: 'p1', rounds: [posterRound], now: 0 });
  if (phase === 'intro') return state;
  state = step(state, { type: 'timer', now: GUESS_START });
  if (phase === 'guessing') return state;
  return step(state, { type: 'timer', now: state.phaseEndsAt }); // reveal
}

describe('clueImageAccess', () => {
  it('locks everything during the intro', () => {
    expect(clueImageAccess(at('intro'), 'tok-1', 0, 0)).toBe('locked');
  });

  it('unlocks one level per interval while guessing', () => {
    const state = at('guessing');
    expect(clueImageAccess(state, 'tok-1', 0, GUESS_START)).toBe('ok');
    expect(clueImageAccess(state, 'tok-1', 1, GUESS_START)).toBe('locked');
    expect(clueImageAccess(state, 'tok-1', 1, GUESS_START + INTERVAL - CLUE_UNLOCK_TOLERANCE_MS - 1)).toBe('locked');
    expect(clueImageAccess(state, 'tok-1', 1, GUESS_START + INTERVAL - CLUE_UNLOCK_TOLERANCE_MS)).toBe('ok');
    expect(clueImageAccess(state, 'tok-1', 4, GUESS_START + 4 * INTERVAL)).toBe('ok');
  });

  it('keeps the unobscured image for the reveal', () => {
    expect(clueImageAccess(at('guessing'), 'tok-1', LEVELS, GUESS_START + timings.guessMs - 1)).toBe('locked');
    expect(clueImageAccess(at('reveal'), 'tok-1', LEVELS, 0)).toBe('ok');
  });

  it('rejects wrong tokens and impossible levels', () => {
    const state = at('reveal');
    expect(clueImageAccess(state, 'other', 0, 0)).toBe('not_found');
    for (const level of [-1, LEVELS + 1, 1.5, NaN]) expect(clueImageAccess(state, 'tok-1', level, 0)).toBe('not_found');
  });

  it('has nothing for text clues', () => {
    let state = createRoom({ code: 'ABCD', now: 0, timings });
    state = step(state, { type: 'join', playerId: 'p1', name: 'Sam', now: 0 });
    const textRound = { ...posterRound, clue: { type: 'plot', text: 'A shark.' } };
    state = step(state, { type: 'start', playerId: 'p1', rounds: [textRound], now: 0 });
    state = step(state, { type: 'timer', now: GUESS_START });
    expect(clueImageAccess(state, 'tok-1', 0, GUESS_START)).toBe('not_found');
  });
});

describe('public image clues', () => {
  it('sends an opaque URL and unlock times, never the TMDB image path', () => {
    const view = toPublicState(at('guessing'), 'p1', GUESS_START);
    expect(view.round.clue).toEqual({
      type: 'poster',
      levels: LEVELS,
      url: '/api/clues/tok-1',
      unlockAt: [3_000, 9_000, 15_000, 21_000, 27_000],
      revealed: false,
    });
    expect(JSON.stringify(view)).not.toMatch(/secret|jaws/i);
  });

  it('marks the clue as revealed and includes the poster after the round', () => {
    const view = toPublicState(at('reveal'), 'p1', 40_000);
    expect(view.round.clue).toMatchObject({ unlockAt: null, revealed: true });
    expect(view.round.answer.posterUrl).toBe('https://image.tmdb.org/t/p/w342/secret-poster.jpg');
  });
});
