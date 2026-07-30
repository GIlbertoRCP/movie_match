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
    <div className="editorial-card p-6 rounded-3xl border border-stone-200/90 space-y-4 shadow-sm relative overflow-hidden group">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-stone-100 text-stone-700 border border-stone-200">
            <Film className="w-4 h-4 text-stone-700" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-medium text-stone-900">
              Active Movie Spotlight
            </h3>
            <p className="text-[11px] font-sans font-light text-stone-500">
              Live Preview & Streaming Data
            </p>
          </div>
        </div>

        <button
          onClick={() => setInspectedMovie && setInspectedMovie(currentMovie)}
          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-800 border border-stone-200 text-xs font-sans font-medium transition-all duration-300 flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
        >
          <Info className="w-3.5 h-3.5 text-stone-600" />
          <span>Full Details</span>
        </button>
      </div>

      {/* Backdrop / Poster Media Showcase */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-inner">
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
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />

            {/* Trailer Overlay Play Button if key exists */}
            {ytKey && (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-900/20 hover:bg-stone-900/10 transition-colors duration-300 group/play">
                <button
                  onClick={() => setShowTrailer(true)}
                  className="w-14 h-14 rounded-2xl bg-[#FFFDF9] hover:bg-white text-stone-900 flex items-center justify-center shadow-md group-hover/play:scale-105 transition-transform duration-300 border border-stone-200 cursor-pointer"
                  title="Play Trailer in Spotlight"
                >
                  <Play className="w-6 h-6 fill-stone-900 ml-0.5 text-stone-900" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Movie Details Summary */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-serif font-normal text-stone-900 truncate">
            {currentMovie.title}
          </h4>
          <div className="flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200 text-xs font-sans font-medium text-stone-800">
            <Star className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
            <span>{currentMovie.vote_average}</span>
          </div>
        </div>

        {/* Overview Snippet */}
        <p className="text-xs font-sans font-light text-stone-600 line-clamp-3 leading-relaxed">
          {currentMovie.overview}
        </p>

        {/* Quick Genre Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {currentMovie.genres?.map((g, i) => (
            <span
              key={i}
              className="px-2.5 py-0.5 rounded-lg text-[10px] font-sans font-light bg-stone-100 text-stone-700 border border-stone-200"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
