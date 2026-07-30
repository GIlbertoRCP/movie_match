import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import tmdbRoutes from './routes/tmdbRoutes.js';
import listRoutes from './routes/listRoutes.js';
import sessionRoutes, { recordSwipeInDb, cleanupOldSessions } from './routes/sessionRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Allowed Origins for CORS Security (Normalizes Render host strings with https://)
const rawOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

const allowedOrigins = [
  '*',
  ...rawOrigins.flatMap(url => [
    url,
    url.startsWith('http') ? url : `https://${url}`,
    url.startsWith('http') ? url : `http://${url}`
  ])
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive fallback
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tmdb-key'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/sessions', sessionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Movie Matcher Express Backend active',
    authentikConfigured: Boolean(process.env.AUTHENTIK_CLIENT_ID && process.env.AUTHENTIK_ISSUER_URL),
    timestamp: new Date()
  });
});

// Create HTTP Server & Attach Socket.io
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Real-Time Socket.io Connection & Room Logic
io.on('connection', (socket) => {
  socket.on('join_session', ({ sessionId, role }) => {
    if (!sessionId) return;
    socket.join(sessionId);
    socket.to(sessionId).emit('participant_joined', { role, timestamp: new Date() });
  });

  socket.on('leave_session', ({ sessionId, role }) => {
    if (!sessionId) return;
    socket.to(sessionId).emit('session_terminated', {
      message: 'Participant left the session',
      role,
      timestamp: new Date()
    });
    socket.leave(sessionId);
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit('session_terminated', {
          message: 'Partner closed their window or disconnected',
          timestamp: new Date()
        });
      }
    }
  });

  socket.on('swipe_card', ({ sessionId, player, movieId, isLike }) => {
    if (!sessionId || !movieId) return;

    // Record in SQLite DB
    const result = recordSwipeInDb(sessionId, player, movieId, isLike);

    if (result && result.success) {
      // Broadcast live swipe update to room
      io.to(sessionId).emit('session_updated', {
        sessionId,
        p1Likes: result.p1Likes,
        p2Likes: result.p2Likes
      });

      // Instant Match Trigger
      if (result.isMatch) {
        io.to(sessionId).emit('match_found', {
          sessionId,
          matchedMovieId: result.matchedMovieId,
          timestamp: new Date()
        });
      }
    }
  });

  socket.on('disconnect', () => {
    // Socket disconnected cleanly
  });
});

// Periodic Session Expiration Cleanup (Runs every 12 hours)
setInterval(cleanupOldSessions, 12 * 60 * 60 * 1000);
cleanupOldSessions(); // Initial cleanup on startup

// Start Express + Socket.io Server
httpServer.listen(PORT, () => {
  console.log(`🚀 Movie Matcher Backend & Socket.io Server active at http://localhost:${PORT}`);
});
