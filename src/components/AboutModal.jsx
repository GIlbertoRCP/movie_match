import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Sparkles, Users, Tv, Layers, ArrowRight, Heart, Star, Compass } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-md">
        {/* Backdrop Click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Shell */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative w-full max-w-2xl bg-[#FFFDF9] dark:bg-[#1C1A17] border border-stone-200/80 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8 space-y-6 text-stone-900 dark:text-stone-100 max-h-[90vh] overflow-y-auto scrollbar-thin"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-stone-200/60 dark:border-stone-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 shadow-md">
                <Film strokeWidth={1.25} className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-normal tracking-tight text-stone-900 dark:text-stone-100">
                  About MovieMatch
                </h3>
                <p className="text-xs font-sans font-light text-stone-500 dark:text-stone-400 mt-0.5">
                  Discover movies together without the endless scrolling argument
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
            >
              <X strokeWidth={1.25} className="w-5 h-5" />
            </button>
          </div>

          {/* Core App Description Intro */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-100/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-2">
            <h4 className="text-sm font-serif font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Compass strokeWidth={1.25} className="w-4 h-4 text-emerald-500" />
              <span>What is MovieMatch?</span>
            </h4>
            <p className="text-xs font-sans font-light text-stone-600 dark:text-stone-400 leading-relaxed">
              MovieMatch turns deciding what to watch into a seamless, fun experience. Browse live trending catalogs or curated theme packs, swipe right on movies you want to watch, and connect with friends in real time to instantly discover your <strong>Mutual Matches</strong>.
            </p>
          </div>

          {/* Key Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Feature 1 */}
            <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800/80 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-serif text-sm font-normal">
                <Heart className="w-4 h-4 text-stone-700 dark:text-stone-300 fill-stone-700 dark:fill-stone-300" />
                <span>Swipe & Auto-Pass</span>
              </div>
              <p className="text-[11px] font-sans font-light text-stone-500 dark:text-stone-400 leading-relaxed">
                Swipe right to Like, left to Pass. Use trackpad scroll wheel or keyboard arrows (<kbd className="px-1 bg-stone-200 dark:bg-stone-800 rounded">↓</kbd> / <kbd className="px-1 bg-stone-200 dark:bg-stone-800 rounded">↑</kbd>) for smooth navigation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800/80 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-serif text-sm font-normal">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>Live Friend Sessions</span>
              </div>
              <p className="text-[11px] font-sans font-light text-stone-500 dark:text-stone-400 leading-relaxed">
                Host a session using Guest Links or User Accounts. When both of you like the same title, MovieMatch triggers a celebration!
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800/80 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-serif text-sm font-normal">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Curated & Custom Decks</span>
              </div>
              <p className="text-[11px] font-sans font-light text-stone-500 dark:text-stone-400 leading-relaxed">
                Explore hand-picked theme packs (<em>90s Classics, Sci-Fi Masterpieces</em>) or build custom decks saved permanently to your account profile.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-4 rounded-2xl bg-[#FFFDF9] dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800/80 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-serif text-sm font-normal">
                <Tv className="w-4 h-4 text-amber-500" />
                <span>Trailers & Streaming Providers</span>
              </div>
              <p className="text-[11px] font-sans font-light text-stone-500 dark:text-stone-400 leading-relaxed">
                Inspect movie details or press <kbd className="px-1 bg-stone-200 dark:bg-stone-800 rounded">Space</kbd> to watch official trailers, view TMDB ratings, and see live streaming availability.
              </p>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200/60 dark:border-stone-800">
            <span className="text-[11px] font-sans font-light text-stone-500">
              Powered by TMDB API • Version 2.0
            </span>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 font-sans font-medium text-xs shadow-md hover:bg-stone-800 dark:hover:bg-stone-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Explore MovieMatch</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
