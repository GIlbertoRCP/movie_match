import React, { useState } from 'react';
import { Moon, Sun, Users, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const NAME_MAX = 20;
const CODE_LENGTH = 4;

const normalizeCode = (value) =>
  value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, CODE_LENGTH);

export default function HomeScreen() {
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');

  const trimmedName = name.trim();
  const nameValid = trimmedName.length > 0;
  const codeValid = code.length === CODE_LENGTH;

  // The server side of rooms is done (milestone 2); these screens get wired up in milestone 4.
  const handleCreate = (event) => {
    event.preventDefault();
    if (!nameValid) return;
    setNotice(`Creating rooms isn't live yet, ${trimmedName}. The game screens land in milestone 4.`);
  };

  const handleJoin = (event) => {
    event.preventDefault();
    if (!nameValid || !codeValid) return;
    setNotice(`Joining room ${code} isn't live yet. The game screens land in milestone 4.`);
  };

  const inputClass =
    'w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-900/80 px-4 py-3 text-base text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:focus-visible:ring-stone-400';
  const buttonBase =
    'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-500 focus-visible:ring-offset-[#FBF9F5] dark:focus-visible:ring-offset-[#121110] disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="min-h-screen ambient-bg flex flex-col">
      <header className="flex justify-end px-4 pt-4 sm:px-6">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="rounded-full p-2.5 text-stone-600 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:bg-stone-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
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
            <button
              type="submit"
              disabled={!nameValid}
              className={`${buttonBase} w-full bg-stone-900 text-stone-50 hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300`}
            >
              <Users size={18} aria-hidden="true" />
              Create a room
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
              disabled={!nameValid || !codeValid}
              className={`${buttonBase} shrink-0 border border-stone-300 text-stone-800 hover:bg-stone-200/60 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800/60`}
            >
              Join
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>

          <p role="status" className="mt-6 min-h-[1.5rem] text-center text-sm text-stone-600 dark:text-stone-400">
            {notice}
          </p>
        </div>
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-stone-500 dark:text-stone-500">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </div>
  );
}
