import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { copyToClipboard } from '../utils/urlState';
import { Smartphone, Share2, Check, Sparkles, ArrowRight, Heart, RefreshCw, Radio, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TransitionScreen() {
  const { mode, startPlayer2Turn, getShareLink, p1Likes, p2Likes, deck, resetSession, onlineSessionId, onlineRole, onlineSessionName } = useMovieContext();
  const [copied, setCopied] = useState(false);

  const isOnlineOrAsync = Boolean(onlineSessionId) || mode === 'async';

  const handleCopyLink = async () => {
    const link = onlineSessionId
      ? `${window.location.origin}${window.location.pathname}?session=${onlineSessionId}&mode=guest`
      : getShareLink();

    const success = await copyToClipboard(link);
    if (success) {
      setCopied(true);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 }
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // 1. Local Pass & Play (Couch) Mode Transition Screen
  if (mode === 'couch' && !onlineSessionId) {
    return (
      <div className="w-full max-w-md mx-auto p-6 flex flex-col items-center justify-center text-center my-auto min-h-[460px]">
        {/* Pass Device Animation Badge */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 p-1 animate-pulse-subtle shadow-2xl shadow-indigo-950/40">
            <div className="w-full h-full bg-slate-950 rounded-[20px] flex items-center justify-center">
              <Smartphone className="w-10 h-10 text-indigo-400 animate-bounce" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Player 1 Complete! 🎉
        </h2>
        <p className="text-sm text-slate-300 mt-2 max-w-xs leading-relaxed">
          Pass the phone to <span className="text-indigo-400 font-bold">Player 2</span>.
          They will swipe through the deck to find instant local matches!
        </p>

        {/* Stats Pill */}
        <div className="mt-6 flex items-center gap-2 bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner">
          <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">
            Player 1 liked <strong className="text-white font-extrabold">{p1Likes.length}</strong> out of {deck.length} movies
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={startPlayer2Turn}
          className="mt-8 w-full max-w-xs py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 text-white font-extrabold text-base shadow-xl shadow-indigo-950/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group border border-indigo-400/30"
        >
          <span>Start Player 2 Turn</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => resetSession()}
          className="mt-4 text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Start over with new movies</span>
        </button>
      </div>
    );
  }

  // 2. Online Multiplayer Room / Link Share Mode Transition Screen
  const shareUrl = onlineSessionId
    ? `${window.location.origin}${window.location.pathname}?session=${onlineSessionId}&mode=guest`
    : getShareLink();

  return (
    <div className="w-full max-w-md mx-auto p-6 flex flex-col items-center justify-center text-center my-auto min-h-[460px]">
      {/* Online Room Live Icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-500 p-1 shadow-2xl shadow-indigo-950/50">
          <div className="w-full h-full bg-slate-950 rounded-[20px] flex items-center justify-center">
            {onlineSessionId ? (
              <Radio className="w-10 h-10 text-cyan-400 animate-pulse" />
            ) : (
              <Share2 className="w-10 h-10 text-cyan-400" />
            )}
          </div>
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
        You've Finished Swiping! 🍿
      </h2>
      <p className="text-sm text-slate-300 mt-2 max-w-xs leading-relaxed">
        {onlineSessionId
          ? `Your swipes are saved live in Room #${onlineSessionId}. Send the link to Player 2 to find your mutual matches!`
          : 'Your likes have been serialized into a lightweight link. Share it with your partner!'}
      </p>

      {/* Stats Pill */}
      <div className="mt-4 flex items-center gap-2 bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800">
        <Sparkles className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-slate-200">
          You liked <strong className="text-white font-extrabold">{p1Likes.length}</strong> movies
          {p2Likes.length > 0 && ` • Partner liked ${p2Likes.length}`}
        </span>
      </div>

      {/* Share Link Box */}
      <div className="mt-6 w-full glass-card p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
        <div className="bg-slate-950 px-3 py-2.5 rounded-xl font-mono text-xs text-cyan-300 truncate border border-slate-800">
          {shareUrl}
        </div>

        <button
          onClick={handleCopyLink}
          className={`w-full py-4 px-4 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
            copied
              ? 'bg-emerald-600 text-white shadow-emerald-950/40'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 text-white hover:opacity-95 active:scale-95 shadow-indigo-950/40 border border-indigo-400/30'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 text-white" />
              <span>Session Link Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Share2 className="w-5 h-5 text-white" />
              <span>Copy Session Invite Link</span>
            </>
          )}
        </button>
      </div>

      <button
        onClick={() => resetSession()}
        className="mt-6 text-xs text-slate-500 hover:text-slate-300 font-semibold transition-colors flex items-center gap-1.5"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Start New Match Session</span>
      </button>
    </div>
  );
}
