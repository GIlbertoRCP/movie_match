// Pure room state machine.
//
//   lobby ─start─▶ round_intro ─timer─▶ guessing ─timer / everyone solved─▶ reveal ─timer─┐
//     ▲                                                                                     │
//     └──── results ◀── last round ◀──────────────────────────── next round ◀──────────────┘
//
// `reduce(state, event)` never mutates `state`, never reads the clock (every
// event carries `now`) and never schedules anything. The room manager owns
// timers and sockets; this module only decides what happens.

import { PHASES, LIMITS, ERRORS } from './constants.js';
import { isCorrectGuess } from './answers.js';
import { pointsForCorrectGuess } from './scoring.js';

export function createRoom({ code, now, timings }) {
  return {
    code,
    createdAt: now,
    lastActivityAt: now,
    timings: {
      introMs: timings.introMs,
      guessMs: timings.guessMs,
      revealMs: timings.revealMs,
    },
    phase: PHASES.LOBBY,
    hostId: null,
    players: {},
    playerOrder: [],
    rounds: [],
    roundIndex: -1,
    phaseStartedAt: now,
    phaseEndsAt: null,
    // Per-round bookkeeping: who solved it, when, and for how many points.
    solvedBy: {},
  };
}

// --- Helpers -----------------------------------------------------------------

export function sanitizeName(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/\p{Cc}/gu, '') // control characters
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LIMITS.nameMaxLength)
    .trim();
}

function uniqueName(name, players) {
  const taken = new Set(Object.values(players).map((p) => p.name.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  for (let n = 2; ; n++) {
    const suffix = ` ${n}`;
    const candidate = `${name.slice(0, LIMITS.nameMaxLength - suffix.length)}${suffix}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

function connectedIds(state) {
  return state.playerOrder.filter((id) => state.players[id]?.connected);
}

// Keep the current host if they're still here and connected; otherwise pick the
// longest-standing connected player, then anyone at all.
function electHost(state) {
  const current = state.players[state.hostId];
  if (current?.connected) return state.hostId;
  return connectedIds(state)[0] ?? state.playerOrder[0] ?? null;
}

function enterPhase(state, phase, now, durationMs) {
  return {
    ...state,
    phase,
    phaseStartedAt: now,
    phaseEndsAt: durationMs == null ? null : now + durationMs,
  };
}

function everyoneConnectedSolved(state) {
  const ids = connectedIds(state);
  return ids.length > 0 && ids.every((id) => state.solvedBy[id]);
}

function startRound(state, index, now) {
  return enterPhase({ ...state, roundIndex: index, solvedBy: {} }, PHASES.ROUND_INTRO, now, state.timings.introMs);
}

function advance(state, now) {
  switch (state.phase) {
    case PHASES.ROUND_INTRO:
      return enterPhase(state, PHASES.GUESSING, now, state.timings.guessMs);
    case PHASES.GUESSING:
      return enterPhase(state, PHASES.REVEAL, now, state.timings.revealMs);
    case PHASES.REVEAL:
      return state.roundIndex + 1 < state.rounds.length
        ? startRound(state, state.roundIndex + 1, now)
        : enterPhase(state, PHASES.RESULTS, now, null);
    default:
      return state;
  }
}

// A no-op returns the same state object, so callers can skip broadcasting.
const ok = (state, result) => ({ state, result });
const fail = (state, error) => ({ state, error });

// --- Reducer -----------------------------------------------------------------

export function reduce(state, event) {
  const { now } = event;
  const touch = (next) => ({ ...next, lastActivityAt: now });

  switch (event.type) {
    case 'join': {
      if (state.phase !== PHASES.LOBBY && state.phase !== PHASES.RESULTS) {
        return fail(state, ERRORS.GAME_IN_PROGRESS);
      }
      if (state.playerOrder.length >= LIMITS.maxPlayers) return fail(state, ERRORS.ROOM_FULL);
      const cleaned = sanitizeName(event.name);
      if (!cleaned) return fail(state, ERRORS.INVALID_NAME);

      const player = {
        id: event.playerId,
        name: uniqueName(cleaned, state.players),
        score: 0,
        connected: true,
        joinedAt: now,
      };
      const next = {
        ...state,
        players: { ...state.players, [player.id]: player },
        playerOrder: [...state.playerOrder, player.id],
      };
      return ok(touch({ ...next, hostId: electHost(next) }), { player });
    }

    case 'disconnect':
    case 'reconnect': {
      const player = state.players[event.playerId];
      if (!player) return fail(state, ERRORS.UNKNOWN_PLAYER);
      let next = {
        ...state,
        players: { ...state.players, [player.id]: { ...player, connected: event.type === 'reconnect' } },
      };
      next = { ...next, hostId: electHost(next) };
      // A disconnect can leave only solvers connected, which ends the round early.
      if (next.phase === PHASES.GUESSING && everyoneConnectedSolved(next)) {
        next = advance(next, now);
      }
      return ok(touch(next));
    }

    case 'remove': {
      if (!state.players[event.playerId]) return fail(state, ERRORS.UNKNOWN_PLAYER);
      const players = { ...state.players };
      delete players[event.playerId];
      const solvedBy = { ...state.solvedBy };
      delete solvedBy[event.playerId];
      let next = {
        ...state,
        players,
        solvedBy,
        playerOrder: state.playerOrder.filter((id) => id !== event.playerId),
      };
      next = { ...next, hostId: electHost(next) };
      if (next.phase === PHASES.GUESSING && everyoneConnectedSolved(next)) {
        next = advance(next, now);
      }
      return ok(touch(next));
    }

    case 'start': {
      if (event.playerId !== state.hostId) return fail(state, ERRORS.NOT_HOST);
      if (state.phase !== PHASES.LOBBY && state.phase !== PHASES.RESULTS) {
        return fail(state, ERRORS.WRONG_PHASE);
      }
      if (!Array.isArray(event.rounds) || event.rounds.length === 0) {
        return fail(state, ERRORS.NO_QUESTIONS);
      }
      const players = Object.fromEntries(
        Object.entries(state.players).map(([id, p]) => [id, { ...p, score: 0 }])
      );
      return ok(touch(startRound({ ...state, players, rounds: event.rounds }, 0, now)));
    }

    case 'timer': {
      // Ignore stale or early timers: only the scheduled deadline advances a phase.
      if (state.phaseEndsAt == null || now < state.phaseEndsAt) return ok(state);
      return ok(touch(advance(state, now)));
    }

    case 'guess': {
      if (state.phase !== PHASES.GUESSING) return fail(state, ERRORS.WRONG_PHASE);
      const player = state.players[event.playerId];
      if (!player) return fail(state, ERRORS.UNKNOWN_PLAYER);
      if (state.solvedBy[player.id]) return fail(state, ERRORS.ALREADY_SOLVED);

      const question = state.rounds[state.roundIndex];
      if (!isCorrectGuess(event.text, question.title, question.alternativeTitles)) {
        return ok(touch(state), { correct: false });
      }

      // Guesses are processed in the order the server receives them, so the
      // first correct guess here is the first correct guess, period.
      const isFirst = Object.keys(state.solvedBy).length === 0;
      const points = pointsForCorrectGuess({
        remainingMs: state.phaseEndsAt - now,
        totalMs: state.timings.guessMs,
        isFirst,
      });

      let next = {
        ...state,
        players: { ...state.players, [player.id]: { ...player, score: player.score + points } },
        solvedBy: { ...state.solvedBy, [player.id]: { at: now, points, isFirst } },
      };
      if (everyoneConnectedSolved(next)) next = advance(next, now);
      return ok(touch(next), { correct: true, points });
    }

    default:
      return fail(state, ERRORS.BAD_REQUEST);
  }
}

// --- What a client is allowed to see ------------------------------------------
//
// Anti-cheat: the answer never leaves the server before the reveal, and clues
// are only sent once guessing starts. Future rounds are never sent at all.

const CLUE_VISIBLE = new Set([PHASES.GUESSING, PHASES.REVEAL]);
const ANSWER_VISIBLE = new Set([PHASES.REVEAL, PHASES.RESULTS]);

export function toPublicState(state, viewerId, now) {
  const question = state.rounds[state.roundIndex];
  return {
    code: state.code,
    phase: state.phase,
    hostId: state.hostId,
    you: viewerId,
    serverNow: now,
    phaseEndsAt: state.phaseEndsAt,
    players: state.playerOrder.map((id) => {
      const p = state.players[id];
      return {
        id,
        name: p.name,
        score: p.score,
        connected: p.connected,
        isHost: id === state.hostId,
        solved: Boolean(state.solvedBy[id]),
      };
    }),
    round: question
      ? {
          number: state.roundIndex + 1,
          total: state.rounds.length,
          clueType: question.clue.type,
          clue: CLUE_VISIBLE.has(state.phase) ? question.clue : null,
          answer: ANSWER_VISIBLE.has(state.phase) ? { title: question.title, year: question.year } : null,
          yourPoints: state.solvedBy[viewerId]?.points ?? null,
        }
      : null,
  };
}
