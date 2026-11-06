// The movie pool: well-known films with everything needed to make clues,
// fetched from TMDB once and cached on disk (server/data/pool.json, not
// committed: it's TMDB data, built from your own API credentials).

import fs from 'fs/promises';
import path from 'path';

export const POOL_VERSION = 1;

// Countries whose alternative titles are accepted as answers. Others are
// mostly translations, which would only make matching looser.
const ANSWER_TITLE_COUNTRIES = new Set(['US', 'GB', 'CA', 'AU', 'NZ', 'IE']);

const DEFAULTS = {
  pages: 10, // per list; 20 films per page
  minVoteCount: 3_000, // "most people have heard of it"
  concurrency: 6,
  castLimit: 15,
  backdropLimit: 6,
};

function yearOf(releaseDate) {
  const year = Number(String(releaseDate || '').slice(0, 4));
  return Number.isFinite(year) && year > 1800 ? year : null;
}

// Turns a TMDB details response (with credits, images, alternative_titles)
// into a pool entry, or null if the film can't make good clues.
export function toPoolEntry(details, { castLimit = DEFAULTS.castLimit, backdropLimit = DEFAULTS.backdropLimit } = {}) {
  if (!details || details.adult || !details.title || !details.poster_path) return null;

  const alternativeTitles = [
    details.original_title,
    ...(details.alternative_titles?.titles ?? [])
      .filter((t) => ANSWER_TITLE_COUNTRIES.has(t.iso_3166_1))
      .map((t) => t.title),
  ].filter((t, i, all) => t && t !== details.title && all.indexOf(t) === i);

  // Textless backdrops only: a still with the title printed on it gives the answer away.
  const backdropPaths = (details.images?.backdrops ?? [])
    .filter((b) => b.iso_639_1 === null && b.width >= 1_280)
    .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
    .slice(0, backdropLimit)
    .map((b) => b.file_path);

  return {
    id: details.id,
    title: details.title,
    alternativeTitles,
    year: yearOf(details.release_date),
    popularity: details.popularity ?? 0,
    voteCount: details.vote_count ?? 0,
    overview: details.overview || '',
    posterPath: details.poster_path,
    backdropPaths,
    cast: (details.credits?.cast ?? [])
      .slice(0, castLimit)
      .map((c) => ({ name: c.name, character: c.character || '' })),
    directors: (details.credits?.crew ?? []).filter((c) => c.job === 'Director').map((c) => c.name),
  };
}

// Runs `fn` over `items` with at most `limit` in flight.
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function buildPool(client, options = {}) {
  const { pages, minVoteCount, concurrency, log = () => {} } = { ...DEFAULTS, ...options };

  // Popular (current) plus top rated (classics), de-duplicated.
  const candidates = new Map();
  for (const list of ['/movie/popular', '/movie/top_rated']) {
    for (let page = 1; page <= pages; page++) {
      const { results = [] } = await client.get(list, { page });
      for (const m of results) {
        if (!m.adult && m.vote_count >= minVoteCount && !candidates.has(m.id)) candidates.set(m.id, m);
      }
    }
  }
  log(`Pool: ${candidates.size} candidates, fetching details…`);

  let failures = 0;
  const entries = await mapLimit([...candidates.keys()], concurrency, async (id) => {
    try {
      const details = await client.get(`/movie/${id}`, {
        append_to_response: 'credits,images,alternative_titles',
        include_image_language: 'en,null',
      });
      return toPoolEntry(details, options);
    } catch (error) {
      failures++;
      log(`Pool: skipping ${id}: ${error.message}`);
      return null;
    }
  });

  const movies = entries.filter(Boolean).sort((a, b) => b.voteCount - a.voteCount);
  log(`Pool: ${movies.length} films ready (${failures} failed).`);
  return { version: POOL_VERSION, builtAt: new Date().toISOString(), movies };
}

export async function savePool(file, pool) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(pool));
  await fs.rename(tmp, file); // atomic: never leaves a half-written pool
}

// Returns the cached pool, or null if it's missing, stale or from an older format.
export async function loadPool(file, { maxAgeMs = 7 * 24 * 60 * 60 * 1_000, now = Date.now() } = {}) {
  try {
    const pool = JSON.parse(await fs.readFile(file, 'utf8'));
    if (pool.version !== POOL_VERSION || !Array.isArray(pool.movies) || pool.movies.length === 0) return null;
    if (now - Date.parse(pool.builtAt) > maxAgeMs) return null;
    return pool;
  } catch {
    return null;
  }
}
