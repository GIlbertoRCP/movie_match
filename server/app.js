import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import tmdbRoutes from './routes/tmdbRoutes.js';
import { createOriginCheck } from './origins.js';
import { createRoomManager } from './game/manager.js';
import { registerGameHandlers } from './game/socket.js';
import { createFixtureQuestionSource } from './game/questions.js';
import { IMAGE_CLUE_TYPES } from './game/room.js';
import { createClueRenderer } from './content/images.js';

// Builds the HTTP + Socket.io server without listening, so tests can run it
// on a random port with fast timings.
export function createGameServer({
  allowedOrigins = new Set(),
  timings,
  questionSource = createFixtureQuestionSource(),
  guessRate,
  clueRenderer = createClueRenderer(),
  logger = console,
} = {}) {
  const isAllowedOrigin = createOriginCheck(allowedOrigins);

  const app = express();
  app.set('trust proxy', 1); // behind Render / nginx
  app.use(
    cors((req, callback) => callback(null, { origin: isAllowedOrigin(req), methods: ['GET', 'POST'] }))
  );
  app.use(express.json());

  app.use('/api/tmdb', tmdbRoutes);
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  // Clue images: opaque per-round token + level. The manager decides whether
  // that level is unlocked yet; the browser never sees a TMDB image URL.
  app.get('/api/clues/:token/:level', async (req, res) => {
    const level = Number(req.params.level);
    const { status, clue } = manager.authorizeClue(req.params.token, level);
    if (status === 'not_found') return res.status(404).end();
    if (status === 'locked') return res.status(403).end();
    try {
      const image = await clueRenderer.render(clue, level);
      res.set({ 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=600' }).send(image);
    } catch (error) {
      logger.error('[clues] render failed:', error);
      res.status(502).end();
    }
  });

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: [...allowedOrigins] },
    // CORS only covers the HTTP polling transport; WebSocket upgrades must be
    // origin-checked explicitly.
    allowRequest: (req, callback) => callback(null, isAllowedOrigin(req)),
  });

  // The manager reports changes; the socket layer turns them into broadcasts.
  let broadcastRoom = () => {};
  const manager = createRoomManager({
    questionSource,
    timings,
    onRoomChange: (code) => broadcastRoom(code),
    // Warm the first image during the intro so guessing starts without a wait.
    onRoundStart: (question) => {
      if (IMAGE_CLUE_TYPES.has(question.clue.type)) {
        clueRenderer.render(question.clue, 0).catch((error) => logger.error('[clues] pre-render failed:', error));
      }
    },
  });
  ({ broadcastRoom } = registerGameHandlers(io, manager, { guessRate, logger }));

  async function close() {
    manager.close();
    await io.close(); // also closes httpServer
  }

  return { app, httpServer, io, manager, close };
}
