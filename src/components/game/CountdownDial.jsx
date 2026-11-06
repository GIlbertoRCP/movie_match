import React from 'react';

const SIZE = 60;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2 - 1;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// The round's clock: one arc per clue level, filling as time passes, with
// the seconds left in the centre. `segments` are { start, end } in server ms.
// `urgent` (the last seconds of guessing) steps the numerals up a weight.
export default function CountdownDial({ segments, now, endsAt, label, urgent = false }) {
  const count = Math.max(1, segments.length);
  const gap = count > 1 ? 6 : 0;
  const slot = CIRCUMFERENCE / count;
  const length = slot - gap;
  const seconds = Math.max(0, Math.ceil((endsAt - now) / 1000));

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }} role="timer" aria-label={label ?? `${seconds} seconds left`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" aria-hidden="true">
        {segments.map((segment, i) => {
          const span = Math.max(1, segment.end - segment.start);
          const fraction = Math.min(1, Math.max(0, (now - segment.start) / span));
          const common = { cx: SIZE / 2, cy: SIZE / 2, r: RADIUS, fill: 'none', strokeDashoffset: -i * slot };
          return (
            <g key={i}>
              {/* Future time: a hairline that stays visible against the ground (≥3:1). */}
              <circle
                {...common}
                strokeWidth={2}
                className="stroke-stone-500"
                strokeDasharray={`${length} ${CIRCUMFERENCE}`}
              />
              <circle
                {...common}
                strokeWidth={STROKE}
                className="stroke-stone-900 dark:stroke-stone-100"
                strokeDasharray={`${length * fraction} ${CIRCUMFERENCE}`}
              />
            </g>
          );
        })}
      </svg>
      <span
        className={`absolute inset-0 grid place-items-center font-serif text-[22px] leading-none tabular-nums text-stone-900 dark:text-stone-50 ${
          urgent ? 'font-medium' : 'font-normal'
        }`}
      >
        {seconds}
      </span>
    </div>
  );
}
