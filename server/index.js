import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import tmdbRoutes from './routes/tmdbRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Trust reverse proxy headers (Render, Nginx)
app.set('trust proxy', 1);

// --- Allowed origins -------------------------------------------------------
// Only the app's own frontend may call the API or open a socket.
// CLIENT_ORIGINS: comma-separated full origins (e.g. "https://example.com").
// FRONTEND_URL: Render's `host` property, which may be a bare hostname.
function toOrigin(value) {
  const trimmed = value.trim().replace(/\/$/, '');
  if (!trimmed) return null;
  if (/^https?:\/\//.test(trimmed)) return trimmed;
  const host = trimmed.includes('.') ? trimmed : `${trimmed}.onrender.com`;
  return `https://${host}`;
}

const allowedOrigins = new Set(
  [
    ...(process.env.CLIENT_ORIGINS || '').split(','),
    process.env.FRONTEND_URL || '',
  ]
    .map(toOrigin)
    .filter(Boolean)
);

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
}

// Allowed: no Origin header (same-origin GETs, curl, health checks), a listed
// origin, or a same-origin request (Origin host matches the Host it was sent to,
// as when nginx serves the frontend and proxies /api and /socket.io).
function isAllowedOrigin(req) {
  const { origin, host } = req.headers;
  if (!origin || allowedOrigins.has(origin)) return true;
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

app.use(
  cors((req, callback) =>
    callback(null, { origin: isAllowedOrigin(req), methods: ['GET', 'POST'] })
  )
);
app.use(express.json());

// --- Routes ----------------------------------------------------------------
app.use('/api/tmdb', tmdbRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// --- Socket.io ---------------------------------------------------------------
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: [...allowedOrigins] },
  // CORS only covers the HTTP polling transport; WebSocket upgrades must be
  // origin-checked explicitly.
  allowRequest: (req, callback) => callback(null, isAllowedOrigin(req)),
});

// The room/game engine lands in milestone 2 (docs/PIVOT_PLAN.md §5).
// Rule for every handler added here: player identity comes from the server
// (socket id / server-issued token), never from fields in the client payload.
io.on('connection', () => {});

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Allowed origins: ${[...allowedOrigins].join(', ') || '(same-origin only)'}`);
});
