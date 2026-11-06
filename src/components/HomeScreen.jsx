import React, { useState } from 'react';
import { Users, ArrowRight, Loader2 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useGame, roomCodeFromUrl } from '../game/GameContext';
import { errorMessage } from '../game/errors';
import { inputClass, primaryButton, secondaryButton } from './ui';

const NAME_MAX = 20;
const CODE_LENGTH = 4;

const normalizeCode = (value) =>
  value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, CODE_LENGTH);

export default function HomeScreen() {
  const { createRoom, joinRoom, notice, savedName, connected } = useGame();
  const [name, setName] = useState(savedName);
  // A share link (?room=CODE) pre-fills the code.
  const [code, setCode] = useState(roomCodeFromUrl);
  const [pending, setPending] = useState(null); // 'create' | 'join'
  const [error, setError] = useState(null);

  const trimmedName = name.trim();
  const nameValid = trimmedName.length > 0;
  const codeValid = code.length === CODE_LENGTH;
  const message = error ?? notice;

  async function run(kind, action) {
    setPending(kind);
    setError(null);
    const reply = await action();
    setPending(null);
    if (!reply.ok) setError(reply.error);
  }

  const handleCreate = (event) => {
    event.preventDefault();
    if (!nameValid || pending) return;
    run('create', () => createRoom(trimmedName));
  };

  const handleJoin = (event) => {
    event.preventDefault();
    if (!nameValid || !codeValid || pending) return;
    run('join', () => joinRoom(code, trimmedName));
  };

  return (
    <div className="min-h-dvh ambient-bg flex flex-col">
      <header className="flex justify-end px-4 pt-4 sm:px-6">
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <h1 className="text-5xl text-stone-900 dark:text-stone-50">Movie Match</h1>
            <p className="mt-3 text-stone-600 dark:text-stone-400">
              Guess the movie before your friends do.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            <label htmlFor="player-name" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              Your name
            </label>
            <input
              id="player-name"
              type="text"
              autoComplete="nickname"
              maxLength={NAME_MAX}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Sam"
              className={inputClass}
            />
            <button type="submit" disabled={!nameValid || Boolean(pending)} className={`${primaryButton} w-full`}>
              {pending === 'create' ? (
                <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <Users size={18} aria-hidden="true" />
              )}
              {pending === 'create' ? 'Creating room…' : 'Create a room'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-sm text-stone-500 dark:text-stone-500" aria-hidden="true">
            <span className="h-px flex-1 bg-stone-300 dark:bg-stone-700" />
            or join one
            <span className="h-px flex-1 bg-stone-300 dark:bg-stone-700" />
          </div>

          <form onSubmit={handleJoin} className="flex gap-2">
            <label htmlFor="room-code" className="sr-only">
              Room code
            </label>
            <input
              id="room-code"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              value={code}
              onChange={(event) => setCode(normalizeCode(event.target.value))}
              placeholder="CODE"
              className={`${inputClass} min-w-0 text-center font-mono tracking-[0.4em] uppercase`}
            />
            <button
              type="submit"
              disabled={!nameValid || !codeValid || Boolean(pending)}
              className={`${secondaryButton} shrink-0`}
            >
              {pending === 'join' ? 'Joining…' : 'Join'}
              {pending !== 'join' && <ArrowRight size={18} aria-hidden="true" />}
            </button>
          </form>

          <p role="status" className="mt-6 min-h-[1.5rem] text-center text-sm text-stone-600 dark:text-stone-400">
            {message ? errorMessage(message) : !connected ? 'Connecting to the game server…' : ''}
          </p>
        </div>
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-stone-600 dark:text-stone-400">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </div>
  );
}
