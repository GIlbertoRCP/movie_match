import React, { useState, useEffect } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { DEFAULT_POSTER, fetchMovieTrailer } from '../services/tmdbApi';
import { Star, Play, Info, Calendar, Clock, Film, Sparkles, Tv } from 'lucide-react';

export default function DesktopCinemaSpotlight() {
  const { currentMovie, setInspectedMovie } = useMovieContext();
  const [trailerData, setTrailerData] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);

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

  if (!currentMovie) return null;

  const ytKey = typeof trailerData === 'string' ? trailerData : trailerData?.key;
  const youtubeUrl = trailerData?.youtubeUrl || (ytKey ? `https://www.youtube.com/watch?v=${ytKey}` : null);

  return (
    <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-4 shadow-2xl relative overflow-hidden group">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Film className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Active Movie Spotlight
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold">
              Live Preview & Streaming Data
            </p>
          </div>
        </div>

        <button
          onClick={() => setInspectedMovie && setInspectedMovie(currentMovie)}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Full Details</span>
        </button>
      </div>

      {/* Backdrop / Poster Media Showcase */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950 shadow-inner">
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
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

            {/* Trailer Overlay Play Button if key exists */}
            {ytKey && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 hover:bg-slate-950/10 transition-colors group/play">
                <button
                  onClick={() => setShowTrailer(true)}
                  className="w-14 h-14 rounded-2xl bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl group-hover/play:scale-110 transition-transform border border-indigo-400/50 cursor-pointer"
                  title="Play Trailer in Spotlight"
                >
                  <Play className="w-7 h-7 fill-white ml-0.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Movie Details Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-black text-white truncate">
            {currentMovie.title}
          </h4>
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-xs font-black text-cyan-400">
            <Star className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
            <span>{currentMovie.vote_average}</span>
          </div>
        </div>

        {/* Overview Snippet */}
        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
          {currentMovie.overview}
        </p>

        {/* Quick Genre Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {currentMovie.genres?.map((g, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-950 text-indigo-300 border border-indigo-900/40"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
