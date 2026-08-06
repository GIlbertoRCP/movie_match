import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import tmdbRoutes from './routes/tmdbRoutes.js';
import listRoutes from './routes/listRoutes.js';
import sessionRoutes, { recordSwipeInDb, cleanupOldSessions } from './routes/sessionRoutes.js';
import mlRoutes from './routes/mlRoutes.js';
import db from './config/db.js';
import { extractMovieEmbedding, updateOnlineUserVector } from './ml/twoTowerEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Trust reverse proxy headers (required on Render, Heroku, Nginx)
app.set('trust proxy', 1);

// Permissive CORS middleware for cross-origin authentication & API requests
const corsOptions = {
  origin: (origin, callback) => {
    // Reflect origin dynamically to satisfy credentials: true specification across browsers
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tmdb-key'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/ml', mlRoutes);

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

// Active Room Presence & Session ML Vector Memory Store
// Map<sessionId, { p1SocketId, p2SocketId, p1LastPing, p2LastPing, userVector }>
const activeRooms = new Map();

// Real-Time Socket.io Connection, Room Presence & State Synchronization Logic
io.on('connection', (socket) => {
  socket.on('join_session', ({ sessionId, role = 'p1' }) => {
    if (!sessionId) return;

    socket.join(sessionId);

    // Initialize or update active room tracking
    if (!activeRooms.has(sessionId)) {
      activeRooms.set(sessionId, {
        p1SocketId: null,
        p2SocketId: null,
        p1LastPing: Date.now(),
        p2LastPing: Date.now(),
        userVector: new Array(64).fill(0.5)
      });
    }

    const room = activeRooms.get(sessionId);
    if (role === 'p1') {
      room.p1SocketId = socket.id;
      room.p1LastPing = Date.now();
    } else {
      room.p2SocketId = socket.id;
      room.p2LastPing = Date.now();
    }

    // Broadcast participant joining & room presence update
    socket.to(sessionId).emit('participant_joined', { role, timestamp: new Date() });
    io.to(sessionId).emit('partner_presence', {
      p1Online: Boolean(room.p1SocketId),
      p2Online: Boolean(room.p2SocketId)
    });
  });

  // Room presence heartbeat ping handler
  socket.on('ping_room', ({ sessionId, role = 'p1' }) => {
    if (!sessionId || !activeRooms.has(sessionId)) return;
    const room = activeRooms.get(sessionId);
    if (role === 'p1') {
      room.p1LastPing = Date.now();
    } else {
      room.p2LastPing = Date.now();
    }
  });

  // State Recovery Handler (restores session state following network reconnects)
  socket.on('recover_state', ({ sessionId, role }) => {
    if (!sessionId) return;

    try {
      const session = db.prepare('SELECT * FROM hosted_sessions WHERE id = ?').get(sessionId);
      if (session) {
        const p1Likes = session.p1_likes ? session.p1_likes.split(',').map(id => parseInt(id, 10)) : [];
        const p2Likes = session.p2_likes ? session.p2_likes.split(',').map(id => parseInt(id, 10)) : [];
        const deckIds = session.deck_movie_ids ? session.deck_movie_ids.split(',').map(id => parseInt(id, 10)) : [];

        const room = activeRooms.get(sessionId);
        const userVector = room ? room.userVector : new Array(64).fill(0.5);

        socket.emit('state_recovered', {
          sessionId,
          sessionName: session.session_name,
          p1Likes,
          p2Likes,
          matchedMovieId: session.matched_movie_id,
          deckMovieIds: deckIds,
          userVector,
          timestamp: new Date()
        });
      }
    } catch (err) {
      console.error('Error recovering session state for socket:', err);
    }
  });

  socket.on('leave_session', ({ sessionId, role = 'p1' }) => {
    if (!sessionId) return;

    if (activeRooms.has(sessionId)) {
      const room = activeRooms.get(sessionId);
      if (role === 'p1') room.p1SocketId = null;
      else room.p2SocketId = null;

      io.to(sessionId).emit('partner_presence', {
        p1Online: Boolean(room.p1SocketId),
        p2Online: Boolean(room.p2SocketId)
      });
    }

    socket.to(sessionId).emit('session_terminated', {
      message: 'Participant left the session',
      role,
      timestamp: new Date()
    });
    socket.leave(sessionId);
  });

  socket.on('disconnecting', () => {
    for (const roomName of socket.rooms) {
      if (roomName !== socket.id && activeRooms.has(roomName)) {
        const room = activeRooms.get(roomName);
        if (room.p1SocketId === socket.id) room.p1SocketId = null;
        if (room.p2SocketId === socket.id) room.p2SocketId = null;

        socket.to(roomName).emit('partner_presence', {
          p1Online: Boolean(room.p1SocketId),
          p2Online: Boolean(room.p2SocketId)
        });
      }
    }
  });

  socket.on('swipe_card', ({ sessionId, player, movieId, isLike, movie = null }) => {
    if (!sessionId || !movieId) return;

    // Record swipe in SQLite DB
    const result = recordSwipeInDb(sessionId, player, movieId, isLike);

    // Online Learning: Dynamically update session user vector in real time over WebSockets
    let updatedVector = null;
    if (activeRooms.has(sessionId)) {
      const room = activeRooms.get(sessionId);
      if (movie) {
        const movieEmbed = extractMovieEmbedding(movie);
        room.userVector = updateOnlineUserVector(room.userVector, movieEmbed, isLike);
        updatedVector = room.userVector;
      } else {
        updatedVector = room.userVector;
      }
    }

    if (result && result.success) {
      // Broadcast live swipe update and updated online vector to room
      io.to(sessionId).emit('session_updated', {
        sessionId,
        p1Likes: result.p1Likes,
        p2Likes: result.p2Likes,
        userVector: updatedVector
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

// Periodic Heartbeat Presence Check & Abandoned Room Cleanup (every 20 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, room] of activeRooms.entries()) {
    const p1TimedOut = room.p1SocketId && (now - room.p1LastPing > 45000);
    const p2TimedOut = room.p2SocketId && (now - room.p2LastPing > 45000);

    if (p1TimedOut) room.p1SocketId = null;
    if (p2TimedOut) room.p2SocketId = null;

    if (p1TimedOut || p2TimedOut) {
      io.to(sessionId).emit('partner_presence', {
        p1Online: Boolean(room.p1SocketId),
        p2Online: Boolean(room.p2SocketId)
      });
    }

    // Purge memory room if both participants disconnected for > 10 minutes
    if (!room.p1SocketId && !room.p2SocketId && (now - Math.max(room.p1LastPing, room.p2LastPing) > 10 * 60 * 1000)) {
      activeRooms.delete(sessionId);
    }
  }
}, 20000);

// Periodic Session Expiration Cleanup (Runs every 12 hours)
setInterval(cleanupOldSessions, 12 * 60 * 60 * 1000);
cleanupOldSessions(); // Initial cleanup on startup

// Start Express + Socket.io Server
httpServer.listen(PORT, () => {
  console.log(`🚀 Movie Matcher Backend & Socket.io Server active at http://localhost:${PORT}`);
});
