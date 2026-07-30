import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';
import { Sliders, Share2, Layers, User, UserCheck, Play, RefreshCw } from 'lucide-react';
import FilterModal from './FilterModal';
import CustomListModal from './CustomListModal';
import AuthModal from './AuthModal';
import HostSessionModal from './HostSessionModal';

export default function Navbar() {
  const { mode, setMode, resetSession, activePack, customMovieIds, onlineSessionId, getShareLink } = useMovieContext();
  const { user, isAuthenticated } = useAuth();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCustomListOpen, setIsCustomListOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHostSessionOpen, setIsHostSessionOpen] = useState(false);

  const isCustomActive = activePack || customMovieIds.length > 0;

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 px-6 sm:px-8 py-5 bg-gradient-to-b from-stone-900/40 to-transparent pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
          {/* Minimal Text Logo */}
          <div onClick={() => resetSession()} className="cursor-pointer">
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

            {/* Share Link Button */}
            <button
              onClick={() => {
                const link = getShareLink();
                navigator.clipboard.writeText(link);
              }}
              className="text-stone-50 opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              title="Share Link"
            >
              <Share2 strokeWidth={1.25} className="w-5 h-5" />
            </button>

            {/* Curated Lists & Series */}
            <button
              onClick={() => setIsCustomListOpen(true)}
              className={`transition-opacity duration-300 cursor-pointer ${
                isCustomActive ? 'text-amber-300 opacity-90' : 'text-stone-50 opacity-60 hover:opacity-100'
              }`}
              title="Curated Series & Custom Lists"
            >
              <Layers strokeWidth={1.25} className="w-5 h-5" />
            </button>

            {/* Filter Catalog */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="text-stone-50 opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              title="Filter Catalog"
            >
              <Sliders strokeWidth={1.25} className="w-5 h-5" />
            </button>

            {/* User Account */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className={`transition-opacity duration-300 cursor-pointer ${
                isAuthenticated ? 'text-emerald-300 opacity-90' : 'text-stone-50 opacity-60 hover:opacity-100'
              }`}
              title={isAuthenticated ? `User: ${user.username}` : 'Sign In'}
            >
              {isAuthenticated ? <UserCheck strokeWidth={1.25} className="w-5 h-5" /> : <User strokeWidth={1.25} className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Modals */}
      <FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
      <CustomListModal isOpen={isCustomListOpen} onClose={() => setIsCustomListOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <HostSessionModal isOpen={isHostSessionOpen} onClose={() => setIsHostSessionOpen(false)} />
    </>
  );
}
