import React from 'react';
import { MovieProvider, useMovieContext } from './context/MovieContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import CardStack from './components/CardStack';
import TransitionScreen from './components/TransitionScreen';
import MatchModal from './components/MatchModal';
import HistoryDrawer from './components/HistoryDrawer';
import ServerColdStartBanner from './components/ServerColdStartBanner';
import OnlineSessionStatusBar from './components/OnlineSessionStatusBar';
import DesktopCinemaSpotlight from './components/DesktopCinemaSpotlight';

function MainApp() {
  const { phase } = useMovieContext();

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#FBF9F5] dark:bg-[#121110] ambient-bg text-stone-900 dark:text-stone-100 font-sans selection:bg-stone-200 selection:text-stone-900 overflow-hidden">
      {/* Cold Start Monitor Toast */}
      <ServerColdStartBanner />

      {/* Top Fixed HUD Header */}
      <Navbar />

      {/* Main Full-Screen Vertical Snap Scroll Feed Container */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-16 pb-12 h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth scrollbar-none">
        <OnlineSessionStatusBar />

        {/* Responsive Desktop Grid Layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          {/* Main Feed Column */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col items-center justify-center">
            {phase === 'p1_finished' ? (
              <TransitionScreen />
            ) : (
              <CardStack />
            )}
          </div>

          {/* Desktop Companion Sidebar */}
          <div className="hidden lg:flex lg:flex-col lg:col-span-5 xl:col-span-5 space-y-5 pt-8 sm:pt-9">
            {/* Desktop Active Movie Spotlight */}
            <DesktopCinemaSpotlight />
          </div>
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
    <AuthProvider>
      <MovieProvider>
        <MainApp />
      </MovieProvider>
    </AuthProvider>
  );
}
