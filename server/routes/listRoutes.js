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
