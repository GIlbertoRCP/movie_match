import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieContext } from '../context/MovieContext';
import { Heart, X, Info, RotateCcw, Star, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
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
    fetchNextPage
  } = useMovieContext();

  const [detailMovie, setDetailMovie] = useState(null);
  const [slideDirection, setSlideDirection] = useState('next'); // 'next' | 'prev' | 'like'
  const isScrollingRef = useRef(false);

  const currentMovie = deck[currentIndex];

  // Helper trigger for Pass & Next (Down Arrow / Scroll Down)
  const triggerPassNext = () => {
    if (!currentMovie) return;
    setSlideDirection('next');
    handleSwipe(currentMovie, 'left');
  };

  // Helper trigger for Like & Next (Right Arrow)
  const triggerLikeNext = () => {
    if (!currentMovie) return;
    setSlideDirection('like');
    handleSwipe(currentMovie, 'right');
  };

  // Helper trigger for Undo / Previous (Up Arrow / Scroll Up)
  const triggerUndoPrev = () => {
    if (!canUndo) return;
    setSlideDirection('prev');
    handleUndo();
  };

  // Check if any modal, settings drawer, or text input is open
  const isAnyOverlayOpen = () => {
    if (detailMovie) return true;
    if (typeof document === 'undefined') return false;
    if (document.querySelector('input:focus, textarea:focus, select:focus')) return true;
    
    const modals = document.querySelectorAll('[role="dialog"], .z-50.fixed:not(.pointer-events-none):not(#server-cold-start-banner)');
    return modals.length > 0;
  };

  // Mouse wheel scroll listener for smooth auto-pass scrolling
  useEffect(() => {
    const handleWheel = (e) => {
      if (isAnyOverlayOpen()) return;

      // Prevent native container scroll behavior
      if (e.cancelable) {
        e.preventDefault();
      }

      if (isScrollingRef.current) return;

      if (e.deltaY > 30) {
        // Scroll Down -> Auto Pass
        isScrollingRef.current = true;
        triggerPassNext();
        setTimeout(() => { isScrollingRef.current = false; }, 380);
      } else if (e.deltaY < -30 && canUndo) {
        // Scroll Up -> Undo / Previous
        isScrollingRef.current = true;
        triggerUndoPrev();
        setTimeout(() => { isScrollingRef.current = false; }, 380);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentMovie, canUndo, detailMovie]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAnyOverlayOpen()) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        triggerPassNext();
      } else if (e.key === 'ArrowRight') {
        triggerLikeNext();
      } else if (e.key === 'ArrowUp') {
        if (canUndo) {
          triggerUndoPrev();
        } else if (currentMovie) {
          setDetailMovie(currentMovie);
        }
      } else if (e.code === 'Space') {
        if (currentMovie) setDetailMovie(currentMovie);
      } else if (e.key === 'z' || e.key === 'Z') {
        if (canUndo) triggerUndoPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMovie, canUndo, detailMovie]);

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

  // Animation variants for smooth card switching
  const cardVariants = {
    initial: (dir) => {
      if (dir === 'next') return { y: 60, opacity: 0, scale: 0.95 };
      if (dir === 'prev') return { y: -60, opacity: 0, scale: 0.95 };
      if (dir === 'like') return { x: 50, opacity: 0, scale: 0.95 };
      return { y: 40, opacity: 0 };
    },
    animate: {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 260, damping: 26 }
    },
    exit: (dir) => {
      if (dir === 'next') return { y: -80, opacity: 0, scale: 0.94, transition: { duration: 0.25 } };
      if (dir === 'prev') return { y: 80, opacity: 0, scale: 0.94, transition: { duration: 0.25 } };
      if (dir === 'like') return { x: 120, opacity: 0, scale: 0.94, rotate: 6, transition: { duration: 0.25 } };
      return { opacity: 0 };
    }
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto flex flex-col items-center h-[calc(100vh-5.5rem)] sm:h-[calc(100vh-4.5rem)] relative justify-center">
      {/* Right Middle Animated Chevron Controls (Desktop / Laptop Only) */}
      <div className="hidden md:flex fixed right-3 sm:right-6 lg:right-10 top-1/2 -translate-y-1/2 flex-col gap-3.5 z-40">
        {/* Up Chevron Button (Undo / Previous) */}
        <motion.button
          whileHover={{ scale: 1.12, y: -2 }}
          whileTap={{ scale: 0.88 }}
          onClick={triggerUndoPrev}
          disabled={!canUndo}
          className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full backdrop-blur-md shadow-2xl flex items-center justify-center border transition-all duration-200 cursor-pointer ${
            canUndo
              ? 'bg-[#1a1b1f]/90 dark:bg-[#141518]/95 text-stone-100 border-stone-700/60 hover:bg-stone-800 hover:border-stone-500 shadow-stone-950/40'
              : 'bg-stone-900/40 text-stone-600 border-stone-800/40 opacity-40 cursor-not-allowed'
          }`}
          title="Previous Movie / Undo (Up Arrow / Z)"
        >
          <ChevronUp className="w-6 h-6 text-stone-100" />
        </motion.button>

        {/* Down Chevron Button (Pass & Next) */}
        <motion.button
          whileHover={{ scale: 1.12, y: 2 }}
          whileTap={{ scale: 0.88 }}
          onClick={triggerPassNext}
          className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#1a1b1f]/90 dark:bg-[#141518]/95 text-stone-100 border border-stone-700/60 hover:bg-stone-800 hover:border-stone-500 backdrop-blur-md shadow-2xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-stone-950/40"
          title="Next Movie / Pass (Down Arrow)"
        >
          <ChevronDown className="w-6 h-6 text-stone-100" />
        </motion.button>
      </div>

      {/* Main Single Animated Movie Card Container */}
      <div className="w-full flex-1 flex items-center justify-center p-1 sm:p-2">
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={currentMovie.id}
            custom={slideDirection}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.65}
            onDragEnd={(e, info) => {
              if (isAnyOverlayOpen()) return;
              const threshold = 60;
              const { offset, velocity } = info;

              if (offset.x > threshold || velocity.x > 250) {
                // Swipe Right -> Like
                triggerLikeNext();
              } else if (offset.x < -threshold || velocity.x < -250) {
                // Swipe Left -> Pass
                triggerPassNext();
              } else if (offset.y > threshold || velocity.y > 250) {
                // Swipe Down -> Pass & Next
                triggerPassNext();
              } else if (offset.y < -threshold || velocity.y < -250) {
                // Swipe Up -> Undo / Previous
                if (canUndo) {
                  triggerUndoPrev();
                } else if (currentMovie) {
                  setDetailMovie(currentMovie);
                }
              }
            }}
            className="editorial-card relative w-full h-[520px] xs:h-[550px] sm:h-[620px] lg:h-[720px] xl:h-[780px] rounded-3xl p-3.5 sm:p-5 lg:p-6 flex flex-col justify-between shadow-xl overflow-hidden touch-none cursor-grab active:cursor-grabbing select-none"
          >
            {/* Framed Matting Media Image Container */}
            <div className="relative w-full flex-1 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
              <img
                src={currentMovie.poster_path || DEFAULT_POSTER}
                alt={currentMovie.title}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_POSTER;
                }}
                className="w-full h-full object-cover object-top pointer-events-none"
                loading="eager"
              />

              {/* Soft Warm Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent pointer-events-none" />

              {/* Rating Badge */}
              <div className="absolute top-3.5 left-3.5 lg:top-5 lg:left-5 flex items-center gap-1.5 bg-[#FFFDF9]/90 dark:bg-stone-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-200/80 dark:border-stone-700/80 shadow-sm z-10">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="text-xs lg:text-sm font-sans font-medium text-stone-900 dark:text-stone-100">{currentMovie.vote_average}</span>
              </div>

              {/* Info Trigger Button */}
              <button
                onClick={() => setDetailMovie(currentMovie)}
                className="absolute top-3.5 right-3.5 lg:top-5 lg:right-5 p-2.5 rounded-full bg-[#FFFDF9]/90 dark:bg-stone-900/90 backdrop-blur-md text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 transition-all z-10 shadow-sm cursor-pointer hover:scale-105"
                title="Movie Information & Trailers"
              >
                <Info className="w-4.5 h-4.5" />
              </button>

              {/* Movie Title Overlay Section */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 space-y-2 lg:space-y-3 z-10 pointer-events-none">
                <div className="flex items-end justify-between gap-3">
                  <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-normal text-stone-100 tracking-tight leading-tight drop-shadow-md">
                    {currentMovie.title}
                  </h2>
                  <span className="text-xs lg:text-sm font-sans font-light text-stone-300 bg-stone-900/70 backdrop-blur-md px-3 py-1 rounded-full border border-stone-700/60 flex-shrink-0">
                    {currentMovie.release_date?.split('-')[0]}
                  </span>
                </div>

                {/* Genre Badges */}
                <div className="flex flex-wrap gap-1.5 lg:gap-2">
                  {currentMovie.genres?.slice(0, 4).map((g, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg text-[11px] lg:text-xs font-sans font-light bg-stone-900/70 text-stone-200 border border-stone-700/70 backdrop-blur-xs"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Action Controls */}
            <div className="w-full flex items-center justify-between pt-3 sm:pt-4 px-2">
              <button
                onClick={triggerUndoPrev}
                disabled={!canUndo}
                className={`p-3.5 lg:p-4 rounded-2xl border transition-all duration-300 shadow-sm ${
                  canUndo
                    ? 'bg-[#FFFDF9] dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 active:scale-95 cursor-pointer'
                    : 'bg-stone-100/50 dark:bg-stone-900/50 text-stone-300 dark:text-stone-700 border-stone-200/50 dark:border-stone-800 opacity-40 cursor-not-allowed'
                }`}
                title="Undo previous pick (Z)"
              >
                <RotateCcw className="w-4 h-4 lg:w-5 lg:h-5" />
              </button>

              <div className="flex items-center gap-4 lg:gap-6">
                {/* Pass Button */}
                <button
                  onClick={triggerPassNext}
                  className="px-6 sm:px-8 lg:px-10 py-3 lg:py-3.5 rounded-2xl bg-[#FFFDF9] dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 active:scale-95 transition-all duration-300 shadow-sm flex items-center gap-2 cursor-pointer font-sans font-medium text-xs lg:text-sm group"
                  title="Pass (Down / Left Arrow)"
                >
                  <X className="w-4 h-4 lg:w-5 lg:h-5 text-stone-500 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Pass</span>
                </button>

                {/* Like Button */}
                <button
                  onClick={triggerLikeNext}
                  className="px-7 sm:px-9 lg:px-11 py-3 lg:py-3.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 border border-stone-800 dark:border-stone-200 hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-95 transition-all duration-300 shadow-md flex items-center gap-2 cursor-pointer font-sans font-medium text-xs lg:text-sm group"
                  title="Like (Right Arrow)"
                >
                  <Heart className="w-4 h-4 lg:w-5 lg:h-5 fill-stone-100 dark:fill-stone-900 group-hover:scale-110 transition-transform duration-300" />
                  <span>Like</span>
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* PC Keyboard & Scroll Shortcut Hint Bar (Always Visible Below Cards on Desktop) */}
      <div className="hidden lg:flex items-center justify-center gap-5 mt-4 text-xs font-sans text-stone-500 dark:text-stone-400">
        <span className="flex items-center gap-1.5 bg-stone-200/60 dark:bg-stone-800/60 px-2.5 py-1 rounded-lg border border-stone-300/40 dark:border-stone-700/40">
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-[10px] font-mono">↓ / Scroll</kbd> Pass & Next
        </span>
        <span className="flex items-center gap-1.5 bg-stone-200/60 dark:bg-stone-800/60 px-2.5 py-1 rounded-lg border border-stone-300/40 dark:border-stone-700/40">
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-[10px] font-mono">↑</kbd> Previous
        </span>
        <span className="flex items-center gap-1.5 bg-stone-200/60 dark:bg-stone-800/60 px-2.5 py-1 rounded-lg border border-stone-300/40 dark:border-stone-700/40">
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-[10px] font-mono">→</kbd> Like
        </span>
        <span className="flex items-center gap-1.5 bg-stone-200/60 dark:bg-stone-800/60 px-2.5 py-1 rounded-lg border border-stone-300/40 dark:border-stone-700/40">
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-[10px] font-mono">Space</kbd> Details
        </span>
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
