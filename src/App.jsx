import React from 'react';
import { MovieProvider, useMovieContext } from './context/MovieContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import CardStack from './components/CardStack';
import TransitionScreen from './components/TransitionScreen';
import MatchModal from './components/MatchModal';
import HistoryDrawer from './components/HistoryDrawer';
import ServerColdStartBanner from './components/ServerColdStartBanner';
import OnlineSessionStatusBar from './components/OnlineSessionStatusBar';
import CinemaDashboard from './components/CinemaDashboard';

function MainApp() {
  const { phase, deck, currentIndex } = useMovieContext();
  const currentMovie = deck[currentIndex];

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#FBF9F5] dark:bg-[#121110] ambient-bg text-stone-900 dark:text-stone-100 font-sans selection:bg-stone-200 selection:text-stone-900 overflow-hidden">
      {/* Dynamic Ambient Stage Glow Background */}
      {currentMovie && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <img
            key={currentMovie.id}
            src={currentMovie.backdrop_path || currentMovie.poster_path}
            alt=""
            className="w-full h-full object-cover blur-3xl scale-125 opacity-20 dark:opacity-25 transition-all duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FBF9F5] via-transparent to-[#FBF9F5]/70 dark:from-[#121110] dark:via-transparent dark:to-[#121110]/70" />
        </div>
      )}

      {/* Cold Start Monitor Toast */}
      <ServerColdStartBanner />

      {/* Top Fixed HUD Header */}
      <Navbar />

      {/* Main Full-Screen Vertical Snap Scroll Feed Container (Centered Stage) */}
      <main className="relative z-10 flex-1 w-full max-w-xl sm:max-w-2xl mx-auto px-3 sm:px-6 pt-16 pb-12 h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth scrollbar-none flex flex-col items-center">
        <OnlineSessionStatusBar />

        {/* Centered Main Feed Column */}
        <div className="w-full flex-1 flex flex-col items-center justify-center">
          {phase === 'p1_finished' ? (
            <TransitionScreen />
          ) : (
            <CardStack />
          )}
        </div>
      </main>

      {/* Responsive Match History Vaul Drawer */}
      <HistoryDrawer />

      {/* Celebratory Match Modal */}
      <MatchModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MovieProvider>
          <MainApp />
        </MovieProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
