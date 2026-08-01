import express from 'express';
import { processTwoTowerRecommendations, buildUserEmbedding, extractMovieEmbedding } from '../ml/twoTowerEngine.js';

const router = express.Router();

// Two-Tower Neural Network Recommendation Endpoint
router.post('/recommend', (req, res) => {
  try {
    const { candidateMovies = [], likedMovies = [], passedMovies = [] } = req.body;

    if (!Array.isArray(candidateMovies)) {
      return res.status(400).json({ error: 'candidateMovies must be an array.' });
    }

    const rankedMovies = processTwoTowerRecommendations(candidateMovies, likedMovies, passedMovies);

    res.json({
      model: 'Two-Tower Deep Neural Network (Retrieval + Ranking MLP)',
      count: rankedMovies.length,
      movies: rankedMovies
    });
  } catch (err) {
    console.error('ML Recommendation error:', err);
    res.status(500).json({ error: 'ML recommendation engine error.' });
  }
});

// Endpoint to inspect user embedding vector representation
router.post('/user-embedding', (req, res) => {
  try {
    const { likedMovies = [], passedMovies = [] } = req.body;
    const userVec = buildUserEmbedding(likedMovies, passedMovies);

    res.json({
      dimensions: userVec.length,
      userVector: userVec
    });
  } catch (err) {
    console.error('Error generating user embedding:', err);
    res.status(500).json({ error: 'Failed to generate user embedding.' });
  }
});

export default router;
