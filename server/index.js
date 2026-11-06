import 'dotenv/config'; // first, so every module below sees .env
import { createGameServer } from './app.js';
import { allowedOriginsFromEnv } from './origins.js';
import { createContentSource } from './content/source.js';
import { createTmdbClient } from './content/tmdbClient.js';
import { POOL_FILE } from './content/paths.js';

const PORT = process.env.PORT || 5001;
const allowedOrigins = allowedOriginsFromEnv();

const questionSource = createContentSource({ poolFile: POOL_FILE, client: createTmdbClient() });
const { httpServer } = createGameServer({ allowedOrigins, questionSource });

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Allowed origins: ${[...allowedOrigins].join(', ') || '(same-origin only)'}`);
});
