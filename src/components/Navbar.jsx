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
      <header className="sticky top-0 z-30 w-full bg-[#080a0f]/90 backdrop-blur-2xl border-b border-slate-800/80 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => resetSession()}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-900/60 to-slate-900 border border-indigo-500/40 p-0.5 shadow-lg shadow-indigo-950/40 flex items-center justify-center transition-transform group-hover:scale-105">
              <Film className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Movie Match
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  PRO
                </span>
              </h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest hidden sm:block">
                {onlineSessionId
                  ? `Room #${onlineSessionId} • ${onlineRole === 'p1' ? 'Host' : 'Partner'}`
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

          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setMode('couch')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                mode === 'couch'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Pass & Play on the same phone"
            >
              <Users className="w-4 h-4 text-slate-200" />
              <span className="hidden xs:inline">Couch</span>
            </button>

            <button
              onClick={() => setMode('async')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                mode === 'async'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Share link with remote partner"
            >
              <Share2 className="w-4 h-4 text-slate-200" />
              <span className="hidden xs:inline">Link Share</span>
            </button>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            {/* Host Session Button (Prominent Easy-Click Pill) */}
            <button
              onClick={() => setIsHostSessionOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 text-white font-extrabold text-xs shadow-lg shadow-indigo-950/50 hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 border border-indigo-400/30"
              title="Host Match Session (Guest vs Logged Account)"
            >
              <Play className="w-4 h-4 fill-white" />
              <span className="hidden md:inline">Host Session</span>
            </button>

            {/* User Auth Button */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className={`p-2.5 sm:p-3 rounded-2xl transition-all border active:scale-95 ${
                isAuthenticated
                  ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40 shadow-lg shadow-emerald-950/40'
                  : 'text-slate-300 hover:text-white bg-slate-900 border-slate-800'
              }`}
              title={isAuthenticated ? `Logged in as ${user.username}` : 'Log In / Authentik SSO'}
            >
              {isAuthenticated ? <UserCheck className="w-4.5 h-4.5 text-emerald-400" /> : <User className="w-4.5 h-4.5 text-slate-300" />}
            </button>

            {/* Custom Lists & Theme Packs Trigger */}
            <button
              onClick={() => setIsCustomListOpen(true)}
              className={`p-2.5 sm:p-3 rounded-2xl transition-all border active:scale-95 ${
                isCustomActive
                  ? 'text-cyan-300 border-cyan-500/50 bg-cyan-950/40 shadow-lg'
                  : 'text-slate-300 hover:text-white bg-slate-900 border-slate-800'
              }`}
              title="Curated Series & Custom Watchlists"
            >
              <Layers className="w-4.5 h-4.5 text-slate-300" />
            </button>

            {/* Filter Trigger */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="p-2.5 sm:p-3 rounded-2xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-all border border-slate-800 active:scale-95"
              title="Genre & Rating Filters"
            >
              <Sliders className="w-4.5 h-4.5 text-slate-300" />
            </button>

            {/* API Key Modal */}
            <button
              onClick={() => setIsApiKeyOpen(true)}
              className={`p-2.5 sm:p-3 rounded-2xl transition-all border active:scale-95 ${
                apiKey
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20'
                  : 'text-slate-400 bg-slate-900 border-slate-800 hover:text-white'
              }`}
              title={apiKey ? 'TMDB API Key Active' : 'Demo Mode (Click to set TMDB Key)'}
            >
              <Key className="w-4.5 h-4.5" />
            </button>

            {/* Reset Session */}
            <button
              onClick={() => resetSession()}
              className="p-2.5 sm:p-3 rounded-2xl bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 hover:border-rose-800/40 transition-all border border-slate-800 active:scale-95"
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
