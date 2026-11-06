import { describe, it, expect } from 'vitest';
import { createRoom, reduce, toPublicState, sanitizeName } from '../game/room.js';
import { PHASES, ERRORS, LIMITS, SCORING } from '../game/constants.js';

const timings = { introMs: 3_000, guessMs: 30_000, revealMs: 5_000 };

const ROUNDS = [
  { id: 'jaws', title: 'Jaws', alternativeTitles: [], year: 1975, clue: { type: 'plot', text: 'Shark.' } },
  { id: 'up', title: 'Up', alternativeTitles: [], year: 2009, clue: { type: 'plot', text: 'Balloons.' } },
];

// Applies events in order, failing the test on any unexpected error.
function run(state, ...events) {
  for (const event of events) {
    const { state: next, error } = reduce(state, event);
    if (error) throw new Error(`Unexpected error ${error} for ${event.type}`);
    state = next;
  }
  return state;
}

function lobbyWith(...names) {
  let state = createRoom({ code: 'ABCD', now: 0, timings });
  names.forEach((name, i) => {
    state = run(state, { type: 'join', playerId: `p${i + 1}`, name, now: 0 });
  });
  return state;
}

// Host starts at t=0; guessing opens at t=3000 and closes at t=33000.
function guessingWith(...names) {
  return run(
    lobbyWith(...names),
    { type: 'start', playerId: 'p1', rounds: ROUNDS, now: 0 },
    { type: 'timer', now: timings.introMs }
  );
}

describe('joining', () => {
  it('makes the first player host', () => {
    const state = lobbyWith('Sam', 'Alex');
    expect(state.hostId).toBe('p1');
    expect(state.playerOrder).toEqual(['p1', 'p2']);
  });

  it('cleans names and de-duplicates them', () => {
    const state = lobbyWith('  Sam\n ', 'sam', 'SAM');
    expect(Object.values(state.players).map((p) => p.name)).toEqual(['Sam', 'sam 2', 'SAM 3']);
  });

  it('rejects empty names', () => {
    const room = createRoom({ code: 'ABCD', now: 0, timings });
    expect(reduce(room, { type: 'join', playerId: 'p1', name: '   ', now: 0 }).error).toBe(ERRORS.INVALID_NAME);
    expect(reduce(room, { type: 'join', playerId: 'p1', name: null, now: 0 }).error).toBe(ERRORS.INVALID_NAME);
  });

  it('caps name length', () => {
    expect(sanitizeName('x'.repeat(50))).toHaveLength(LIMITS.nameMaxLength);
  });

  it('enforces the player limit', () => {
    const names = Array.from({ length: LIMITS.maxPlayers }, (_, i) => `P${i}`);
    const full = lobbyWith(...names);
    expect(reduce(full, { type: 'join', playerId: 'extra', name: 'Late', now: 0 }).error).toBe(ERRORS.ROOM_FULL);
  });

  it('rejects joins once a game is running', () => {
    const state = guessingWith('Sam');
    expect(reduce(state, { type: 'join', playerId: 'p9', name: 'Late', now: 4_000 }).error).toBe(
      ERRORS.GAME_IN_PROGRESS
    );
  });
});

describe('starting', () => {
  it('only lets the host start', () => {
    const state = lobbyWith('Sam', 'Alex');
    expect(reduce(state, { type: 'start', playerId: 'p2', rounds: ROUNDS, now: 0 }).error).toBe(ERRORS.NOT_HOST);
  });

  it('needs at least one question', () => {
    const state = lobbyWith('Sam');
    expect(reduce(state, { type: 'start', playerId: 'p1', rounds: [], now: 0 }).error).toBe(ERRORS.NO_QUESTIONS);
  });

  it('enters the round intro with a deadline', () => {
    const state = run(lobbyWith('Sam'), { type: 'start', playerId: 'p1', rounds: ROUNDS, now: 100 });
    expect(state.phase).toBe(PHASES.ROUND_INTRO);
    expect(state.roundIndex).toBe(0);
    expect(state.phaseEndsAt).toBe(100 + timings.introMs);
  });

  it('works solo', () => {
    expect(guessingWith('Sam').phase).toBe(PHASES.GUESSING);
  });
});

describe('timers', () => {
  it('ignores timers that fire early', () => {
    const state = run(lobbyWith('Sam'), { type: 'start', playerId: 'p1', rounds: ROUNDS, now: 0 });
    const { state: next } = reduce(state, { type: 'timer', now: timings.introMs - 1 });
    expect(next).toBe(state); // same object: nothing to broadcast
  });

  it('walks every phase through to results', () => {
    let state = guessingWith('Sam');
    const phases = [];
    let now = timings.introMs;
    while (state.phase !== PHASES.RESULTS) {
      now = state.phaseEndsAt;
      state = run(state, { type: 'timer', now });
      phases.push(state.phase);
    }
    expect(phases).toEqual([PHASES.REVEAL, PHASES.ROUND_INTRO, PHASES.GUESSING, PHASES.REVEAL, PHASES.RESULTS]);
    expect(state.phaseEndsAt).toBeNull();
  });
});

describe('guessing', () => {
  it('rejects guesses outside the guessing phase', () => {
    const intro = run(lobbyWith('Sam'), { type: 'start', playerId: 'p1', rounds: ROUNDS, now: 0 });
    expect(reduce(intro, { type: 'guess', playerId: 'p1', text: 'Jaws', now: 1 }).error).toBe(ERRORS.WRONG_PHASE);
  });

  it('scores a wrong guess as nothing', () => {
    const state = guessingWith('Sam', 'Alex');
    const { state: next, result } = reduce(state, { type: 'guess', playerId: 'p1', text: 'Titanic', now: 4_000 });
    expect(result).toEqual({ correct: false });
    expect(next.players.p1.score).toBe(0);
  });

  it('awards speed points and the first-correct bonus', () => {
    const state = guessingWith('Sam', 'Alex');
    const instant = reduce(state, { type: 'guess', playerId: 'p1', text: 'jaws', now: timings.introMs });
    expect(instant.result).toEqual({ correct: true, points: SCORING.max + SCORING.firstCorrectBonus });

    const later = reduce(instant.state, { type: 'guess', playerId: 'p2', text: 'Jaws', now: 33_000 });
    expect(later.result).toEqual({ correct: true, points: SCORING.min });
  });

  it('refuses a second correct guess from the same player', () => {
    const state = run(guessingWith('Sam', 'Alex'), { type: 'guess', playerId: 'p1', text: 'Jaws', now: 4_000 });
    expect(reduce(state, { type: 'guess', playerId: 'p1', text: 'Jaws', now: 5_000 }).error).toBe(
      ERRORS.ALREADY_SOLVED
    );
  });

  it('ends the round early once everyone connected has solved it', () => {
    const state = run(
      guessingWith('Sam', 'Alex'),
      { type: 'guess', playerId: 'p1', text: 'Jaws', now: 4_000 },
      { type: 'guess', playerId: 'p2', text: 'Jaws', now: 5_000 }
    );
    expect(state.phase).toBe(PHASES.REVEAL);
    expect(state.phaseEndsAt).toBe(5_000 + timings.revealMs);
  });

  it('does not wait for disconnected players', () => {
    const state = run(
      guessingWith('Sam', 'Alex'),
      { type: 'disconnect', playerId: 'p2', now: 4_000 },
      { type: 'guess', playerId: 'p1', text: 'Jaws', now: 5_000 }
    );
    expect(state.phase).toBe(PHASES.REVEAL);
  });

  it('ends the round when the last unsolved player drops', () => {
    const state = run(
      guessingWith('Sam', 'Alex'),
      { type: 'guess', playerId: 'p1', text: 'Jaws', now: 4_000 },
      { type: 'disconnect', playerId: 'p2', now: 5_000 }
    );
    expect(state.phase).toBe(PHASES.REVEAL);
  });

  it('resets per-round solves for the next round', () => {
    let state = run(guessingWith('Sam'), { type: 'guess', playerId: 'p1', text: 'Jaws', now: 4_000 });
    state = run(state, { type: 'timer', now: state.phaseEndsAt }); // -> round 2 intro
    expect(state.roundIndex).toBe(1);
    expect(state.solvedBy).toEqual({});
  });
});

describe('players leaving and returning', () => {
  it('hands host to the next connected player on disconnect', () => {
    const state = run(lobbyWith('Sam', 'Alex', 'Kim'), { type: 'disconnect', playerId: 'p1', now: 1 });
    expect(state.hostId).toBe('p2');
    expect(state.players.p1.connected).toBe(false);
  });

  it('keeps score across a reconnect', () => {
    let state = run(guessingWith('Sam', 'Alex'), { type: 'guess', playerId: 'p2', text: 'Jaws', now: 4_000 });
    const score = state.players.p2.score;
    state = run(state, { type: 'disconnect', playerId: 'p2', now: 5_000 }, { type: 'reconnect', playerId: 'p2', now: 6_000 });
    expect(state.players.p2).toMatchObject({ connected: true, score });
  });

  it('removes a player and re-elects host', () => {
    const state = run(lobbyWith('Sam', 'Alex'), { type: 'remove', playerId: 'p1', now: 1 });
    expect(state.playerOrder).toEqual(['p2']);
    expect(state.hostId).toBe('p2');
  });

  it('leaves no host once everyone is gone', () => {
    const state = run(lobbyWith('Sam'), { type: 'remove', playerId: 'p1', now: 1 });
    expect(state.hostId).toBeNull();
  });

  it('errors on unknown players', () => {
    expect(reduce(lobbyWith('Sam'), { type: 'remove', playerId: 'nope', now: 1 }).error).toBe(ERRORS.UNKNOWN_PLAYER);
  });
});

describe('playing again', () => {
  it('lets the host restart from results with fresh scores', () => {
    let state = run(guessingWith('Sam'), { type: 'guess', playerId: 'p1', text: 'Jaws', now: 4_000 });
    while (state.phase !== PHASES.RESULTS) state = run(state, { type: 'timer', now: state.phaseEndsAt });
    expect(state.players.p1.score).toBeGreaterThan(0);

    state = run(state, { type: 'start', playerId: 'p1', rounds: ROUNDS, now: 100_000 });
    expect(state.phase).toBe(PHASES.ROUND_INTRO);
    expect(state.players.p1.score).toBe(0);
  });
});

describe('toPublicState (anti-cheat)', () => {
  it('hides the clue during the intro', () => {
    const intro = run(lobbyWith('Sam'), { type: 'start', playerId: 'p1', rounds: ROUNDS, now: 0 });
    const view = toPublicState(intro, 'p1', 0);
    expect(view.round).toMatchObject({ number: 1, total: 2, clueType: 'plot', clue: null, answer: null });
  });

  it('shows the clue but not the answer while guessing', () => {
    const view = toPublicState(guessingWith('Sam'), 'p1', 4_000);
    expect(view.round.clue).toEqual({ type: 'plot', text: 'Shark.' });
    expect(view.round.answer).toBeNull();
    expect(JSON.stringify(view)).not.toMatch(/jaws/i);
  });

  it('never sends other rounds', () => {
    const view = toPublicState(guessingWith('Sam'), 'p1', 4_000);
    expect(JSON.stringify(view)).not.toMatch(/balloons|"up"/i);
  });

  it('reveals the answer after the round', () => {
    let state = guessingWith('Sam');
    state = run(state, { type: 'timer', now: state.phaseEndsAt });
    expect(toPublicState(state, 'p1', state.phaseStartedAt).round.answer).toEqual({ title: 'Jaws', year: 1975, posterUrl: null });
  });

  it("includes the viewer's points and everyone's solved flags", () => {
    const state = run(guessingWith('Sam', 'Alex'), { type: 'guess', playerId: 'p1', text: 'Jaws', now: 4_000 });
    const view = toPublicState(state, 'p1', 4_000);
    expect(view.round.yourPoints).toBeGreaterThan(0);
    expect(view.players.map((p) => p.solved)).toEqual([true, false]);
    expect(toPublicState(state, 'p2', 4_000).round.yourPoints).toBeNull();
  });
});
