import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieContext } from '../context/MovieContext';
import { Sparkles, Heart, Star, Calendar, X, RefreshCw, Film } from 'lucide-react';
import confetti from 'canvas-confetti';
import WatchProviders from './WatchProviders';

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80";

export default function MatchModal() {
  const { matchedMovie, isMatchModalOpen, setIsMatchModalOpen, filters, resetSession } = useMovieContext();

  useEffect(() => {
    if (isMatchModalOpen && matchedMovie) {
      // Fire celebratory confetti cannons
      const count = 160;
      const defaults = { origin: { y: 0.7 } };

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, { spread: 26, startVelocity: 45 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 90, decay: 0.91, scalar: 0.8 });
    }
  }, [isMatchModalOpen, matchedMovie]);

  if (!matchedMovie) return null;

  return (
    <AnimatePresence>
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMatchModalOpen(false)}
            className="absolute inset-0"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="relative w-full max-w-md bg-[#FFFDF9] dark:bg-[#1C1A17] border border-stone-200/80 dark:border-stone-800 rounded-3xl shadow-xl overflow-hidden z-10 max-h-[90vh] flex flex-col text-stone-900 dark:text-stone-100"
          >
            {/* Header Backdrop & Match Title */}
            <div className="relative h-52 w-full bg-stone-900 flex-shrink-0 overflow-hidden">
              {matchedMovie.backdrop_path ? (
                <img
                  src={matchedMovie.backdrop_path}
                  alt={matchedMovie.title}
                  onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_POSTER; }}
                  className="w-full h-full object-cover opacity-50"
                />
              ) : (
                <div className="w-full h-full bg-stone-900 flex items-center justify-center">
                  <Film className="w-16 h-16 text-stone-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#FFFDF9] dark:from-[#1C1A17] via-stone-950/40 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setIsMatchModalOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-stone-950/60 text-stone-300 hover:text-white backdrop-blur-md border border-stone-700/50 transition-all cursor-pointer"
              >
                <X strokeWidth={1.25} className="w-5 h-5" />
              </button>

              {/* Celebratory Banner */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-amber-700 text-white text-[11px] font-sans font-medium uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                <Sparkles strokeWidth={1.25} className="w-3.5 h-3.5" />
                <span>IT'S A MATCH!</span>
              </div>

              {/* Poster and Title Overlay */}
              <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3.5">
                <img
                  src={matchedMovie.poster_path || DEFAULT_POSTER}
                  alt={matchedMovie.title}
                  onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_POSTER; }}
                  className="w-20 aspect-[2/3] object-cover rounded-xl shadow-lg border border-stone-200/80 dark:border-stone-700 flex-shrink-0"
                />
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-xs font-sans font-medium mb-0.5">
                    <Heart strokeWidth={1.25} className="w-3.5 h-3.5 fill-emerald-700 dark:fill-emerald-400 text-emerald-700 dark:text-emerald-400" />
                    <span>Both of you liked this movie!</span>
                  </div>
                  <h2 className="text-xl font-serif font-normal text-stone-900 dark:text-stone-100 leading-snug truncate">
                    {matchedMovie.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs font-sans font-light text-stone-600 dark:text-stone-400 mt-0.5">
                    <span className="flex items-center gap-1 font-medium text-amber-700 dark:text-amber-500">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {matchedMovie.vote_average}
                    </span>
                    <span>•</span>
                    <span>{matchedMovie.release_date?.split('-')[0]}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Synopsis */}
              <p className="text-xs font-sans font-light text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-100/70 dark:bg-stone-900/60 p-3 rounded-2xl border border-stone-200/60 dark:border-stone-800">
                {matchedMovie.overview}
              </p>

              {/* Streaming Badges */}
              <WatchProviders movieId={matchedMovie.id} initialRegion={filters.region} />

              {/* Bottom Actions */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => setIsMatchModalOpen(false)}
                  className="w-full py-3.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 font-sans font-medium text-xs hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  Keep Swiping More Movies
                </button>

                <button
                  onClick={() => resetSession()}
                  className="w-full py-2 text-xs font-sans font-light text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw strokeWidth={1.25} className="w-3.5 h-3.5" />
                  <span>Start a New Deck</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
