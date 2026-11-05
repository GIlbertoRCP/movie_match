// Room manager: the impure shell around the pure reducer in room.js.
// It owns room storage, session tokens, phase timers and reconnect grace
// periods, and calls `onRoomChange(code)` whenever a room's state changes.

import crypto from 'crypto';
import { createRoom, reduce, toPublicState } from './room.js';
import { DEFAULT_TIMINGS, ERRORS, LIMITS, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from './constants.js';

export class GameError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export function normalizeRoomCode(value) {
  return typeof value === 'string' ? value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, ROOM_CODE_LENGTH) : '';
}

export function createRoomManager({
  questionSource,
  timings = DEFAULT_TIMINGS,
  clock = () => Date.now(),
  random = Math.random,
  onRoomChange = () => {},
} = {}) {
  if (!questionSource) throw new Error('createRoomManager needs a questionSource');
  const t = { ...DEFAULT_TIMINGS, ...timings };

  // code -> { state, phaseTimer, graceTimers: Map<playerId, Timeout> }
  const rooms = new Map();
  // token -> { code, playerId }. Tokens are secrets; player ids are public.
  const sessions = new Map();

  function generateCode() {
    for (let attempt = 0; attempt < 1_000; attempt++) {
      let code = '';
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += ROOM_CODE_ALPHABET[Math.floor(random() * ROOM_CODE_ALPHABET.length)];
      }
      if (!rooms.has(code)) return code;
    }
    throw new Error('Could not allocate a room code');
  }

  function getRoom(code) {
    const room = rooms.get(normalizeRoomCode(code));
    if (!room) throw new GameError(ERRORS.ROOM_NOT_FOUND);
    return room;
  }

  function destroyRoom(code) {
    const room = rooms.get(code);
    if (!room) return;
    clearTimeout(room.phaseTimer);
    room.graceTimers.forEach(clearTimeout);
    rooms.delete(code);
    for (const [token, session] of sessions) {
      if (session.code === code) sessions.delete(token);
    }
  }

  function schedulePhaseTimer(code, room) {
    clearTimeout(room.phaseTimer);
    room.phaseTimer = null;
    const deadline = room.state.phaseEndsAt;
    if (deadline == null) return;
    room.phaseTimer = setTimeout(() => {
      const current = rooms.get(code);
      // Ignore a timer whose phase already ended some other way.
      if (current !== room || room.state.phaseEndsAt !== deadline) return;
      // Node timers can fire a millisecond early; the deadline is what counts.
      dispatch(code, { type: 'timer', now: Math.max(clock(), deadline) });
    }, Math.max(0, deadline - clock()));
  }

  // Runs one event through the reducer and applies the side effects.
  function dispatch(code, event) {
    const room = rooms.get(code);
    if (!room) throw new GameError(ERRORS.ROOM_NOT_FOUND);
    const { state, error, result } = reduce(room.state, event);
    if (error) throw new GameError(error);
    if (state === room.state) return result;

    const previousDeadline = room.state.phaseEndsAt;
    room.state = state;
    if (state.playerOrder.length === 0) {
      destroyRoom(code);
      return result;
    }
    if (state.phaseEndsAt !== previousDeadline) schedulePhaseTimer(code, room);
    onRoomChange(code);
    return result;
  }

  function issueSession(code, playerId) {
    const token = crypto.randomBytes(24).toString('base64url');
    sessions.set(token, { code, playerId });
    return token;
  }

  function addPlayer(code, name) {
    const playerId = crypto.randomUUID();
    dispatch(code, { type: 'join', playerId, name, now: clock() });
    return { code, playerId, token: issueSession(code, playerId) };
  }

  // Player left for good (explicit leave or grace period expired).
  function leave(code, playerId) {
    const room = rooms.get(code);
    if (!room?.state.players[playerId]) return;
    clearTimeout(room.graceTimers.get(playerId));
    room.graceTimers.delete(playerId);
    for (const [token, session] of sessions) {
      if (session.code === code && session.playerId === playerId) sessions.delete(token);
    }
    dispatch(code, { type: 'remove', playerId, now: clock() });
  }

  const sweeper = setInterval(() => {
    const cutoff = clock() - t.idleRoomMs;
    for (const [code, room] of rooms) {
      if (room.state.lastActivityAt < cutoff) destroyRoom(code);
    }
  }, Math.min(60_000, t.idleRoomMs));
  sweeper.unref?.();

  return {
    createRoom(name) {
      const code = generateCode();
      rooms.set(code, { state: createRoom({ code, now: clock(), timings: t }), phaseTimer: null, graceTimers: new Map() });
      try {
        return addPlayer(code, name);
      } catch (error) {
        rooms.delete(code); // don't leave an empty room behind (e.g. invalid name)
        throw error;
      }
    },

    joinRoom(code, name) {
      return addPlayer(getRoom(code).state.code, name);
    },

    // Reclaims a seat after a disconnect. Returns the player's id.
    resume(code, token) {
      const session = typeof token === 'string' ? sessions.get(token) : undefined;
      if (!session || session.code !== normalizeRoomCode(code)) throw new GameError(ERRORS.INVALID_SESSION);
      const room = getRoom(session.code);
      clearTimeout(room.graceTimers.get(session.playerId));
      room.graceTimers.delete(session.playerId);
      dispatch(session.code, { type: 'reconnect', playerId: session.playerId, now: clock() });
      return { code: session.code, playerId: session.playerId };
    },

    async startGame(code, playerId, { roundCount = LIMITS.defaultRoundCount } = {}) {
      const room = getRoom(code);
      // Fail fast before fetching questions; the reducer re-checks after.
      if (room.state.hostId !== playerId) throw new GameError(ERRORS.NOT_HOST);
      const count = Math.min(Math.max(1, Math.floor(Number(roundCount)) || LIMITS.defaultRoundCount), LIMITS.maxRoundCount);
      const rounds = await questionSource.pick(count);
      dispatch(room.state.code, { type: 'start', playerId, rounds, now: clock() });
    },

    guess(code, playerId, text) {
      return dispatch(getRoom(code).state.code, { type: 'guess', playerId, text, now: clock() });
    },

    // Socket dropped: keep the seat for the grace period, then remove the player.
    disconnect(code, playerId) {
      const room = rooms.get(code);
      if (!room?.state.players[playerId]) return;
      dispatch(code, { type: 'disconnect', playerId, now: clock() });
      if (!rooms.has(code)) return;
      clearTimeout(room.graceTimers.get(playerId));
      const timer = setTimeout(() => {
        room.graceTimers.delete(playerId);
        if (rooms.get(code) !== room || room.state.players[playerId]?.connected !== false) return;
        leave(code, playerId);
      }, t.reconnectGraceMs);
      timer.unref?.();
      room.graceTimers.set(playerId, timer);
    },

    leave,

    getPublicState(code, playerId) {
      const room = rooms.get(code);
      return room ? toPublicState(room.state, playerId, clock()) : null;
    },

    hasRoom: (code) => rooms.has(normalizeRoomCode(code)),
    roomCount: () => rooms.size,

    close() {
      clearInterval(sweeper);
      [...rooms.keys()].forEach(destroyRoom);
    },
  };
}
