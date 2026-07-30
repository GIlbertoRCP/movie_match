import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { motion } from 'framer-motion';
import { useMovieContext } from '../context/MovieContext';
import { Heart, Sparkles, X } from 'lucide-react';
import MovieDetailDrawer from './MovieDetailDrawer';

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80";

export default function HistoryDrawer() {
  const { p1Likes, p2Likes, deck } = useMovieContext();
  const [inspectedMovie, setInspectedMovie] = useState(null);

  // Responsive Viewport Detection for Vaul Direction
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handler = (e) => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Derived Data
  const p1LikedMovies = deck.filter(m => p1Likes.includes(m.id));
  const commonLikes = deck.filter(m => p1Likes.includes(m.id) && p2Likes.includes(m.id));
  const totalLikes = p1LikedMovies.length;

  return (
    <>
      <Drawer.Root direction={isDesktop ? 'right' : 'bottom'} nested={false}>
        {/* Floating Glassmorphism Trigger - Visible on Mobile & Desktop */}
        <Drawer.Trigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-8 z-40 px-4 py-2.5 rounded-full bg-stone-900/90 dark:bg-stone-100/95 text-stone-100 dark:text-stone-900 backdrop-blur-md shadow-xl font-serif text-xs font-medium tracking-wide transition-all cursor-pointer flex items-center gap-2 border border-stone-700/60 dark:border-stone-300/60"
          >
            <Heart strokeWidth={1.5} className="w-4 h-4 fill-stone-400 text-stone-400 dark:fill-stone-600 dark:text-stone-600" />
            <span>Session Picks</span>
            <span className="px-2 py-0.5 rounded-full bg-stone-800 dark:bg-stone-200 text-stone-200 dark:text-stone-800 text-[10px] font-sans font-bold">
              {totalLikes}
            </span>
          </motion.button>
        </Drawer.Trigger>

        {/* Drawer Shell */}
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-[#FBF9F5] dark:bg-[#1C1A17] text-stone-900 dark:text-stone-100 flex flex-col rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none fixed bottom-0 left-0 right-0 md:left-auto md:top-0 md:h-full md:w-[420px] max-h-[85vh] md:max-h-full z-50 border-t md:border-t-0 md:border-l border-stone-200/60 dark:border-stone-800 outline-none">
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto my-3 md:hidden flex-shrink-0" />

            {/* Sticky Header */}
            <div className="flex items-center justify-between px-6 pb-4 pt-2 border-b border-stone-200/60 dark:border-stone-800 flex-shrink-0">
              <Drawer.Title className="text-lg font-serif font-normal text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Heart strokeWidth={1.25} className="w-4 h-4 text-stone-700 dark:text-stone-300 fill-stone-700 dark:fill-stone-300" />
                <span>Session Matches & Likes</span>
              </Drawer.Title>

              <Drawer.Close asChild>
                <button className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer">
                  <X strokeWidth={1.25} className="w-5 h-5" />
                </button>
              </Drawer.Close>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin">
              {/* Mutual Matches */}
              {commonLikes.length > 0 && (
                <section className="space-y-3">
                  <h4 className="font-serif text-sm font-normal text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Sparkles strokeWidth={1.25} className="w-4 h-4 text-emerald-500" />
                    <span>Mutual Matches ({commonLikes.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {commonLikes.map(m => (
                      <div
                        key={m.id}
                        onClick={() => setInspectedMovie(m)}
                        className="flex items-center gap-3.5 bg-[#FFFDF9] dark:bg-stone-900/60 p-2.5 rounded-2xl border border-stone-200/60 dark:border-stone-800 cursor-pointer hover:border-stone-400 dark:hover:border-stone-600 hover:scale-[1.01] transition-all"
                      >
                        <img
                          src={m.poster_path || DEFAULT_POSTER}
                          alt={m.title}
                          className="w-12 h-16 object-cover rounded-xl border border-stone-300 dark:border-stone-700 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="font-serif text-sm font-normal text-stone-900 dark:text-stone-100 truncate">{m.title}</h5>
                          <p className="text-xs font-sans font-light text-stone-500 dark:text-stone-400 mt-0.5">
                            {m.release_date?.split('-')[0]} • ★ {m.vote_average}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Liked Movies */}
              <section className="space-y-3">
                <h4 className="font-serif text-sm font-normal text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Heart strokeWidth={1.25} className="w-4 h-4 text-stone-700 dark:text-stone-300 fill-stone-700 dark:fill-stone-300" />
                  <span>Liked Movies ({p1LikedMovies.length})</span>
                </h4>

                {p1LikedMovies.length === 0 ? (
                  <p className="text-xs font-sans font-light text-stone-500 dark:text-stone-400 italic">
                    No liked movies recorded yet in this session.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {p1LikedMovies.map(m => (
                      <div
                        key={m.id}
                        onClick={() => setInspectedMovie(m)}
                        className="flex flex-col justify-between bg-[#FFFDF9] dark:bg-stone-900/60 p-2 rounded-2xl border border-stone-200/60 dark:border-stone-800 cursor-pointer hover:border-stone-400 dark:hover:border-stone-600 hover:scale-[1.02] transition-all"
                      >
                        <img
                          src={m.poster_path || DEFAULT_POSTER}
                          alt={m.title}
                          className="w-full aspect-[2/3] object-cover rounded-xl border border-stone-300 dark:border-stone-700 mb-2"
                        />
                        <div className="px-1 pb-1">
                          <h5 className="font-serif text-xs font-normal text-stone-900 dark:text-stone-100 truncate">{m.title}</h5>
                          <p className="text-[10px] font-sans font-light text-stone-500 dark:text-stone-400">★ {m.vote_average}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Movie Info Detail Drawer when a session pick is clicked */}
      <MovieDetailDrawer
        movie={inspectedMovie}
        isOpen={Boolean(inspectedMovie)}
        onClose={() => setInspectedMovie(null)}
      />
    </>
  );
}
