import React, { useState } from 'react';
import { Check, Copy, Crown, LogOut, Play, Share2, Loader2 } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { useGame } from '../../game/GameContext';
import { errorMessage } from '../../game/errors';
import { primaryButton, secondaryButton, quietButton, mutedText } from '../ui';

const ROUND_OPTIONS = [5, 10, 15];

export function shareLink(code) {
  const url = new URL(window.location.href);
  url.search = `?room=${code}`;
  url.hash = '';
  return url.toString();
}

export function RoundCountPicker({ value, onChange }) {
  return (
    <fieldset className="flex items-center justify-between gap-3">
      <legend className="sr-only">Number of rounds</legend>
      <span className={`text-sm ${mutedText}`} aria-hidden="true">
        Rounds
      </span>
      <div className="flex rounded-xl border border-stone-300 p-1 dark:border-stone-700">
        {ROUND_OPTIONS.map((n) => (
          <label
            key={n}
            className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm tabular-nums transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-stone-500 ${
              value === n
                ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900'
                : 'text-stone-700 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:bg-stone-800/60'
            }`}
          >
            <input type="radio" name="rounds" value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" />
            {n}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function Lobby() {
  const { room, me, startGame, leave } = useGame();
  const [rounds, setRounds] = useState(10);
  const [copied, setCopied] = useState(null); // 'link' | 'code'
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const isHost = me?.isHost;
  const host = room.players.find((p) => p.isHost);
  const alone = room.players.length === 1;
  const link = shareLink(room.code);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function copy(kind, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  async function share() {
    try {
      await navigator.share({ title: 'Movie Match', text: `Join my Movie Match room: ${room.code}`, url: link });
    } catch {
      // Dismissed share sheet: nothing to do.
    }
  }

  async function start() {
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

      <main className="flex-1 flex justify-center px-4 pb-10 pt-6 sm:pt-12">
        <div className="w-full max-w-sm">
          <section className="text-center" aria-labelledby="room-code-heading">
            <h1 id="room-code-heading" className="sr-only">
              Room {room.code}
            </h1>
            <p className="font-serif text-7xl leading-none tracking-[0.12em] text-stone-900 dark:text-stone-50 tabular-nums" aria-hidden="true">
              {room.code}
            </p>
            <p className={`mt-3 text-sm ${mutedText}`}>Friends join with this code.</p>
            <div className="mt-5 flex justify-center gap-2">
              {canNativeShare ? (
                <button type="button" onClick={share} className={secondaryButton}>
                  <Share2 size={18} aria-hidden="true" />
                  Share invite
                </button>
              ) : (
                <button type="button" onClick={() => copy('link', link)} className={secondaryButton}>
                  {copied === 'link' ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
                  {copied === 'link' ? 'Link copied' : 'Copy invite link'}
                </button>
              )}
              <button type="button" onClick={() => copy('code', room.code)} className={secondaryButton} aria-label="Copy room code">
                {copied === 'code' ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
              </button>
            </div>
            <p className="sr-only" role="status">
              {copied ? `${copied === 'link' ? 'Invite link' : 'Room code'} copied` : ''}
            </p>
          </section>

          <section className="mt-12" aria-labelledby="players-heading">
            <div className="flex items-baseline justify-between">
              <h2 id="players-heading" className="text-2xl text-stone-900 dark:text-stone-50">
                Players
              </h2>
              <span className={`text-sm tabular-nums ${mutedText}`}>{room.players.length} of 8</span>
            </div>
            <ul className="mt-3 divide-y divide-stone-200 border-y border-stone-200 dark:divide-stone-800 dark:border-stone-800">
              {room.players.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-stone-200 text-sm font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-200" aria-hidden="true">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <span className={`flex-1 ${p.connected ? 'text-stone-900 dark:text-stone-100' : 'text-stone-600 dark:text-stone-400'}`}>
                    {p.name}
                    {p.id === room.you && <span className={`ml-1.5 text-sm ${mutedText}`}>(you)</span>}
                    {!p.connected && <span className={`ml-1.5 text-sm ${mutedText}`}>away</span>}
                  </span>
                  {p.isHost && (
                    <span className={`flex items-center gap-1 text-sm ${mutedText}`}>
                      <Crown size={15} aria-hidden="true" />
                      Host
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 space-y-4" aria-label="Start">
            {isHost ? (
              <>
                <RoundCountPicker value={rounds} onChange={setRounds} />
                <button type="button" onClick={start} disabled={starting} className={`${primaryButton} w-full`}>
                  {starting ? (
                    <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  ) : (
                    <Play size={18} aria-hidden="true" />
                  )}
                  {starting ? 'Starting…' : alone ? 'Start playing solo' : 'Start the game'}
                </button>
                <p className={`text-center text-sm ${mutedText}`}>
                  {alone ? 'Friends can join with the code until you start.' : 'Everyone here plays from their own phone.'}
                </p>
              </>
            ) : (
              <p className={`text-center ${mutedText}`}>Waiting for {host?.name ?? 'the host'} to start the game…</p>
            )}
            <p role="alert" className="min-h-[1.25rem] text-center text-sm text-stone-700 dark:text-stone-300">
              {error ? errorMessage(error) : ''}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
