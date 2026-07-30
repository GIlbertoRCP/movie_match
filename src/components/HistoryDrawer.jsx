import React, { useState, useEffect, useContext } from 'react';
import { Drawer } from 'vaul';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieContext } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';
import { ThemeContext, useTheme } from '../context/ThemeContext';
import { Heart, Sparkles, X, Settings, ArrowLeft, Sun, Moon, RefreshCw } from 'lucide-react';

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80";

export default function HistoryDrawer() {
  const { p1Likes, p2Likes, deck } = useMovieContext();

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
    <Drawer.Root direction={isDesktop ? 'right' : 'bottom'} nested={false}>
      {/* Flat Text-Based Bottom Trigger */}
      <Drawer.Trigger asChild>
        <button className="fixed bottom-0 left-1/2 -translate-x-1/2 pb-6 z-40 text-stone-600 dark:text-stone-400 font-serif text-xs uppercase tracking-widest hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer flex items-center gap-2 bg-transparent border-0 shadow-none">
          <Heart strokeWidth={1.25} className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300 fill-stone-700 dark:fill-stone-300" />
          <span>Session Picks ({totalLikes})</span>
        </button>
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
              <span>Session Matches</span>
            </Drawer.Title>

            <Drawer.Close asChild>
              <button className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer">
                <X strokeWidth={1.25} className="w-5 h-5" />
              </button>
            </Drawer.Close>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Mutual Matches */}
            {commonLikes.length > 0 && (
              <section className="space-y-3">
                <h4 className="font-serif text-sm font-normal text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Sparkles strokeWidth={1.25} className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>Mutual Matches ({commonLikes.length})</span>
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {commonLikes.map(m => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3.5 bg-[#FFFDF9] dark:bg-stone-900/60 p-2.5 rounded-2xl border border-stone-200/60 dark:border-stone-800"
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
                      className="flex flex-col justify-between bg-[#FFFDF9] dark:bg-stone-900/60 p-2 rounded-2xl border border-stone-200/60 dark:border-stone-800"
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
  );
}
