// Shared game constants. Durations are in milliseconds.

export const PHASES = Object.freeze({
  LOBBY: 'lobby',
  ROUND_INTRO: 'round_intro',
  GUESSING: 'guessing',
  REVEAL: 'reveal',
  RESULTS: 'results',
});

export const DEFAULT_TIMINGS = Object.freeze({
  introMs: 3_000,
  guessMs: 30_000,
  revealMs: 5_000,
  // How long a disconnected player keeps their seat and score.
  reconnectGraceMs: 30_000,
  // Rooms with no activity for this long are deleted.
  idleRoomMs: 60 * 60 * 1_000,
});

export const LIMITS = Object.freeze({
  maxPlayers: 8,
  nameMaxLength: 20,
  guessMaxLength: 100,
  defaultRoundCount: 10,
  maxRoundCount: 20,
});

export const SCORING = Object.freeze({
  // A correct answer earns between `min` and `max` points depending on speed.
  min: 100,
  max: 1_000,
  firstCorrectBonus: 100,
});

// Room codes skip I and O, which are easy to confuse with 1 and 0.
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const ROOM_CODE_LENGTH = 4;

// Error codes returned to clients. Kept stable so the UI can map them to copy.
export const ERRORS = Object.freeze({
  ROOM_NOT_FOUND: 'room_not_found',
  ROOM_FULL: 'room_full',
  GAME_IN_PROGRESS: 'game_in_progress',
  INVALID_NAME: 'invalid_name',
  NOT_HOST: 'not_host',
  WRONG_PHASE: 'wrong_phase',
  ALREADY_SOLVED: 'already_solved',
  UNKNOWN_PLAYER: 'unknown_player',
  INVALID_SESSION: 'invalid_session',
  NOT_IN_ROOM: 'not_in_room',
  RATE_LIMITED: 'rate_limited',
  BAD_REQUEST: 'bad_request',
  NO_QUESTIONS: 'no_questions',
});
