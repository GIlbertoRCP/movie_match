import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useMovieContext } from '../context/MovieContext';
import { Heart, X, Info, RotateCcw, Star, Calendar, Loader2, Sparkles } from 'lucide-react';
import MovieDetailDrawer from './MovieDetailDrawer';

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80";

export default function CardStack() {
  const {
    deck,
    currentIndex,
    isLoadingDeck,
    handleSwipe,
    handleUndo,
    canUndo,
    filters,
    phase,
    mode,
    onlineSessionId,
    fetchNextPage
  } = useMovieContext();

  const [detailMovie, setDetailMovie] = useState(null);
  const currentMovie = deck[currentIndex];

  const showStatusBar = Boolean(onlineSessionId) || mode === 'couch' || phase === 'p2_swiping';

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 800) {
      fetchNextPage();
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (detailMovie || document.querySelector('input:focus')) return;

      if (e.key === 'ArrowRight') {
        if (currentMovie) handleSwipe(currentMovie, 'right');
      } else if (e.key === 'ArrowLeft') {
        if (currentMovie) handleSwipe(currentMovie, 'left');
      } else if (e.key === 'ArrowUp' || e.code === 'Space') {
        if (currentMovie) setDetailMovie(currentMovie);
      } else if (e.key === 'z' || e.key === 'Z') {
        if (canUndo) handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMovie, detailMovie, canUndo, handleSwipe, handleUndo]);

  if (isLoadingDeck) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] p-6 text-center">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-stone-900 dark:bg-stone-100 flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-stone-100 dark:text-stone-900 animate-spin" />
          </div>
        </div>
        <p className="mt-4 text-sm font-serif font-medium text-stone-900 dark:text-stone-100">Curating Feed...</p>
        <p className="text-xs font-sans font-light text-stone-500 dark:text-stone-400 mt-1">Filtering catalog by scores & region</p>
      </div>
    );
  }

  if (!currentMovie || currentIndex >= deck.length) {
    return null;
  }

  return (
    <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto flex flex-col items-center h-[calc(100vh-4.5rem)] relative">
      {/* Vertical Snap-Scrolling Container */}
      <div onScroll={handleScroll} className="w-full flex-1 overflow-y-scroll snap-y snap-mandatory scroll-smooth scrollbar-none py-2 space-y-6">
        {deck.slice(currentIndex, deck.length).map((movie, idx) => {
          const isFocused = idx === 0;
          return (
            <div key={movie.id} className="snap-center min-h-[calc(100vh-8.5rem)] w-full flex items-center justify-center p-2">
              <VerticalMovieCard
                movie={movie}
                isFocused={isFocused}
                onSwipe={(dir) => handleSwipe(movie, dir)}
                onOpenDetails={() => setDetailMovie(movie)}
                onUndo={handleUndo}
                canUndo={canUndo}
              />
            </div>
          );
        })}
      </div>

      {/* Detail Drawer */}
      <MovieDetailDrawer
        movie={detailMovie}
        isOpen={Boolean(detailMovie)}
        onClose={() => setDetailMovie(null)}
        region={filters.region}
      />
    </div>
  );
}

function VerticalMovieCard({ movie, isFocused, onSwipe, onOpenDetails, onUndo, canUndo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 24 }}
      className="editorial-card relative w-full h-[580px] sm:h-[640px] rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-sm overflow-hidden"
    >
      {/* Framed Matting Media Image Container */}
      <div className="relative w-full flex-1 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
        <img
          src={movie.poster_path || DEFAULT_POSTER}
          alt={movie.title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_POSTER;
          }}
          className="w-full h-full object-cover pointer-events-none"
          loading="eager"
        />

        {/* Soft Warm Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent pointer-events-none" />

        {/* Rating Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#FFFDF9]/90 dark:bg-stone-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-stone-200/80 dark:border-stone-700/80 shadow-sm z-10">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span className="text-xs font-sans font-medium text-stone-900 dark:text-stone-100">{movie.vote_average}</span>
        </div>

        {/* Info Trigger Button */}
        <button
          onClick={onOpenDetails}
          className="absolute top-3 right-3 p-2 rounded-full bg-[#FFFDF9]/90 dark:bg-stone-900/90 backdrop-blur-md text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 transition-all z-10 shadow-sm cursor-pointer"
          title="Movie Information & Trailers"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Bottom Information Details Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-10 space-y-2 text-white pointer-events-none">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-2xl sm:text-3xl font-serif text-white font-normal leading-snug drop-shadow-sm">
              {movie.title}
            </h2>
            {movie.release_date && (
              <span className="text-xs font-sans font-light text-stone-200 flex-shrink-0 bg-stone-900/60 px-2.5 py-0.5 rounded-full border border-stone-700/60">
                {movie.release_date.split('-')[0]}
              </span>
            )}
          </div>

          {/* Genre Badges */}
          <div className="flex flex-wrap gap-1.5">
            {movie.genres?.slice(0, 3).map((g, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-md text-[11px] font-sans font-light bg-stone-900/60 text-stone-200 border border-stone-700/60"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Short Synopsis */}
          <p className="text-xs font-sans font-light text-stone-200 line-clamp-2 leading-relaxed opacity-90">
            {movie.overview}
          </p>
        </div>
      </div>

      {/* Floating Organic Controls */}
      <div className="w-full flex items-center justify-between pt-3.5 px-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-3 rounded-2xl border transition-all duration-300 shadow-sm ${
            canUndo
              ? 'bg-[#FFFDF9] dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 active:scale-95 cursor-pointer'
              : 'bg-stone-100/50 dark:bg-stone-900/50 text-stone-300 dark:text-stone-700 border-stone-200/50 dark:border-stone-800 opacity-40 cursor-not-allowed'
          }`}
          title="Undo previous pick (Z)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-4">
          {/* Pass Button */}
          <button
            onClick={() => onSwipe('left')}
            className="px-6 py-3 rounded-2xl bg-[#FFFDF9] dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 active:scale-95 transition-all duration-300 shadow-sm flex items-center gap-2 cursor-pointer font-sans font-medium text-xs group"
            title="Pass (← Arrow)"
          >
            <X className="w-4 h-4 text-stone-500 group-hover:rotate-90 transition-transform duration-300" />
            <span>Pass</span>
          </button>

          {/* Like Button */}
          <button
            onClick={() => onSwipe('right')}
            className="px-7 py-3 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 border border-stone-800 dark:border-stone-200 hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-95 transition-all duration-300 shadow-md flex items-center gap-2 cursor-pointer font-sans font-medium text-xs group"
            title="Like (→ Arrow)"
          >
            <Heart className="w-4 h-4 fill-stone-100 dark:fill-stone-900 group-hover:scale-110 transition-transform duration-300" />
            <span>Like</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
