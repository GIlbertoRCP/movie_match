import React, { useState } from 'react';
import { Drawer } from 'vaul';
import { useMovieContext } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';
import { Heart, Sparkles, X, Settings, ArrowLeft, Sun, Moon, RefreshCw, User, UserCheck } from 'lucide-react';

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80";

export default function HistoryDrawer() {
  const { p1Likes, p2Likes, deck, theme, toggleTheme, resetSession } = useMovieContext();
  const { user, isAuthenticated, logout } = useAuth();
  const [view, setView] = useState('history'); // 'history' | 'settings'

  const p1LikedMovies = deck.filter(m => p1Likes.includes(m.id));
  const commonLikes = deck.filter(m => p1Likes.includes(m.id) && p2Likes.includes(m.id));
  const totalLikes = p1LikedMovies.length;

  return (
    <Drawer.Root direction="bottom" nested={false}>
      {/* Trigger Button */}
      <Drawer.Trigger asChild>
        <button className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 text-stone-600 dark:text-stone-400 font-serif text-xs uppercase tracking-widest hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer flex items-center gap-2 bg-[#FBF9F5]/90 dark:bg-[#121110]/90 px-4 py-2 rounded-full border border-stone-300/60 dark:border-stone-800 shadow-sm backdrop-blur-md">
          <Heart strokeWidth={1.25} className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300 fill-stone-700 dark:fill-stone-300" />
          <span>Session Picks ({totalLikes})</span>
        </button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50" />
        <Drawer.Content className="bg-[#FBF9F5] dark:bg-[#1C1A17] text-stone-900 dark:text-stone-100 flex flex-col rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none fixed bottom-0 left-0 right-0 md:left-auto md:top-0 md:h-full md:w-[420px] max-h-[85vh] md:max-h-full z-50 border-t md:border-t-0 md:border-l border-stone-200/60 dark:border-stone-800 outline-none">
          {/* Mobile Handle */}
          <div className="w-12 h-1 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto my-3 md:hidden flex-shrink-0" />

          {/* Sticky Drawer Header (Ergonomic Gear Icon on Far Left) */}
          <div className="p-6 pb-4 border-b border-stone-200/60 dark:border-stone-800 flex items-center justify-between flex-shrink-0">
            {view === 'history' ? (
              <>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setView('settings')}
                    className="p-1.5 rounded-full text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
                    title="Settings"
                  >
                    <Settings strokeWidth={1.25} className="w-5 h-5" />
                  </button>
                  <div>
                    <Drawer.Title className="text-lg font-serif font-normal text-stone-900 dark:text-stone-100">
                      Session Matches
                    </Drawer.Title>
                    <p className="text-xs font-sans font-light text-stone-500 dark:text-stone-400 mt-0.5">
                      Session picks & mutual matches
                    </p>
                  </div>
                </div>

                <Drawer.Close asChild>
                  <button className="p-2 rounded-full text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer">
                    <X strokeWidth={1.25} className="w-5 h-5" />
                  </button>
                </Drawer.Close>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setView('history')}
                    className="p-1.5 rounded-full text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
                    title="Back to Matches"
                  >
                    <ArrowLeft strokeWidth={1.25} className="w-5 h-5" />
                  </button>
                  <Drawer.Title className="text-lg font-serif font-normal text-stone-900 dark:text-stone-100">
                    Settings & Theme
                  </Drawer.Title>
                </div>

                <Drawer.Close asChild>
                  <button className="p-2 rounded-full text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer">
                    <X strokeWidth={1.25} className="w-5 h-5" />
                  </button>
                </Drawer.Close>
              </>
            )}
          </div>

          {/* Drawer Scrollable Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {view === 'history' ? (
              /* HISTORY VIEW */
              <>
                {/* Mutual Matches Section */}
                {commonLikes.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-serif text-sm font-normal text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <Sparkles strokeWidth={1.25} className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                      <span>Mutual Matches ({commonLikes.length})</span>
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {commonLikes.map(m => (
                        <div
                          key={m.id}
                          className="poster-matting flex items-center gap-3.5 bg-[#FFFDF9] dark:bg-stone-900/60 p-2.5 rounded-2xl border border-stone-200/60 dark:border-stone-800"
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
                  </div>
                )}

                {/* Session Liked Movies */}
                <div className="space-y-3">
                  <h4 className="font-serif text-sm font-normal text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Heart strokeWidth={1.25} className="w-4 h-4 text-stone-700 dark:text-stone-300 fill-stone-700 dark:fill-stone-300" />
                    <span>Liked Movies ({p1LikedMovies.length})</span>
                  </h4>

                  {p1LikedMovies.length === 0 ? (
                    <p className="text-xs font-sans font-light text-stone-500 dark:text-stone-400 italic">No liked movies recorded yet in this session.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {p1LikedMovies.map(m => (
                        <div
                          key={m.id}
                          className="poster-matting flex flex-col justify-between bg-[#FFFDF9] dark:bg-stone-900/60 p-2 rounded-2xl border border-stone-200/60 dark:border-stone-800"
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
                </div>
              </>
            ) : (
              /* SETTINGS VIEW */
              <div className="space-y-6">
                {/* 1. Flat Full-Width Rectangular Theme Toggle Button */}
                <div className="space-y-2">
                  <span className="text-xs font-sans font-light text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Appearance
                  </span>
                  <button
                    onClick={toggleTheme}
                    className="w-full p-4 rounded-none border border-stone-200/60 dark:border-stone-800 bg-[#FFFDF9] dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-sans font-light text-sm flex items-center justify-between transition-colors cursor-pointer hover:bg-stone-100/50 dark:hover:bg-stone-800/80"
                  >
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? (
                        <Moon strokeWidth={1.25} className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Sun strokeWidth={1.25} className="w-4 h-4 text-amber-600" />
                      )}
                      <span>Appearance: {theme === 'dark' ? 'Dark Obsidian' : 'Light Studio'}</span>
                    </div>
                    <span className="text-xs font-sans text-stone-400 font-normal">Toggle</span>
                  </button>
                </div>

                {/* 2. User Account Section */}
                <div className="space-y-3 pt-2 border-t border-stone-200/60 dark:border-stone-800">
                  <span className="text-xs font-sans font-light text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    Account & Session
                  </span>
                  {isAuthenticated ? (
                    <div className="bg-[#FFFDF9] dark:bg-stone-900/60 p-4 rounded-none border border-stone-200/60 dark:border-stone-800 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-800 dark:text-stone-200 font-serif">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-sans font-medium text-stone-900 dark:text-stone-100">{user.username}</p>
                          <p className="text-xs font-sans font-light text-stone-500 dark:text-stone-400">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={logout}
                        className="w-full py-2 rounded-none bg-stone-100 dark:bg-stone-800 text-xs font-sans font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer border border-stone-200/60 dark:border-stone-700"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#FFFDF9] dark:bg-stone-900/60 p-4 rounded-none border border-stone-200/60 dark:border-stone-800 text-center space-y-2">
                      <p className="text-xs font-sans font-light text-stone-600 dark:text-stone-400">
                        Sign in to save watchlists across devices
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Reset Deck */}
                <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800">
                  <button
                    onClick={() => resetSession()}
                    className="w-full py-3.5 rounded-none border border-stone-200/60 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 text-xs font-sans font-medium hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw strokeWidth={1.25} className="w-4 h-4" />
                    <span>Reset Deck & Match Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
