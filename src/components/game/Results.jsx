import React, { useState } from 'react';
import { LogOut, RotateCcw, Loader2 } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { useGame } from '../../game/GameContext';
import { errorMessage } from '../../game/errors';
import { RoundCountPicker } from './Lobby';
import { primaryButton, quietButton, mutedText } from '../ui';

function headline(ranked, you) {
  const top = ranked[0];
  const tied = ranked.filter((p) => p.score === top.score);
  if (ranked.length > 1 && tied.length > 1) return "It's a tie";
  if (ranked.length === 1) return `${top.score.toLocaleString()} points`;
  return top.id === you ? 'You win' : `${top.name} wins`;
}

export default function Results() {
  const { room, me, startGame, leave } = useGame();
  const [rounds, setRounds] = useState(room.round?.total ?? 10);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const ranked = [...room.players].sort((a, b) => b.score - a.score);
  const host = room.players.find((p) => p.isHost);
  // Standard competition ranking: equal scores share a place.
  const placeOf = (p) => ranked.findIndex((q) => q.score === p.score) + 1;

  async function again() {
    setStarting(true);
    setError(null);
    const reply = await startGame(rounds);
    setStarting(false);
    if (!reply.ok) setError(reply.error);
  }

  return (
    <div className="min-h-full ambient-bg flex flex-col">
      <header className="flex items-center justify-between px-4 pt-4 sm:px-6">
        <button type="button" onClick={leave} className={quietButton}>
          <LogOut size={16} aria-hidden="true" />
          Leave
        </button>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex justify-center px-4 pb-10 pt-8 sm:pt-14">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <h1 className="font-serif text-5xl leading-tight text-stone-900 dark:text-stone-50 text-balance">{headline(ranked, room.you)}</h1>
            <p className={`mt-2 ${mutedText}`}>
              {room.round?.total} rounds{ranked.length === 1 ? ' solo' : ''} · room {room.code}
            </p>
          </div>

          {ranked.length > 1 && (
            <ol className="mt-10 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800" aria-label="Final scores">
              {ranked.map((p) => {
                const isYou = p.id === room.you;
                return (
                  <li key={p.id} className="flex items-center gap-4 py-3.5">
                    <span className={`w-5 text-sm tabular-nums ${mutedText}`}>{placeOf(p)}</span>
                    <span className={`flex-1 text-stone-900 dark:text-stone-100 ${isYou ? 'font-semibold' : ''}`}>
                      {isYou ? `${p.name} (you)` : p.name}
                    </span>
                    <span className="font-serif text-2xl tabular-nums text-stone-900 dark:text-stone-50">{p.score.toLocaleString()}</span>
                  </li>
                );
              })}
            </ol>
          )}

          <section className="mt-10 space-y-4" aria-label="Play again">
            {me?.isHost ? (
              <>
                <RoundCountPicker value={rounds} onChange={setRounds} />
                <button type="button" onClick={again} disabled={starting} className={`${primaryButton} w-full`}>
                  {starting ? (
                    <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  ) : (
                    <RotateCcw size={18} aria-hidden="true" />
                  )}
                  {starting ? 'Starting…' : 'Play again'}
                </button>
              </>
            ) : (
              <p className={`text-center ${mutedText}`}>Waiting for {host?.name ?? 'the host'} to start another game…</p>
            )}
            <p role="alert" className="min-h-[1.25rem] text-center text-sm text-stone-700 dark:text-stone-300">
              {error ? errorMessage(error) : ''}
            </p>
          </section>
        </div>
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-stone-600 dark:text-stone-400">
        Movie data and images from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </div>
  );
}
