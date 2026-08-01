import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchDiscoverMovies, fetchMoviesByIds, PRESET_PACKS } from '../services/tmdbApi';
import { parseURLState, generateShareableURL } from '../utils/urlState';
import { BACKEND_API } from '../config';
import socketService from '../services/socketService';
import { createInitialTasteMatrix, updateTasteMatrix, calculateMatchScore, rankAndBalanceDeck } from '../utils/recommendationEngine';

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

  // Recommendation Matrix & Dynamic Feed Taste Matrix State
  const [tasteMatrix, setTasteMatrix] = useState(createInitialTasteMatrix);

  // Persistent Liked Movies History Objects State
  const [likedMovieObjects, setLikedMovieObjects] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('movie_match_saved_liked_movies');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Error reading saved liked movies:', e);
      }
    }
    return [];
  });

  // Sync likedMovieObjects to localStorage whenever updated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('movie_match_saved_liked_movies', JSON.stringify(likedMovieObjects));
      } catch (e) {
        console.warn('Error writing saved liked movies to localStorage:', e);
      }
    }
  }, [likedMovieObjects]);

  // User Account Saved Watchlists & Persistent Likes State
  const [userWatchlists, setUserWatchlists] = useState([]);

  // Helper to get stored auth token
  const getAuthToken = () => {
    return typeof window !== 'undefined' ? localStorage.getItem('movie_match_jwt_token') || '' : '';
  };

  // Fetch logged-in user's saved watchlists from database
  const fetchUserWatchlists = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUserWatchlists([]);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_API}/lists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserWatchlists(data.watchlists || []);
      }
    } catch (err) {
      console.error('Error fetching user watchlists:', err);
    }
  }, []);

  // Fetch logged-in user's saved likes from database
  const fetchUserLikes = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${BACKEND_API}/lists/likes/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.movieIds && data.movieIds.length > 0) {
          setP1Likes(prev => Array.from(new Set([...prev, ...data.movieIds])));

          // Fetch full movie objects for missing backend liked IDs
          const missingIds = data.movieIds.filter(id => !likedMovieObjects.some(m => m.id === id));
          if (missingIds.length > 0) {
            const fetched = await fetchMoviesByIds(missingIds, apiKey);
            if (fetched && fetched.length > 0) {
              setLikedMovieObjects(prev => {
                const existingMap = new Map(prev.map(m => [m.id, m]));
                fetched.forEach(m => existingMap.set(m.id, m));
                return Array.from(existingMap.values());
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching user likes:', err);
    }
  }, [apiKey, likedMovieObjects]);

  // Save a custom watchlist deck to logged-in user account
  const saveWatchlistToAccount = async (title, movieIds) => {
    const token = getAuthToken();
    if (!token) throw new Error('Must be logged in to save watchlists');

    const res = await fetch(`${BACKEND_API}/lists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, movieIds })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to save watchlist');
    }

    await fetchUserWatchlists();
    return data.watchlist;
  };

  // Delete a saved watchlist deck from user account
  const deleteUserWatchlist = async (id) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${BACKEND_API}/lists/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUserWatchlists(prev => prev.filter(w => w.id !== id));
      }
    } catch (err) {
      console.error('Error deleting watchlist:', err);
    }
  };

  // Load account data on mount and token availability
  useEffect(() => {
    fetchUserWatchlists();
    fetchUserLikes();
  }, [fetchUserWatchlists, fetchUserLikes]);
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

  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

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
        const discoverMovies = await fetchDiscoverMovies(currentFilters, apiKey, 1);
        
        const existingIds = new Set(p1Movies.map(m => m.id));
        const extraMovies = discoverMovies.filter(m => !existingIds.has(m.id));
        movies = [...p1Movies, ...extraMovies];
      } else {
        setActivePack(null);
        setCustomMovieIds([]);
        movies = await fetchDiscoverMovies(currentFilters, apiKey, 1);
      }

      // Rank & Score movies dynamically via Recommendation Matrix
      const scoredDeck = rankAndBalanceDeck(movies, tasteMatrix);
      setDeck(scoredDeck);
      setCurrentIndex(0);
      setPage(1);
      setHistory([]);
    } catch (err) {
      console.error('Error loading deck:', err);
    } finally {
      setIsLoadingDeck(false);
    }
  }, [filters, apiKey, tasteMatrix]);

  // Fetch next page of TMDB movies for infinite scrolling deck with Recommendation Scoring
  const fetchNextPage = useCallback(async () => {
    if (isFetchingMore || activePack || customMovieIds.length > 0) return;
    setIsFetchingMore(true);
    try {
      const nextPage = page + 1;
      const newMovies = await fetchDiscoverMovies(filters, apiKey, nextPage);
      if (newMovies && newMovies.length > 0) {
        const scoredNewMovies = rankAndBalanceDeck(newMovies, tasteMatrix);
        setDeck(prevDeck => {
          const existingIds = new Set(prevDeck.map(m => m.id));
          const filteredNew = scoredNewMovies.filter(m => !existingIds.has(m.id));
          return [...prevDeck, ...filteredNew];
        });
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Error fetching next page:', err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [page, isFetchingMore, filters, apiKey, activePack, customMovieIds, tasteMatrix]);

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

  // Helper to exit online multiplayer session cleanly
  const exitOnlineSession = useCallback(() => {
    if (onlineSessionId) {
      socketService.leaveSession(onlineSessionId, onlineRole);
    }
    setOnlineSessionId(null);
    setOnlineSessionName(null);
    setOnlineRole('p1');
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [onlineSessionId, onlineRole]);

  // Real-Time Socket.io WebSockets Room Synchronization & Disconnect Listener
  useEffect(() => {
    if (!onlineSessionId) return;

    // Join room via WebSockets
    socketService.joinSession(onlineSessionId, onlineRole);

    // Listen for partner window close or session termination
    socketService.onSessionTerminated(() => {
      console.log('Session was terminated by partner or tab close.');
      exitOnlineSession();
    });

    // Notify partner if window/tab is closed
    const handleBeforeUnload = () => {
      socketService.leaveSession(onlineSessionId, onlineRole);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

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
      }
    });

    // Listen for live room swipe updates
    socketService.onSessionUpdated(({ p1Likes: updatedP1, p2Likes: updatedP2 }) => {
      if (updatedP1) setP1Likes(updatedP1);
      if (updatedP2) setP2Likes(updatedP2);
    });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [onlineSessionId, onlineRole, deck, apiKey, exitOnlineSession]);

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

    // Persist liked movie to local history & backend user account
    if (isLike) {
      setLikedMovieObjects(prev => {
        if (prev.some(m => m.id === movie.id)) return prev;
        return [movie, ...prev];
      });

      const token = getAuthToken();
      if (token) {
        fetch(`${BACKEND_API}/lists/likes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ movieId: movie.id })
        }).catch(err => console.error('Error syncing like to user account:', err));
      }
    }

    // Update Recommendation Taste Matrix in real-time
    setTasteMatrix(prev => {
      const updated = updateTasteMatrix(prev, movie, isLike);
      
      // Dynamically update upcoming cards' match scores based on new taste vector
      setDeck(prevDeck => {
        return prevDeck.map((m, idx) => {
          if (idx <= currentIndex) return m;
          return {
            ...m,
            matchScore: calculateMatchScore(m, updated)
          };
        });
      });

      return updated;
    });

    if (isPlayer1) {
      if (isLike) {
        setP1Likes(prev => [...prev, movie.id]);
      } else {
        setP1Passes(prev => [...prev, movie.id]);
      }

      const nextIdx = currentIndex + 1;
      if (nextIdx >= deck.length - 4) {
        fetchNextPage();
      }

      if (nextIdx >= deck.length && (activePack || customMovieIds.length > 0)) {
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
      if (nextIdx >= deck.length - 5) {
        fetchNextPage();
      }

      if (nextIdx >= deck.length && (activePack || customMovieIds.length > 0)) {
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
    exitOnlineSession,
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
    fetchNextPage,
    isFetchingMore,
    userWatchlists,
    saveWatchlistToAccount,
    deleteUserWatchlist,
    fetchUserWatchlists,
    tasteMatrix,
    calculateMatchScore,
    likedMovieObjects
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
