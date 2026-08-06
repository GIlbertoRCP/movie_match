import express from 'express';
import { processTwoTowerRecommendations, buildUserEmbedding, extractMovieEmbedding, updateOnlineUserVector } from '../ml/twoTowerEngine.js';

const router = express.Router();

// Two-Tower Neural Network Recommendation Endpoint
router.post('/recommend', (req, res) => {
  try {
    const { candidateMovies = [], likedMovies = [], passedMovies = [], userVector = null } = req.body;

    if (!Array.isArray(candidateMovies)) {
      return res.status(400).json({ error: 'candidateMovies must be an array.' });
    }

    const rankedMovies = processTwoTowerRecommendations(candidateMovies, likedMovies, passedMovies, userVector);

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

// Online Learning endpoint: dynamic user embedding update on swipe event
router.post('/online-update', (req, res) => {
  try {
    const { currentVector, movie, isLike, learningRate } = req.body;

    if (!movie) {
      return res.status(400).json({ error: 'movie object is required.' });
    }

    const movieEmbed = extractMovieEmbedding(movie);
    const updatedVector = updateOnlineUserVector(currentVector, movieEmbed, isLike, learningRate);

    res.json({
      dimensions: updatedVector.length,
      userVector: updatedVector
    });
  } catch (err) {
    console.error('Error performing online vector update:', err);
    res.status(500).json({ error: 'Failed to perform online vector update.' });
  }
});

export default router;
