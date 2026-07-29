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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
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
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 space-y-5 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-800/40">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Curated Lists & Series</h3>
                <p className="text-xs text-slate-400">Choose a theme pack or build your custom deck</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 flex-shrink-0">
            <button
              onClick={() => setActiveTab('preset')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'preset'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Theme Packs</span>
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'custom'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-400 hover:text-slate-200'
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
                      className={`group relative p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                        isActive
                          ? 'bg-purple-950/40 border-purple-500 shadow-xl shadow-purple-950/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${pack.color} flex items-center justify-center text-xl shadow-lg`}>
                            {pack.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-extrabold text-white group-hover:text-purple-300 transition-colors">
                                {pack.title}
                              </h4>
                              {isActive && (
                                <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                              {pack.description}
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800 flex-shrink-0">
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
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search movies by title (e.g. Harry Potter, Star Wars)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl pl-10 pr-4 py-3 outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
                  />
                  {isSearching && (
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin absolute right-3.5 top-3.5" />
                  )}
                </div>

                {/* Live Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-1.5 bg-slate-950/80 p-2 rounded-2xl border border-slate-800 max-h-48 overflow-y-auto">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block">
                      Search Results
                    </span>
                    {searchResults.map(movie => {
                      const isAdded = draftList.some(m => m.id === movie.id);
                      return (
                        <div
                          key={movie.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-900 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={movie.poster_path || DEFAULT_POSTER}
                              alt={movie.title}
                              onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_POSTER; }}
                              className="w-8 h-11 object-cover rounded-md"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-200 line-clamp-1">{movie.title}</p>
                              <p className="text-[10px] text-slate-500">{movie.release_date?.split('-')[0]} • ★ {movie.vote_average}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddToDraft(movie)}
                            disabled={isAdded}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isAdded
                                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400 opacity-60'
                                : 'bg-purple-950/60 border-purple-800 text-purple-300 hover:bg-purple-600 hover:text-white'
                            }`}
                          >
                            {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Custom Watchlist Draft Tray */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Selected Watchlist ({draftList.length})
                    </span>
                    {draftList.length > 0 && (
                      <button
                        onClick={() => setDraftList([])}
                        className="text-[11px] text-rose-400 hover:underline font-semibold"
                      >
                        Clear List
                      </button>
                    )}
                  </div>

                  {draftList.length === 0 ? (
                    <div className="text-center py-6 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
                      Search and add at least 1 movie to build your custom deck!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                      {draftList.map(m => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 gap-2"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <img
                              src={m.poster_path || DEFAULT_POSTER}
                              alt={m.title}
                              onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_POSTER; }}
                              className="w-6 h-8 object-cover rounded"
                            />
                            <span className="text-xs font-semibold text-slate-200 truncate">{m.title}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveFromDraft(m.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
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
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-sm shadow-xl shadow-purple-900/40 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Start Swiping Custom Deck ({draftList.length} Movies)</span>
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
