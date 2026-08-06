import express from 'express';
import NodeCache from 'node-cache';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Rate Limiter for TMDB Proxy Routes (prevents API key exhaustion & abuse)
const tmdbLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // 120 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: { error: 'Too many requests to TMDB proxy. Please try again in a few minutes.' }
});

router.use(tmdbLimiter);

// Server-side In-Memory Cache (Std TTL 8 Hours = 28800 seconds)
const tmdbCache = new NodeCache({ stdTTL: 28800, checkperiod: 3600 });

// Proxy helper for fetching from TMDB API with NodeCache support
async function fetchFromTMDB(endpoint, params = {}, reqKey = null) {
  const activeKey = reqKey || process.env.VITE_TMDB_API_KEY || 'b992337b97dc83be1869733cc4ecb839';
  const readToken = process.env.TMDB_READ_TOKEN;

  const searchParams = new URLSearchParams({
    language: 'en-US',
    ...params
  });

  const cacheKey = `${endpoint}?${searchParams.toString()}`;
  const cachedData = tmdbCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const headers = {};
  if (readToken) {
    headers['Authorization'] = `Bearer ${readToken}`;
  } else if (activeKey) {
    searchParams.append('api_key', activeKey);
  }

  const url = `${TMDB_BASE_URL}${endpoint}?${searchParams.toString()}`;
  const res = await fetch(url, { headers });
  
  if (!res.ok) {
    throw new Error(`TMDB Proxy Error HTTP ${res.status}`);
  }
  const data = await res.json();
  tmdbCache.set(cacheKey, data);
  return data;
}

// Search Movies Proxy
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const clientApiKey = req.headers['x-tmdb-key'];

    if (!query || !query.trim()) {
      return res.json({ results: [] });
    }

    const data = await fetchFromTMDB('/search/movie', {
      query: query.trim(),
      include_adult: 'false',
      page: '1'
    }, clientApiKey);

    res.json(data);
  } catch (err) {
    console.error('TMDB Search Proxy failed:', err.message);
    res.status(500).json({ error: 'Failed to search movies from TMDB' });
  }
});

// Movie Details Proxy by ID
router.get('/movie/:id', async (req, res) => {
  try {
    const clientApiKey = req.headers['x-tmdb-key'];
    const movieId = req.params.id;

    const data = await fetchFromTMDB(`/movie/${movieId}`, {}, clientApiKey);
    res.json(data);
  } catch (err) {
    console.error('TMDB Movie Details Proxy failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

// Movie Videos (YouTube Trailers) Proxy
router.get('/videos/:id', async (req, res) => {
  try {
    const clientApiKey = req.headers['x-tmdb-key'];
    const movieId = req.params.id;

    const data = await fetchFromTMDB(`/movie/${movieId}/videos`, {}, clientApiKey);
    res.json(data);
  } catch (err) {
    console.error('TMDB Videos Proxy failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch movie videos' });
  }
});

// Discover Movies Proxy with Watch Provider Support
router.get('/discover', async (req, res) => {
  try {
    const clientApiKey = req.headers['x-tmdb-key'];
    const { genre, minScore, startYear, endYear, sortBy, provider, region, page } = req.query;

    const params = {
      sort_by: sortBy || 'popularity.desc',
      include_adult: 'false',
      include_video: 'false',
      page: page || '1',
      'vote_count.gte': '100'
    };

    if (genre && genre !== 'all') params['with_genres'] = genre;
    if (minScore) params['vote_average.gte'] = minScore;
    if (startYear) params['primary_release_date.gte'] = `${startYear}-01-01`;
    if (endYear) params['primary_release_date.lte'] = `${endYear}-12-31`;
    if (provider && provider !== 'all') {
      params['with_watch_providers'] = provider;
      params['watch_region'] = region || 'US';
    }

    const data = await fetchFromTMDB('/discover/movie', params, clientApiKey);
    res.json(data);
  } catch (err) {
    console.error('TMDB Discover Proxy failed:', err.message);
    res.status(500).json({ error: 'Failed to discover movies' });
  }
});

// Watch Providers Proxy
router.get('/providers/:id', async (req, res) => {
  try {
    const clientApiKey = req.headers['x-tmdb-key'];
    const movieId = req.params.id;

    const data = await fetchFromTMDB(`/movie/${movieId}/watch/providers`, {}, clientApiKey);
    res.json(data);
  } catch (err) {
    console.error('TMDB Watch Providers Proxy failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch watch providers' });
  }
});

export default router;
