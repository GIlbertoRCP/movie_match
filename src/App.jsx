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
  const { phase } = useMovieContext();

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#FBF9F5] ambient-bg text-stone-900 font-sans selection:bg-stone-200 selection:text-stone-900 overflow-hidden">
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
      <footer className="relative z-10 w-full border-t border-stone-200/80 bg-[#F5F2EB]/80 py-4 px-6 text-center text-xs text-stone-500 font-sans font-light mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-800 font-normal hover:underline"
            >
              TMDB API
            </a>
            <span>& JustWatch</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-stone-600 font-light bg-[#FFFDF9] px-3.5 py-1 rounded-full border border-stone-300/60 shadow-sm">
            <span className="font-serif">Shortcuts:</span>
            <span className="text-stone-800 font-normal"><kbd className="bg-stone-100 px-1.5 py-0.5 rounded border border-stone-300">←</kbd> Pass</span>
            <span className="text-stone-800 font-normal"><kbd className="bg-stone-100 px-1.5 py-0.5 rounded border border-stone-300">→</kbd> Like</span>
            <span className="text-stone-800 font-normal"><kbd className="bg-stone-100 px-1.5 py-0.5 rounded border border-stone-300">↑</kbd> Details</span>
            <span className="text-stone-800 font-normal"><kbd className="bg-stone-100 px-1.5 py-0.5 rounded border border-stone-300">Z</kbd> Undo</span>
          </div>

          <p className="flex items-center gap-1 font-serif text-stone-600">
            <span>Movie Match Editorial</span>
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
