import express from 'express';
import db from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Create a custom watchlist (Protected)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, movieIds } = req.body;

    if (!title || !movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return res.status(400).json({ error: 'Title and movieIds array are required.' });
    }

    const movieIdsStr = movieIds.join(',');
    const insert = db.prepare('INSERT INTO watchlists (user_id, title, movie_ids) VALUES (?, ?, ?)');
    const result = insert.run(req.user.id, title.trim(), movieIdsStr);

    res.status(201).json({
      message: 'Watchlist saved successfully',
      watchlist: {
        id: result.lastInsertRowid,
        user_id: req.user.id,
        title: title.trim(),
        movie_ids: movieIds
      }
    });
  } catch (err) {
    console.error('Error saving watchlist:', err);
    res.status(500).json({ error: 'Failed to save watchlist' });
  }
});

// Get all watchlists for logged in user (Protected)
router.get('/', authenticateToken, (req, res) => {
  try {
    const lists = db.prepare('SELECT id, title, movie_ids, created_at FROM watchlists WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    
    const formatted = lists.map(l => ({
      id: l.id,
      title: l.title,
      movie_ids: l.movie_ids.split(',').map(id => parseInt(id, 10)),
      created_at: l.created_at
    }));

    res.json({ watchlists: formatted });
  } catch (err) {
    console.error('Error fetching watchlists:', err);
    res.status(500).json({ error: 'Failed to fetch watchlists' });
  }
});

// Delete a user's custom watchlist (Protected)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM watchlists WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Watchlist not found or unauthorized' });
    }
    res.json({ message: 'Watchlist deleted successfully' });
  } catch (err) {
    console.error('Error deleting watchlist:', err);
    res.status(500).json({ error: 'Failed to delete watchlist' });
  }
});

// Save a liked movie to user profile (Protected)
router.post('/likes', authenticateToken, (req, res) => {
  try {
    const { movieId } = req.body;
    if (!movieId) {
      return res.status(400).json({ error: 'movieId is required' });
    }
    const insert = db.prepare('INSERT OR IGNORE INTO user_likes (user_id, movie_id) VALUES (?, ?)');
    insert.run(req.user.id, parseInt(movieId, 10));
    res.status(201).json({ message: 'Like saved to user profile', movieId });
  } catch (err) {
    console.error('Error saving user like:', err);
    res.status(500).json({ error: 'Failed to save like' });
  }
});

// Remove a liked movie from user profile (Protected)
router.delete('/likes/:movieId', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM user_likes WHERE user_id = ? AND movie_id = ?').run(req.user.id, parseInt(req.params.movieId, 10));
    res.json({ message: 'Like removed from user profile' });
  } catch (err) {
    console.error('Error deleting user like:', err);
    res.status(500).json({ error: 'Failed to remove like' });
  }
});

// Get all saved likes for logged in user (Protected)
router.get('/likes/all', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT movie_id FROM user_likes WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    const movieIds = rows.map(r => r.movie_id);
    res.json({ movieIds });
  } catch (err) {
    console.error('Error fetching user likes:', err);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

// Get public watchlist by ID
router.get('/:id', (req, res) => {
  try {
    const list = db.prepare('SELECT id, user_id, title, movie_ids, created_at FROM watchlists WHERE id = ?').get(req.params.id);
    if (!list) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    res.json({
      watchlist: {
        id: list.id,
        user_id: list.user_id,
        title: list.title,
        movie_ids: list.movie_ids.split(',').map(id => parseInt(id, 10)),
        created_at: list.created_at
      }
    });
  } catch (err) {
    console.error('Error fetching watchlist by ID:', err);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

export default router;
