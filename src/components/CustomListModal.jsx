import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieContext } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';
import { PRESET_PACKS, searchMovies } from '../services/tmdbApi';
import { X, Sparkles, Search, Plus, Trash2, Check, Film, Layers, ArrowRight, Loader2, Bookmark, Play, Save, UserCheck, ShieldAlert } from 'lucide-react';

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80";

export default function CustomListModal({ isOpen, onClose }) {
  const {
    loadPresetPack,
    loadCustomList,
    activePack,
    apiKey,
    userWatchlists,
    saveWatchlistToAccount,
    deleteUserWatchlist
  } = useMovieContext();

  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('preset'); // 'preset' | 'custom' | 'saved'

  const watchlists = Array.isArray(userWatchlists) ? userWatchlists : [];

  // Custom List Builder State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [draftList, setDraftList] = useState([]);
  const [deckTitle, setDeckTitle] = useState('');
  const [saveToAccount, setSaveToAccount] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Handle live movie search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchMovies(searchQuery, apiKey);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, apiKey]);

  if (!isOpen) return null;

  const handleSelectPack = (packId) => {
    loadPresetPack(packId);
    onClose();
  };

  const handleAddToDraft = (movie) => {
    if (!draftList.some(m => m.id === movie.id)) {
      setDraftList(prev => [...prev, movie]);
    }
  };

  const handleRemoveFromDraft = (movieId) => {
    setDraftList(prev => prev.filter(m => m.id !== movieId));
  };

  const handleLaunchCustomList = async () => {
    if (draftList.length === 0) return;

    setIsSaving(true);
    try {
      if (isAuthenticated && saveToAccount) {
        const title = deckTitle.trim() || `Custom Deck (${draftList.length} Movies)`;
        await saveWatchlistToAccount(title, draftList.map(m => m.id));
      }
      loadCustomList(draftList);
      onClose();
    } catch (err) {
      console.error('Error saving deck:', err);
      loadCustomList(draftList);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleLaunchSavedWatchlist = (movieIds) => {
    loadCustomList(movieIds);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-md">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-2xl bg-[#FBF9F5] dark:bg-[#181715] border border-stone-300/80 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-5 sm:p-7 space-y-5 max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 shadow-md">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-serif font-normal text-stone-900 dark:text-stone-100">
                  Curated Series & Custom Decks
                </h3>
                <p className="text-xs font-sans font-light text-stone-500 dark:text-stone-400">
                  Play curated thematic sagas, assemble custom decks, or manage your account watchlists
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-300/60 dark:border-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* 3-Way Segmented Control Navigation Tabs */}
          <div className="flex bg-stone-200/60 dark:bg-stone-900/80 p-1.5 rounded-2xl border border-stone-300/40 dark:border-stone-800 flex-shrink-0 gap-1">
            <button
              onClick={() => setActiveTab('preset')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-sans font-medium transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'preset'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-md border border-stone-200 dark:border-stone-700'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
              <span>Curated Collections</span>
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-sans font-medium transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-md border border-stone-200 dark:border-stone-700'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-cyan-500" />
              <span>Build Custom Deck {draftList.length > 0 && `(${draftList.length})`}</span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-sans font-medium transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'saved'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-md border border-stone-200 dark:border-stone-700'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-emerald-500" />
              <span>My Saved Decks {watchlists.length > 0 && `(${watchlists.length})`}</span>
            </button>
          </div>

          {/* Tab Contents with Fluid Motion Fade/Slide Animation */}
          <div className="overflow-y-auto space-y-4 flex-1 pr-1 scrollbar-thin">
            <AnimatePresence mode="wait">
              {activeTab === 'preset' && (
                <motion.div
                  key="preset"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="grid grid-cols-1 gap-3.5"
                >
                  {PRESET_PACKS.map(pack => {
                    const isActive = activePack?.id === pack.id;
                    return (
                      <motion.div
                        key={pack.id}
                        whileHover={{ scale: 1.01, y: -2 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        onClick={() => handleSelectPack(pack.id)}
                        className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden shadow-sm ${
                          isActive
                            ? 'bg-stone-200/90 dark:bg-stone-800/90 border-stone-400 dark:border-stone-600 shadow-md'
                            : 'bg-[#FFFDF9] dark:bg-stone-900/70 border-stone-300/80 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          {/* Left Side: Overlapping Multi-Poster Collage */}
                          <div className="flex items-center gap-4">
                            <div className="relative w-20 h-24 flex-shrink-0 flex items-center justify-center">
                              {pack.posters && pack.posters.map((posterUrl, idx) => (
                                <img
                                  key={idx}
                                  src={posterUrl}
                                  alt=""
                                  className={`absolute w-14 h-20 object-cover rounded-lg border border-stone-700/60 shadow-md transition-transform duration-300 group-hover:scale-105 ${
                                    idx === 0
                                      ? 'z-30 left-0 top-1 -rotate-6'
                                      : idx === 1
                                      ? 'z-20 left-3 top-2 rotate-0 opacity-90'
                                      : 'z-10 left-6 top-3 rotate-6 opacity-80'
                                  }`}
                                />
                              ))}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300/60 dark:border-stone-700">
                                  {pack.tag || 'Curated'}
                                </span>
                                <span className="text-[10px] font-sans font-light text-stone-500 dark:text-stone-400">
                                  {pack.movieIds.length} Movies
                                </span>
                                {isActive && (
                                  <span className="bg-emerald-600 text-white text-[10px] font-sans font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Active
                                  </span>
                                )}
                              </div>

                              <h4 className="text-base sm:text-lg font-serif font-medium text-stone-900 dark:text-stone-100 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors">
                                {pack.title}
                              </h4>
                              <p className="text-xs font-sans font-light text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                                {pack.description}
                              </p>
                            </div>
                          </div>

                          {/* Play Deck Button */}
                          <div className="flex-shrink-0 self-end sm:self-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPack(pack.id);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 font-sans font-medium text-xs shadow-md group-hover:bg-stone-800 dark:group-hover:bg-stone-200 dark:group-hover:text-stone-900 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Play Pack</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {activeTab === 'custom' && (
                <motion.div
                  key="custom"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  {/* Search Bar Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Search movies by title (e.g. Harry Potter, Interstellar)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#FFFDF9] dark:bg-stone-900 border border-stone-300/80 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs rounded-xl pl-10 pr-4 py-3 outline-none focus:border-stone-500 transition-all font-sans font-medium placeholder:text-stone-400"
                    />
                    {isSearching && (
                      <Loader2 className="w-4 h-4 text-stone-600 dark:text-stone-400 animate-spin absolute right-3.5 top-3.5" />
                    )}
                  </div>

                  {/* Live Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-1.5 bg-[#FFFDF9] dark:bg-stone-900 p-2.5 rounded-2xl border border-stone-300/80 dark:border-stone-800 max-h-52 overflow-y-auto scrollbar-thin">
                      <span className="text-[10px] font-sans font-light text-stone-500 uppercase tracking-wider px-2 block">
                        Search Results
                      </span>
                      {searchResults.map(movie => {
                        const isAdded = draftList.some(m => m.id === movie.id);
                        return (
                          <div
                            key={movie.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={movie.poster_path || DEFAULT_POSTER}
                                alt={movie.title}
                                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_POSTER; }}
                                className="w-9 h-12 object-cover rounded-lg border border-stone-300 dark:border-stone-700 flex-shrink-0"
                              />
                              <div>
                                <p className="text-xs font-serif font-medium text-stone-900 dark:text-stone-100 line-clamp-1">{movie.title}</p>
                                <p className="text-[10px] font-sans font-light text-stone-500">{movie.release_date?.split('-')[0]} • ★ {movie.vote_average}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddToDraft(movie)}
                              disabled={isAdded}
                              className={`p-2 rounded-xl font-sans font-medium text-xs transition-all flex items-center gap-1 cursor-pointer ${
                                isAdded
                                  ? 'bg-stone-200 dark:bg-stone-800 text-stone-500 cursor-not-allowed'
                                  : 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 hover:bg-stone-800 active:scale-95'
                              }`}
                            >
                              {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Draft Deck Details & Save Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-sans font-medium text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                        Selected Movies ({draftList.length})
                      </h4>
                      {draftList.length > 0 && (
                        <button
                          onClick={() => setDraftList([])}
                          className="text-[10px] font-sans font-light text-rose-600 hover:underline cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {draftList.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-stone-300/80 dark:border-stone-800 rounded-2xl space-y-2">
                        <Film className="w-8 h-8 text-stone-400 mx-auto" />
                        <p className="text-xs font-serif font-medium text-stone-700 dark:text-stone-300">Your custom deck is currently empty</p>
                        <p className="text-[11px] font-sans font-light text-stone-500">Search above to add movies to your deck</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                          {draftList.map(movie => (
                            <div
                              key={movie.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFFDF9] dark:bg-stone-900 border border-stone-300/80 dark:border-stone-800 shadow-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={movie.poster_path || DEFAULT_POSTER}
                                  alt={movie.title}
                                  className="w-7 h-10 object-cover rounded-md border border-stone-300 dark:border-stone-700 flex-shrink-0"
                                />
                                <span className="text-xs font-serif text-stone-900 dark:text-stone-100 truncate">{movie.title}</span>
                              </div>

                              <button
                                onClick={() => handleRemoveFromDraft(movie.id)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Title & Save to Account Form */}
                        <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-2.5">
                          <input
                            type="text"
                            placeholder="Deck Name (e.g. Friday Night Favorites)..."
                            value={deckTitle}
                            onChange={(e) => setDeckTitle(e.target.value)}
                            className="w-full bg-white dark:bg-stone-900 border border-stone-300/80 dark:border-stone-700 text-xs rounded-xl px-3 py-2.5 outline-none font-sans font-medium"
                          />

                          {isAuthenticated ? (
                            <label className="flex items-center gap-2 text-xs font-sans text-stone-700 dark:text-stone-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={saveToAccount}
                                onChange={(e) => setSaveToAccount(e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                              />
                              <span className="flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                Save to My Account (Permanent Deck)
                              </span>
                            </label>
                          ) : (
                            <p className="text-[11px] font-sans font-light text-stone-500 italic">
                              Sign in to save custom decks permanently to your account profile.
                            </p>
                          )}
                        </div>

                        {/* Launch Button */}
                        <button
                          onClick={handleLaunchCustomList}
                          disabled={isSaving}
                          className="w-full py-3.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 font-sans font-medium text-xs shadow-md hover:bg-stone-800 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span>Launch Custom Deck ({draftList.length} Movies)</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'saved' && (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  {!isAuthenticated ? (
                    <div className="p-8 text-center rounded-2xl border border-stone-200 dark:border-stone-800 bg-[#FFFDF9] dark:bg-stone-900/50 space-y-3">
                      <ShieldAlert className="w-9 h-9 text-rose-500 mx-auto" />
                      <h4 className="text-sm font-serif font-normal text-stone-900 dark:text-stone-100">
                        Sign In Required
                      </h4>
                      <p className="text-xs font-sans font-light text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                        Log in to access your saved custom watchlists, synced movie likes, and cross-device decks.
                      </p>
                    </div>
                  ) : watchlists.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-stone-300/80 dark:border-stone-800 rounded-2xl space-y-2">
                      <Bookmark className="w-8 h-8 text-stone-400 mx-auto" />
                      <p className="text-xs font-serif font-medium text-stone-700 dark:text-stone-300">No Saved Account Decks Yet</p>
                      <p className="text-[11px] font-sans font-light text-stone-500">
                        Use the "Build Custom Deck" tab to save custom watchlists directly to your account.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {watchlists.map(list => (
                        <div
                          key={list.id}
                          className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-stone-900/70 border border-stone-300/80 dark:border-stone-800 flex items-center justify-between gap-4 shadow-sm hover:border-stone-400 transition-all"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <h4 className="text-sm font-serif font-medium text-stone-900 dark:text-stone-100 truncate">
                              {list.title}
                            </h4>
                            <p className="text-[11px] font-sans font-light text-stone-500">
                              {list.movie_ids.length} Movies • Saved {new Date(list.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleLaunchSavedWatchlist(list.movie_ids)}
                              className="px-3.5 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 font-sans font-medium text-xs hover:bg-stone-800 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Play</span>
                            </button>

                            <button
                              onClick={() => deleteUserWatchlist(list.id)}
                              className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Saved Deck"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
