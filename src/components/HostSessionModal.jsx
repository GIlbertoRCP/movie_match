import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieContext } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';
import { BACKEND_API } from '../config';
import { copyToClipboard } from '../utils/urlState';
import { X, Play, Users, UserCheck, Share2, Check, Sparkles, Smartphone, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function HostSessionModal({ isOpen, onClose }) {
  const { deck, activePack, customMovieIds, p1Likes, setOnlineSessionId, setOnlineRole, setDeck, exitOnlineSession } = useMovieContext();
  const { user } = useAuth();

  const p1LikedMovies = deck.filter(m => p1Likes.includes(m.id));
  const hasLikedMovies = p1LikedMovies.length > 0;

  // Deck Source Selection Mode: 'liked' | 'current'
  const [deckSource, setDeckSource] = useState(hasLikedMovies ? 'liked' : 'current');
  const [sessionName, setSessionName] = useState(
    user ? `${user.username}'s Movie Match` : 'Movie Night Match'
  );
  const [partnerMode, setPartnerMode] = useState('guest'); // 'guest' | 'account'
  const [createdSession, setCreatedSession] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreateSession = async () => {
    setIsCreating(true);

    // Clear any stale previous session before hosting new session
    if (exitOnlineSession) {
      exitOnlineSession();
    }
    let sessionData = null;

    // Use liked movies deck if selected
    const targetMovies = deckSource === 'liked' && hasLikedMovies
      ? p1LikedMovies
      : deck;
    const movieIds = targetMovies.map(m => m.id);

    try {
      const res = await fetch(`${BACKEND_API}/sessions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionName,
          deckMovieIds: movieIds,
          partnerMode,
          hostUserId: user?.id || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        sessionData = data.session;
      }
    } catch (err) {
      console.warn('Backend server unavailable, falling back to instant client session code generation.');
    }

    if (!sessionData) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      sessionData = {
        id: code,
        session_name: sessionName || 'Movie Match Session',
        partner_mode: partnerMode,
        deck_movie_ids: movieIds
      };
    }

    setCreatedSession(sessionData);
    if (setOnlineSessionId) {
      setOnlineSessionId(sessionData.id);
      setOnlineRole('p1');
    }
    // If hosting with liked movies deck, set active deck
    if (deckSource === 'liked' && hasLikedMovies) {
      setDeck(p1LikedMovies);
    }
    setIsCreating(false);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  const handleCopyLink = async () => {
    if (!createdSession) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?session=${createdSession.id}&mode=${partnerMode}`;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="relative w-full max-w-md bg-[#FFFDF9] dark:bg-[#1C1A17] border border-stone-200/80 dark:border-stone-800 rounded-3xl shadow-xl overflow-hidden z-10 p-6 space-y-5 text-stone-900 dark:text-stone-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-stone-800 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700">
                <Play strokeWidth={1.25} className="w-5 h-5 fill-stone-900 dark:fill-stone-100" />
              </div>
              <div>
                <h3 className="text-base font-serif font-normal text-stone-900 dark:text-stone-100">Host Session with Friend</h3>
                <p className="text-xs font-sans font-light text-stone-500 dark:text-stone-400">Share your picks & find mutual matches</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
            >
              <X strokeWidth={1.25} className="w-5 h-5" />
            </button>
          </div>

          {!createdSession ? (
            <div className="space-y-4">
              {/* Session Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-sans font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider block px-0.5">
                  Session Title
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full bg-stone-100/80 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs rounded-2xl p-3 outline-none focus:border-stone-400 font-sans font-medium"
                />
              </div>

              {/* Shared Deck Choice */}
              <div className="space-y-2">
                <label className="text-[11px] font-sans font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider block px-0.5">
                  Initial Swiping Deck for Friend
                </label>

                {/* Liked Movies Deck Option */}
                {hasLikedMovies && (
                  <div
                    onClick={() => setDeckSource('liked')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      deckSource === 'liked'
                        ? 'bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-xs'
                        : 'bg-stone-100/50 dark:bg-stone-900/50 border-stone-200/60 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        deckSource === 'liked'
                          ? 'bg-stone-800 text-stone-100 dark:bg-stone-200 dark:text-stone-900'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
                      }`}>
                        <Sparkles strokeWidth={1.25} className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-serif font-normal flex items-center gap-2">
                          <span>Your Liked Movies Deck ({p1LikedMovies.length})</span>
                          <span className={`text-[9px] font-sans font-medium px-2 py-0.5 rounded-md ${
                            deckSource === 'liked'
                              ? 'bg-stone-800 text-stone-200 dark:bg-stone-200 dark:text-stone-800'
                              : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                          }`}>
                            Recommended
                          </span>
                        </h4>
                        <p className="text-[11px] font-sans font-light opacity-80 mt-0.5">
                          Friend swipes on your liked movies first for instant matches.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Discovery Catalog Option */}
                <div
                  onClick={() => setDeckSource('current')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    deckSource === 'current'
                      ? 'bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100'
                      : 'bg-stone-100/50 dark:bg-stone-900/50 border-stone-200/60 dark:border-stone-800 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                      <Smartphone strokeWidth={1.25} className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-serif font-normal">
                        Full Catalog Feed ({deck.length} Movies)
                      </h4>
                      <p className="text-[11px] font-sans font-light opacity-80 mt-0.5">
                        Start with live TMDB discovery feed from page 1.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Partner Participation Mode */}
              <div className="space-y-2">
                <label className="text-[11px] font-sans font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider block px-0.5">
                  Participation Mode
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPartnerMode('guest')}
                    className={`p-3 rounded-2xl border text-xs font-sans font-medium text-left transition-all cursor-pointer ${
                      partnerMode === 'guest'
                        ? 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100'
                        : 'bg-stone-100/50 dark:bg-stone-900/50 border-stone-200/60 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 opacity-80" />
                      <span>Guest Link</span>
                    </div>
                    <div className="text-[10px] font-light opacity-80 mt-0.5">No login needed</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPartnerMode('account')}
                    className={`p-3 rounded-2xl border text-xs font-sans font-medium text-left transition-all cursor-pointer ${
                      partnerMode === 'account'
                        ? 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100'
                        : 'bg-stone-100/50 dark:bg-stone-900/50 border-stone-200/60 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      <span>User Account</span>
                    </div>
                    <div className="text-[10px] font-light opacity-80 mt-0.5">Save to history</div>
                  </button>
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateSession}
                disabled={isCreating}
                className="w-full py-3.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 font-sans font-medium text-xs hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-stone-100 dark:text-stone-900" />
                ) : (
                  <>
                    <span>Generate Session Link</span>
                    <ArrowRight strokeWidth={1.25} className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Invite Link Generated */
            <div className="space-y-4 text-center">
              <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-xs font-serif font-normal flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Session #{createdSession.id} Active</span>
              </div>

              <div className="p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-3 bg-[#FFFDF9] dark:bg-[#121110]">
                <p className="text-xs font-sans font-light text-stone-600 dark:text-stone-400">
                  Share link with your friend:
                </p>
                <div className="bg-stone-100 dark:bg-stone-900 p-3 rounded-xl font-mono text-[11px] text-stone-800 dark:text-stone-200 truncate border border-stone-200/60 dark:border-stone-800">
                  {`${window.location.origin}${window.location.pathname}?session=${createdSession.id}&mode=${partnerMode}`}
                </div>

                <button
                  onClick={handleCopyLink}
                  className={`w-full py-3 rounded-xl font-sans font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                    copied
                      ? 'bg-emerald-800 text-white'
                      : 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-95'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Copy Invite Link</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={onClose}
                className="text-xs font-sans font-light text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
              >
                Close & Start Swiping
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
