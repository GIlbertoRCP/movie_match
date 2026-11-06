import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useGame, useServerClock } from '../../game/GameContext';
import { errorMessage } from '../../game/errors';
import { CLUE_INSTRUCTIONS, CLUE_LABELS } from '../../game/clues';
import CountdownDial from './CountdownDial';
import ClueView, { unlockedLevel } from './ClueView';
import PlayerChips from './PlayerChips';
import { inputClass, primaryButton, mutedText } from '../ui';

function dialSegments(room) {
  const clue = room.round?.clue;
  if (room.phase === 'guessing' && clue?.unlockAt) {
    return clue.unlockAt.map((start, i) => ({ start, end: clue.unlockAt[i + 1] ?? room.phaseEndsAt }));
  }
  return [{ start: room.phaseStartedAt, end: room.phaseEndsAt }];
}

function seconds(ms) {
  return Math.max(0, Math.ceil(ms / 1000));
}

function GuessForm({ solved, points }) {
  const { guess } = useGame();
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState(null); // { kind: 'wrong' | 'error', message }
  const [pending, setPending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  if (solved) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-stone-900 px-4 py-3.5 text-stone-50 dark:bg-stone-100 dark:text-stone-900">
        <Check size={20} strokeWidth={2.5} aria-hidden="true" />
        <span className="flex-1">You got it</span>
        <span className="font-serif text-xl tabular-nums">+{points}</span>
      </div>
    );
  }

  async function submit(event) {
    event.preventDefault();
    const value = text.trim();
    if (!value || pending) return;
    setPending(true);
    const reply = await guess(value);
    setPending(false);
    if (reply.ok && reply.correct) {
      setFeedback(null);
      return; // the server's next state flips this form to "You got it"
    }
    setFeedback(
      reply.ok
        ? { kind: 'wrong', message: `Not "${value}". Try again.` }
        : { kind: 'error', message: errorMessage(reply.error) }
    );
    inputRef.current?.select();
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <label htmlFor="guess" className="sr-only">
          Your guess
        </label>
        <input
          ref={inputRef}
          id="guess"
          type="text"
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={100}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (feedback) setFeedback(null);
          }}
          placeholder="Name the movie"
          aria-describedby="guess-feedback"
          className={`${inputClass} min-w-0`}
        />
        <button type="submit" disabled={!text.trim() || pending} className={`${primaryButton} shrink-0`}>
          {pending ? <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-label="Checking" /> : 'Guess'}
        </button>
      </div>
      <p id="guess-feedback" aria-live="polite" className={`min-h-[1.25rem] px-1 text-sm ${mutedText}`}>
        {feedback?.message ?? ''}
      </p>
    </form>
  );
}

// Announces round starts, other players' solves, sharpenings and the answer to
// screen readers, through one persistent live region.
function useAnnouncements(room, level) {
  const [message, setMessage] = useState('');
  const solvedBefore = useRef(new Set());
  const lastLevel = useRef(level);
  const lastPhase = useRef(null);
  const { round, phase } = room;

  useEffect(() => {
    const key = `${round.number}:${phase}`;
    if (lastPhase.current === key) return;
    lastPhase.current = key;
    if (phase === 'round_intro') {
      setMessage(`Round ${round.number} of ${round.total}: ${CLUE_LABELS[round.clueType]}.`);
    } else if (phase === 'reveal' && round.answer) {
      const year = round.answer.year ? ` (${round.answer.year})` : '';
      const points = round.yourPoints != null ? ` You got it for ${round.yourPoints} points.` : '';
      setMessage(`It was ${round.answer.title}${year}.${points}`);
    }
  }, [phase, round]);

  useEffect(() => {
    if (room.phase !== 'guessing') {
      solvedBefore.current = new Set();
      return;
    }
    const newly = room.players.filter((p) => p.solved && !solvedBefore.current.has(p.id));
    room.players.filter((p) => p.solved).forEach((p) => solvedBefore.current.add(p.id));
    const youSolved = newly.some((p) => p.id === room.you);
    const others = newly.filter((p) => p.id !== room.you);
    if (youSolved) setMessage(`You got it for ${room.round.yourPoints} points.`);
    else if (others.length) setMessage(`${others.map((p) => p.name).join(' and ')} got it.`);
  }, [room]);

  useEffect(() => {
    if (level > lastLevel.current && room.phase === 'guessing') setMessage('The clue just got clearer.');
    lastLevel.current = level;
  }, [level, room.phase]);

  return message;
}

function Intro({ round }) {
  return (
    <div className="text-center">
      <p className="font-serif text-4xl text-stone-900 dark:text-stone-50">{CLUE_LABELS[round.clueType]}</p>
      <p className={`mx-auto mt-3 max-w-[28ch] ${mutedText}`}>{CLUE_INSTRUCTIONS[round.clueType]}</p>
    </div>
  );
}

// Plot rounds have no image of their own: the reveal fades the film's poster in.
function RevealPoster({ answer }) {
  const [loaded, setLoaded] = useState(false);
  if (!answer.posterUrl) return null;
  return (
    <img
      src={answer.posterUrl}
      alt={`Poster for ${answer.title}`}
      onLoad={() => setLoaded(true)}
      className={`aspect-[2/3] h-full max-w-full rounded-2xl object-cover shadow-[0_18px_40px_-18px_rgba(28,25,23,0.45)] transition-opacity duration-700 ease-out motion-reduce:transition-none ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}

function RevealCaption({ room, now }) {
  const { round, players } = room;
  const solvers = players.filter((p) => p.solved).length;
  const isLast = round.number === round.total;
  const result =
    round.yourPoints != null
      ? `You got it for ${round.yourPoints} points.`
      : solvers === 0
        ? 'Nobody got this one.'
        : `${solvers} of ${players.length} got it.`;

  return (
    <div className="mt-4 text-center">
      <h2 className="font-serif text-[clamp(1.75rem,7vw,2.5rem)] leading-tight text-balance text-stone-900 dark:text-stone-50">
        {round.answer.title}
        {round.answer.year && <span className={`ml-2 text-[0.6em] ${mutedText}`}>{round.answer.year}</span>}
      </h2>
      <p className={`mt-1 tabular-nums ${mutedText}`}>
        {result} {isLast ? 'Final scores' : 'Next round'} in {seconds(room.phaseEndsAt - now)}s.
      </p>
    </div>
  );
}

export default function Round() {
  const { room, me } = useGame();
  const now = useServerClock(true, 100);
  const { round, phase } = room;
  const level = unlockedLevel(round.clue, now);
  const announcement = useAnnouncements(room, level);
  const showClue = phase === 'guessing' || phase === 'reveal';
  const isImageClue = round.clue && round.clue.type !== 'plot';
  const secondsLeft = seconds(room.phaseEndsAt - now);

  const nextUnlock = round.clue?.unlockAt?.find((at) => at > now);
  const hint = me?.solved
    ? 'Waiting for the others.'
    : round.clue?.type === 'plot'
      ? 'Name it before the clock runs out.'
      : nextUnlock
        ? `Sharpens in ${seconds(nextUnlock - now)}s`
        : 'This is as clear as it gets.';

  const dialLabel =
    phase === 'round_intro'
      ? `Round starts in ${secondsLeft} seconds`
      : phase === 'reveal'
        ? `${round.number === round.total ? 'Final scores' : 'Next round'} in ${secondsLeft} seconds`
        : `${secondsLeft} seconds left`;

  return (
    <div className="h-full ambient-bg flex flex-col overflow-hidden">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 pt-5 pb-2 group-data-[keyboard=open]/app:pt-3">
        <div>
          <h1 className="font-serif text-[22px] leading-tight text-stone-900 dark:text-stone-50">Round {round.number}</h1>
          <p className={`text-xs tracking-[0.02em] ${mutedText}`}>
            of {round.total} · {CLUE_LABELS[round.clueType]}
            {/* The chips fold away while typing; keep the room's progress visible. */}
            {phase === 'guessing' && room.players.length > 1 && (
              <span className="hidden tabular-nums group-data-[keyboard=open]/app:inline" aria-hidden="true">
                {' '}· {room.players.filter((p) => p.solved).length} of {room.players.length} got it
              </span>
            )}
          </p>
        </div>
        <CountdownDial
          segments={dialSegments(room)}
          now={now}
          endsAt={room.phaseEndsAt}
          label={dialLabel}
          urgent={phase === 'guessing' && !me?.solved && secondsLeft <= 5}
        />
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-3">
        {phase === 'round_intro' && <Intro round={round} />}
        {showClue && (
          <>
            {/* One clue slot from guessing through the reveal, so the final, clear
                image cross-fades over the last level instead of remounting. */}
            <div className="flex min-h-0 w-full max-w-3xl flex-1 items-center justify-center">
              {phase === 'reveal' && !isImageClue ? (
                <RevealPoster answer={round.answer} />
              ) : (
                <ClueView
                  clue={round.clue}
                  clueType={round.clueType}
                  now={now}
                  alt={phase === 'reveal' ? `${CLUE_LABELS[round.clueType]} for ${round.answer.title}` : undefined}
                />
              )}
            </div>
            {phase === 'guessing' ? (
              <p className={`mt-3 text-sm tabular-nums ${mutedText} group-data-[keyboard=open]/app:hidden`}>{hint}</p>
            ) : (
              <RevealCaption room={room} now={now} />
            )}
          </>
        )}
      </main>

      <footer className="mx-auto w-full max-w-xl space-y-3 px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {room.players.length > 1 && (
          <div className="group-data-[keyboard=open]/app:hidden">
            <PlayerChips players={room.players} you={room.you} />
          </div>
        )}
        {phase === 'guessing' ? (
          <GuessForm key={round.number} solved={Boolean(me?.solved)} points={round.yourPoints} />
        ) : phase === 'reveal' ? (
          <p className="flex h-[4.75rem] items-end justify-center pb-1 text-center text-xs text-stone-600 dark:text-stone-400">
            Movie data and images from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        ) : (
          <div className="h-[4.75rem]" aria-hidden="true" />
        )}
      </footer>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
