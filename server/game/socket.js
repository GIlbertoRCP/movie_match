// Socket.io protocol for the game.
//
// Client -> server (every event takes an ack callback that receives
// `{ ok: true, ... }` or `{ ok: false, error }`):
//   room:create  { name }            -> { code, playerId, token, state }
//   room:join    { code, name }      -> { code, playerId, token, state }
//   room:resume  { code, token }     -> { code, playerId, state }
//   room:leave   {}                  -> {}
//   game:start   { roundCount? }     -> {}
//   guess:submit { text }            -> { correct, points? }
//
// Server -> client:
//   room:state       public room state for this player (see toPublicState)
//   session:replaced this seat was resumed from another tab/device
//
// Identity rule: which room and player a socket acts as is stored in
// socket.data by this module after create/join/resume. Nothing in a payload
// can choose a player id.

import { GameError, normalizeRoomCode } from './manager.js';
import { ERRORS, LIMITS } from './constants.js';

const DEFAULT_GUESS_RATE = { max: 5, windowMs: 3_000 };

function createRateLimiter({ max, windowMs }, clock) {
  let stamps = [];
  return () => {
    const now = clock();
    stamps = stamps.filter((at) => now - at < windowMs);
    if (stamps.length >= max) return false;
    stamps.push(now);
    return true;
  };
}

export function registerGameHandlers(io, manager, { guessRate = DEFAULT_GUESS_RATE, clock = () => Date.now(), logger = console } = {}) {
  // playerId -> socket id currently acting for that player
  const activeSocketByPlayer = new Map();

  function broadcastRoom(code) {
    const socketIds = io.sockets.adapter.rooms.get(code);
    if (!socketIds) return;
    for (const id of socketIds) {
      const socket = io.sockets.sockets.get(id);
      if (socket?.data.playerId) {
        socket.emit('room:state', manager.getPublicState(code, socket.data.playerId));
      }
    }
  }

  function bindSocket(socket, code, playerId) {
    const previousId = activeSocketByPlayer.get(playerId);
    if (previousId && previousId !== socket.id) {
      const previous = io.sockets.sockets.get(previousId);
      if (previous) {
        previous.data = {};
        previous.leave(code);
        previous.emit('session:replaced');
      }
    }
    socket.data = { code, playerId };
    socket.join(code);
    activeSocketByPlayer.set(playerId, socket.id);
  }

  function unbindSocket(socket) {
    const { code, playerId } = socket.data;
    if (code) socket.leave(code);
    if (playerId && activeSocketByPlayer.get(playerId) === socket.id) activeSocketByPlayer.delete(playerId);
    socket.data = {};
  }

  // Wraps a handler: validates the payload shape, normalises errors, never throws.
  function handle(socket, event, fn) {
    socket.on(event, async (payload, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        const body = payload && typeof payload === 'object' ? payload : {};
        reply({ ok: true, ...((await fn(body)) ?? {}) });
      } catch (error) {
        if (error instanceof GameError) {
          reply({ ok: false, error: error.code });
        } else {
          logger.error(`[socket] ${event} failed:`, error);
          reply({ ok: false, error: ERRORS.BAD_REQUEST });
        }
      }
    });
  }

  const requireRoom = (socket) => {
    const { code, playerId } = socket.data;
    if (!code || !playerId || !manager.hasRoom(code)) throw new GameError(ERRORS.NOT_IN_ROOM);
    return { code, playerId };
  };

  // A socket in one room that creates or joins another leaves the first for good.
  const leaveCurrentRoom = (socket) => {
    const { code, playerId } = socket.data;
    if (!code) return;
    unbindSocket(socket);
    manager.leave(code, playerId);
  };

  io.on('connection', (socket) => {
    socket.data = {};
    const allowGuess = createRateLimiter(guessRate, clock);

    handle(socket, 'room:create', ({ name }) => {
      leaveCurrentRoom(socket);
      const { code, playerId, token } = manager.createRoom(name);
      bindSocket(socket, code, playerId);
      return { code, playerId, token, state: manager.getPublicState(code, playerId) };
    });

    handle(socket, 'room:join', ({ code, name }) => {
      const target = normalizeRoomCode(code);
      if (socket.data.code === target) throw new GameError(ERRORS.BAD_REQUEST);
      // Join first so a failed join (full, in progress) doesn't drop the current room.
      const joined = manager.joinRoom(target, name);
      leaveCurrentRoom(socket);
      bindSocket(socket, joined.code, joined.playerId);
      // Others were notified before this socket joined the channel; refresh everyone.
      broadcastRoom(joined.code);
      return { ...joined, state: manager.getPublicState(joined.code, joined.playerId) };
    });

    handle(socket, 'room:resume', ({ code, token }) => {
      const resumed = manager.resume(code, token);
      if (socket.data.playerId !== resumed.playerId) leaveCurrentRoom(socket);
      bindSocket(socket, resumed.code, resumed.playerId);
      broadcastRoom(resumed.code);
      return { ...resumed, state: manager.getPublicState(resumed.code, resumed.playerId) };
    });

    handle(socket, 'room:leave', () => {
      leaveCurrentRoom(socket);
    });

    handle(socket, 'game:start', async ({ roundCount }) => {
      const { code, playerId } = requireRoom(socket);
      await manager.startGame(code, playerId, { roundCount });
    });

    handle(socket, 'guess:submit', ({ text }) => {
      const { code, playerId } = requireRoom(socket);
      if (typeof text !== 'string' || text.length > LIMITS.guessMaxLength) throw new GameError(ERRORS.BAD_REQUEST);
      if (!allowGuess()) throw new GameError(ERRORS.RATE_LIMITED);
      return manager.guess(code, playerId, text);
    });

    socket.on('disconnect', () => {
      const { code, playerId } = socket.data;
      if (!code || activeSocketByPlayer.get(playerId) !== socket.id) return;
      activeSocketByPlayer.delete(playerId);
      manager.disconnect(code, playerId);
    });
  });

  return { broadcastRoom };
}
