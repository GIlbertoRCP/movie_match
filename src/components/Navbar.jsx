import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sliders, Share2, Layers, User, UserCheck, Play, RefreshCw, Sun, Moon, HelpCircle } from 'lucide-react';
import FilterModal from './FilterModal';
import CustomListModal from './CustomListModal';
import AuthModal from './AuthModal';
import HostSessionModal from './HostSessionModal';
import AboutModal from './AboutModal';

export default function Navbar() {
  const { mode, setMode, resetSession, activePack, customMovieIds, onlineSessionId, getShareLink } = useMovieContext();
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCustomListOpen, setIsCustomListOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHostSessionOpen, setIsHostSessionOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const isCustomActive = activePack || customMovieIds.length > 0;

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 px-6 sm:px-8 py-6 bg-gradient-to-b from-stone-950/70 via-stone-900/40 to-transparent pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
          {/* Minimal Text Logo */}
          <div onClick={() => resetSession()} className="cursor-pointer flex items-center gap-2">
            <h1 className="font-serif text-stone-50 text-lg font-normal tracking-tight">
              Movie Match
            </h1>
          </div>

          {/* Bare Icons with Thin Stroke & Opacity Hover */}
          <div className="flex items-center gap-5">
            {/* Host / Session Link Button */}
            <button
              onClick={() => setIsHostSessionOpen(true)}
              className="text-stone-50 opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              title="Host Session"
            >
              <Play strokeWidth={1.25} className="w-5 h-5" />
            </button>

            {/* Curated Lists & Series */}
            <button
              onClick={() => setIsCustomListOpen(true)}
              className={`transition-opacity duration-300 cursor-pointer ${
                isCustomActive ? 'text-cyan-400 opacity-100' : 'text-stone-50 opacity-60 hover:opacity-100'
              }`}
              title="Curated Series & Custom Lists"
            >
              <Layers strokeWidth={1.25} className="w-5 h-5" />
            </button>



            {/* Settings (Filters & Appearance) */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="text-stone-50 opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              title="Settings"
            >
              <Sliders strokeWidth={1.25} className="w-5 h-5" />
            </button>

            {/* User Account Button & Authenticated User Pill */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className={`transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                isAuthenticated
                  ? 'bg-stone-800/80 hover:bg-stone-800 px-2.5 py-1 rounded-full border border-stone-700/60 text-stone-100'
                  : 'text-stone-50 opacity-60 hover:opacity-100'
              }`}
              title={isAuthenticated ? `User: ${user.username}` : 'Sign In'}
            >
              {isAuthenticated ? (
                <>
                  <UserCheck strokeWidth={1.5} className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-serif font-medium max-w-[90px] truncate">{user.username}</span>
                </>
              ) : (
                <User strokeWidth={1.25} className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Modals */}
      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
      <CustomListModal isOpen={isCustomListOpen} onClose={() => setIsCustomListOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <HostSessionModal isOpen={isHostSessionOpen} onClose={() => setIsHostSessionOpen(false)} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
}
