import dotenv from 'dotenv';
import { createGameServer } from './app.js';
import { allowedOriginsFromEnv } from './origins.js';

dotenv.config();

const PORT = process.env.PORT || 5001;
const allowedOrigins = allowedOriginsFromEnv();

const { httpServer } = createGameServer({ allowedOrigins });

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Allowed origins: ${[...allowedOrigins].join(', ') || '(same-origin only)'}`);
});
