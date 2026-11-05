import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import tmdbRoutes from './routes/tmdbRoutes.js';
import { createOriginCheck } from './origins.js';
import { createRoomManager } from './game/manager.js';
import { registerGameHandlers } from './game/socket.js';
import { createFixtureQuestionSource } from './game/questions.js';

// Builds the HTTP + Socket.io server without listening, so tests can run it
// on a random port with fast timings.
export function createGameServer({
  allowedOrigins = new Set(),
  timings,
  questionSource = createFixtureQuestionSource(),
  guessRate,
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
  });
  ({ broadcastRoom } = registerGameHandlers(io, manager, { guessRate, logger }));

  async function close() {
    manager.close();
    await io.close(); // also closes httpServer
  }

  return { app, httpServer, io, manager, close };
}
