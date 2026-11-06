// The clue image endpoint during a real game: time-gated levels over HTTP.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { io as connect } from 'socket.io-client';
import { createGameServer } from '../app.js';

const FAST = { introMs: 100, guessMs: 1_500, revealMs: 300, reconnectGraceMs: 300, idleRoomMs: 60_000 };
const LEVELS = 5;

const QUESTIONS = [
  {
    id: 'tmdb-578',
    title: 'Jaws',
    alternativeTitles: [],
    year: 1975,
    posterPath: '/jaws-poster.jpg',
    clue: { type: 'poster', imagePath: '/jaws-poster.jpg', levels: LEVELS },
  },
];

let server;
let base;
let socket;
let renders;

beforeEach(async () => {
  renders = [];
  const clueRenderer = {
    async render(clue, level) {
      renders.push(level);
      return Buffer.from(`${clue.type}:${level}`);
    },
  };
  server = createGameServer({
    timings: FAST,
    questionSource: { pick: async (n) => QUESTIONS.slice(0, n) },
    clueRenderer,
    logger: { error: () => {} },
  });
  await new Promise((resolve) => server.httpServer.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.httpServer.address().port}`;
  socket = connect(base, { transports: ['websocket'], forceNew: true, reconnection: false });
  socket.states = [];
  socket.on('room:state', (s) => socket.states.push(s));
});

afterEach(async () => {
  socket.disconnect();
  await server.close();
});

const call = (event, payload = {}) => socket.timeout(2_000).emitWithAck(event, payload);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const status = async (path) => (await fetch(`${base}${path}`)).status;

function waitFor(predicate, ms = 3_000) {
  const seen = socket.states.find(predicate);
  if (seen) return Promise.resolve(seen);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timed out')), ms);
    socket.on('room:state', function onState(s) {
      if (!predicate(s)) return;
      clearTimeout(timer);
      socket.off('room:state', onState);
      resolve(s);
    });
  });
}

describe('clue images', () => {
  it('serves each level only once it unlocks, and the full image only after the reveal', async () => {
    await call('room:create', { name: 'Sam' });
    await call('game:start', { roundCount: 1 });
    const intro = await waitFor((s) => s.phase === 'round_intro');
    expect(intro.round.clue).toBeNull();
    expect(intro.round.clueType).toBe('poster');

    const guessing = await waitFor((s) => s.phase === 'guessing');
    const { url, unlockAt } = guessing.round.clue;
    expect(url).toMatch(/^\/api\/clues\/[\w-]{20,}$/);
    expect(JSON.stringify(guessing)).not.toMatch(/jaws/i);
    expect(renders[0]).toBe(0); // level 0 was pre-rendered during the intro

    const res = await fetch(`${base}${url}/0`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
    expect(await res.text()).toBe('poster:0');

    expect(await status(`${url}/4`)).toBe(403); // not yet
    expect(await status(`${url}/${LEVELS}`)).toBe(403);

    await sleep(Math.max(0, unlockAt[4] - guessing.serverNow) + 20);
    expect(await status(`${url}/4`)).toBe(200);
    expect(await status(`${url}/${LEVELS}`)).toBe(403); // still guessing

    const reveal = await waitFor((s) => s.phase === 'reveal', FAST.guessMs + 1_000);
    expect(reveal.round.clue.revealed).toBe(true);
    expect(await status(`${url}/${LEVELS}`)).toBe(200);
  });

  it('404s for unknown tokens, bad levels and finished games that were restarted', async () => {
    expect(await status('/api/clues/not-a-token/0')).toBe(404);

    await call('room:create', { name: 'Sam' });
    await call('game:start', { roundCount: 1 });
    const { round } = await waitFor((s) => s.phase === 'guessing');
    expect(await status(`${round.clue.url}/99`)).toBe(404);
    expect(await status(`${round.clue.url}/abc`)).toBe(404);

    await call('guess:submit', { text: 'Jaws' });
    await waitFor((s) => s.phase === 'results', 2_000);
    await call('game:start', { roundCount: 1 });
    await waitFor((s) => s.phase === 'round_intro' && s.players[0].score === 0);
    expect(await status(`${round.clue.url}/0`)).toBe(404); // the old round's token is gone
  });
});
