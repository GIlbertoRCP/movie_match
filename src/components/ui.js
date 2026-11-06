// Shared control styles, taken from the home screen so every screen uses the same controls.

export const inputClass =
  'w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-900/80 px-4 py-3 text-base text-stone-900 dark:text-stone-100 placeholder:text-stone-500 dark:placeholder:text-stone-400 caret-stone-900 dark:caret-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:focus-visible:ring-stone-400 disabled:opacity-60';

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-500 focus-visible:ring-offset-[#FBF9F5] dark:focus-visible:ring-offset-[#121110] disabled:cursor-not-allowed disabled:opacity-40';

export const primaryButton = `${buttonBase} bg-stone-900 text-stone-50 hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300`;

export const secondaryButton = `${buttonBase} border border-stone-300 text-stone-800 hover:bg-stone-200/60 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800/60`;

export const quietButton =
  'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-stone-600 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:bg-stone-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500';

export const mutedText = 'text-stone-600 dark:text-stone-400';
