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
      className="w-full max-w-xl mx-auto mb-5 px-4 py-3 rounded-2xl bg-[#F5F2EB] border border-stone-300/70 text-stone-900 shadow-sm flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex items-center justify-center p-2 rounded-xl bg-stone-200/80 border border-stone-300/80 text-stone-700">
          <Radio className="w-4 h-4 text-stone-700 animate-pulse" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-serif font-medium text-stone-900 truncate">
              {onlineSessionName || `Online Room #${onlineSessionId}`}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-sans font-light uppercase bg-stone-200 text-stone-700 border border-stone-300/80 flex-shrink-0">
              {onlineRole === 'p1' ? 'Host' : 'Partner'}
            </span>
          </div>
          <p className="text-[11px] font-sans font-light text-stone-600 truncate">
            {p2Likes.length > 0
              ? `Partner active (${p2Likes.length} picks recorded)`
              : 'Real-time WebSockets Sync Active • Share link to match'}
          </p>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className={`px-3.5 py-1.5 rounded-xl font-sans font-medium text-xs transition-all duration-300 flex items-center gap-1.5 flex-shrink-0 shadow-sm ${
          copied
            ? 'bg-emerald-800 text-white border border-emerald-700'
            : 'bg-stone-900 hover:bg-stone-800 text-stone-100 active:scale-95'
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
            <Copy className="w-3.5 h-3.5 text-stone-100" />
            <span>Copy Link</span>
          </>
        )}
      </button>
    </motion.div>
  );
}
