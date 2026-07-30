import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchDiscoverMovies, fetchMoviesByIds, PRESET_PACKS } from '../services/tmdbApi';
import { parseURLState, generateShareableURL } from '../utils/urlState';
import { BACKEND_API } from '../config';
import socketService from '../services/socketService';

const MovieContext = createContext();

const DEFAULT_FILTERS = {
  genreId: 'all',
  minScore: 6.5,
  region: 'US',
  startYear: '',
  endYear: '',
  sortBy: 'popularity.desc'
};

export const MovieProvider = ({ children }) => {
  const [mode, setModeState] = useState('couch'); // 'couch' | 'async'
  const [phase, setPhase] = useState('p1_swiping'); // 'p1_swiping' | 'p1_finished' | 'p2_swiping' | 'matched'
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingDeck, setIsLoadingDeck] = useState(true);

  // Online Multiplayer Room State
  const [onlineSessionId, setOnlineSessionId] = useState(null);
  const [onlineRole, setOnlineRole] = useState('p1'); // 'p1' | 'p2'
  const [onlineSessionName, setOnlineSessionName] = useState(null);

  // Active custom list or preset pack state
  const [activePack, setActivePack] = useState(null);
  const [customMovieIds, setCustomMovieIds] = useState([]);

  // Likes & Passes State
  const [p1Likes, setP1Likes] = useState([]);
  const [p1Passes, setP1Passes] = useState([]);
  const [p2Likes, setP2Likes] = useState([]);
  const [p2Passes, setP2Passes] = useState([]);

  // Swipe history for undo functionality
  const [history, setHistory] = useState([]);

  // Match State
  const [matchedMovie, setMatchedMovie] = useState(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // TMDB API Key from LocalStorage or env
  const [apiKey, setApiKeyState] = useState(() => {
    return localStorage.getItem('movie_match_api_key') || '';
  });

  // Selected Movie for Detail Drawer
  const [inspectedMovie, setInspectedMovie] = useState(null);

  const saveApiKey = (key) => {
    setApiKeyState(key);
    if (key) {
      localStorage.setItem('movie_match_api_key', key);
    } else {
      localStorage.removeItem('movie_match_api_key');
    }
  };

  // Helper to reset swiping session state
  const resetSessionState = () => {
    setP1Likes([]);
    setP1Passes([]);
    setP2Likes([]);
    setP2Passes([]);
    setMatchedMovie(null);
    setIsMatchModalOpen(false);
    setPhase('p1_swiping');
    setCurrentIndex(0);
    setHistory([]);
  };

  // Load Deck based on filters, mode, custom lists or preset packs
  const loadDeck = useCallback(async (currentFilters = filters, isP2LinkMode = false, p1LikedIds = [], targetCustomIds = [], packId = null) => {
    setIsLoadingDeck(true);
    try {
      let movies = [];
      
      if (packId) {
        const pack = PRESET_PACKS.find(p => p.id === packId);
        if (pack) {
          setActivePack(pack);
          movies = await fetchMoviesByIds(pack.movieIds, apiKey);
        }
      } else if (targetCustomIds.length > 0) {
        setCustomMovieIds(targetCustomIds);
        movies = await fetchMoviesByIds(targetCustomIds, apiKey);
      } else if (isP2LinkMode && p1LikedIds.length > 0) {
        const p1Movies = await fetchMoviesByIds(p1LikedIds, apiKey);
        const discoverMovies = await fetchDiscoverMovies(currentFilters, apiKey);
        
        const existingIds = new Set(p1Movies.map(m => m.id));
        const extraMovies = discoverMovies.filter(m => !existingIds.has(m.id));
        movies = [...p1Movies, ...extraMovies].slice(0, 20);
      } else {
        setActivePack(null);
        setCustomMovieIds([]);
        movies = await fetchDiscoverMovies(currentFilters, apiKey);
      }

      setDeck(movies);
      setCurrentIndex(0);
      setHistory([]);
    } catch (err) {
      console.error('Error loading deck:', err);
    } finally {
      setIsLoadingDeck(false);
    }
  }, [filters, apiKey]);

  // Initial check for URL state (Online Room or Async Link Share Mode)
  useEffect(() => {
    const urlState = parseURLState();
    if (urlState && urlState.sessionId) {
      setOnlineSessionId(urlState.sessionId);
      setModeState('async');
      const isPlayer2 = urlState.sessionMode === 'guest' || urlState.sessionMode === 'account';
      if (isPlayer2) {
        setOnlineRole('p2');
        setPhase('p2_swiping');
      }

      // Fetch Online Session details from Backend Server
      fetch(`${BACKEND_API}/sessions/${urlState.sessionId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.session) {
            const s = data.session;
            setOnlineSessionName(s.session_name);
            if (s.p1_likes) setP1Likes(s.p1_likes);
            if (s.p2_likes) setP2Likes(s.p2_likes);
            if (s.deck_movie_ids && s.deck_movie_ids.length > 0) {
              setCustomMovieIds(s.deck_movie_ids);
              loadDeck(filters, true, s.p1_likes, s.deck_movie_ids);
            } else {
              loadDeck(filters);
            }
          } else {
            loadDeck(filters);
          }
        })
        .catch(() => loadDeck(filters));
    } else if (urlState && urlState.isAsyncLink) {
      setModeState('async');
      if (urlState.p1Likes.length > 0) {
        setP1Likes(urlState.p1Likes);
        setPhase('p2_swiping');
      }
      const mergedFilters = { ...DEFAULT_FILTERS, ...urlState.filters };
      setFilters(mergedFilters);
      loadDeck(mergedFilters, urlState.p1Likes.length > 0, urlState.p1Likes, urlState.customMovieIds, urlState.packId);
    } else {
      loadDeck(filters);
    }
  }, [loadDeck]);

  // Real-Time Socket.io WebSockets Room Synchronization & Instant Match Handler
  useEffect(() => {
    if (!onlineSessionId) return;

    // Join room via WebSockets
    socketService.joinSession(onlineSessionId, onlineRole);

    // Listen for instant match found emission
    socketService.onMatchFound(async ({ matchedMovieId }) => {
      let found = deck.find(m => m.id === matchedMovieId);
      if (!found) {
        const fetched = await fetchMoviesByIds([matchedMovieId], apiKey);
        found = fetched[0];
      }
      if (found) {
        setMatchedMovie(found);
        setIsMatchModalOpen(true);
        setPhase('matched');
      }
    });

    // Listen for live room swipe updates
    socketService.onSessionUpdated(({ p1Likes: updatedP1, p2Likes: updatedP2 }) => {
      if (updatedP1) setP1Likes(updatedP1);
      if (updatedP2) setP2Likes(updatedP2);
    });

    // Fallback polling loop (3s backup)
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_API}/sessions/${onlineSessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        const s = data.session;

        if (s.p1_likes) setP1Likes(s.p1_likes);
        if (s.p2_likes) setP2Likes(s.p2_likes);

        if (s.matched_movie_id && !matchedMovie) {
          let found = deck.find(m => m.id === s.matched_movie_id);
          if (!found) {
            const fetched = await fetchMoviesByIds([s.matched_movie_id], apiKey);
            found = fetched[0];
          }
          if (found) {
            setMatchedMovie(found);
            setIsMatchModalOpen(true);
            setPhase('matched');
          }
        }
      } catch (err) {
        // Backup catch
      }
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [onlineSessionId, onlineRole, deck, matchedMovie, apiKey]);

  // Load a Preset Theme Pack
  const loadPresetPack = (packId) => {
    const pack = PRESET_PACKS.find(p => p.id === packId);
    if (pack) {
      setActivePack(pack);
      setCustomMovieIds([]);
      resetSessionState();
      loadDeck(filters, false, [], [], packId);
    }
  };

  // Load a Custom Built Watchlist (accepts array of objects OR array of IDs)
  const loadCustomList = (customMoviesOrIds) => {
    if (!customMoviesOrIds || customMoviesOrIds.length === 0) return;

    setActivePack(null);
    resetSessionState();

    if (typeof customMoviesOrIds[0] === 'object') {
      // Direct full movie objects
      const ids = customMoviesOrIds.map(m => m.id);
      setCustomMovieIds(ids);
      setDeck(customMoviesOrIds);
      setCurrentIndex(0);
      setIsLoadingDeck(false);
    } else {
      // Array of IDs (e.g. from URL state)
      setCustomMovieIds(customMoviesOrIds);
      loadDeck(filters, false, [], customMoviesOrIds, null);
    }
  };

  // Handle Swiping Action
  const handleSwipe = (movie, direction) => {
    if (!movie) return;

    const isLike = direction === 'right';
    const isPlayer1 = phase === 'p1_swiping';
    const isPlayer2 = phase === 'p2_swiping';

    setHistory(prev => [...prev, { movie, direction, phase, index: currentIndex }]);

    // Sync swipe instantly via WebSockets & HTTP
    if (onlineSessionId) {
      const playerNum = onlineRole === 'p2' ? 2 : 1;
      
      // Instant WebSocket Broadcast
      socketService.sendSwipe(onlineSessionId, playerNum, movie.id, isLike);

      // HTTP fallback POST for record keeping
      fetch(`${BACKEND_API}/sessions/${onlineSessionId}/swipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: playerNum,
          movieId: movie.id,
          isLike
        })
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.isMatch) {
          setMatchedMovie(movie);
          setIsMatchModalOpen(true);
          setPhase('matched');
        }
      })
      .catch(err => console.error('Error posting online swipe:', err));
    }

    if (isPlayer1) {
      if (isLike) {
        setP1Likes(prev => [...prev, movie.id]);
      } else {
        setP1Passes(prev => [...prev, movie.id]);
      }

      const nextIdx = currentIndex + 1;
      if (nextIdx >= deck.length) {
        setPhase('p1_finished');
      } else {
        setCurrentIndex(nextIdx);
      }
    } else if (isPlayer2) {
      if (isLike) {
        setP2Likes(prev => [...prev, movie.id]);

        if (p1Likes.includes(movie.id)) {
          setMatchedMovie(movie);
          setIsMatchModalOpen(true);
          setPhase('matched');
        }
      } else {
        setP2Passes(prev => [...prev, movie.id]);
      }

      const nextIdx = currentIndex + 1;
      if (nextIdx >= deck.length) {
        setPhase(matchedMovie ? 'matched' : 'p1_finished');
      } else {
        setCurrentIndex(nextIdx);
      }
    }
  };

  // Undo Last Swipe
  const handleUndo = () => {
    if (history.length === 0) return;

    const lastAction = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));

    const { movie, direction, phase: actionPhase, index } = lastAction;
    setCurrentIndex(index);
    setPhase(actionPhase);

    if (actionPhase === 'p1_swiping') {
      if (direction === 'right') {
        setP1Likes(prev => prev.filter(id => id !== movie.id));
      } else {
        setP1Passes(prev => prev.filter(id => id !== movie.id));
      }
    } else if (actionPhase === 'p2_swiping') {
      if (direction === 'right') {
        setP2Likes(prev => prev.filter(id => id !== movie.id));
      } else {
        setP2Passes(prev => prev.filter(id => id !== movie.id));
      }
    }
  };

  const startPlayer2Turn = () => {
    setPhase('p2_swiping');
    setCurrentIndex(0);
    setHistory([]);
  };

  const setMode = (newMode) => {
    setModeState(newMode);
    resetSession(newMode);
  };

  const updateFilters = (newFilters) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    setActivePack(null);
    setCustomMovieIds([]);
    loadDeck(updated, phase === 'p2_swiping', p1Likes);
  };

  const resetSession = (targetMode = mode) => {
    if (window.location.search) {
      window.history.pushState({}, '', window.location.pathname);
    }
    setActivePack(null);
    setCustomMovieIds([]);
    setOnlineSessionId(null);
    setOnlineSessionName(null);
    setOnlineRole('p1');
    resetSessionState();
    loadDeck(filters);
  };

  const getShareLink = () => {
    return generateShareableURL(p1Likes, filters, customMovieIds, activePack?.id);
  };

  // Theme State ('dark' | 'light')
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('movie_match_theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light-mode');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('movie_match_theme', nextTheme);
      return nextTheme;
    });
  };

  const value = {
    mode,
    setMode,
    phase,
    setPhase,
    deck,
    currentIndex,
    currentMovie: deck[currentIndex] || null,
    isLoadingDeck,
    onlineSessionId,
    setOnlineSessionId,
    onlineRole,
    setOnlineRole,
    onlineSessionName,
    activePack,
    customMovieIds,
    loadPresetPack,
    loadCustomList,
    p1Likes,
    p1Passes,
    p2Likes,
    p2Passes,
    matchedMovie,
    isMatchModalOpen,
    setIsMatchModalOpen,
    filters,
    updateFilters,
    apiKey,
    saveApiKey,
    inspectedMovie,
    setInspectedMovie,
    handleSwipe,
    handleUndo,
    startPlayer2Turn,
    resetSession,
    getShareLink,
    canUndo: history.length > 0,
    theme,
    toggleTheme
  };

  return <MovieContext.Provider value={value}>{children}</MovieContext.Provider>;
};

export const useMovieContext = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error('useMovieContext must be used within a MovieProvider');
  }
  return context;
};
