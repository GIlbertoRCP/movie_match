import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMovieContext } from '../context/MovieContext';
import { copyToClipboard } from '../utils/urlState';
import { Radio, Share2, Check, Users, Sparkles, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OnlineSessionStatusBar() {
  const { onlineSessionId, onlineRole, onlineSessionName, p1Likes, p2Likes, mode } = useMovieContext();
  const [copied, setCopied] = useState(false);

  if (!onlineSessionId) return null;

  const handleCopy = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?session=${onlineSessionId}&mode=guest`;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.2 } });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl mx-auto mb-4 px-3 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 text-slate-100 shadow-xl shadow-indigo-950/30 flex items-center justify-between gap-2"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative flex items-center justify-center p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white truncate">
              {onlineSessionName || `Online Room #${onlineSessionId}`}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
              {onlineRole === 'p1' ? 'Host' : 'Partner'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {p2Likes.length > 0
              ? `Partner active! (${p2Likes.length} likes recorded)`
              : 'Real-time WebSocket Sync Active • Share link to match'}
          </p>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 flex-shrink-0 shadow-md ${
          copied
            ? 'bg-emerald-600 text-white border border-emerald-400'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 active:scale-95'
        }`}
        title="Copy live online room link"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-white" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-white" />
            <span>Copy Link</span>
          </>
        )}
      </button>
    </motion.div>
  );
}
