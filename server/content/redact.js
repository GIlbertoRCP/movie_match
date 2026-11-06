// Plot clues: a synopsis with the giveaway words blanked out — words from the
// title, and the names of the cast, their characters and the director.

export const BLANK = '█████'; // fixed width, so the blank's length leaks nothing

// Words too common to redact: blanking them would wreck the sentence without
// hiding anything. Also generic character descriptions ("Young Man", "Himself").
const KEEP = new Set(
  `a an and are as at be but by for from had has have he her him his i in into is it its me my no not of on or our
   out she so than that the their them then there they this to up us was we were what when where who why will with
   you your all one two man men woman women girl boy kid child young old new himself herself themselves voice
   mother father mom dad son daughter wife husband brother sister friend officer doctor dr mr mrs ms miss sir
   lady lord king queen captain agent guard police soldier driver uncredited narrator cameo self life day night
   world time back first last good great little big`
    .split(/\s+/)
    .filter(Boolean)
);

const WORD = /[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu;

// Accent- and case-insensitive key for comparing words.
const keyOf = (word) =>
  word
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]s$/, ''); // possessive: "Cobb's" -> "cobb"

function giveawayWords({ title, alternativeTitles = [], cast = [], directors = [] }) {
  const sources = [title, ...alternativeTitles, ...directors, ...cast.flatMap((c) => [c.name, c.character])];
  const words = new Set();
  for (const source of sources) {
    for (const word of String(source ?? '').match(WORD) ?? []) {
      const key = keyOf(word);
      // Numbers stay: "two decades later" is a clue, not a giveaway.
      if (key.length >= 3 && !KEEP.has(key) && !/^\d+$/.test(key)) words.add(key);
    }
  }
  return words;
}

// Returns { text, redacted, total } — `redacted` of `total` words were blanked.
export function redactOverview(overview, movie) {
  const giveaways = giveawayWords(movie);
  let redacted = 0;
  let total = 0;
  const text = String(overview ?? '').replace(WORD, (word) => {
    total++;
    if (!giveaways.has(keyOf(word))) return word;
    redacted++;
    return BLANK;
  });
  // Merge runs like "█████ █████" (a full name) into one blank so the number
  // of words in a name isn't revealed either.
  return { text: text.replace(new RegExp(`${BLANK}(?:\\s+${BLANK})+`, 'g'), BLANK), redacted, total };
}

// A plot clue is usable if enough of the sentence survives to read it.
export function plotClueFor(movie, { minWords = 12, maxRedactedRatio = 0.25 } = {}) {
  const { text, redacted, total } = redactOverview(movie.overview, movie);
  if (total < minWords || redacted / total > maxRedactedRatio) return null;
  return { type: 'plot', text };
}
