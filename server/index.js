import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import tmdbRoutes from './routes/tmdbRoutes.js';
import listRoutes from './routes/listRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tmdb-key']
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

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Movie Matcher Backend Server running at http://localhost:${PORT}`);
});
