// Client-side game state: one socket, the latest room:state from the server,
// and the actions players take. The server is the source of truth; this only
// mirrors what it sends and remembers the session token for reconnects.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../config';

const SESSION_KEY = 'movie-match:session';
const ACK_TIMEOUT_MS = 8_000;

export const GameContext = createContext(null);

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable: reconnects within this page still work.
  }
}

// Keeps ?room=CODE in the address bar so the URL is the share link.
function setRoomInUrl(code) {
  const url = new URL(window.location.href);
  if (code) url.searchParams.set('room', code);
  else url.searchParams.delete('room');
  window.history.replaceState(null, '', url);
}

export function roomCodeFromUrl() {
  const code = new URLSearchParams(window.location.search).get('room') || '';
  return code.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
}

export function GameProvider({ children }) {
  const socketRef = useRef(null);
  const sessionRef = useRef(readSession());
  const [room, setRoom] = useState(null);
  const [connected, setConnected] = useState(false);
  const [resuming, setResuming] = useState(Boolean(sessionRef.current));
  const [notice, setNotice] = useState(null); // error code shown on the home screen
  // serverNow ≈ Date.now() + clockOffset. Timers are drawn from server timestamps.
  const [clockOffset, setClockOffset] = useState(0);

  const applyState = useCallback((state) => {
    if (!state) return;
    setClockOffset(state.serverNow - Date.now());
    setRoom(state);
  }, []);

  const forgetSession = useCallback((code = null) => {
    sessionRef.current = null;
    writeSession(null);
    setRoom(null);
    setRoomInUrl(null);
    if (code) setNotice(code);
  }, []);

  const call = useCallback((event, payload = {}) => {
    const socket = socketRef.current;
    return socket
      .timeout(ACK_TIMEOUT_MS)
      .emitWithAck(event, payload)
      .catch(() => ({ ok: false, error: 'offline' }));
  }, []);

  const resume = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    setResuming(true);
    const reply = await call('room:resume', { code: session.code, token: session.token });
    setResuming(false);
    if (reply.ok) applyState(reply.state);
    else if (reply.error !== 'offline') forgetSession(reply.error);
  }, [applyState, call, forgetSession]);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnected(true);
      resume(); // first load with a saved seat, or any reconnect after a drop
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setResuming(false));
    socket.on('room:state', applyState);
    socket.on('session:replaced', () => forgetSession('replaced'));
    return () => socket.disconnect();
  }, [applyState, forgetSession, resume]);

  const enterRoom = useCallback(
    (reply, name) => {
      sessionRef.current = { code: reply.code, token: reply.token, name };
      writeSession(sessionRef.current);
      setRoomInUrl(reply.code);
      setNotice(null);
      applyState(reply.state);
    },
    [applyState]
  );

  const actions = useMemo(
    () => ({
      async createRoom(name) {
        const reply = await call('room:create', { name });
        if (reply.ok) enterRoom(reply, name);
        return reply;
      },
      async joinRoom(code, name) {
        const reply = await call('room:join', { code, name });
        if (reply.ok) enterRoom(reply, name);
        return reply;
      },
      startGame: (roundCount) => call('game:start', { roundCount }),
      guess: (text) => call('guess:submit', { text }),
      async leave() {
        await call('room:leave');
        forgetSession();
      },
      dismissNotice: () => setNotice(null),
    }),
    [call, enterRoom, forgetSession]
  );

  const value = useMemo(
    () => ({
      room,
      me: room?.players.find((p) => p.id === room.you) ?? null,
      connected,
      resuming,
      notice,
      savedName: sessionRef.current?.name ?? '',
      serverNow: () => Date.now() + clockOffset,
      ...actions,
    }),
    [room, connected, resuming, notice, clockOffset, actions]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}

// Re-renders on an interval while `active`, returning the current server time.
export function useServerClock(active, intervalMs = 200) {
  const { serverNow } = useGame();
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    if (!active) return undefined;
    setNow(serverNow());
    const id = setInterval(() => setNow(serverNow()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, serverNow]);
  return now;
}

// Server clue URLs are paths (/api/clues/<token>); the dev preview passes a ready-made image URL.
export const clueImageUrl = (clue, level) =>
  clue.url.startsWith('/') ? `${BACKEND_URL}${clue.url}/${level}` : clue.url;
