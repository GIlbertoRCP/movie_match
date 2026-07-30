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
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative w-full max-w-lg bg-[#FBF9F5] dark:bg-[#1c1a17] border border-stone-300/80 dark:border-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10"
          >
            {/* Header Backdrop Banner or YouTube Trailer Player */}
            <div className="relative h-48 sm:h-56 w-full bg-stone-900 flex-shrink-0 overflow-hidden">
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
                    className="absolute top-2 left-2 px-3 py-1 rounded-lg bg-stone-900/80 text-xs font-sans font-medium text-stone-200 border border-stone-700 backdrop-blur-md"
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
                    <div className="w-full h-full bg-stone-800 flex items-center justify-center">
                      <Film className="w-16 h-16 text-stone-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

                  {/* Play Trailer Button Badge */}
                  {trailer && (
                    <button
                      onClick={() => setShowTrailer(true)}
                      className="absolute top-3 left-3 px-3.5 py-1.5 rounded-full bg-[#FFFDF9] text-stone-900 font-sans font-medium text-xs shadow-md hover:bg-white transition-all duration-300 flex items-center gap-1.5 backdrop-blur-md border border-stone-200 active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-stone-900" />
                      <span>Watch Trailer</span>
                    </button>
                  )}
                </>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-full bg-stone-900/60 text-stone-200 hover:text-white hover:bg-stone-900 backdrop-blur-md transition-all border border-stone-700/60 z-20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Poster & Main Title Overlay */}
              {!showTrailer && (
                <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3.5">
                  <div className="poster-matting p-1 rounded-xl shadow-md bg-[#FFFDF9] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 flex-shrink-0">
                    <img
                      src={movie.poster_path || DEFAULT_POSTER}
                      alt={movie.title}
                      onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_POSTER; }}
                      className="w-20 sm:w-24 aspect-[2/3] object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 pb-1">
                    <h3 className="text-xl sm:text-2xl font-serif text-white font-normal leading-snug drop-shadow-sm">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-stone-200 font-sans font-light">
                      <span className="flex items-center gap-1 font-medium text-amber-300">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {movie.vote_average}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-300" />
                        {movie.release_date?.split('-')[0]}
                      </span>
                      {movie.runtime && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-300" />
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
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Genres Pills */}
              <div className="flex flex-wrap gap-1.5">
                {movie.genres?.map((g, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-sans font-light bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Tagline */}
              {movie.tagline && (
                <p className="text-xs font-serif italic text-stone-600 dark:text-stone-400 border-l-2 border-stone-400 dark:border-stone-600 pl-3 py-0.5">
                  "{movie.tagline}"
                </p>
              )}

              {/* Overview */}
              <div>
                <h4 className="text-xs font-sans font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                  Synopsis
                </h4>
                <p className="text-xs sm:text-sm font-sans font-light text-stone-700 dark:text-stone-300 leading-relaxed">
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
