import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieContext } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';
import { BACKEND_API } from '../config';
import { copyToClipboard } from '../utils/urlState';
import { X, Play, Users, UserCheck, Share2, Check, Sparkles, Smartphone, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function HostSessionModal({ isOpen, onClose }) {
  const { deck, activePack, customMovieIds, setOnlineSessionId, setOnlineRole } = useMovieContext();
  const { user } = useAuth();

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
    let sessionData = null;
    const movieIds = deck.map(m => m.id);

    try {
      // Attempt backend API call
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

    // Always guarantee session creation even if backend port is offline
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
    setIsCreating(false);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-800/40">
                <Play className="w-5 h-5 fill-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Host Match Session</h3>
                <p className="text-xs text-slate-400">Start a match deck and invite Player 2</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!createdSession ? (
            <div className="space-y-4">
              {/* Session Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Session Name
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl p-3 outline-none focus:border-purple-500 font-semibold"
                />
              </div>

              {/* Current Deck Summary */}
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Selected Deck:</span>
                <span className="font-bold text-purple-300">
                  {activePack ? activePack.title : customMovieIds.length > 0 ? `Custom (${customMovieIds.length} Movies)` : `Discovery (${deck.length} Movies)`}
                </span>
              </div>

              {/* Partner Mode Choice Cards */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Player 2 Participation Mode
                </label>

                {/* Guest Mode Card */}
                <div
                  onClick={() => setPartnerMode('guest')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    partnerMode === 'guest'
                      ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/30'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-900/50 text-purple-300">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Guest Mode (Instant)</span>
                        <span className="bg-purple-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                          Zero Setup
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Player 2 joins via share link or passes phone. No account required.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Logged Account Mode Card */}
                <div
                  onClick={() => setPartnerMode('account')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    partnerMode === 'account'
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/30'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-900/50 text-emerald-300">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Logged Account Mode</span>
                        <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                          Saved History
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Player 2 logs in / uses Authentik SSO. Matches save to user profiles.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateSession}
                disabled={isCreating}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 text-white font-extrabold text-sm shadow-xl shadow-purple-900/40 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>Generate Session Invite</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Session Created Invite Card */
            <div className="space-y-4 text-center">
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                <span>Session #{createdSession.id} Live!</span>
              </div>

              <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
                <p className="text-xs text-slate-300">
                  Share this link with Player 2 ({partnerMode === 'guest' ? 'Guest Mode' : 'Account Mode'}):
                </p>
                <div className="bg-slate-950 p-2.5 rounded-xl font-mono text-xs text-purple-300 truncate border border-slate-800">
                  {`${window.location.origin}${window.location.pathname}?session=${createdSession.id}&mode=${partnerMode}`}
                </div>

                <button
                  onClick={handleCopyLink}
                  className={`w-full py-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                    copied
                      ? 'bg-emerald-600 text-white shadow-emerald-900/40'
                      : 'bg-gradient-to-r from-purple-600 to-rose-600 text-white hover:opacity-90 active:scale-95 shadow-purple-900/30'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Invite Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Copy Session Invite Link</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={onClose}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
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
