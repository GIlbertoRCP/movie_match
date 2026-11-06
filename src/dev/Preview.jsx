// Dev-only screen preview: http://localhost:5173/?preview=<scene>
// Renders the real screens from fixed sample data with a frozen clock, so
// every state (reveal, results, away players…) can be checked without
// timing a live game. Never imported in production builds (see main.jsx).
import React, { useMemo } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { GameContext } from '../game/GameContext';
import GameScreens from '../components/game/GameScreens';

const NOW = 1_700_000_000_000;
const GUESS_MS = 30_000;

// A synthetic mosaic standing in for a pixelated render (no TMDB images in the repo).
function mosaic(cols, rows, width, height, seed = 3) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const warm = Math.abs(x - cols / 2) < cols / 4 && y < rows / 2;
      const base = warm ? [196, 92, 46] : [36 + y * 3, 52 + y * 2, 74 + y * 2];
      const jitter = () => Math.round((rand() - 0.5) * 40);
      ctx.fillStyle = `rgb(${base[0] + jitter()},${base[1] + jitter()},${base[2] + jitter()})`;
      ctx.fillRect(Math.floor((x * width) / cols), Math.floor((y * height) / rows), Math.ceil(width / cols), Math.ceil(height / rows));
    }
  }
  return canvas.toDataURL('image/png');
}

const PLAYERS = [
  { id: 'p1', name: 'Sam', score: 1620, connected: true, isHost: true, solved: false },
  { id: 'p2', name: 'Alex', score: 2140, connected: true, isHost: false, solved: true },
  { id: 'p3', name: 'Kim', score: 980, connected: true, isHost: false, solved: false },
  { id: 'p4', name: 'Jo', score: 410, connected: false, isHost: false, solved: false },
];

function guessingRound(type, elapsedMs) {
  const start = NOW - elapsedMs;
  const unlockAt = [0, 1, 2, 3, 4].map((k) => start + k * (GUESS_MS / 5));
  const clues = {
    poster: { type, levels: 5, url: mosaic(10, 15, 342, 513), unlockAt, revealed: false },
    still: { type, levels: 5, url: mosaic(16, 9, 780, 439, 11), unlockAt, revealed: false },
    plot: {
      type,
      text: '█████, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life as payment for a task considered to be impossible: "█████", the implantation of another person\'s idea into a target\'s subconscious.',
    },
  };
  return { start, round: { number: 3, total: 10, clueType: type, clue: clues[type], answer: null, yourPoints: null } };
}

const ANSWER = { title: 'Inception', year: 2010, posterUrl: 'https://image.tmdb.org/t/p/w342/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg' };

function scene(name) {
  const room = (overrides) => ({
    code: 'BQXR',
    hostId: 'p1',
    you: 'p1',
    serverNow: NOW,
    phaseStartedAt: NOW - 1_000,
    phaseEndsAt: NOW + 2_000,
    players: PLAYERS.map((p) => ({ ...p, solved: false })),
    round: null,
    ...overrides,
  });

  switch (name) {
    case 'home':
      return { room: null };
    case 'home-error':
      return { room: null, notice: 'room_not_found' };
    case 'lobby':
      return { room: room({ phase: 'lobby', phaseEndsAt: null, players: PLAYERS.map((p) => ({ ...p, score: 0, solved: false })) }) };
    case 'lobby-solo':
      return { room: room({ phase: 'lobby', phaseEndsAt: null, players: [{ ...PLAYERS[0], score: 0 }] }) };
    case 'lobby-guest':
      return { room: room({ phase: 'lobby', you: 'p3', phaseEndsAt: null, players: PLAYERS.map((p) => ({ ...p, score: 0, solved: false })) }) };
    case 'intro': {
      const { round } = guessingRound('poster', 0);
      return { room: room({ phase: 'round_intro', round: { ...round, clue: null } }) };
    }
    case 'poster':
    case 'still':
    case 'plot': {
      const { start, round } = guessingRound(name, 9_000);
      return { room: room({ phase: 'guessing', phaseStartedAt: start, phaseEndsAt: start + GUESS_MS, players: PLAYERS, round }) };
    }
    case 'solved': {
      const { start, round } = guessingRound('poster', 14_000);
      return {
        room: room({
          phase: 'guessing',
          phaseStartedAt: start,
          phaseEndsAt: start + GUESS_MS,
          players: PLAYERS.map((p) => ({ ...p, solved: p.id === 'p1' || p.id === 'p2' })),
          round: { ...round, yourPoints: 640 },
        }),
      };
    }
    case 'reveal-poster':
    case 'reveal-plot': {
      const type = name === 'reveal-poster' ? 'poster' : 'plot';
      const { round } = guessingRound(type, 0);
      const clue = type === 'poster' ? { ...round.clue, url: ANSWER.posterUrl, unlockAt: null, revealed: true } : round.clue;
      return {
        room: room({
          phase: 'reveal',
          players: PLAYERS.map((p) => ({ ...p, solved: p.id !== 'p4' })),
          round: { ...round, clue, answer: ANSWER, yourPoints: 640 },
        }),
      };
    }
    case 'results':
    case 'results-guest':
      return { room: room({ phase: 'results', you: name === 'results' ? 'p1' : 'p3', phaseEndsAt: null, round: { number: 10, total: 10 } }) };
    case 'results-solo':
      return { room: room({ phase: 'results', phaseEndsAt: null, players: [{ ...PLAYERS[0], score: 6240 }], round: { number: 5, total: 5 } }) };
    case 'reconnecting': {
      const { start, round } = guessingRound('still', 20_000);
      return { room: room({ phase: 'guessing', phaseStartedAt: start, phaseEndsAt: start + GUESS_MS, players: PLAYERS, round }), connected: false };
    }
    default:
      return null;
  }
}

export const SCENES = [
  'home', 'home-error', 'lobby', 'lobby-solo', 'lobby-guest', 'intro', 'poster', 'still', 'plot', 'solved',
  'reveal-poster', 'reveal-plot', 'results', 'results-guest', 'results-solo', 'reconnecting',
];

const unavailable = async () => ({ ok: false, error: 'bad_request' });

export default function Preview() {
  const name = new URLSearchParams(window.location.search).get('preview');
  const data = useMemo(() => scene(name), [name]);

  if (!data) {
    return (
      <ul style={{ padding: 24, fontFamily: 'system-ui', lineHeight: 2 }}>
        {SCENES.map((s) => (
          <li key={s}>
            <a href={`?preview=${s}`}>{s}</a>
          </li>
        ))}
      </ul>
    );
  }

  const value = {
    room: data.room,
    me: data.room?.players.find((p) => p.id === data.room.you) ?? null,
    connected: data.connected ?? true,
    resuming: false,
    notice: data.notice ?? null,
    savedName: 'Sam',
    serverNow: () => NOW,
    createRoom: unavailable,
    joinRoom: unavailable,
    startGame: unavailable,
    guess: async () => ({ ok: true, correct: false }),
    leave: async () => {},
    dismissNotice: () => {},
  };

  return (
    <ThemeProvider>
      <GameContext.Provider value={value}>
        <GameScreens />
      </GameContext.Provider>
    </ThemeProvider>
  );
}
