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
      <header className="sticky top-0 z-30 w-full bg-[#FBF9F5]/90 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => resetSession()}>
            <div className="w-9 h-9 rounded-xl bg-[#FFFDF9] border border-stone-300/80 p-0.5 shadow-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <Film className="w-4 h-4 text-stone-800" />
            </div>
            <div>
              <h1 className="text-lg font-serif text-stone-900 tracking-tight flex items-center gap-2">
                Movie Match
                <span className="px-2 py-0.5 rounded-full text-[9px] font-sans font-medium uppercase tracking-widest bg-stone-200/70 text-stone-700">
                  EDITION
                </span>
              </h1>
              <p className="text-[10px] font-sans font-light text-stone-500 uppercase tracking-widest hidden sm:block">
                {onlineSessionId
                  ? `Room #${onlineSessionId} • ${onlineRole === 'p1' ? 'Host' : 'Partner'}`
                  : activePack
                  ? `Pack: ${activePack.title}`
                  : customMovieIds.length > 0
                  ? `Custom Deck (${customMovieIds.length})`
                  : mode === 'couch'
                  ? 'Pass & Play Mode'
                  : 'Link Share Mode'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center bg-stone-200/50 p-1 rounded-xl border border-stone-300/40">
            <button
              onClick={() => setMode('couch')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-all duration-300 ${
                mode === 'couch'
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Pass & Play on the same phone"
            >
              <Users className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden xs:inline">Couch</span>
            </button>

            <button
              onClick={() => setMode('async')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-all duration-300 ${
                mode === 'async'
                  ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Share link with remote partner"
            >
              <Share2 className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden xs:inline">Link Share</span>
            </button>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            {/* Host Session Button */}
            <button
              onClick={() => setIsHostSessionOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-stone-900 text-stone-100 font-sans font-medium text-xs shadow-sm hover:bg-stone-800 active:scale-95 transition-all duration-300 flex items-center gap-1.5"
              title="Host Match Session"
            >
              <Play className="w-3.5 h-3.5 fill-stone-100" />
              <span className="hidden md:inline">Host Session</span>
            </button>

            {/* User Auth Button */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className={`p-2.5 rounded-xl transition-all duration-300 border ${
                isAuthenticated
                  ? 'text-stone-900 border-stone-400 bg-stone-200/60 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 bg-[#FFFDF9] border-stone-300/80 hover:bg-stone-100'
              }`}
              title={isAuthenticated ? `Logged in as ${user.username}` : 'Log In / Authentik SSO'}
            >
              {isAuthenticated ? <UserCheck className="w-4 h-4 text-stone-900" /> : <User className="w-4 h-4 text-stone-600" />}
            </button>

            {/* Custom Lists & Theme Packs Trigger */}
            <button
              onClick={() => setIsCustomListOpen(true)}
              className={`p-2.5 rounded-xl transition-all duration-300 border ${
                isCustomActive
                  ? 'text-stone-900 border-stone-400 bg-stone-200/60 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 bg-[#FFFDF9] border-stone-300/80 hover:bg-stone-100'
              }`}
              title="Curated Series & Custom Watchlists"
            >
              <Layers className="w-4 h-4 text-stone-600" />
            </button>

            {/* Filter Trigger */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="p-2.5 rounded-xl bg-[#FFFDF9] text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-all duration-300 border border-stone-300/80"
              title="Genre & Rating Filters"
            >
              <Sliders className="w-4 h-4 text-stone-600" />
            </button>

            {/* API Key Modal */}
            <button
              onClick={() => setIsApiKeyOpen(true)}
              className={`p-2.5 rounded-xl transition-all duration-300 border ${
                apiKey
                  ? 'text-stone-900 border-stone-400 bg-stone-200/60'
                  : 'text-stone-500 bg-[#FFFDF9] border-stone-300/80 hover:text-stone-900 hover:bg-stone-100'
              }`}
              title={apiKey ? 'TMDB API Key Active' : 'Demo Mode (Click to set TMDB Key)'}
            >
              <Key className="w-4 h-4" />
            </button>

            {/* Reset Session */}
            <button
              onClick={() => resetSession()}
              className="p-2.5 rounded-xl bg-[#FFFDF9] text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all duration-300 border border-stone-300/80"
              title="Reset Deck & Session"
            >
              <RefreshCw className="w-4 h-4" />
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
