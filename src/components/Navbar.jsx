import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';
import { Film, Sliders, Key, RefreshCw, Users, Share2, Sparkles, Layers, User, UserCheck, Play, Sun, Moon } from 'lucide-react';
import FilterModal from './FilterModal';
import ApiKeyModal from './ApiKeyModal';
import CustomListModal from './CustomListModal';
import AuthModal from './AuthModal';
import HostSessionModal from './HostSessionModal';

export default function Navbar() {
  const { mode, setMode, apiKey, resetSession, activePack, customMovieIds, onlineSessionId, onlineRole, onlineSessionName, theme, toggleTheme } = useMovieContext();
  const { user, isAuthenticated } = useAuth();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isCustomListOpen, setIsCustomListOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHostSessionOpen, setIsHostSessionOpen] = useState(false);

  const isCustomActive = activePack || customMovieIds.length > 0;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-5 bg-gradient-to-b from-stone-950/90 via-stone-950/40 to-transparent pointer-events-none transition-opacity duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 pointer-events-auto">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => resetSession()}>
            <div className="w-8 h-8 flex items-center justify-center text-white opacity-80 group-hover:opacity-100 transition-opacity">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-serif text-white tracking-tight flex items-center gap-2 drop-shadow-sm font-normal">
                Movie Match
                <span className="text-[10px] font-sans font-light uppercase tracking-widest text-stone-300 opacity-75">
                  EDITORIAL
                </span>
              </h1>
              <p className="text-[10px] font-sans font-light text-stone-300 opacity-70 uppercase tracking-widest hidden sm:block">
                {onlineSessionId
                  ? `Room #${onlineSessionId} • ${onlineRole === 'p1' ? 'Host' : 'Partner'}`
                  : activePack
                  ? `Pack: ${activePack.title}`
                  : customMovieIds.length > 0
                  ? `Custom Deck (${customMovieIds.length})`
                  : mode === 'couch'
                  ? 'Pass & Play'
                  : 'Link Share'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Flat Controls */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => setMode('couch')}
              className={`text-xs font-sans font-medium transition-opacity duration-300 flex items-center gap-1.5 cursor-pointer ${
                mode === 'couch' ? 'text-white opacity-100' : 'text-stone-300 opacity-50 hover:opacity-90'
              }`}
              title="Pass & Play on the same phone"
            >
              <Users className="w-4 h-4" />
              <span className="hidden xs:inline">Couch</span>
            </button>

            <button
              onClick={() => setMode('async')}
              className={`text-xs font-sans font-medium transition-opacity duration-300 flex items-center gap-1.5 cursor-pointer ${
                mode === 'async' ? 'text-white opacity-100' : 'text-stone-300 opacity-50 hover:opacity-90'
              }`}
              title="Share link with remote partner"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden xs:inline">Link Share</span>
            </button>
          </div>

          {/* Right Action Icons (Flat, Transparent with Opacity Hover) */}
          <div className="flex items-center gap-4">
            {/* Host Session Button */}
            <button
              onClick={() => setIsHostSessionOpen(true)}
              className="text-white opacity-70 hover:opacity-100 transition-opacity duration-300 text-xs font-sans font-medium flex items-center gap-1.5 cursor-pointer"
              title="Host Match Session"
            >
              <Play className="w-4 h-4 fill-white" />
              <span className="hidden md:inline">Host Session</span>
            </button>

            {/* User Auth Button */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className={`transition-opacity duration-300 cursor-pointer ${
                isAuthenticated ? 'text-emerald-300 opacity-90 hover:opacity-100' : 'text-white opacity-70 hover:opacity-100'
              }`}
              title={isAuthenticated ? `Logged in as ${user.username}` : 'Log In / Authentik SSO'}
            >
              {isAuthenticated ? <UserCheck className="w-4.5 h-4.5 text-emerald-300" /> : <User className="w-4.5 h-4.5 text-white" />}
            </button>

            {/* Custom Lists & Theme Packs Trigger */}
            <button
              onClick={() => setIsCustomListOpen(true)}
              className={`transition-opacity duration-300 cursor-pointer ${
                isCustomActive ? 'text-amber-300 opacity-90 hover:opacity-100' : 'text-white opacity-70 hover:opacity-100'
              }`}
              title="Curated Series & Custom Watchlists"
            >
              <Layers className="w-4.5 h-4.5 text-white" />
            </button>

            {/* Filter Trigger */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="text-white opacity-70 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              title="Genre & Rating Filters"
            >
              <Sliders className="w-4.5 h-4.5" />
            </button>

            {/* Theme Toggle (Light / Dark Mode) */}
            <button
              onClick={toggleTheme}
              className="text-white opacity-70 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-300" /> : <Moon className="w-4.5 h-4.5 text-stone-200" />}
            </button>

            {/* Reset Session */}
            <button
              onClick={() => resetSession()}
              className="text-white opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              title="Reset Deck & Session"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Modals */}
      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
      <ApiKeyModal isOpen={isApiKeyOpen} onClose={() => setIsApiKeyOpen(false)} />
      <CustomListModal isOpen={isCustomListOpen} onClose={() => setIsCustomListOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <HostSessionModal isOpen={isHostSessionOpen} onClose={() => setIsHostSessionOpen(false)} />
    </>
  );
}
