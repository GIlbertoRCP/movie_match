// Chooses where game questions come from at startup:
//   1. a fresh cached pool on disk, or
//   2. a pool built from TMDB in the background (games use the fixtures until it's ready), or
//   3. the hand-written fixtures, if there are no TMDB credentials.

import { buildPool, loadPool, savePool } from './pool.js';
import { createTmdbQuestionSource } from './tmdbQuestions.js';
import { createFixtureQuestionSource } from '../game/questions.js';

export function createContentSource({ poolFile, client, buildOptions, log = console.log } = {}) {
  let current = createFixtureQuestionSource();
  let kind = 'fixtures';

  const adopt = (pool, how) => {
    current = createTmdbQuestionSource({ pool });
    kind = 'tmdb';
    log(`Questions: ${pool.movies.length} films from TMDB (${how}).`);
  };

  const ready = (async () => {
    const cached = await loadPool(poolFile);
    if (cached) return adopt(cached, `cached ${cached.builtAt}`);
    if (!client) {
      log('Questions: no TMDB credentials, using the built-in fixture set.');
      return;
    }
    log('Questions: building the TMDB pool in the background; using fixtures until it is ready.');
    try {
      const pool = await buildPool(client, { ...buildOptions, log });
      if (!pool.movies.length) throw new Error('TMDB returned no usable films');
      await savePool(poolFile, pool).catch((error) => log(`Questions: could not cache the pool: ${error.message}`));
      adopt(pool, 'freshly built');
    } catch (error) {
      log(`Questions: pool build failed (${error.message}); staying on fixtures.`);
    }
  })();

  return {
    pick: (count) => current.pick(count),
    kind: () => kind,
    ready,
  };
}
