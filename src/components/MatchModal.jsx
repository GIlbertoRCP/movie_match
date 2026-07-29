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
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [isMatchModalOpen, matchedMovie]);

  if (!matchedMovie) return null;

  return (
    <AnimatePresence>
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg">
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
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
          >
            {/* Header Backdrop & Match Title */}
            <div className="relative h-56 w-full bg-slate-950 flex-shrink-0">
              {matchedMovie.backdrop_path ? (
                <img
                  src={matchedMovie.backdrop_path}
                  alt={matchedMovie.title}
                  onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_POSTER; }}
                  className="w-full h-full object-cover opacity-60"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-rose-900 flex items-center justify-center">
                  <Film className="w-20 h-20 text-slate-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setIsMatchModalOpen(false)}
                className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/60 text-slate-300 hover:text-white backdrop-blur-md border border-slate-700/50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Celebratory Banner */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-rose-600 text-white text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-lg border border-purple-400/30 animate-pulse-subtle">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>IT'S A MATCH!</span>
              </div>

              {/* Poster and Title */}
              <div className="absolute bottom-3 left-4 right-4 flex items-end gap-4">
                <img
                  src={matchedMovie.poster_path || DEFAULT_POSTER}
                  alt={matchedMovie.title}
                  onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_POSTER; }}
                  className="w-24 aspect-[2/3] object-cover rounded-2xl shadow-2xl border-2 border-purple-500/60"
                />
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mb-1">
                    <Heart className="w-3.5 h-3.5 fill-emerald-400" />
                    <span>Both of you liked this movie!</span>
                  </div>
                  <h2 className="text-2xl font-black text-white leading-tight drop-shadow-md">
                    {matchedMovie.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                    <span className="flex items-center gap-1 font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {matchedMovie.vote_average}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {matchedMovie.release_date?.split('-')[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Synopsis */}
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                {matchedMovie.overview}
              </p>

              {/* Streaming Badges */}
              <WatchProviders movieId={matchedMovie.id} initialRegion={filters.region} />

              {/* Bottom Actions */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => setIsMatchModalOpen(false)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 text-white font-extrabold text-sm shadow-xl shadow-purple-900/40 hover:opacity-95 active:scale-95 transition-all"
                >
                  Keep Swiping More Movies
                </button>

                <button
                  onClick={() => resetSession()}
                  className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
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
