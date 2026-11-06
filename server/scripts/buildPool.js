// Builds (or rebuilds) the TMDB movie pool: npm run build-pool
import 'dotenv/config';
import { createTmdbClient } from '../content/tmdbClient.js';
import { buildPool, savePool } from '../content/pool.js';
import { POOL_FILE } from '../content/paths.js';

const client = createTmdbClient();
if (!client) {
  console.error('Set TMDB_READ_TOKEN (or TMDB_API_KEY) in server/.env first.');
  process.exit(1);
}

const pool = await buildPool(client, { log: console.log });
await savePool(POOL_FILE, pool);
console.log(`Saved ${pool.movies.length} films to ${POOL_FILE}`);
