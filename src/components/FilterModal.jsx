import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieContext } from '../context/MovieContext';
import { useTheme } from '../context/ThemeContext';
import { TMDB_GENRES, REGIONS, STREAMING_PROVIDERS } from '../services/tmdbApi';
import { X, Sliders, Star, Globe, Calendar, Check, Tv, Sun, Moon, RotateCcw } from 'lucide-react';

const DEFAULT_FILTERS = {
  genreId: 'all',
  minScore: 6.5,
  region: 'US',
  startYear: '',
  endYear: '',
  sortBy: 'popularity.desc',
  provider: 'all'
};

export default function FilterModal({ isOpen, onClose }) {
  const { filters, updateFilters } = useMovieContext();
  const { theme, toggleTheme } = useTheme();
  const [localFilters, setLocalFilters] = useState(filters);

  if (!isOpen) return null;

  const handleApply = () => {
    updateFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-md">
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
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-xl md:max-w-3xl bg-[#FBF9F5] dark:bg-[#181715] border border-stone-300/80 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 md:p-8 space-y-6 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 shadow-md">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-serif font-normal text-stone-900 dark:text-stone-100">
                  Discovery Preferences & Filters
                </h3>
                <p className="text-xs font-sans font-light text-stone-500 dark:text-stone-400">
                  Customize genres, streaming availability, ratings, and display appearance
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

          {/* 2-Column Responsive Body Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1 flex-1 scrollbar-thin">
            {/* Left Column: Subscriptions, Region, Score & Theme */}
            <div className="space-y-5">
              {/* Streaming Subscriptions */}
              <div className="space-y-2.5">
                <label className="text-xs font-sans font-medium text-stone-600 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                  <span>Streaming Services</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {STREAMING_PROVIDERS.map(provider => {
                    const isSelected = (localFilters.provider || 'all') === provider.id;
                    return (
                      <button
                        key={provider.id}
                        onClick={() => setLocalFilters({ ...localFilters, provider: provider.id })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-sans transition-all duration-200 border cursor-pointer ${
                          isSelected
                            ? 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-sm font-medium'
                            : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-300/70 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
                        }`}
                      >
                        {provider.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Streaming Region Selection */}
              <div className="space-y-2">
                <label className="text-xs font-sans font-medium text-stone-600 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                  <span>Streaming Region</span>
                </label>
                <select
                  value={localFilters.region}
                  onChange={(e) => setLocalFilters({ ...localFilters, region: e.target.value })}
                  className="w-full bg-white dark:bg-stone-900 border border-stone-300/80 dark:border-stone-800 text-stone-800 dark:text-stone-200 text-xs rounded-xl p-3 outline-none focus:border-stone-500 transition-all font-sans font-medium"
                >
                  {REGIONS.map(r => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minimum Score Slider */}
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between text-xs font-sans font-medium text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                    <span>Min Rating Score</span>
                  </span>
                  <span className="text-stone-900 dark:text-stone-100 text-sm font-serif font-normal">
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
                  className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-stone-800 dark:accent-stone-200"
                />
                <div className="flex justify-between text-[10px] text-stone-500 dark:text-stone-400 font-sans font-light px-0.5">
                  <span>5.0 (Any)</span>
                  <span>7.0 (Popular)</span>
                  <span>8.5 (Masterpieces)</span>
                </div>
              </div>

              {/* Theme Appearance */}
              <div className="space-y-2">
                <label className="text-xs font-sans font-medium text-stone-600 dark:text-stone-400 uppercase tracking-wider block">
                  Theme Appearance
                </label>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-stone-300/80 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 text-xs font-sans font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-stone-700" />}
                    <span>{theme === 'dark' ? 'Dark Obsidian Theme' : 'Light Studio Theme'}</span>
                  </div>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider">Toggle</span>
                </button>
              </div>
            </div>

            {/* Right Column: Genre Badges Grid */}
            <div className="space-y-2.5">
              <label className="text-xs font-sans font-medium text-stone-600 dark:text-stone-400 uppercase tracking-wider block">
                Movie Genres
              </label>
              <div className="flex flex-wrap gap-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                <button
                  onClick={() => setLocalFilters({ ...localFilters, genreId: 'all' })}
                  className={`px-3.5 py-2 rounded-xl text-xs font-sans transition-all duration-200 border cursor-pointer ${
                    localFilters.genreId === 'all'
                      ? 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-sm font-medium'
                      : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-300/70 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
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
                      className={`px-3.5 py-2 rounded-xl text-xs font-sans transition-all duration-200 border cursor-pointer ${
                        isSelected
                          ? 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-sm font-medium'
                          : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-300/70 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center gap-3 pt-3 border-t border-stone-200/80 dark:border-stone-800 flex-shrink-0">
            <button
              onClick={handleReset}
              className="px-4 py-3.5 rounded-2xl border border-stone-300/80 dark:border-stone-700 text-stone-600 dark:text-stone-400 font-sans font-medium text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleApply}
              className="flex-1 py-3.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 font-sans font-medium text-xs shadow-md hover:bg-stone-800 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
