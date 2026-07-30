import React, { useState, useEffect } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { DEFAULT_POSTER, fetchMovieTrailer } from '../services/tmdbApi';
import { Star, Play, Info, Film, Heart, CheckCircle2 } from 'lucide-react';

export default function CinemaDashboard() {
  const {
    deck,
    currentIndex,
    p1Likes,
    p2Likes,
    setInspectedMovie,
    filters,
    applyFilters
  } = useMovieContext();

  const currentMovie = deck[currentIndex];
  const [trailerData, setTrailerData] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [activeTab, setActiveTab] = useState('spotlight'); // 'spotlight' | 'watchlist'

  useEffect(() => {
    let isMounted = true;
    if (currentMovie?.id) {
      setShowTrailer(false);
      setTrailerData(null);
      fetchMovieTrailer(currentMovie.id).then(res => {
        if (isMounted && res) {
          setTrailerData(res);
        }
      });
    }
    return () => { isMounted = false; };
  }, [currentMovie?.id]);

  // Combine session likes into watchlist items
  const likedMovieIds = Array.from(new Set([...p1Likes, ...p2Likes]));
  const likedMovies = deck.filter(m => likedMovieIds.includes(m.id));

  const ytKey = typeof trailerData === 'string' ? trailerData : trailerData?.key;

  const quickGenres = [
    { id: 'all', name: 'All' },
    { id: '28', name: 'Action' },
    { id: '35', name: 'Comedy' },
    { id: '18', name: 'Drama' },
    { id: '878', name: 'Sci-Fi' },
    { id: '27', name: 'Horror' },
    { id: '10749', name: 'Romance' },
    { id: '16', name: 'Animation' }
  ];

  return (
    <div className="editorial-card p-5 sm:p-6 rounded-3xl border border-stone-200/90 dark:border-stone-800 space-y-5 shadow-sm relative overflow-hidden bg-[#FFFDF9] dark:bg-[#121110]">
      {/* 1. Dashboard Mode Selector Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200/70 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('spotlight')}
            className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'spotlight'
                ? 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Now Playing</span>
          </button>

          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 relative ${
              activeTab === 'watchlist'
                ? 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500/30 text-rose-500" />
            <span>Watchlist</span>
            {likedMovies.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-500 text-white font-bold ml-0.5">
                {likedMovies.length}
              </span>
            )}
          </button>
        </div>

        {currentMovie && (
          <button
            onClick={() => setInspectedMovie && setInspectedMovie(currentMovie)}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-all cursor-pointer"
            title="Inspect Full Movie Details"
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. 1-Click Quick Genre Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-sans font-medium text-stone-500 dark:text-stone-400 px-1">
          <span>Quick Filter</span>
          <span className="text-[10px] text-stone-400 uppercase tracking-wider">1-Click Switch</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickGenres.map(g => {
            const isActive = String(filters.genreId) === String(g.id);
            return (
              <button
                key={g.id}
                onClick={() => applyFilters({ ...filters, genreId: g.id })}
                className={`px-2.5 py-1 rounded-xl text-xs font-sans font-medium transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? 'bg-amber-700 text-white border-amber-800 dark:bg-amber-600 dark:border-amber-500 shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-stone-800 hover:bg-stone-200 dark:hover:bg-stone-800'
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Dashboard Body Content */}
      {activeTab === 'spotlight' ? (
        currentMovie ? (
          <div className="space-y-4">
            {/* Widescreen Cinema Trailer Stage */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-900 shadow-inner group">
              {showTrailer && ytKey ? (
                <iframe
                  src={`https://www.youtube.com/embed/${ytKey}?autoplay=1&rel=0&enablejsapi=1`}
                  title={`${currentMovie.title} Trailer`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  <img
                    src={currentMovie.backdrop_path || currentMovie.poster_path || DEFAULT_POSTER}
                    alt={currentMovie.title}
                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_POSTER; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />

                  {/* Play Overlay Button */}
                  {ytKey && (
                    <div className="absolute inset-0 flex items-center justify-center bg-stone-950/30 hover:bg-stone-950/20 transition-colors duration-300">
                      <button
                        onClick={() => setShowTrailer(true)}
                        className="w-12 h-12 rounded-2xl bg-[#FFFDF9] dark:bg-stone-100 hover:scale-105 text-stone-900 flex items-center justify-center shadow-md transition-transform duration-300 cursor-pointer"
                        title="Watch Trailer"
                      >
                        <Play className="w-5 h-5 fill-stone-900 ml-0.5 text-stone-900" />
                      </button>
                    </div>
                  )}

                  {/* Rating Tag */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-stone-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-stone-800 text-xs text-white">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{currentMovie.vote_average}</span>
                  </div>
                </>
              )}
            </div>

            {/* Spotlight Metadata */}
            <div className="space-y-2">
              <h4 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100 truncate">
                {currentMovie.title}
              </h4>
              <p className="text-xs font-sans font-light text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                {currentMovie.overview}
              </p>
            </div>
          </div>
        ) : null
      ) : (
        /* Watchlist Tab View */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-sans font-medium text-stone-500 dark:text-stone-400">
            <span>Session Matches & Picks ({likedMovies.length})</span>
          </div>

          {likedMovies.length === 0 ? (
            <div className="p-6 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-600 space-y-2">
              <Heart className="w-8 h-8 mx-auto opacity-40 text-stone-400 dark:text-stone-600" />
              <p className="text-xs font-serif font-medium text-stone-700 dark:text-stone-300">No Liked Movies Yet</p>
              <p className="text-[11px] font-sans font-light">Swipe right or click Like to add movies to your session list.</p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
              {likedMovies.map(movie => {
                const isP1 = p1Likes.includes(movie.id);
                const isP2 = p2Likes.includes(movie.id);
                const isMutualMatch = isP1 && isP2;

                return (
                  <div
                    key={movie.id}
                    onClick={() => setInspectedMovie && setInspectedMovie(movie)}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-stone-100/70 dark:bg-stone-900/60 hover:bg-stone-200/70 dark:hover:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 transition-all cursor-pointer"
                  >
                    <img
                      src={movie.poster_path || DEFAULT_POSTER}
                      alt={movie.title}
                      className="w-10 h-14 object-cover rounded-xl border border-stone-200 dark:border-stone-800 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-serif font-medium text-stone-900 dark:text-stone-100 truncate">
                        {movie.title}
                      </h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-sans text-stone-500 dark:text-stone-400 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {movie.vote_average}
                        </span>
                        {isMutualMatch ? (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-700 text-white text-[10px] font-sans font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Match!
                          </span>
                        ) : (
                          <span className="text-[10px] font-sans text-amber-700 dark:text-amber-500 font-medium">
                            Liked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
