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
    <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto flex flex-col items-center py-2 px-2 sm:px-4">
      {/* Turn Indicator Banner */}
      <div className="w-full flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-700/60"></span>
          <span className="text-xs font-sans font-medium uppercase tracking-wider text-stone-600">
            {phase === 'p1_swiping' ? 'Player 1 Turn' : 'Player 2 Turn'}
          </span>
        </div>
        <span className="text-xs font-sans font-normal text-stone-500 bg-stone-200/50 px-3 py-1 rounded-full border border-stone-300/40">
          {currentIndex + 1} of {deck.length}
        </span>
      </div>

      {/* Cards Stack Container (Editorial Matting Poster Frame) */}
      <div className="relative w-full aspect-[2/3] h-[560px] sm:h-[640px] lg:h-[680px]">
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

      {/* Controls Container (Organic Soft Stone Buttons) */}
      <div className="w-full flex items-center justify-center gap-5 mt-6">
        {/* Undo Button */}
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={`relative p-4 rounded-2xl border transition-all duration-300 shadow-sm ${
            canUndo
              ? 'bg-[#FFFDF9] text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-900 active:scale-95'
              : 'bg-stone-100/50 text-stone-300 border-stone-200/50 opacity-40 cursor-not-allowed'
          }`}
          title="Undo previous swipe (Keyboard: Z)"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Pass Button */}
        <button
          onClick={() => handleSwipe(currentMovie, 'left')}
          className="relative p-5 rounded-2xl bg-[#FFFDF9] text-stone-600 border border-stone-200/90 hover:bg-stone-100 hover:text-stone-900 hover:border-stone-300 active:scale-95 transition-all duration-300 shadow-sm group"
          title="Pass (Keyboard: ← Left Arrow)"
        >
          <X className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Info Button */}
        <button
          onClick={() => setDetailMovie(currentMovie)}
          className="relative p-4 rounded-2xl bg-[#FFFDF9] text-stone-700 border border-stone-200 hover:bg-stone-100 hover:text-stone-900 active:scale-95 transition-all duration-300 shadow-sm"
          title="Movie Info & Streaming Options (Keyboard: ↑ Up Arrow or Space)"
        >
          <Info className="w-5 h-5" />
        </button>

        {/* Like Button */}
        <button
          onClick={() => handleSwipe(currentMovie, 'right')}
          className="relative p-5 rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 hover:bg-stone-800 active:scale-95 transition-all duration-300 shadow-md group"
          title="Like (Keyboard: → Right Arrow)"
        >
          <Heart className="w-7 h-7 fill-stone-100/20 group-hover:fill-stone-100 group-hover:scale-110 transition-transform duration-300" />
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
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const likeOpacity = useTransform(x, [15, 120], [0, 1]);
  const passOpacity = useTransform(x, [-15, -120], [0, 1]);

  // Scaled stack effect for cards beneath top
  const scale = 1 - index * 0.04;
  const translateY = index * 12;

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
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: isTop ? 1 : scale, opacity: 1, y: isTop ? 0 : translateY }}
      exit={{
        x: x.get() < 0 ? -300 : 300,
        opacity: 0,
        rotate: x.get() < 0 ? -20 : 20,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      className={`absolute inset-0 rounded-3xl poster-matting flex flex-col justify-between select-none cursor-grab active:cursor-grabbing ${
        isTop ? 'touch-pan-y' : 'pointer-events-none'
      }`}
    >
      {/* Framed Image Container */}
      <div className="relative w-full flex-1 rounded-2xl overflow-hidden bg-stone-100">
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
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent pointer-events-none" />

        {/* Dynamic Overlay Stamps (Like / Pass) */}
        {isTop && (
          <>
            {/* LIKE Stamp */}
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-6 left-6 z-20 transform -rotate-6 border-2 border-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-xl shadow-md pointer-events-none"
            >
              <span className="text-xl font-sans font-bold tracking-widest text-emerald-800 uppercase">
                LIKE
              </span>
            </motion.div>

            {/* PASS Stamp */}
            <motion.div
              style={{ opacity: passOpacity }}
              className="absolute top-6 right-6 z-20 transform rotate-6 border-2 border-stone-400 bg-stone-100 px-4 py-1.5 rounded-xl shadow-md pointer-events-none"
            >
              <span className="text-xl font-sans font-bold tracking-widest text-stone-700 uppercase">
                PASS
              </span>
            </motion.div>
          </>
        )}

        {/* Top Details Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 bg-[#FFFDF9]/90 backdrop-blur-md px-3 py-1 rounded-full border border-stone-200/80 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
            <span className="text-xs font-sans font-medium text-stone-800">{movie.vote_average}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            className="p-2 rounded-full bg-[#FFFDF9]/90 backdrop-blur-md text-stone-700 hover:text-stone-900 border border-stone-200/80 transition-all pointer-events-auto shadow-sm"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Information Container inside framed image */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-10 space-y-2 pointer-events-none text-white">
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
    </motion.div>
  );
}
