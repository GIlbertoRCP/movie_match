import React, { useEffect, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { clueImageUrl } from '../../game/GameContext';
import { BLANK } from '../../game/clues';

// Requests a level slightly before its unlock time so it lands on schedule;
// the server allows 250ms of clock slack and we retry anything refused.
const PREFETCH_MS = 150;
const RETRY_MS = 300;
const MAX_RETRIES = 4;

export function unlockedLevel(clue, now) {
  if (!clue?.levels) return 0;
  if (clue.revealed) return clue.levels;
  const unlocked = clue.unlockAt.filter((at) => at - PREFETCH_MS <= now).length;
  return Math.max(0, unlocked - 1);
}

// Stacks rendered levels and fades each new one in over the last, so the
// image visibly sharpens rather than flickering between loads.
function ImageClue({ clue, level, alt }) {
  const [layers, setLayers] = useState([]); // [{ level, src, loaded }]
  const [failed, setFailed] = useState(false);
  const retries = useRef({});

  useEffect(() => {
    setLayers((current) => {
      if (current.some((l) => l.level === level)) return current;
      return [...current, { level, src: clueImageUrl(clue, level), loaded: false }].slice(-3);
    });
  }, [clue, level]);

  const onLoad = (lvl) => setLayers((current) => current.map((l) => (l.level === lvl ? { ...l, loaded: true } : l)));
  const onError = (lvl) => {
    const tries = (retries.current[lvl] ?? 0) + 1;
    retries.current[lvl] = tries;
    if (tries > MAX_RETRIES) {
      setLayers((current) => {
        // Only show the failure if nothing has loaded at all; otherwise keep the last good level.
        if (!current.some((l) => l.loaded)) setFailed(true);
        return current.filter((l) => l.level !== lvl);
      });
      return;
    }
    setTimeout(() => {
      setLayers((current) =>
        current.map((l) => (l.level === lvl ? { ...l, src: `${clueImageUrl(clue, lvl)}?r=${tries}` } : l))
      );
    }, RETRY_MS);
  };

  const aspect = clue.type === 'poster' ? 'aspect-[2/3] h-full max-w-full' : 'aspect-video w-full max-h-full';

  return (
    <div className={`relative ${aspect} overflow-hidden rounded-2xl bg-stone-200 dark:bg-stone-900 shadow-[0_18px_40px_-18px_rgba(28,25,23,0.45)]`}>
      {failed ? (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-stone-600 dark:text-stone-400">
          <div>
            <ImageOff className="mx-auto mb-2" size={22} aria-hidden="true" />
            Couldn't load this clue. Keep guessing, or wait for the reveal.
          </div>
        </div>
      ) : (
        layers.map((layer) => (
          <img
            key={layer.level}
            src={layer.src}
            alt={layer.level === level ? alt : ''}
            aria-hidden={layer.level === level ? undefined : true}
            draggable={false}
            onLoad={() => onLoad(layer.level)}
            onError={() => onError(layer.level)}
            className={`absolute inset-0 h-full w-full object-cover select-none transition-opacity duration-700 ease-out motion-reduce:transition-none ${
              layer.loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))
      )}
    </div>
  );
}

// Splits a redacted synopsis into text and blanks, so each blank renders as an ink bar.
function Blank() {
  return (
    <span
      role="img"
      aria-label="blank"
      className="mx-0.5 inline-block h-[0.82em] w-[2.6em] translate-y-[0.08em] rounded-[3px] bg-stone-900 dark:bg-stone-100"
    />
  );
}

function PlotClue({ text }) {
  // Words containing a blank ("█████," or "█████"") are kept on one line with
  // their punctuation, so a blank never wraps away from its quote mark.
  const tokens = text.split(/(\S*█████\S*)/);
  // Large by default; long synopses (the pool runs from ~85 to ~615 characters)
  // step down so they still fit a phone, and again while the keyboard is open
  // (the whole clue should stay readable while typing); scrolling is the last resort.
  const size =
    text.length <= 280
      ? 'text-[clamp(1.5rem,6.4vw,2.25rem)]'
      : text.length <= 440
        ? 'text-[clamp(1.3rem,5.4vw,1.9rem)]'
        : 'text-[clamp(1.15rem,4.6vw,1.6rem)]';
  return (
    <blockquote className={`max-h-full max-w-[34ch] overflow-y-auto font-serif ${size} group-data-[keyboard=open]/app:text-[clamp(1.1rem,4.8vw,1.4rem)] leading-snug text-stone-900 dark:text-stone-50 text-balance`}>
      {tokens.map((token, i) => {
        if (!token.includes(BLANK)) return <React.Fragment key={i}>{token}</React.Fragment>;
        const pieces = token.split(BLANK);
        return (
          <span key={i} className="whitespace-nowrap">
            {pieces.map((piece, j) => (
              <React.Fragment key={j}>
                {piece}
                {j < pieces.length - 1 && <Blank />}
              </React.Fragment>
            ))}
          </span>
        );
      })}
    </blockquote>
  );
}

export default function ClueView({ clue, clueType, now, alt }) {
  if (!clue) return null;
  if (clue.type === 'plot') return <PlotClue text={clue.text} />;
  // Keyed by URL: a new round's clue starts with a fresh stack of layers.
  return <ImageClue key={clue.url} clue={clue} level={unlockedLevel(clue, now)} alt={alt ?? `${clueType} clue`} />;
}
