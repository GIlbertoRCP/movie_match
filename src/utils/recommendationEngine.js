// Recommendation Matrix & Dynamic Feed Scoring Engine
import { BACKEND_API } from '../config.js';

export function getDecadeKey(releaseDate) {
  if (!releaseDate) return '2020s';
  const year = parseInt(releaseDate.split('-')[0], 10);
  if (isNaN(year)) return '2020s';
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

export function getMovieGenreIds(movie) {
  if (!movie) return [];
  if (Array.isArray(movie.genre_ids) && movie.genre_ids.length > 0) {
    return movie.genre_ids;
  }
  if (Array.isArray(movie.genres) && movie.genres.length > 0) {
    return movie.genres.map(g => (typeof g === 'object' ? g.id : g));
  }
  return [];
}

export function createInitialTasteMatrix() {
  return {
    genreWeights: {},        // { [genreId]: numericScore }
    decadeWeights: {},       // { [decadeKey]: numericScore }
    preferredMinScore: 6.5,  // Dynamic rating floor baseline
    likedCount: 0,
    passedCount: 0,
    swipedIds: new Set()     // All swiped movie IDs to prevent duplicate cards
  };
}

export function updateTasteMatrix(currentMatrix, movie, isLike) {
  if (!movie || !movie.id) return currentMatrix || createInitialTasteMatrix();

  const safeMatrix = currentMatrix || createInitialTasteMatrix();

  const matrix = {
    ...createInitialTasteMatrix(),
    ...safeMatrix,
    genreWeights: { ...(safeMatrix.genreWeights || {}) },
    decadeWeights: { ...(safeMatrix.decadeWeights || {}) },
    swipedIds: new Set(safeMatrix.swipedIds || [])
  };

  matrix.swipedIds.add(movie.id);

  const genreIds = getMovieGenreIds(movie);
  const decade = getDecadeKey(movie.release_date);
  const voteAverage = movie.vote_average || 6.5;

  if (isLike) {
    matrix.likedCount = (matrix.likedCount || 0) + 1;

    // Boost genre weights for liked movie
    genreIds.forEach(id => {
      matrix.genreWeights[id] = (matrix.genreWeights[id] || 0) + 2.5;
    });

    // Boost decade weight
    matrix.decadeWeights[decade] = (matrix.decadeWeights[decade] || 0) + 1.5;

    // Nudge preferred rating score upward if user likes highly rated movies
    matrix.preferredMinScore = (matrix.preferredMinScore * 0.8) + (voteAverage * 0.2);
  } else {
    matrix.passedCount = (matrix.passedCount || 0) + 1;

    // Softly decrease genre weights for passed movie
    genreIds.forEach(id => {
      matrix.genreWeights[id] = (matrix.genreWeights[id] || 0) - 0.75;
    });

    // Softly decrease decade weight
    matrix.decadeWeights[decade] = (matrix.decadeWeights[decade] || 0) - 0.5;
  }

  return matrix;
}

export function calculateMatchScore(movie, tasteMatrix) {
  if (!movie) return 75;

  const matrix = tasteMatrix || createInitialTasteMatrix();
  let score = 70;
  const totalSwipes = (matrix.likedCount || 0) + (matrix.passedCount || 0);

  // Cold start (fewer than 2 swipes): calculate initial score from TMDB rating
  if (totalSwipes < 2) {
    const voteAvg = movie.vote_average || 7.0;
    const basePct = Math.round(55 + (voteAvg * 4.5));
    return Math.min(98, Math.max(65, basePct));
  }

  const genreIds = getMovieGenreIds(movie);
  const decade = getDecadeKey(movie.release_date);
  const voteAverage = movie.vote_average || 6.5;

  // 1. Genre Affinity Contribution (-25 to +25 points)
  if (genreIds.length > 0) {
    let genreSum = 0;
    genreIds.forEach(id => {
      genreSum += (matrix.genreWeights?.[id] || 0);
    });
    const genreAvg = genreSum / genreIds.length;
    score += Math.min(25, Math.max(-25, genreAvg * 3.5));
  }

  // 2. Decade Affinity Contribution (-10 to +15 points)
  const decadeVal = matrix.decadeWeights?.[decade] || 0;
  score += Math.min(15, Math.max(-10, decadeVal * 2.0));

  // 3. TMDB Quality Rating Contribution (-15 to +15 points)
  const minScore = matrix.preferredMinScore || 6.5;
  if (voteAverage >= minScore) {
    score += Math.min(15, (voteAverage - minScore) * 3.5);
  } else {
    score -= Math.min(15, (minScore - voteAverage) * 3.0);
  }

  // Bound final match score between 58% and 99%
  return Math.round(Math.min(99, Math.max(58, score)));
}

export function rankAndBalanceDeck(candidateMovies, tasteMatrix) {
  if (!candidateMovies || candidateMovies.length === 0) return [];

  const matrix = tasteMatrix || createInitialTasteMatrix();
  const swiped = matrix.swipedIds || new Set();
  const unswiped = candidateMovies.filter(m => m && !swiped.has(m.id));

  // Compute match score for each unswiped movie
  const scored = unswiped.map(movie => ({
    ...movie,
    matchScore: calculateMatchScore(movie, tasteMatrix)
  }));

  // Sort by matchScore descending with subtle exploration tie-break jitter for dynamic card order
  scored.sort((a, b) => {
    const jitterA = (Math.sin((a.id || 0) * 1.3) * 0.5) + (Math.random() * 1.5 - 0.75);
    const jitterB = (Math.sin((b.id || 0) * 1.3) * 0.5) + (Math.random() * 1.5 - 0.75);
    return (b.matchScore + jitterB) - (a.matchScore + jitterA);
  });

  // Interleave 80% top recommendations + 20% fresh discovery titles to avoid echo chamber
  let topTier = scored.slice(0, Math.ceil(scored.length * 0.8));
  const discoveryPool = scored.slice(Math.ceil(scored.length * 0.8));

  const totalSwipes = (matrix.likedCount || 0) + (matrix.passedCount || 0);
  if (totalSwipes < 2 && topTier.length > 1) {
    // Cold start: Shuffle top tier so every page refresh/entry starts with a different fresh movie
    topTier = [...topTier];
    for (let i = topTier.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [topTier[i], topTier[j]] = [topTier[j], topTier[i]];
    }
  }

  const balanced = [];
  let dIdx = 0;

  topTier.forEach((movie, i) => {
    balanced.push(movie);
    if ((i + 1) % 4 === 0 && dIdx < discoveryPool.length) {
      balanced.push(discoveryPool[dIdx]);
      dIdx++;
    }
  });

  while (dIdx < discoveryPool.length) {
    balanced.push(discoveryPool[dIdx]);
    dIdx++;
  }

  // Interleave genres so consecutive cards in the stack present diverse genres
  return interleaveGenreDiversity(balanced);
}

/**
 * Genre Diversity Interleaving: Prevents back-to-back cards of the same genre
 */
export function interleaveGenreDiversity(movies) {
  if (!movies || movies.length <= 2) return movies;

  const result = [];
  const pool = [...movies];
  const lastGenres = new Set();

  while (pool.length > 0) {
    // Look for candidate whose primary genre isn't in recent genre set
    let candidateIndex = pool.findIndex(m => {
      const gIds = getMovieGenreIds(m);
      const primaryGenre = gIds[0];
      return primaryGenre !== undefined && !lastGenres.has(primaryGenre);
    });

    if (candidateIndex === -1) {
      candidateIndex = 0;
    }

    const chosen = pool.splice(candidateIndex, 1)[0];
    result.push(chosen);

    // Keep track of recent genres (keep last 2 genres)
    lastGenres.clear();
    const chosenGenres = getMovieGenreIds(chosen);
    chosenGenres.slice(0, 2).forEach(g => lastGenres.add(g));
  }

  return result;
}

// Fetch Two-Tower Neural Network recommendations from backend ML service
export async function fetchTwoTowerMLRecommendations(candidateMovies, likedMovies = [], passedMovies = [], userVector = null) {
  if (!candidateMovies || candidateMovies.length === 0) return [];

  try {
    const res = await fetch(`${BACKEND_API}/ml/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateMovies,
        likedMovies,
        passedMovies,
        userVector
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.movies && data.movies.length > 0) {
        return data.movies;
      }
    }
  } catch (err) {
    console.warn('Backend ML recommendation service offline, using client fallback:', err);
  }

  // Fallback to client-side recommendation engine if ML service is unreachable
  return rankAndBalanceDeck(candidateMovies, createInitialTasteMatrix());
}

// Client-side online learning vector update helper
export async function updateClientOnlineVector(currentVector, movie, isLike) {
  try {
    const res = await fetch(`${BACKEND_API}/ml/online-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentVector,
        movie,
        isLike
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data.userVector;
    }
  } catch (err) {
    console.warn('Failed to update online vector via ML service:', err);
  }
  return currentVector;
}
