import React from 'react';
import { MovieProvider, useMovieContext } from './context/MovieContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import CardStack from './components/CardStack';
import TransitionScreen from './components/TransitionScreen';
import MatchModal from './components/MatchModal';
import SessionStats from './components/SessionStats';
import { Sparkles } from 'lucide-react';

function MainApp() {
  const { phase } = useMovieContext();

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#080a0f] ambient-bg text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 overflow-hidden">
      {/* Top Navbar */}
      <Navbar />

      {/* Main View Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 sm:p-6 w-full max-w-4xl mx-auto">
        {phase === 'p1_finished' ? (
          <TransitionScreen />
        ) : (
          <CardStack />
        )}

        {/* Collapsible Session Stats & Picks */}
        <SessionStats />
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
