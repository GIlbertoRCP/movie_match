import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieContext } from '../context/MovieContext';
import { TMDB_GENRES, REGIONS, STREAMING_PROVIDERS } from '../services/tmdbApi';
import { X, Sliders, Star, Globe, Calendar, Check, Tv } from 'lucide-react';

export default function FilterModal({ isOpen, onClose }) {
  const { filters, updateFilters } = useMovieContext();
  const [localFilters, setLocalFilters] = useState(filters);

  if (!isOpen) return null;

  const handleApply = () => {
    updateFilters(localFilters);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
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
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 space-y-5 max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-800/40">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Deck Filters</h3>
                <p className="text-xs text-slate-400">Tailor your movie recommendations</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Streaming Platform Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-cyan-400" />
              <span>Streaming Subscriptions</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {STREAMING_PROVIDERS.map(provider => {
                const isSelected = (localFilters.provider || 'all') === provider.id;
                return (
                  <button
                    key={provider.id}
                    onClick={() => setLocalFilters({ ...localFilters, provider: provider.id })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                        : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
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
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Genre
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              <button
                onClick={() => setLocalFilters({ ...localFilters, genreId: 'all' })}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  localFilters.genreId === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950/50'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                ✨ All Genres
              </button>
              {TMDB_GENRES.map(g => {
                const isSelected = String(localFilters.genreId) === String(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => setLocalFilters({ ...localFilters, genreId: g.id })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950/50'
                        : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
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
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                <span>Minimum TMDB Score</span>
              </span>
              <span className="text-cyan-400 text-sm font-black">
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
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-semibold px-0.5">
              <span>5.0 (Any)</span>
              <span>6.5 (Default)</span>
              <span>8.5 (Masterpieces)</span>
            </div>
          </div>

          {/* Release Era / Decade */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>Release Era</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'All Eras', start: '', end: '' },
                { label: '2020s', start: '2020', end: '2026' },
                { label: '2010s', start: '2010', end: '2019' },
                { label: '2000s', start: '2000', end: '2009' },
                { label: '1990s', start: '1990', end: '1999' },
                { label: 'Classics', start: '1900', end: '1989' }
              ].map(era => {
                const isSelected = localFilters.startYear === era.start && localFilters.endYear === era.end;
                return (
                  <button
                    key={era.label}
                    onClick={() => setLocalFilters({ ...localFilters, startYear: era.start, endYear: era.end })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {era.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Streaming Region */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Streaming Region</span>
            </label>
            <select
              value={localFilters.region}
              onChange={(e) => setLocalFilters({ ...localFilters, region: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-purple-500 transition-all font-semibold"
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
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-sm shadow-xl shadow-purple-900/40 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Refresh Deck</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
