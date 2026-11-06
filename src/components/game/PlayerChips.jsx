import React from 'react';
import { Check } from 'lucide-react';

const initial = (name) => name.trim().charAt(0).toUpperCase() || '?';

// Everyone in the room as a compact row; a chip turns to ink when that player solves.
export default function PlayerChips({ players, you }) {
  return (
    <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Players">
      {players.map((p) => {
        const isYou = p.id === you;
        const label = isYou ? 'You' : p.name;
        return (
          <li
            key={p.id}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-sm transition-colors duration-300 motion-reduce:transition-none ${
              p.solved
                ? 'border-stone-900 bg-stone-900 text-stone-50 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                : p.connected
                  ? 'border-stone-300 text-stone-800 dark:border-stone-700 dark:text-stone-200'
                  : 'border-dashed border-stone-400 text-stone-600 dark:border-stone-600 dark:text-stone-400'
            }`}
          >
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${
                p.solved ? 'bg-stone-700 text-stone-50 dark:bg-stone-300 dark:text-stone-900' : 'bg-stone-200 dark:bg-stone-800'
              }`}
              aria-hidden="true"
            >
              {p.solved ? <Check size={13} strokeWidth={3} /> : initial(p.name)}
            </span>
            {label}
            <span className="sr-only">
              {p.solved ? ', solved' : ''}
              {p.connected ? '' : ', away'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
