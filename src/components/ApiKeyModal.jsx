import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieContext } from '../context/MovieContext';
import { X, Key, Check, Trash2, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose }) {
  const { apiKey, saveApiKey, resetSession } = useMovieContext();
  const [inputKey, setInputKey] = useState(apiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    saveApiKey(inputKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
      resetSession();
    }, 1200);
  };

  const handleClear = () => {
    setInputKey('');
    saveApiKey('');
    resetSession();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">TMDB API Settings</h3>
                <p className="text-xs text-slate-400">Configure your custom data source</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Status Pill */}
          <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
            apiKey
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
              : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-300'
          }`}>
            {apiKey ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            )}
            <div className="text-xs">
              <p className="font-bold">
                {apiKey ? 'Custom TMDB API Key Active' : 'Demo Mode Active (Zero Setup)'}
              </p>
              <p className="text-slate-400 mt-0.5">
                {apiKey
                  ? 'Fetching live discover movies & streaming data directly from TMDB.'
                  : 'Currently utilizing high-resolution built-in mock movies & providers.'}
              </p>
            </div>
          </div>

          {/* Key Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              TMDB API Key (v3)
            </label>
            <input
              type="password"
              placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-xl p-3.5 outline-none focus:border-emerald-500 font-mono transition-all placeholder:text-slate-600"
            />
            <p className="text-[11px] text-slate-500">
              Key is stored locally in your browser (`localStorage`). Never sent to any 3rd party backend.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className={`flex-1 py-3 px-4 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 active:scale-95 shadow-lg shadow-emerald-950/40'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Key Saved!</span>
                </>
              ) : (
                <span>Save Key & Reload</span>
              )}
            </button>

            {apiKey && (
              <button
                onClick={handleClear}
                className="py-3 px-4 rounded-2xl bg-slate-950 text-rose-400 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900 transition-all font-semibold text-xs flex items-center gap-1"
                title="Remove saved API key"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* TMDB Help Link */}
          <div className="text-center pt-1">
            <a
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              <span>Get a free TMDB API Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
