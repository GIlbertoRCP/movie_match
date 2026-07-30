import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieContext } from '../context/MovieContext';
import { TMDB_GENRES, REGIONS, STREAMING_PROVIDERS } from '../services/tmdbApi';
import { X, Sliders, Star, Globe, Calendar, Check, Tv, Sun, Moon } from 'lucide-react';

export default function FilterModal({ isOpen, onClose }) {
  const { filters, updateFilters, theme, toggleTheme } = useMovieContext();
  const [localFilters, setLocalFilters] = useState(filters);

  if (!isOpen) return null;

  const handleApply = () => {
    updateFilters(localFilters);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-md bg-[#FBF9F5] border border-stone-300/80 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-stone-200/60 text-stone-800 border border-stone-300/60">
                <Sliders className="w-4 h-4 text-stone-800" />
              </div>
              <h3 className="text-lg font-serif font-normal text-stone-900">
                Filter Catalog
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-stone-200/50 text-stone-600 hover:text-stone-900 border border-stone-300/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Streaming Platform Filter */}
          <div className="space-y-2">
            <label className="text-xs font-sans font-medium text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-stone-700" />
              <span>Streaming Subscriptions</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {STREAMING_PROVIDERS.map(provider => {
                const isSelected = (localFilters.provider || 'all') === provider.id;
                return (
                  <button
                    key={provider.id}
                    onClick={() => setLocalFilters({ ...localFilters, provider: provider.id })}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-sans transition-all duration-300 border ${
                      isSelected
                        ? 'bg-stone-900 text-stone-100 border-stone-900 shadow-sm'
                        : 'bg-[#FFFDF9] text-stone-600 border-stone-300/70 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    {provider.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Genre Selection Grid */}
          <div className="space-y-2">
            <label className="text-xs font-sans font-medium text-stone-600 uppercase tracking-wider block">
              Genre
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              <button
                onClick={() => setLocalFilters({ ...localFilters, genreId: 'all' })}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-sans transition-all duration-300 border ${
                  localFilters.genreId === 'all'
                    ? 'bg-stone-900 text-stone-100 border-stone-900 shadow-sm'
                    : 'bg-[#FFFDF9] text-stone-600 border-stone-300/70 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                All Genres
              </button>
              {TMDB_GENRES.map(g => {
                const isSelected = String(localFilters.genreId) === String(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => setLocalFilters({ ...localFilters, genreId: g.id })}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-sans transition-all duration-300 border ${
                      isSelected
                        ? 'bg-stone-900 text-stone-100 border-stone-900 shadow-sm'
                        : 'bg-[#FFFDF9] text-stone-600 border-stone-300/70 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minimum TMDB Rating Score Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-sans font-medium text-stone-600 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
                <span>Minimum TMDB Score</span>
              </span>
              <span className="text-stone-900 text-sm font-serif font-normal">
                ≥ {localFilters.minScore} / 10
              </span>
            </div>
            <input
              type="range"
              min="5.0"
              max="8.5"
              step="0.5"
              value={localFilters.minScore}
              onChange={(e) => setLocalFilters({ ...localFilters, minScore: parseFloat(e.target.value) })}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
            />
            <div className="flex justify-between text-[10px] text-stone-500 font-sans font-light px-0.5">
              <span>5.0 (Any)</span>
              <span>7.0 (Recommended)</span>
              <span>8.5 (Masterpieces)</span>
            </div>
          </div>

          {/* Preferred Streaming Region */}
          <div className="space-y-2">
            <label className="text-xs font-sans font-medium text-stone-600 uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-stone-700" />
              <span>Streaming Region</span>
            </label>
            <select
              value={localFilters.region}
              onChange={(e) => setLocalFilters({ ...localFilters, region: e.target.value })}
              className="w-full bg-[#FFFDF9] border border-stone-300/80 text-stone-800 text-xs rounded-xl p-3 outline-none focus:border-stone-500 transition-all font-sans font-medium"
            >
              {REGIONS.map(r => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Apply Button */}
          <div className="pt-2">
            <button
              onClick={handleApply}
              className="w-full py-3.5 rounded-2xl bg-stone-900 text-stone-100 font-sans font-medium text-xs shadow-sm hover:bg-stone-800 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Apply Filters & Refresh Deck</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
