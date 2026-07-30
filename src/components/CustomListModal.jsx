import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieContext } from '../context/MovieContext';
import { PRESET_PACKS, searchMovies } from '../services/tmdbApi';
import { X, Sparkles, Search, Plus, Trash2, Check, Film, Layers, ArrowRight, Loader2 } from 'lucide-react';

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80";

export default function CustomListModal({ isOpen, onClose }) {
  const { loadPresetPack, loadCustomList, activePack, apiKey } = useMovieContext();
  const [activeTab, setActiveTab] = useState('preset'); // 'preset' | 'custom'

  // Custom List Builder State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [draftList, setDraftList] = useState([]);

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

  const handleLaunchCustomList = () => {
    if (draftList.length > 0) {
      loadCustomList(draftList);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-stone-950/80 backdrop-blur-sm">
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
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-lg bg-[#FBF9F5] dark:bg-[#1c1a17] border border-stone-300/80 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 space-y-5 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-stone-200/60 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300/60 dark:border-stone-700">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-normal text-stone-900 dark:text-stone-100">
                  Curated Series & Custom Decks
                </h3>
                <p className="text-xs font-sans font-light text-stone-500 dark:text-stone-400">
                  Choose a curated collection or assemble your own custom watchlist
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-stone-200/50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-300/60 dark:border-stone-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-stone-200/50 dark:bg-stone-900/60 p-1 rounded-2xl border border-stone-300/40 dark:border-stone-800 flex-shrink-0">
            <button
              onClick={() => setActiveTab('preset')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-sans font-medium transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'preset'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm border border-stone-200 dark:border-stone-700'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Theme Packs</span>
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-sans font-medium transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm border border-stone-200 dark:border-stone-700'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Build Custom List {draftList.length > 0 && `(${draftList.length})`}</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="overflow-y-auto space-y-4 flex-1 pr-1">
            {activeTab === 'preset' ? (
              <div className="space-y-3">
                {PRESET_PACKS.map(pack => {
                  const isActive = activePack?.id === pack.id;
                  return (
                    <div
                      key={pack.id}
                      onClick={() => handleSelectPack(pack.id)}
                      className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                        isActive
                          ? 'bg-stone-200/60 dark:bg-stone-800/80 border-stone-400 dark:border-stone-600 shadow-sm'
                          : 'bg-[#FFFDF9] dark:bg-stone-900/50 border-stone-300/80 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-300/60 dark:border-stone-700 flex items-center justify-center text-lg shadow-sm">
                            {pack.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-serif font-medium text-stone-900 dark:text-stone-100 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors">
                                {pack.title}
                              </h4>
                              {isActive && (
                                <span className="bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 text-[10px] font-sans font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-sans font-light text-stone-600 dark:text-stone-400 mt-0.5 line-clamp-2">
                              {pack.description}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-sans font-light text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full border border-stone-300/60 dark:border-stone-700 flex-shrink-0">
                          {pack.movieIds.length} Movies
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search Bar Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search movies by title (e.g. Harry Potter, Star Wars)..."
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
                  <div className="space-y-1.5 bg-[#FFFDF9] dark:bg-stone-900 p-2 rounded-2xl border border-stone-300/80 dark:border-stone-800 max-h-48 overflow-y-auto">
                    <span className="text-[10px] font-sans font-light text-stone-500 uppercase tracking-wider px-2 block">
                      Search Results
                    </span>
                    {searchResults.map(movie => {
                      const isAdded = draftList.some(m => m.id === movie.id);
                      return (
                        <div
                          key={movie.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={movie.poster_path || DEFAULT_POSTER}
                              alt={movie.title}
                              onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_POSTER; }}
                              className="w-8 h-11 object-cover rounded-md border border-stone-300 dark:border-stone-700"
                            />
                            <div>
                              <p className="text-xs font-serif font-normal text-stone-900 dark:text-stone-100 line-clamp-1">{movie.title}</p>
                              <p className="text-[10px] font-sans font-light text-stone-500">{movie.release_date?.split('-')[0]} • ★ {movie.vote_average}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddToDraft(movie)}
                            disabled={isAdded}
                            className={`p-2 rounded-xl font-sans font-medium text-xs transition-all flex items-center gap-1 ${
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

                {/* Draft List Container */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-sans font-medium text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                      Selected Movies ({draftList.length})
                    </h4>
                    {draftList.length > 0 && (
                      <button
                        onClick={() => setDraftList([])}
                        className="text-[10px] font-sans font-light text-rose-700 hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {draftList.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-stone-300/80 dark:border-stone-800 rounded-2xl space-y-1">
                      <Film className="w-6 h-6 text-stone-400 mx-auto" />
                      <p className="text-xs font-serif text-stone-700 dark:text-stone-300">Your deck is currently empty</p>
                      <p className="text-[11px] font-sans font-light text-stone-500">Search above to add movies to your deck</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {draftList.map(movie => (
                        <div
                          key={movie.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#FFFDF9] dark:bg-stone-900 border border-stone-300/80 dark:border-stone-800"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={movie.poster_path || DEFAULT_POSTER}
                              alt={movie.title}
                              className="w-6 h-9 object-cover rounded-md border border-stone-300 dark:border-stone-700 flex-shrink-0"
                            />
                            <span className="text-xs font-serif text-stone-900 dark:text-stone-100 truncate">{movie.title}</span>
                          </div>

                          <button
                            onClick={() => handleRemoveFromDraft(movie.id)}
                            className="p-1 rounded-lg text-stone-400 hover:text-rose-700 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Launch Button */}
                {draftList.length > 0 && (
                  <button
                    onClick={handleLaunchCustomList}
                    className="w-full py-3.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 font-sans font-medium text-xs shadow-sm hover:bg-stone-800 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Launch Custom Deck ({draftList.length} Movies)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
