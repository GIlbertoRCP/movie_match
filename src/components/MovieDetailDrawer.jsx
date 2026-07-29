import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Calendar, Clock, Film, Play, Loader2 } from 'lucide-react';
import WatchProviders from './WatchProviders';
import { fetchMovieTrailer } from '../services/tmdbApi';

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80";

export default function MovieDetailDrawer({ movie, isOpen, onClose, region = 'US' }) {
  const [trailer, setTrailer] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);

  useEffect(() => {
    if (movie && isOpen) {
      setShowTrailer(false);
      setIsLoadingTrailer(true);
      fetchMovieTrailer(movie.id)
        .then(data => {
          setTrailer(data);
        })
        .finally(() => setIsLoadingTrailer(false));
    }
  }, [movie, isOpen]);

  if (!movie) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10"
          >
            {/* Header Backdrop Banner or YouTube Trailer Player */}
            <div className="relative h-48 sm:h-56 w-full bg-slate-950 flex-shrink-0 overflow-hidden">
              {showTrailer && trailer ? (
                <div className="relative w-full h-full">
                  <iframe
                    src={trailer.embedUrl}
                    title={trailer.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                  <button
                    onClick={() => setShowTrailer(false)}
                    className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-slate-950/80 text-xs font-bold text-slate-200 border border-slate-700 backdrop-blur-md"
                  >
                    Close Trailer
                  </button>
                </div>
              ) : (
                <>
                  {movie.backdrop_path ? (
                    <img
                      src={movie.backdrop_path}
                      alt={movie.title}
                      onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_POSTER; }}
                      className="w-full h-full object-cover opacity-60"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/40 via-slate-900 to-indigo-900/40 flex items-center justify-center">
                      <Film className="w-16 h-16 text-slate-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                  {/* Play Trailer Button Badge */}
                  {trailer && (
                    <button
                      onClick={() => setShowTrailer(true)}
                      className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-red-600/90 text-white font-extrabold text-xs shadow-lg hover:bg-red-600 transition-all flex items-center gap-1.5 backdrop-blur-md border border-red-500/50 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Watch Trailer</span>
                    </button>
                  )}
                </>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-950 backdrop-blur-md transition-all border border-slate-700/50 z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Poster & Main Title Overlay */}
              {!showTrailer && (
                <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3">
                  <img
                    src={movie.poster_path || DEFAULT_POSTER}
                    alt={movie.title}
                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_POSTER; }}
                    className="w-20 sm:w-24 aspect-[2/3] object-cover rounded-xl shadow-xl border-2 border-slate-700/60"
                  />
                  <div className="flex-1 pb-1">
                    <h3 className="text-xl font-black text-white leading-tight drop-shadow-md">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-300">
                      <span className="flex items-center gap-1 font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {movie.vote_average}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {movie.release_date?.split('-')[0]}
                      </span>
                      {movie.runtime && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {movie.runtime}m
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Body Details */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Genres Pills */}
              <div className="flex flex-wrap gap-1.5">
                {movie.genres?.map((g, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/50 text-purple-300 border border-purple-800/40"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Tagline */}
              {movie.tagline && (
                <p className="text-xs font-semibold italic text-purple-300/80 border-l-2 border-purple-500 pl-3 py-0.5">
                  "{movie.tagline}"
                </p>
              )}

              {/* Overview */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Synopsis
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {movie.overview}
                </p>
              </div>

              {/* Streaming Availability */}
              <WatchProviders movieId={movie.id} initialRegion={region} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
