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
    phase
  } = useMovieContext();

  const [detailMovie, setDetailMovie] = useState(null);

  const visibleCards = deck.slice(currentIndex, currentIndex + 3);
  const currentMovie = visibleCards[0];

  // Global Keyboard Shortcuts (Arrow keys & Z for undo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when modal or drawer is open or input focused
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-rose-500 animate-spin p-1">
            <div className="w-full h-full bg-slate-950 rounded-[12px] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-300">Assembling Movie Deck...</p>
        <p className="text-xs text-slate-500 mt-1">Filtering by TMDB scores & preferences</p>
      </div>
    );
  }

  if (!currentMovie || currentIndex >= deck.length) {
    return null; // Parent component will show completion or transition screen
  }

  return (
    <div className="relative w-full max-w-sm mx-auto flex flex-col items-center py-2 px-4">
      {/* Turn Indicator Banner */}
      <div className="w-full flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
            {phase === 'p1_swiping' ? 'Player 1 Turn' : 'Player 2 Turn'}
          </span>
        </div>
        <span className="text-xs font-semibold text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800 shadow-sm">
          {currentIndex + 1} / {deck.length}
        </span>
      </div>

      {/* Cards Stack Container */}
      <div className="relative w-full aspect-[3/4] max-h-[520px]">
        <AnimatePresence>
          {visibleCards.map((movie, idx) => {
            const isTop = idx === 0;
            return (
              <SwipeableCard
                key={movie.id}
                movie={movie}
                index={idx}
                isTop={isTop}
                onSwipe={(direction) => handleSwipe(movie, direction)}
                onOpenDetails={() => setDetailMovie(movie)}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Controls Container with Keyboard Shortcuts Hints */}
      <div className="w-full flex items-center justify-center gap-4 mt-6">
        {/* Undo Button */}
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={`relative p-3.5 rounded-full border transition-all duration-200 shadow-lg ${
            canUndo
              ? 'bg-slate-900 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white hover:scale-105 active:scale-95'
              : 'bg-slate-950/40 text-slate-700 border-slate-900 opacity-40 cursor-not-allowed'
          }`}
          title="Undo previous swipe (Keyboard: Z)"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Pass Button */}
        <button
          onClick={() => handleSwipe(currentMovie, 'left')}
          className="relative p-4 rounded-full bg-slate-900/90 text-rose-500 border border-rose-500/30 hover:bg-rose-950/40 hover:border-rose-500 hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl shadow-rose-950/30 group"
          title="Pass (Keyboard: ← Left Arrow)"
        >
          <X className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* Info Button */}
        <button
          onClick={() => setDetailMovie(currentMovie)}
          className="relative p-3.5 rounded-full bg-slate-900 text-purple-400 border border-purple-500/30 hover:bg-purple-950/40 hover:border-purple-500 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
          title="Movie Info & Streaming Options (Keyboard: ↑ Up Arrow or Space)"
        >
          <Info className="w-6 h-6" />
        </button>

        {/* Like Button */}
        <button
          onClick={() => handleSwipe(currentMovie, 'right')}
          className="relative p-4 rounded-full bg-slate-900/90 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-950/40 hover:border-emerald-500 hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl shadow-emerald-950/30 group"
          title="Like (Keyboard: → Right Arrow)"
        >
          <Heart className="w-7 h-7 fill-emerald-500/20 group-hover:fill-emerald-500 group-hover:scale-110 transition-transform duration-200" />
        </button>
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

function SwipeableCard({ movie, index, isTop, onSwipe, onOpenDetails }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const likeOpacity = useTransform(x, [15, 120], [0, 1]);
  const passOpacity = useTransform(x, [-15, -120], [0, 1]);

  // Scaled stack effect for cards beneath top
  const scale = 1 - index * 0.05;
  const translateY = index * 14;

  const handleDragEnd = (event, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > 100 || velocity > 500) {
      onSwipe('right');
    } else if (offset < -100 || velocity < -500) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale: isTop ? 1 : scale,
        y: isTop ? 0 : translateY,
        zIndex: 10 - index
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: isTop ? 1 : scale, opacity: 1, y: isTop ? 0 : translateY }}
      exit={{
        x: x.get() < 0 ? -300 : 300,
        opacity: 0,
        rotate: x.get() < 0 ? -25 : 25,
        transition: { duration: 0.2 }
      }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`absolute inset-0 rounded-3xl overflow-hidden glass-card shadow-2xl select-none cursor-grab active:cursor-grabbing border border-slate-700/60 ${
        isTop ? 'touch-pan-y' : 'pointer-events-none'
      }`}
    >
      {/* Background Poster Image with onError Fallback */}
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

      {/* Dark Gradient Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

      {/* Dynamic Overlay Stamps (Like / Pass) */}
      {isTop && (
        <>
          {/* LIKE Stamp */}
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-6 left-6 z-20 transform -rotate-12 border-4 border-emerald-400 bg-emerald-950/80 px-4 py-1.5 rounded-xl shadow-lg pointer-events-none"
          >
            <span className="text-2xl font-black tracking-widest text-emerald-400 uppercase">
              LIKE
            </span>
          </motion.div>

          {/* PASS Stamp */}
          <motion.div
            style={{ opacity: passOpacity }}
            className="absolute top-6 right-6 z-20 transform rotate-12 border-4 border-rose-500 bg-rose-950/80 px-4 py-1.5 rounded-xl shadow-lg pointer-events-none"
          >
            <span className="text-2xl font-black tracking-widest text-rose-500 uppercase">
              PASS
            </span>
          </motion.div>
        </>
      )}

      {/* Top Details & Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/60">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-bold text-slate-100">{movie.vote_average}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails();
          }}
          className="p-2 rounded-full bg-slate-950/70 backdrop-blur-md text-slate-300 hover:text-white border border-slate-700/60 transition-all pointer-events-auto"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Information Container */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10 space-y-2 pointer-events-none">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-2xl font-black text-white leading-tight drop-shadow-md">
            {movie.title}
          </h2>
          {movie.release_date && (
            <span className="text-xs font-semibold text-slate-400 flex-shrink-0">
              {movie.release_date.split('-')[0]}
            </span>
          )}
        </div>

        {/* Genre Badges */}
        <div className="flex flex-wrap gap-1.5">
          {movie.genres?.slice(0, 3).map((g, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-900/80 text-purple-300 border border-slate-700/60"
            >
              {g}
            </span>
          ))}
        </div>

        {/* Short Synopsis */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed opacity-90">
          {movie.overview}
        </p>
      </div>
    </motion.div>
  );
}
