import React, { useState } from 'react';
import { useMovieContext } from '../context/MovieContext';
import { copyToClipboard } from '../utils/urlState';
import { Smartphone, Share2, Check, Sparkles, ArrowRight, Heart, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TransitionScreen() {
  const { mode, startPlayer2Turn, getShareLink, p1Likes, deck, resetSession } = useMovieContext();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const link = getShareLink();
    const success = await copyToClipboard(link);
    if (success) {
      setCopied(true);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 }
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (mode === 'couch') {
    return (
      <div className="w-full max-w-md mx-auto p-6 flex flex-col items-center justify-center text-center my-auto min-h-[460px]">
        {/* Pass Device Animation Badge */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-rose-500 p-1 animate-pulse-subtle shadow-2xl shadow-purple-900/40">
            <div className="w-full h-full bg-slate-950 rounded-[20px] flex items-center justify-center">
              <Smartphone className="w-10 h-10 text-purple-400 animate-bounce" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Player 1 Complete! 🎉
        </h2>
        <p className="text-sm text-slate-300 mt-2 max-w-xs leading-relaxed">
          Pass the phone to <span className="text-purple-400 font-bold">Player 2</span>.
          They will swipe through the deck to find instant local matches!
        </p>

        {/* Stats Pill */}
        <div className="mt-6 flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800 shadow-inner">
          <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">
            Player 1 liked <strong className="text-white font-extrabold">{p1Likes.length}</strong> out of {deck.length} movies
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={startPlayer2Turn}
          className="mt-8 w-full max-w-xs py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 text-white font-black text-base shadow-xl shadow-purple-900/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
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

  // Link Share Mode
  const shareUrl = getShareLink();

  return (
    <div className="w-full max-w-md mx-auto p-6 flex flex-col items-center justify-center text-center my-auto min-h-[460px]">
      {/* Share Link Icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 p-1 shadow-2xl shadow-rose-900/40">
          <div className="w-full h-full bg-slate-950 rounded-[20px] flex items-center justify-center">
            <Share2 className="w-10 h-10 text-rose-400" />
          </div>
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
        Session Ready to Share! 🚀
      </h2>
      <p className="text-sm text-slate-300 mt-2 max-w-xs leading-relaxed">
        Your likes have been serialized into a lightweight URL link. Send it to your partner!
      </p>

      {/* Stats Pill */}
      <div className="mt-4 flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-semibold text-slate-200">
          You liked <strong className="text-white font-extrabold">{p1Likes.length}</strong> movies
        </span>
      </div>

      {/* Share Link Box */}
      <div className="mt-6 w-full glass-card p-3 rounded-2xl border border-slate-800 flex flex-col gap-2">
        <div className="bg-slate-950 px-3 py-2 rounded-xl text-left font-mono text-xs text-purple-300 truncate border border-slate-800/80">
          {shareUrl}
        </div>

        <button
          onClick={handleCopyLink}
          className={`w-full py-3 px-4 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
            copied
              ? 'bg-emerald-600 text-white shadow-emerald-900/40'
              : 'bg-gradient-to-r from-purple-600 to-rose-600 text-white hover:opacity-90 active:scale-95 shadow-purple-900/30'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Link Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Copy Share Link</span>
            </>
          )}
        </button>
      </div>

      <p className="text-[11px] text-slate-500 mt-4">
        When your partner opens this link, they will swipe through the deck to match with your picks.
      </p>
    </div>
  );
}
