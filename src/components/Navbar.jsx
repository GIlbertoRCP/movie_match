import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';
import { Film, Sliders, Key, RefreshCw, Users, Share2, Sparkles, Layers, User, UserCheck, Play } from 'lucide-react';
import FilterModal from './FilterModal';
import ApiKeyModal from './ApiKeyModal';
import CustomListModal from './CustomListModal';
import AuthModal from './AuthModal';
import HostSessionModal from './HostSessionModal';

export default function Navbar() {
  const { mode, setMode, apiKey, resetSession, activePack, customMovieIds, onlineSessionId, onlineRole, onlineSessionName } = useMovieContext();
  const { user, isAuthenticated } = useAuth();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isCustomListOpen, setIsCustomListOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHostSessionOpen, setIsHostSessionOpen] = useState(false);

  const isCustomActive = activePack || customMovieIds.length > 0;

  return (
    <>
      <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => resetSession()}>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 p-0.5 shadow-md flex items-center justify-center">
              <Film className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Movie Match <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h1>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest hidden sm:block">
                {onlineSessionId
                  ? `Room #${onlineSessionId} (${onlineRole === 'p1' ? 'Host' : 'Partner'})`
                  : activePack
                  ? `Pack: ${activePack.title}`
                  : customMovieIds.length > 0
                  ? `Custom Deck (${customMovieIds.length})`
                  : mode === 'couch'
                  ? 'Pass & Play Mode'
                  : 'Async Link Mode'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Pills */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-full border border-slate-800 shadow-inner">
            <button
              onClick={() => setMode('couch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                mode === 'couch'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Pass & Play on the same phone"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Couch</span>
            </button>

            <button
              onClick={() => setMode('async')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                mode === 'async'
                  ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-md shadow-rose-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Share link with remote partner"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Link Share</span>
            </button>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5">
            {/* Host Session Button */}
            <button
              onClick={() => setIsHostSessionOpen(true)}
              className="p-2 rounded-xl glass-pill text-amber-400 hover:text-white bg-amber-950/20 border border-amber-500/30 transition-all"
              title="Host Match Session (Guest vs Logged Account)"
            >
              <Play className="w-4 h-4 fill-amber-400" />
            </button>

            {/* User Auth Button */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className={`p-2 rounded-xl glass-pill transition-all border ${
                isAuthenticated
                  ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30 shadow-lg shadow-emerald-950/40'
                  : 'text-slate-300 hover:text-white border-slate-700/50'
              }`}
              title={isAuthenticated ? `Logged in as ${user.username}` : 'Log In / Authentik SSO'}
            >
              {isAuthenticated ? <UserCheck className="w-4 h-4 text-emerald-400" /> : <User className="w-4 h-4 text-purple-400" />}
            </button>

            {/* Custom Lists & Theme Packs Trigger */}
            <button
              onClick={() => setIsCustomListOpen(true)}
              className={`p-2 rounded-xl glass-pill transition-all border ${
                isCustomActive
                  ? 'text-purple-300 border-purple-500/50 bg-purple-950/40 shadow-lg shadow-purple-950/40'
                  : 'text-slate-300 hover:text-white border-slate-700/50'
              }`}
              title="Curated Series & Custom Watchlists"
            >
              <Layers className="w-4 h-4 text-purple-400" />
            </button>

            {/* Filter Trigger */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="p-2 rounded-xl glass-pill text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all border border-slate-700/50"
              title="Genre & Rating Filters"
            >
              <Sliders className="w-4 h-4 text-indigo-400" />
            </button>

            {/* API Key Modal */}
            <button
              onClick={() => setIsApiKeyOpen(true)}
              className={`p-2 rounded-xl glass-pill transition-all border ${
                apiKey
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20'
                  : 'text-slate-400 border-slate-700/50 hover:text-white'
              }`}
              title={apiKey ? 'TMDB API Key Active' : 'Demo Mode (Click to set TMDB Key)'}
            >
              <Key className="w-4 h-4" />
            </button>

            {/* Reset Session */}
            <button
              onClick={() => resetSession()}
              className="p-2 rounded-xl glass-pill text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-800/40 transition-all border border-slate-700/50"
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
