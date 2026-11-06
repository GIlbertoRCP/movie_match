// End-to-end tests over real sockets: a real server on a random port, real
// socket.io clients, fast timings.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import http from 'http';
import { io as connect } from 'socket.io-client';
import { createGameServer } from '../app.js';
import { ERRORS } from '../game/constants.js';

const FAST = { introMs: 50, guessMs: 1_500, revealMs: 50, reconnectGraceMs: 300, idleRoomMs: 60_000 };

const QUESTIONS = [
  { id: 'jaws', title: 'Jaws', alternativeTitles: [], year: 1975, clue: { type: 'plot', text: 'A shark.' } },
  { id: 'up', title: 'Up', alternativeTitles: [], year: 2009, clue: { type: 'plot', text: 'Balloons.' } },
];
const fixedSource = { pick: async (count) => QUESTIONS.slice(0, count) };
const silentLogger = { error: () => {} };

let server;
let url;
let clients;

beforeEach(async () => {
  server = createGameServer({ timings: FAST, questionSource: fixedSource, logger: silentLogger });
  await new Promise((resolve) => server.httpServer.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.httpServer.address().port}`;
  clients = [];
});

afterEach(async () => {
  clients.forEach((c) => c.disconnect());
  await server.close();
});

// A client that records every room:state it receives.
function client() {
  const socket = connect(url, { transports: ['websocket'], forceNew: true, reconnection: false });
  socket.states = [];
  socket.on('room:state', (state) => socket.states.push(state));
  clients.push(socket);
  return socket;
}

const call = (socket, event, payload = {}) => socket.timeout(2_000).emitWithAck(event, payload);

// Resolves with the first state (already received or upcoming) matching `predicate`.
function waitForState(socket, predicate, ms = 3_000) {
  const seen = socket.states.find(predicate);
  if (seen) return Promise.resolve(seen);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('room:state', onState);
      reject(new Error(`Timed out waiting for state; last: ${JSON.stringify(socket.states.at(-1))}`));
    }, ms);
    function onState(state) {
      if (!predicate(state)) return;
      clearTimeout(timer);
      socket.off('room:state', onState);
      resolve(state);
    }
    socket.on('room:state', onState);
  });
}

const player = (state, id) => state.players.find((p) => p.id === id);

// Host "Sam" creates a room and "Alex" joins it.
async function twoPlayerRoom() {
  const host = client();
  const guest = client();
  const created = await call(host, 'room:create', { name: 'Sam' });
  const joined = await call(guest, 'room:join', { code: created.code.toLowerCase(), name: 'Alex' });
  await waitForState(host, (s) => s.players.length === 2);
  return { host, guest, created, joined };
}

describe('a full game over sockets', () => {
  it('plays a round from lobby to results', async () => {
    const { host, guest, created, joined } = await twoPlayerRoom();
    expect(created).toMatchObject({ ok: true, code: expect.stringMatching(/^[A-Z]{4}$/) });
    expect(created.token).toEqual(expect.any(String));
    expect(joined.state.players.map((p) => p.name)).toEqual(['Sam', 'Alex']);

    expect(await call(guest, 'game:start', { roundCount: 1 })).toEqual({ ok: false, error: ERRORS.NOT_HOST });
    expect(await call(host, 'game:start', { roundCount: 1 })).toEqual({ ok: true });

    const guessing = await waitForState(guest, (s) => s.phase === 'guessing');
    expect(guessing.round).toMatchObject({ number: 1, total: 1, clue: { text: 'A shark.' }, answer: null });
    expect(guessing.phaseEndsAt).toBeGreaterThan(guessing.serverNow);

    expect(await call(guest, 'guess:submit', { text: 'Titanic' })).toEqual({ ok: true, correct: false });
    const hostGuess = await call(host, 'guess:submit', { text: 'jaws' });
    const guestGuess = await call(guest, 'guess:submit', { text: 'JAWS!' });
    expect(hostGuess).toMatchObject({ ok: true, correct: true });
    expect(guestGuess).toMatchObject({ ok: true, correct: true });
    expect(hostGuess.points).toBeGreaterThan(guestGuess.points); // first + faster

    // Everyone solved it, so the reveal comes early, then the results.
    const reveal = await waitForState(host, (s) => s.phase === 'reveal');
    expect(reveal.round.answer).toEqual({ title: 'Jaws', year: 1975, posterUrl: null });

    const results = await waitForState(guest, (s) => s.phase === 'results');
    expect(player(results, created.playerId).score).toBe(hostGuess.points);
    expect(player(results, joined.playerId).score).toBe(guestGuess.points);
  });

  it('reveals the answer when time runs out', async () => {
    const host = client();
    await call(host, 'room:create', { name: 'Sam' });
    await call(host, 'game:start', { roundCount: 1 });
    const guessing = await waitForState(host, (s) => s.phase === 'guessing');
    const reveal = await waitForState(host, (s) => s.phase === 'reveal', FAST.guessMs + 1_000);
    expect(reveal.serverNow).toBeGreaterThanOrEqual(guessing.phaseEndsAt);
    expect(reveal.round.answer.title).toBe('Jaws');
    expect(reveal.players[0]).toMatchObject({ score: 0, solved: false });
  });

  it('can play again from the results', async () => {
    const host = client();
    await call(host, 'room:create', { name: 'Sam' });
    await call(host, 'game:start', { roundCount: 1 });
    await waitForState(host, (s) => s.phase === 'guessing');
    await call(host, 'guess:submit', { text: 'Jaws' });
    await waitForState(host, (s) => s.phase === 'results');

    expect(await call(host, 'game:start', { roundCount: 1 })).toEqual({ ok: true });
    const again = await waitForState(host, (s) => s.phase === 'round_intro' && s.players[0].score === 0);
    expect(again.round.number).toBe(1);
  });
});

describe('identity and validation', () => {
  it('ignores player ids sent by the client', async () => {
    const { host, guest, created, joined } = await twoPlayerRoom();
    await call(host, 'game:start', { roundCount: 1 });
    await waitForState(guest, (s) => s.phase === 'guessing');

    // The guest tries to answer as the host.
    await call(guest, 'guess:submit', { text: 'Jaws', playerId: created.playerId });
    const state = await waitForState(host, (s) => s.players.some((p) => p.solved));
    expect(player(state, joined.playerId).solved).toBe(true);
    expect(player(state, created.playerId).solved).toBe(false);
  });

  it('rejects bad requests without crashing', async () => {
    const socket = client();
    expect(await call(socket, 'room:join', { code: 'ZZZZ', name: 'Sam' })).toEqual({ ok: false, error: ERRORS.ROOM_NOT_FOUND });
    expect(await call(socket, 'room:create', { name: '   ' })).toEqual({ ok: false, error: ERRORS.INVALID_NAME });
    expect(await call(socket, 'room:create', 'not an object')).toEqual({ ok: false, error: ERRORS.INVALID_NAME });
    expect(await call(socket, 'guess:submit', { text: 'Jaws' })).toEqual({ ok: false, error: ERRORS.NOT_IN_ROOM });
    expect(server.manager.roomCount()).toBe(0); // failed creates leave nothing behind

    await call(socket, 'room:create', { name: 'Sam' });
    expect(await call(socket, 'guess:submit', { text: 42 })).toEqual({ ok: false, error: ERRORS.BAD_REQUEST });
    expect(await call(socket, 'guess:submit', { text: 'x'.repeat(500) })).toEqual({ ok: false, error: ERRORS.BAD_REQUEST });
  });

  it('rate-limits guesses per socket', async () => {
    const socket = client();
    await call(socket, 'room:create', { name: 'Sam' });
    const replies = await Promise.all(Array.from({ length: 8 }, () => call(socket, 'guess:submit', { text: 'x' })));
    expect(replies.filter((r) => r.error === ERRORS.RATE_LIMITED)).toHaveLength(3);
  });

  it('refuses joins once a game has started', async () => {
    const host = client();
    const { code } = await call(host, 'room:create', { name: 'Sam' });
    await call(host, 'game:start', { roundCount: 1 });
    expect(await call(client(), 'room:join', { code, name: 'Late' })).toEqual({ ok: false, error: ERRORS.GAME_IN_PROGRESS });
  });
});

describe('disconnects and reconnection', () => {
  it('keeps the seat and score through a reconnect', async () => {
    const { host, guest, created, joined } = await twoPlayerRoom();
    await call(host, 'game:start', { roundCount: 1 });
    await waitForState(guest, (s) => s.phase === 'guessing');
    const { points } = await call(guest, 'guess:submit', { text: 'Jaws' });

    guest.disconnect();
    await waitForState(host, (s) => player(s, joined.playerId)?.connected === false);

    const resumed = await call(client(), 'room:resume', { code: created.code, token: joined.token });
    expect(resumed).toMatchObject({ ok: true, playerId: joined.playerId });
    expect(player(resumed.state, joined.playerId)).toMatchObject({ connected: true, score: points, solved: true });
    await waitForState(host, (s) => player(s, joined.playerId)?.connected === true);
  });

  it('gives host to the next player while the host is away', async () => {
    const { host, guest, joined } = await twoPlayerRoom();
    host.disconnect();
    const state = await waitForState(guest, (s) => s.hostId === joined.playerId);
    expect(player(state, joined.playerId).isHost).toBe(true);
  });

  it('removes a player once the grace period runs out', async () => {
    const { host, guest, created, joined } = await twoPlayerRoom();
    guest.disconnect();
    await waitForState(host, (s) => s.players.length === 1, FAST.reconnectGraceMs + 1_000);
    expect(await call(client(), 'room:resume', { code: created.code, token: joined.token })).toEqual({
      ok: false,
      error: ERRORS.INVALID_SESSION,
    });
  });

  it('rejects a token for a different room or a made-up token', async () => {
    const { created } = await twoPlayerRoom();
    const other = await call(client(), 'room:create', { name: 'Kim' });
    expect((await call(client(), 'room:resume', { code: other.code, token: created.token })).error).toBe(ERRORS.INVALID_SESSION);
    expect((await call(client(), 'room:resume', { code: created.code, token: 'nope' })).error).toBe(ERRORS.INVALID_SESSION);
  });

  it('moves the seat to a second tab and cuts off the first', async () => {
    const first = client();
    const created = await call(first, 'room:create', { name: 'Sam' });
    const replaced = new Promise((resolve) => first.once('session:replaced', resolve));

    const second = client();
    expect(await call(second, 'room:resume', { code: created.code, token: created.token })).toMatchObject({ ok: true });
    await replaced;
    expect(await call(first, 'guess:submit', { text: 'Jaws' })).toEqual({ ok: false, error: ERRORS.NOT_IN_ROOM });

    // The old tab closing must not mark the player as away.
    first.disconnect();
    await new Promise((r) => setTimeout(r, 50));
    expect(player(server.manager.getPublicState(created.code, created.playerId), created.playerId).connected).toBe(true);
  });

  it('deletes the room when the last player leaves', async () => {
    const socket = client();
    await call(socket, 'room:create', { name: 'Sam' });
    expect(server.manager.roomCount()).toBe(1);
    await call(socket, 'room:leave');
    expect(server.manager.roomCount()).toBe(0);
  });
});

describe('origin check', () => {
  function pollStatus(headers) {
    return new Promise((resolve, reject) => {
      http
        .get(`${url}/socket.io/?EIO=4&transport=polling`, { headers }, (res) => {
          res.resume();
          resolve(res.statusCode);
        })
        .on('error', reject);
    });
  }

  it('refuses sockets from other websites', async () => {
    expect(await pollStatus({ Origin: 'https://evil.example' })).toBe(403);
    expect(await pollStatus({})).toBe(200);
  });
});
