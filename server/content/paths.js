import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Cached TMDB pool. Git-ignored: it's TMDB data built with your own credentials.
export const POOL_FILE = process.env.POOL_FILE || path.join(here, '..', 'data', 'pool.json');
