import React from 'react';
import { MovieProvider, useMovieContext } from './context/MovieContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import CardStack from './components/CardStack';
import TransitionScreen from './components/TransitionScreen';
import MatchModal from './components/MatchModal';
import SessionStats from './components/SessionStats';
import ServerColdStartBanner from './components/ServerColdStartBanner';
import OnlineSessionStatusBar from './components/OnlineSessionStatusBar';
import DesktopCinemaSpotlight from './components/DesktopCinemaSpotlight';
import { Sparkles } from 'lucide-react';

function MainApp() {
  const { phase, theme } = useMovieContext();

  return (
    <div className={`relative min-h-screen flex flex-col justify-between bg-[#080a0f] ambient-bg text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-hidden ${theme === 'light' ? 'light-mode' : ''}`}>
      {/* Cold Start Monitor Toast */}
      <ServerColdStartBanner />

      {/* Top Navbar */}
      <Navbar />

      {/* Main View Area */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto p-3 sm:p-6 my-auto">
        <OnlineSessionStatusBar />

        {/* Responsive Desktop Grid Layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          {/* Main Swiping Column */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col items-center justify-center">
            {phase === 'p1_finished' ? (
              <TransitionScreen />
            ) : (
              <CardStack />
            )}
          </div>

          {/* Desktop Companion Sidebar (Aligned with top edge of movie card) */}
          <div className="hidden lg:flex lg:flex-col lg:col-span-5 xl:col-span-5 space-y-5 pt-8 sm:pt-9">
            {/* Desktop Active Movie Spotlight */}
            <DesktopCinemaSpotlight />

            {/* Desktop Live Session Stats & Picks */}
            <SessionStats />
          </div>
        </div>

        {/* Mobile View Session Stats */}
        <div className="block lg:hidden mt-6">
          <SessionStats />
        </div>
      </main>

      {/* Celebratory Match Modal */}
      <MatchModal />

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-900 bg-slate-950/70 py-4 px-4 text-center text-xs text-slate-500 glass-panel mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 font-bold hover:underline"
            >
              TMDB API
            </a>
            <span>& JustWatch</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 font-medium bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800/80">
            <span>Desktop Shortcuts:</span>
            <span className="text-slate-300 font-bold"><kbd className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700">←</kbd> Pass</span>
            <span className="text-slate-300 font-bold"><kbd className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700">→</kbd> Like</span>
            <span className="text-slate-300 font-bold"><kbd className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700">↑</kbd> Info</span>
            <span className="text-slate-300 font-bold"><kbd className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700">Z</kbd> Undo</span>
          </div>

          <p className="flex items-center gap-1">
            <span>Movie Matcher Session</span>
            <Sparkles className="w-3 h-3 text-purple-400" />
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MovieProvider>
        <MainApp />
      </MovieProvider>
    </AuthProvider>
  );
}
