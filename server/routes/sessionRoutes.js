import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Generate short random session code if uuid not imported
function generateSessionCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create Hosted Pairing Session
router.post('/create', (req, res) => {
  try {
    const { sessionName, deckMovieIds, partnerMode = 'guest', hostUserId = null } = req.body;

    if (!deckMovieIds || !Array.isArray(deckMovieIds) || deckMovieIds.length === 0) {
      return res.status(400).json({ error: 'deckMovieIds array is required' });
    }

    const sessionId = generateSessionCode();
    const movieIdsStr = deckMovieIds.join(',');
    const name = sessionName || `Match Session #${sessionId}`;

    const insert = db.prepare(`
      INSERT INTO hosted_sessions (id, host_user_id, partner_mode, session_name, deck_movie_ids)
      VALUES (?, ?, ?, ?, ?)
    `);

    insert.run(sessionId, hostUserId, partnerMode, name, movieIdsStr);

    res.status(201).json({
      message: 'Hosted session created successfully',
      session: {
        id: sessionId,
        session_name: name,
        partner_mode: partnerMode,
        deck_movie_ids: deckMovieIds,
        share_url: `${req.protocol}://${req.get('host')}/?session=${sessionId}`
      }
    });
  } catch (err) {
    console.error('Error creating hosted session:', err);
    res.status(500).json({ error: 'Failed to create hosted session' });
  }
});

// Get Live Hosted Session Details
router.get('/:id', (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM hosted_sessions WHERE id = ?').get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Hosted session not found' });
    }

    const p1Likes = session.p1_likes ? session.p1_likes.split(',').map(id => parseInt(id, 10)) : [];
    const p2Likes = session.p2_likes ? session.p2_likes.split(',').map(id => parseInt(id, 10)) : [];
    const deckIds = session.deck_movie_ids ? session.deck_movie_ids.split(',').map(id => parseInt(id, 10)) : [];

    res.json({
      session: {
        id: session.id,
        session_name: session.session_name,
        host_user_id: session.host_user_id,
        partner_user_id: session.partner_user_id,
        partner_mode: session.partner_mode,
        deck_movie_ids: deckIds,
        p1_likes: p1Likes,
        p2_likes: p2Likes,
        matched_movie_id: session.matched_movie_id,
        created_at: session.created_at
      }
    });
  } catch (err) {
    console.error('Error fetching session:', err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Player 2 Join Session
router.post('/:id/join', (req, res) => {
  try {
    const { partnerUserId = null, guestName = 'Guest' } = req.body;
    const session = db.prepare('SELECT * FROM hosted_sessions WHERE id = ?').get(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    db.prepare('UPDATE hosted_sessions SET partner_user_id = ? WHERE id = ?').run(partnerUserId, session.id);

    res.json({
      message: 'Joined session successfully',
      session_id: session.id
    });
  } catch (err) {
    console.error('Error joining session:', err);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

// Database Helper for Socket.io & HTTP Endpoints
export function recordSwipeInDb(sessionId, player, movieId, isLike) {
  const session = db.prepare('SELECT * FROM hosted_sessions WHERE id = ?').get(sessionId);
  if (!session) return { error: 'Session not found' };

  let p1Likes = session.p1_likes ? session.p1_likes.split(',').map(id => parseInt(id, 10)) : [];
  let p2Likes = session.p2_likes ? session.p2_likes.split(',').map(id => parseInt(id, 10)) : [];
  let isMatch = false;

  if (player === 1 && isLike && !p1Likes.includes(movieId)) {
    p1Likes.push(movieId);
    db.prepare('UPDATE hosted_sessions SET p1_likes = ? WHERE id = ?').run(p1Likes.join(','), session.id);
  } else if (player === 2 && isLike && !p2Likes.includes(movieId)) {
    p2Likes.push(movieId);
    db.prepare('UPDATE hosted_sessions SET p2_likes = ? WHERE id = ?').run(p2Likes.join(','), session.id);

    if (p1Likes.includes(movieId)) {
      isMatch = true;
      db.prepare('UPDATE hosted_sessions SET matched_movie_id = ? WHERE id = ?').run(movieId, session.id);
    }
  }

  return {
    success: true,
    isMatch,
    matchedMovieId: isMatch ? movieId : session.matched_movie_id,
    p1Likes,
    p2Likes
  };
}

// Automated Session Expiration Cleanup (deletes sessions older than 48 hours)
export function cleanupOldSessions() {
  try {
    const result = db.prepare(`
      DELETE FROM hosted_sessions 
      WHERE datetime(created_at) < datetime('now', '-2 days')
    `).run();
    if (result.changes > 0) {
      console.log(`🧹 Purged ${result.changes} inactive match session(s) from database.`);
    }
  } catch (err) {
    console.error('Failed to run session cleanup:', err);
  }
}

// Record Swipe in Session HTTP Route
router.post('/:id/swipe', (req, res) => {
  try {
    const { player, movieId, isLike } = req.body;
    const result = recordSwipeInDb(req.params.id, player, movieId, isLike);
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    res.json(result);
  } catch (err) {
    console.error('Error recording swipe:', err);
    res.status(500).json({ error: 'Failed to record swipe' });
  }
});

export default router;
