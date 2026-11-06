// Guess matching: forgiving about case, punctuation, accents, a leading
// article and small typos, but strict enough that short titles must be exact.

const LEADING_ARTICLE = /^(the|a|an) /;

export function normalizeTitle(value) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]+/g, ' ') // punctuation -> space
    .replace(/\s+/g, ' ')
    .trim()
    .replace(LEADING_ARTICLE, '');
}

// Classic Levenshtein distance with an early exit once `max` is exceeded.
export function editDistance(a, b, max = Infinity) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > max) return max + 1;
    previous = current;
  }
  return previous[b.length];
}

// Typos allowed for a title of this (normalized) length.
export function typoAllowance(length) {
  if (length <= 4) return 0;
  if (length <= 8) return 1;
  return 2;
}

// Numbers distinguish sequels ("Toy Story" vs "Toy Story 2"), so they must
// match exactly even when the rest of the title is allowed a typo.
const numbersIn = (value) => (value.match(/\d+/g) ?? []).join(' ');

export function isCorrectGuess(guess, title, alternativeTitles = []) {
  const normalizedGuess = normalizeTitle(guess);
  if (!normalizedGuess) return false;

  return [title, ...alternativeTitles].some((candidate) => {
    const target = normalizeTitle(candidate);
    if (!target) return false;
    if (numbersIn(normalizedGuess) !== numbersIn(target)) return false;
    const allowance = typoAllowance(target.length);
    return editDistance(normalizedGuess, target, allowance) <= allowance;
  });
}
